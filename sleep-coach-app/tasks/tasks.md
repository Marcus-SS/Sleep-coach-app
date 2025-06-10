# Build Tasks

## Setup

- [x] Task 1: Initialize a new Next.js project with Tailwind CSS  
  Test: Run `npm run dev` and verify the Next.js welcome page styled with Tailwind loads in the browser.

- [x] Task 2: Create a Supabase project and connect it to the Next.js app  
  Test: Successfully connect to Supabase and fetch a test record via an API route.

- [x] Task 3: Set up Supabase Authentication (Email & Google login)  
  Test: Log in using email and Google, and confirm user session is accessible.

- [x] Task 4: Implement UserContext to hold and provide logged-in user state globally  
  Test: Display logged-in user info in a test component.

## Data Integration

- [x] Task 5: Create a mock data provider simulating wearable device data (Whoop, Oura, Samsung Ring)  
  Test: Display mock sleep, heart rate, and HRV data on a simple dashboard page.

- [x] Task 6: Build `/api/sync/whoop` API route returning mock wearable data  
  Test: Access the endpoint and verify JSON data is returned and logged on frontend.

- [x] Task 7: Implement scheduled data sync with a mock cron job (e.g., every minute)  
  Test: Confirm mock data sync logs success messages every minute in backend logs.

## User Onboarding

- [x] Task 8: Build onboarding form collecting sleep chronotype, work schedule, stress levels, social life, and hobbies  
  Test: Submit form and verify data is saved in Supabase database.

- [x] Task 9: Pre-fill onboarding form with existing data from Supabase if available  
  Test: Reload page and confirm form fields are populated with saved values.

## Dashboard

- [ ] Task 10: Create dashboard UI with cards showing sleep score, HRV, and resting heart rate  
  Test: Render dashboard with cards populated by mock data.

- [ ] Task 11: Add daily sleep coaching suggestion card with hardcoded example tips  
  Test: Display a hardcoded tip like "Avoid screens after 9 PM" on dashboard.

## Coaching Engine

- [ ] Task 12: Implement core coaching logic in `lib/coach.ts`
  Test: Run `analyzeData()` with mock inputs and log tailored coaching tips.

- [ ] Task 13: Create `/coach` page to display personalized coaching recommendations  
  Test: Load the page and verify personalized tips are shown dynamically.

## Reminder System

- [ ] Task 14: Write `generateReminders()` in `lib/reminder.ts` producing context-aware reminders throughout the day (e.g., turn down lights, wind down, get sun exposure)  
  Test: Call function and verify correct reminder messages are outputted.

- [ ] Task 15: Implement reminder UI component that shows reminder toasts based on time and user context  
  Test: See reminder toast popup at scheduled mock times.

## Lifestyle Tools

- [ ] Task 16: Create `/relax` page offering Yoga Nidra audio/video, meditation guides, and deep breathing exercises  
  Test: Visit page and successfully play relaxation content.

- [ ] Task 17: Add static content page with diet and sleep optimization recommendations based on latest science  
  Test: Render readable, styled text content with diet tips.

## Settings & Profile

- [ ] Task 18: Build `/settings` page for user to update sync preferences and notification settings  
  Test: Toggle settings and verify updates are saved to Supabase.

- [ ] Task 19: Implement logout functionality clearing session and redirecting to login  
  Test: Click logout button and confirm user is logged out and redirected.

## Integration & Testing

- [ ] Task 20: Integrate onboarding → data sync → coaching engine → reminder system workflow end-to-end  
  Test: Complete onboarding, sync data, and see tailored tips plus scheduled reminders in UI.

- [ ] Task 21: Add loading spinners during data fetch and analysis phases  
  Test: Trigger sync and verify spinner appears until data is loaded.

- [ ] Task 22: Display fallback UI for missing or incomplete data (e.g., onboarding incomplete)  
  Test: Remove user data and confirm fallback UI is shown with instructions.
