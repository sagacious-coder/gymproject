// ==============================================================================
// GYMPROJECT: TYPESCRIPT DATABASE & METRIC SCHEMAS
// ==============================================================================

export type SessionType = 'strength' | 'cardio' | 'hybrid' | 'mobility' | 'yoga' | 'recovery';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement' | 'pre_workout' | 'post_workout';
export type DocumentCategory = 'bloodwork' | 'diet_plan' | 'workout_routine' | 'dexa_scan' | 'other';

export interface UserGoals {
  target_weight_kg?: number | null;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fats_g: number;
  weekly_run_km: number;
  focus_areas: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  preferred_unit_system: 'metric' | 'imperial';
  goals: UserGoals;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  title?: string;
  type: SessionType;
  date: string;
  duration_min?: number;
  perceived_exertion_rpe?: number;
  ai_summary?: string;
  raw_voice_input?: string;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  session_id: string;
  name: string; // e.g. "Barbell Back Squat", "Outdoor 5K Run"
  category?: string; // e.g. "quads", "chest", "aerobic_base"
  order_index: number;
  notes?: string;
  created_at: string;
  metrics?: ActivityMetric[];
}

// Polymorphic Payload Types for metrics.payload JSONB
export interface StrengthMetricPayload {
  set_number?: number;
  reps: number;
  weight_kg: number;
  weight_lbs?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  tempo?: string; // e.g. "3-0-1-0"
  is_warmup?: boolean;
  one_rep_max_est?: number;
}

export interface CardioMetricPayload {
  distance_km?: number;
  distance_miles?: number;
  time_seconds: number;
  time_min?: number;
  pace_min_km?: number;
  pace_min_mile?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  cadence?: number; // SPM
  elevation_gain_m?: number;
  calories_burned?: number;
}

export interface MobilityMetricPayload {
  duration_min: number;
  target_muscle_groups?: string[];
  poses_completed?: number;
  notes?: string;
}

export type MetricPayload = StrengthMetricPayload | CardioMetricPayload | MobilityMetricPayload | Record<string, unknown>;

export interface ActivityMetric {
  id: string;
  activity_id: string;
  set_number?: number | null;
  payload: MetricPayload;
  created_at: string;
}

export interface MealIngredient {
  item: string;
  quantity?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
}

export interface Meal {
  id: string;
  user_id: string;
  description: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  photo_url?: string;
  ingredients?: MealIngredient[];
  timestamp: string;
  created_at: string;
}

export interface DocumentEntry {
  id: string;
  user_id: string;
  file_url: string;
  file_name?: string;
  type: DocumentCategory;
  raw_extracted_text?: string;
  ai_analysis_summary: string;
  extracted_data?: Record<string, unknown>;
  is_processed: boolean;
  created_at: string;
}
