import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  WorkoutSession,
  StrengthMetricPayload,
  CardioMetricPayload,
} from '../types/database.types';
import { useAuth } from './useAuth';

export interface StrengthChartPoint {
  date: string;
  totalVolume: number; // in kg
}

export interface CardioChartPoint {
  date: string;
  averagePace: number; // in min/km
}

export interface AnalyticsDataResult {
  strengthChartData: StrengthChartPoint[];
  cardioChartData: CardioChartPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches sessions from the last 30 days (with activities and metrics)
 * and processes them into strengthChartData (volume progression) and
 * cardioChartData (average pace).
 */
export async function fetchAnalyticsData(userId?: string): Promise<{
  strengthChartData: StrengthChartPoint[];
  cardioChartData: CardioChartPoint[];
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  let query = supabase
    .from('sessions')
    .select('*, activities(*, metrics(*))')
    .gte('date', thirtyDaysAgoIso)
    .order('date', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.warn('Error fetching analytics sessions:', error);
    return { strengthChartData: [], cardioChartData: [] };
  }

  const sessionList: WorkoutSession[] = sessions || [];

  // 1. Process Strength Sessions -> Group by date & sum (reps * weight_kg)
  const strengthByDate = new Map<string, { label: string; volume: number }>();

  for (const session of sessionList) {
    if (session.type === 'strength' || session.type === 'hybrid') {
      const sessionDate = new Date(session.date || session.created_at);
      const dateKey = sessionDate.toISOString().split('T')[0];
      const label = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;

      let sessionVolume = 0;
      if (session.activities) {
        for (const act of session.activities) {
          if (act.metrics) {
            for (const m of act.metrics) {
              const payload = m.payload as Partial<StrengthMetricPayload>;
              if (payload && payload.reps != null && payload.weight_kg != null) {
                const reps = Number(payload.reps) || 0;
                const weight = Number(payload.weight_kg) || 0;
                sessionVolume += reps * weight;
              }
            }
          }
        }
      }

      if (sessionVolume > 0) {
        const existing = strengthByDate.get(dateKey);
        if (existing) {
          existing.volume += sessionVolume;
        } else {
          strengthByDate.set(dateKey, {
            label,
            volume: sessionVolume,
          });
        }
      }
    }
  }

  const strengthChartData: StrengthChartPoint[] = Array.from(strengthByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, val]) => ({
      date: val.label,
      totalVolume: Math.round(val.volume),
    }));

  // 2. Process Cardio Sessions -> Group by date & average pace_min_km
  const cardioByDate = new Map<string, { label: string; paces: number[] }>();

  for (const session of sessionList) {
    if (session.type === 'cardio') {
      const sessionDate = new Date(session.date || session.created_at);
      const dateKey = sessionDate.toISOString().split('T')[0];
      const label = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;

      const sessionPaces: number[] = [];
      if (session.activities) {
        for (const act of session.activities) {
          if (act.metrics) {
            for (const m of act.metrics) {
              const payload = m.payload as Partial<CardioMetricPayload>;
              if (payload) {
                if (payload.pace_min_km && payload.pace_min_km > 0) {
                  sessionPaces.push(Number(payload.pace_min_km));
                } else if (
                  payload.distance_km &&
                  payload.distance_km > 0 &&
                  payload.time_seconds &&
                  payload.time_seconds > 0
                ) {
                  const calculatedPace = payload.time_seconds / 60 / payload.distance_km;
                  if (calculatedPace > 0 && calculatedPace < 30) {
                    sessionPaces.push(calculatedPace);
                  }
                }
              }
            }
          }
        }
      }

      if (sessionPaces.length > 0) {
        const existing = cardioByDate.get(dateKey);
        if (existing) {
          existing.paces.push(...sessionPaces);
        } else {
          cardioByDate.set(dateKey, {
            label,
            paces: sessionPaces,
          });
        }
      }
    }
  }

  const cardioChartData: CardioChartPoint[] = Array.from(cardioByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, val]) => {
      const sum = val.paces.reduce((a, b) => a + b, 0);
      const avg = sum / val.paces.length;
      return {
        date: val.label,
        averagePace: Number(avg.toFixed(2)),
      };
    });

  return {
    strengthChartData,
    cardioChartData,
  };
}

/**
 * Custom React hook for Analytics Engine data
 */
export function useAnalyticsData(userIdProp?: string): AnalyticsDataResult {
  const { user } = useAuth();
  const targetUserId = userIdProp || user?.id;

  const [strengthChartData, setStrengthChartData] = useState<StrengthChartPoint[]>([]);
  const [cardioChartData, setCardioChartData] = useState<CardioChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAnalyticsData(targetUserId);
      setStrengthChartData(res.strengthChartData);
      setCardioChartData(res.cardioChartData);
    } catch (err: any) {
      console.warn('Error loading analytics data:', err);
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    strengthChartData,
    cardioChartData,
    isLoading,
    error,
    refetch: loadData,
  };
}
