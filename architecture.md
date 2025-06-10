# 🧠 Smart Sleep Coaching App Architecture

## 🌐 Overview

A personalized sleep coaching app that integrates with wearable tracking devices (Oura, Samsung Ring, Whoop, etc.) and delivers customized, science-based recommendations based on real-time user data and behavior. It leverages the latest findings from sleep science (Matthew Walker), behavioral science (CBT-I), bio-optimization (Brian Johnson/Blueprint), and studies like those from Nature and Whoop.

---

## 🧱 Tech Stack

* **Frontend:** Next.js (React-based)
* **Backend:** Supabase (Auth, DB, Edge Functions)
* **State Management:** React Context + Hooks + Supabase Sync
* **Device APIs:** Oura, Samsung, Whoop (via serverless sync endpoints)

---

## 📁 File and Folder Structure

```bash
/sleep-coach-app
├── /app
│   ├── /api                  # API routes (wearables sync, recommendations)
│   ├── /components           # Reusable UI components
│   ├── /contexts             # Global app state (User, Data, Coaching)
│   ├── /hooks                # Custom hooks (useWearables, useSleepPlan)
│   ├── /lib                  # Utilities (API clients, algorithms)
│   ├── /pages
│   │   ├── index.tsx         # Daily summary / dashboard
│   │   ├── profile.tsx       # Onboarding, chronotype, lifestyle survey
│   │   ├── coach.tsx         # Recommendations + daily plan
│   │   ├── relax.tsx         # Meditation, Yoga Nidra, breathing
│   │   └── settings.tsx      # Notification preferences, integrations
│   ├── /public               # Static files
│   ├── /styles               # Tailwind CSS config
│   └── /types                # TypeScript types and interfaces
├── /scripts                  # Scheduled jobs (wearable data sync)
├── /supabase                 # Supabase config & schema
├── .env.local                # Secrets and keys
└── next.config.js            # Next.js configuration
```

---

## 🧩 What Each Part Does

* **/app/api/**: API handlers for device data, syncing, custom endpoints
* **/components/**: Buttons, cards, charts, forms
* **/contexts/**: Manages user state, wearable data, and recommendations
* **/hooks/**: Encapsulate logic like `useSleepScore`, `useCBTIEngine`
* **/lib/**: Custom logic (e.g. CBT-I rules, meal timing experiment engine)
* **/pages/**: Route-based screens for UI navigation
* **/scripts/**: CRON-like jobs (e.g., fetch wearable data every 6h)
* **/supabase/**: SQL, RLS rules, edge function deployment configs

---

## 🧠 Where App State Lives

* **React Contexts**:

  * `UserContext`: profile, schedule, chronotype
  * `WearableDataContext`: synced HR, HRV, sleep, exercise
  * `CoachingContext`: insights, reminders, daily goals
* **Supabase**:

  * Stores logs, preferences, long-term trends
  * Triggers insights generation on data updates

---

## 🔁 App Loop (How It Works)

```ts
1. User signs in → Supabase Auth
2. Onboarding collects:
   - Chronotype, work hours, stress, lifestyle
3. Scheduled job (or manual) syncs wearables → stores in Supabase
4. Coaching engine analyzes:
   - Sleep consistency, HR, HRV, latency, efficiency
   - Matthew Walker: light, caffeine, melatonin timing
   - CBT-I: sleep window, stimulus control, thought log
   - Blueprint: sun exposure, exercise cutoff, early meals
5. Outputs daily coaching plan:
   - Time to dim lights
   - Yoga Nidra session
   - "Pause screens" before bed
   - Reminders for sun, food, social
6. Reacts to stress input in real time:
   - Suggests journaling, breathing, mindfulness
   - Adapts plan dynamically
7. User feedback → improves model over time
```

---

## 🧬 Coaching Engine Inputs

* Chronotype
* Work & social schedule
* Sleep data (duration, quality, interruptions)
* Heart rate, HRV, respiration
* Stress level inputs
* Experiment tracking (e.g., meal cutoff testing)

## 🔮 Coaching Engine Outputs

* Adaptive reminders:

  * Light exposure
  * Wind-down
  * Yoga Nidra
  * Last caffeine
  * Exercise window
* Graphs + insights dashboard
* Guided content:

  * Meditations
  * Breathing techniques
  * Diet tips for deeper sleep

---

## 📚 Embedded Science Principles

* **Matthew Walker:** sleep pressure, rhythm, light, caffeine, temperature
* **CBT-I:** cognitive restructuring, sleep restriction, stimulus control
* **Brian Johnson (Blueprint):** sun exposure, protein pacing, stress tactics
* **Whoop/Nature Study:** no intense workouts <4h before sleep
* **RHR Insight:** lower RHR → better sleep → build coaching around that

---

Let me know if you'd like a dummy codebase scaffold based on this architecture.

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
