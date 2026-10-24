import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';
import { AI_MASTER_PROMPT } from '../prompts/masterPrompt';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface ExtractedWorkoutData {
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
}

export interface ExtractedMealData {
  meal: {
    description: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    ingredients?: Array<{ item: string; quantity?: string; calories?: number }>;
  };
}

export interface DocumentAnalysisData {
  doc_category?: 'bloodwork' | 'diet_plan' | 'workout_routine' | 'dexa_scan' | 'other';
  ai_summary: string;
  actionable_calendar_items?: Array<{
    title: string;
    date_offset_days?: number;
    exercises?: string[];
  }>;
  biomarker_flags?: Array<{
    marker: string;
    value: string;
    status: 'low' | 'normal' | 'high';
    clinical_note?: string;
  }>;
}

export interface AIResponsePayload {
  intent: 'LOG_WORKOUT' | 'LOG_NUTRITION' | 'PERFORMANCE_REVIEW' | 'ANALYZE_DOCUMENT' | 'CLARIFICATION_NEEDED';
  confidence_score?: number;
  workout_data?: ExtractedWorkoutData;
  nutrition_data?: ExtractedMealData;
  document_analysis?: DocumentAnalysisData;
  review_query?: {
    query_target: string;
    sport_category: string;
    direct_coaching_response: string;
  };
}

/**
 * End-to-end voice processing pipeline:
 * 1. Audio URI -> Groq Whisper Speech-to-Text
 * 2. Transcript -> Groq Llama-3 70B JSON Extraction
 * 3. Commit structured entities to Supabase
 */
export async function processAudioInput(userId: string, audioUri: string): Promise<{
  transcript: string;
  structuredData: AIResponsePayload;
}> {
  try {
    if (!GROQ_API_KEY) {
      console.warn('EXPO_PUBLIC_GROQ_API_KEY is not set. Ensure it is configured in .env');
    }

    // 1. Transcribe audio to text via Groq Whisper
    const transcript = await transcribeAudio(audioUri);
    console.log('[OmniFit AI] Audio Transcript:', transcript);

    // 2. Extract structured JSON payload from transcript using Master Prompt
    const structuredData: AIResponsePayload = await extractJSONFromText(transcript);
    console.log('[OmniFit AI] Structured Extraction:', structuredData);

    // 3. Route & commit into Supabase based on classified intent
    if (structuredData.intent === 'LOG_WORKOUT' && structuredData.workout_data) {
      await commitWorkoutToSupabase(userId, structuredData.workout_data, transcript);
    } else if (structuredData.intent === 'LOG_NUTRITION' && structuredData.nutrition_data) {
      await commitMealToSupabase(userId, structuredData.nutrition_data.meal);
    } else if (structuredData.intent === 'PERFORMANCE_REVIEW') {
      console.log('[OmniFit AI] Performance review query detected:', structuredData.review_query);
    } else {
      console.warn('[OmniFit AI] Unhandled intent or clarification needed:', structuredData.intent);
    }

    return { transcript, structuredData };
  } catch (error) {
    console.error('AI Voice Pipeline Error:', error);
    throw error;
  }
}

/**
 * Multimodal document and photo pipeline via Google Gemini 1.5 Flash:
 * Reads PDF or Image as Base64, prompts Gemini with strict JSON configuration,
 * and commits to Supabase (meals table if nutrition, documents table otherwise).
 */
export async function processDocumentInput(
  userId: string,
  fileUri: string,
  mimeType: string
): Promise<AIResponsePayload> {
  try {
    const apiKey = GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables.');
    }

    // 1. Validate and convert file to Base64
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(`File does not exist at URI: ${fileUri}`);
    }

    console.log(`[OmniFit AI] Reading ${mimeType} file into Base64 for Gemini multimodal analysis...`);
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Query Google Gemini 1.5 Flash endpoint with multimodal payload
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${AI_MASTER_PROMPT}\n\nTask: Analyze this attached visual file (PDF document or image). Determine if it is a meal/food photo, a coach's workout routine, bloodwork laboratory report, or DEXA scan. Extract all domain entities strictly conforming to our JSON schema. Output ONLY valid JSON.`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini 1.5 Flash API failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini returned an empty content candidate.');
    }

    const aiData: AIResponsePayload = JSON.parse(candidateText);
    console.log('[OmniFit AI] Gemini Multimodal Parsed Data:', aiData);

    // 3. Commit to Supabase
    await commitDocumentToSupabase(userId, fileUri, aiData);

    return aiData;
  } catch (error) {
    console.error('Gemini Multimodal Pipeline Error:', error);
    throw error;
  }
}

/**
 * Commits multimodal AI output to Supabase:
 * - If LOG_NUTRITION -> routes to commitMealToSupabase
 * - Otherwise -> inserts record into public.documents (and sessions if workout routine)
 */
export async function commitDocumentToSupabase(
  userId: string,
  fileUri: string,
  aiData: AIResponsePayload
) {
  // If classified as a meal/food photo
  if (aiData.intent === 'LOG_NUTRITION' && aiData.nutrition_data?.meal) {
    console.log('[OmniFit AI] Routing meal photo extraction to meals table...');
    return await commitMealToSupabase(userId, aiData.nutrition_data.meal);
  }

  // Determine document category
  const validCategories: Array<'bloodwork' | 'diet_plan' | 'workout_routine' | 'dexa_scan' | 'other'> = [
    'bloodwork',
    'diet_plan',
    'workout_routine',
    'dexa_scan',
    'other',
  ];

  let docCategory: 'bloodwork' | 'diet_plan' | 'workout_routine' | 'dexa_scan' | 'other' = 'other';
  if (aiData.document_analysis?.doc_category && validCategories.includes(aiData.document_analysis.doc_category)) {
    docCategory = aiData.document_analysis.doc_category;
  } else if (aiData.intent === 'LOG_WORKOUT') {
    docCategory = 'workout_routine';
  }

  const summary =
    aiData.document_analysis?.ai_summary ||
    aiData.workout_data?.session?.ai_summary ||
    'Document processed and structured by Gemini 1.5 Flash.';

  const fileName = fileUri.split('/').pop() || 'scanned_document';

  const { data: docRecord, error: docErr } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      file_url: fileUri,
      file_name: fileName,
      type: docCategory,
      raw_extracted_text: null,
      ai_analysis_summary: summary,
      extracted_data: aiData,
      is_processed: true,
    })
    .select('id')
    .single();

  if (docErr) {
    console.error('[OmniFit AI] Error inserting into documents table:', docErr);
    throw new Error(`Failed to commit document to database: ${docErr.message}`);
  }

  // If a full workout routine was also extracted from the document, persist it as a session too
  if (aiData.intent === 'LOG_WORKOUT' && aiData.workout_data) {
    await commitWorkoutToSupabase(userId, aiData.workout_data, summary);
  }

  return docRecord.id;
}

/**
 * Sends recorded audio file to Groq's high-speed Whisper Large v3 endpoint
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error(`Recorded audio file does not exist at URI: ${audioUri}`);
  }

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as any);

  formData.append('model', 'whisper-large-v3');
  formData.append('temperature', '0.0');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Whisper transcription failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.text || '';
}

/**
 * Prompts Groq's Llama-3 70B with strict JSON output mode to extract domain entities
 */
export async function extractJSONFromText(text: string): Promise<AIResponsePayload> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: AI_MASTER_PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq LLM extraction failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Groq returned empty response content.');
  }

  return JSON.parse(rawContent);
}

/**
 * Commits parsed workout payload into Supabase tables: sessions -> activities -> metrics
 */
export async function commitWorkoutToSupabase(
  userId: string,
  workoutData: ExtractedWorkoutData,
  rawTranscript?: string
) {
  const { data: sessionRecord, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      type: workoutData.session.type || 'strength',
      title: workoutData.session.title || 'Workout Session',
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

  for (const act of workoutData.activities || []) {
    const { data: actRecord, error: actErr } = await supabase
      .from('activities')
      .insert({
        session_id: sessionId,
        name: act.name,
        category: act.category,
        order_index: act.order_index ?? 0,
        notes: act.notes,
      })
      .select('id')
      .single();

    if (actErr || !actRecord) {
      console.error(`Failed to insert activity ${act.name}:`, actErr);
      continue;
    }

    const metricsToInsert = (act.metrics || []).map((m) => ({
      activity_id: actRecord.id,
      set_number: m.set_number ?? null,
      payload: m.payload,
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
 * Commits parsed meal payload into Supabase meals table
 */
export async function commitMealToSupabase(
  userId: string,
  meal: ExtractedMealData['meal']
) {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: userId,
      description: meal.description,
      meal_type: meal.meal_type || 'lunch',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fats: meal.fats || 0,
      fiber: meal.fiber || 0,
      ingredients: meal.ingredients || [],
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log meal: ${error.message}`);
  }

  return data.id;
}
