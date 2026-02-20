# Drift X Karting 2026 – Admin Dashboard

A professional live lap timing and race control dashboard built with React, Vite, TailwindCSS, and Supabase.

## 🚀 Quick Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Database Setup
Execute the SQL scripts in the `supabase/` directory in the Supabase SQL Editor in the following order:
1. `001_race_entries.sql`
2. `002_laps.sql`
3. `003_live_leaderboard_view.sql`
4. `004_concurrency_index.sql`
5. `005_rls_policies.sql`
6. `006_update_timestamp_trigger.sql`

### 3. Admin Authentication
Admin accounts are managed via Supabase Auth (Email/Password).
- Go to **Supabase Dashboard** -> **Authentication** -> **Users**.
- Click **"Add User"** -> **"Create New User"**.
- Use these credentials to log in to the dashboard.

### 4. Local Development
```bash
npm install
npm run dev
```

## 🏎️ Features
- **QR Scanning**: Fast rider check-in using `html5-qrcode`.
- **Manual Search**: Search riders by registration ID.
- **Race State Machine**: Manage riders from Queue -> Ready -> Racing -> Completed.
- **Timestamp Stopwatch**: Professional timing using `Date.now()` for millisecond accuracy.
- **Real-time Leaderboard**: Instant updates via Supabase Realtime.
- **Concurrency Control**: Prevents multiple riders from racing at the same time.
- **Dark Racing Theme**: Built with TailwindCSS and custom Inter/JetBrains mono typography.

## 🛠️ Tech Stack
- **Frontend**: React, Vite
- **Styling**: TailwindCSS
- **Database/Auth**: Supabase
- **Scanner**: html5-qrcode
