import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Meal, UserGoals } from '../types/database.types';
import { useAuth } from './useAuth';

export interface ConsumedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DietDataResult {
  goals: UserGoals;
  consumedMacros: ConsumedMacros;
  todayMeals: Meal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const DEFAULT_USER_GOALS: UserGoals = {
  daily_calories: 2500,
  daily_protein_g: 180,
  daily_carbs_g: 250,
  daily_fats_g: 70,
  weekly_run_km: 20,
  focus_areas: ['hypertrophy', 'aerobic_base'],
};

/**
 * Fetches user macro goals from users table and today's logged meals (midnight to midnight),
 * then calculates the sum of calories, protein, carbs, and fats consumed today.
 */
export async function fetchDietData(userId?: string): Promise<{
  goals: UserGoals;
  consumedMacros: ConsumedMacros;
  todayMeals: Meal[];
}> {
  // Midnight to midnight in local time
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  // Queries
  const userGoalsQuery = userId
    ? supabase.from('users').select('goals').eq('id', userId).single()
    : Promise.resolve({ data: null, error: null } as any);

  let mealsQuery = supabase
    .from('meals')
    .select('*')
    .gte('timestamp', startIso)
    .lte('timestamp', endIso)
    .order('timestamp', { ascending: false });

  if (userId) {
    mealsQuery = mealsQuery.eq('user_id', userId);
  }

  const [userRes, mealsRes] = await Promise.all([userGoalsQuery, mealsQuery]);

  let goals: UserGoals = DEFAULT_USER_GOALS;
  if (userRes && 'data' in userRes && userRes.data?.goals) {
    goals = {
      ...DEFAULT_USER_GOALS,
      ...userRes.data.goals,
    };
  }

  if (mealsRes.error) {
    console.warn('Error fetching today meals:', mealsRes.error);
  }

  const rawMeals: Meal[] = mealsRes.data || [];
  const todayMeals: Meal[] = rawMeals.map((m) => ({
    ...m,
    sortDate: m.timestamp || m.created_at,
  }));

  const consumedMacros: ConsumedMacros = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += Number(meal.calories) || 0;
      acc.protein += Number(meal.protein) || 0;
      acc.carbs += Number(meal.carbs) || 0;
      acc.fats += Number(meal.fats) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    goals,
    consumedMacros,
    todayMeals,
  };
}

/**
 * Custom React hook for the Diet & Macro Dashboard
 */
export function useDietData(userIdProp?: string): DietDataResult {
  const { user } = useAuth();
  const targetUserId = userIdProp || user?.id;

  const [goals, setGoals] = useState<UserGoals>(DEFAULT_USER_GOALS);
  const [consumedMacros, setConsumedMacros] = useState<ConsumedMacros>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchDietData(targetUserId);
      setGoals(res.goals);
      setConsumedMacros(res.consumedMacros);
      setTodayMeals(res.todayMeals);
    } catch (err: any) {
      console.warn('Error loading diet data:', err);
      setError(err?.message || 'Failed to load diet data');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    goals,
    consumedMacros,
    todayMeals,
    isLoading,
    error,
    refetch: loadData,
  };
}
