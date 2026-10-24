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

2. **Setup Supabase**:
   - Create a project on [Supabase](https://supabase.com).
   - Paste the SQL script from `supabase/schema.sql` into the Supabase SQL Editor and run it.
   - Copy your Project URL and Anon Key into `.env`:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Start the Expo App**:
   ```bash
   npx expo start
   ```
