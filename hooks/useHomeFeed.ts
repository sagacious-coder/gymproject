import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { WorkoutSession, Meal } from '../types/database.types';
import { useAuth } from './useAuth';

export type TimelineSessionItem = WorkoutSession & {
  sortDate: string;
};

export type TimelineMealItem = Meal & {
  sortDate: string;
};

export type TimelineItem = TimelineSessionItem | TimelineMealItem;

/**
 * Fetches sessions (with nested activities and metrics) and meals,
 * merges them into a unified array, and sorts in descending chronological order.
 */
export async function fetchTimelineData(userId?: string): Promise<TimelineItem[]> {
  try {
    let sessionsQuery = supabase
      .from('sessions')
      .select('*, activities(*, metrics(*))')
      .order('date', { ascending: false })
      .limit(20);

    let mealsQuery = supabase
      .from('meals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (userId) {
      sessionsQuery = sessionsQuery.eq('user_id', userId);
      mealsQuery = mealsQuery.eq('user_id', userId);
    }

    const [sessionsRes, mealsRes] = await Promise.all([sessionsQuery, mealsQuery]);

    if (sessionsRes.error) {
      console.warn('Error fetching sessions for timeline:', sessionsRes.error);
    }

    if (mealsRes.error) {
      console.warn('Error fetching meals for timeline:', mealsRes.error);
    }

    const sessions: WorkoutSession[] = sessionsRes.data || [];
    const meals: Meal[] = mealsRes.data || [];

    const mappedSessions: TimelineSessionItem[] = sessions.map((session) => ({
      ...session,
      sortDate: session.date || session.created_at,
    }));

    const mappedMeals: TimelineMealItem[] = meals.map((meal) => ({
      ...meal,
      sortDate: meal.timestamp || meal.created_at,
    }));

    const combined: TimelineItem[] = [...mappedSessions, ...mappedMeals].sort((a, b) => {
      const timeA = new Date(a.sortDate).getTime();
      const timeB = new Date(b.sortDate).getTime();
      return timeB - timeA;
    });

    return combined;
  } catch (err) {
    console.error('Failed to fetch home feed timeline data:', err);
    return [];
  }
}

/**
 * Custom React hook for the Home Feed timeline.
 * Handles fetching, loading states, and pull-to-refresh refetching.
 */
export function useHomeFeed(userIdProp?: string) {
  const { user } = useAuth();
  const targetUserId = userIdProp || user?.id;

  const [data, setData] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchTimelineData(targetUserId);
      setData(items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load timeline feed');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    refetch: loadData,
  };
}
