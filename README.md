# OmniFit: All-in-One AI Fitness, Running & Nutrition Engine

An ultra-modern, fluid fitness tracking application built with **React Native (Expo)**, **Supabase (PostgreSQL)**, and **Multi-Intent LLM Extraction (Gemini / Groq / Qwen)**.

## Project Structure

```
├── app/
│   ├── _layout.tsx              # Root Layout & Dark Theme Provider
│   └── (tabs)/
│       ├── _layout.tsx          # Floating Glassmorphic Tab Bar with Hero Center Action
│       ├── index.tsx            # Daily Readiness & Hybrid Suggested Workouts
│       ├── log.tsx              # AI Voice-Dump, Sleek Text, & Document Scanner Screen
│       ├── diet.tsx             # Nutrition & Macro Fuel Breakdown
│       ├── analytics.tsx        # Dynamic Sport Analytics (Pace vs 1RM & Volume)
│       └── profile.tsx          # Athlete Goals & Unit Preferences
├── components/
│   ├── GlowingMicButton.tsx     # Reanimated concentric pulse rings & sound wave glow
│   └── GlassCard.tsx            # Frosted glassmorphism dark container
├── prompts/
│   └── ai_master_system_prompt.md # Strict LLM instruction & JSON contract
├── services/
│   └── aiLoggingService.ts      # Direct Supabase polymorphic commit pipeline
├── supabase/
│   └── schema.sql               # Production PostgreSQL schema with RLS & GIN Index
├── types/
│   └── database.types.ts        # TypeScript schemas & polymorphic payload unions
└── package.json
```

## Quickstart

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Supabase & AI Keys**:
   - Create a project on [Supabase](https://supabase.com).
   - Paste the SQL script from `supabase/schema.sql` into the Supabase SQL Editor and run it.
   - Copy your credentials into `.env`:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     EXPO_PUBLIC_GROQ_API_KEY=gsk_your_groq_api_key_here
     EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
     ```

## Features Implemented
- **AI Voice-Dump**: High-speed audio recording via `expo-audio` -> Groq Whisper -> Llama 3 70B extraction.
- **Multimodal Eyes**: Photo & PDF document ingestion via `expo-image-picker` & `expo-document-picker` -> Google Gemini 1.5 Flash -> auto-classification (meals vs bloodwork / routines).
- **Polymorphic Database**: Flexible PostgreSQL schema with JSONB GIN indexing and RLS security.

3. **Start the Expo App**:
   ```bash
   npx expo start
   ```
