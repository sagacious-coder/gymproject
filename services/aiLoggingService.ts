import { createClient } from '@supabase/supabase-js';
import { WorkoutSession, Activity, Meal } from '../types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Commits parsed workout payload from AI prompt directly into Supabase tables:
 * sessions -> activities -> metrics
 */
export async function commitWorkoutToSupabase(
  userId: string,
  workoutData: {
    session: {
      type: string;
      title: string;
      duration_min?: number | null;
      perceived_exertion_rpe?: number | null;
      ai_summary?: string;
    };
    activities: Array<{
      name: string;
      category?: string;
      order_index: number;
      notes?: string;
      metrics: Array<{
        set_number?: number | null;
        payload: Record<string, unknown>;
      }>;
    }>;
  },
  rawTranscript?: string
) {
  // 1. Insert Session
  const { data: sessionRecord, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      type: workoutData.session.type,
      title: workoutData.session.title,
      duration_min: workoutData.session.duration_min,
      perceived_exertion_rpe: workoutData.session.perceived_exertion_rpe,
      ai_summary: workoutData.session.ai_summary,
      raw_voice_input: rawTranscript,
    })
    .select('id')
    .single();

  if (sessionErr || !sessionRecord) {
    throw new Error(`Failed to create workout session: ${sessionErr?.message}`);
  }

  const sessionId = sessionRecord.id;

  // 2. Insert Activities and their polymorphic Metrics
  for (const act of workoutData.activities) {
    const { data: actRecord, error: actErr } = await supabase
      .from('activities')
      .insert({
        session_id: sessionId,
        name: act.name,
        category: act.category,
        order_index: act.order_index,
        notes: act.notes,
      })
      .select('id')
      .single();

    if (actErr || !actRecord) {
      console.error(`Failed to insert activity ${act.name}:`, actErr);
      continue;
    }

    // 3. Batch insert polymorphic metrics payload
    const metricsToInsert = act.metrics.map((m) => ({
      activity_id: actRecord.id,
      set_number: m.set_number ?? null,
      payload: m.payload, // Polymorphic JSONB: reps/weight OR distance/pace/HR
    }));

    if (metricsToInsert.length > 0) {
      const { error: metricsErr } = await supabase
        .from('metrics')
        .insert(metricsToInsert);

      if (metricsErr) {
        console.error(`Failed inserting metrics for activity ${actRecord.id}:`, metricsErr);
      }
    }
  }

  return sessionId;
}

/**
 * Commits parsed meal payload from AI prompt into Supabase meals table
 */
export async function commitMealToSupabase(
  userId: string,
  mealData: {
    description: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    ingredients?: Array<{ item: string; quantity?: string; calories?: number }>;
  }
) {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: userId,
      description: mealData.description,
      meal_type: mealData.meal_type,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fats: mealData.fats,
      fiber: mealData.fiber || 0,
      ingredients: mealData.ingredients || [],
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log meal: ${error.message}`);
  }

  return data.id;
}
