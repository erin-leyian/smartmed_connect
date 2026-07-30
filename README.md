# SmartMed Connect

A web-based platform that helps patients in Nairobi find medicine at nearby verified, licensed pharmacies and gives pharmacies a simple way to manage their stock and get verified by a system administrator.

## Links

- **Live app:** [ADD YOUR VERCEL URL HERE]
- **Demo video:** [ADD YOUR VIDEO LINK HERE]
- **SRS document:** [ADD YOUR SRS LINK HERE]

## System Admin Demo Login

Since system admin accounts can't be created through the app itself (by design — see below), use this account to test pharmacy verification/approval:

- **Email:** `systemadmin@gmail.com`
- **Password:** `123456`

Patient and pharmacy admin accounts can be created freely through the app's "Register" flow.

## Features

**Patients**
- Search medicine by name across all verified pharmacies
- Browse a catalog of available medicines with starting prices
- View full results for one medicine, sorted by price or distance
- Use live geolocation to see how far away each pharmacy is
- View a pharmacy's full profile and current stock

**Pharmacy Admins**
- Register a pharmacy (name, address, phone, license number, contact email, coordinates)
- Track verification status (pending / verified / rejected) and resubmit if rejected
- Edit pharmacy details at any time
- Verify the pharmacy's contact email (demo mode — a code is shown on screen instead of emailed)
- Add, update, and remove medicine stock (locked until contact email is verified)

**System Admins**
- Review pending pharmacy verification requests
- Approve or reject pharmacies (approved pharmacies immediately become visible to patient search)

## Tech Stack

- **Frontend:** React (Vite), React Router, plain CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Row Level Security, database functions/triggers)
- **Hosting:** Vercel (frontend), Supabase (database + auth)

## Setup Instructions

### 1. Clone and install

```bash
git clone https://github.com/erin-leyian/smartmed_connect.git
cd smartmed_connect
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and wait for it to finish provisioning.

### 3. Set up the database

In your Supabase project, go to **SQL Editor**, paste in the entire contents of `supabase/schema.sql` from this repo, and run it. This creates all tables, security policies, and database functions in one step.

### 4. Create the system admin account

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Enter an email and password, toggle **Auto Confirm User** on, save
3. Copy the new user's UUID
4. In the SQL Editor, run:
```sql
   insert into profiles (id, full_name, role)
   values ('paste-uuid-here', 'System Administrator', 'system_admin');
```

### 5. Configure Auth settings

In Supabase Dashboard → **Authentication → Providers → Email**:
- Make sure **Confirm email** is turned ON

In Supabase Dashboard → **Authentication → URL Configuration**:
- Set **Site URL** to your deployed URL (or `http://localhost:5173` for local development)
- Add that same URL under **Redirect URLs**

### 6. Environment variables

Create a `.env` file in the project root:

Both values are in your Supabase Dashboard under **Settings → API**.

### 7. Run locally

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### 8. Deploy (optional — already deployed for this submission)

This project deploys cleanly to Vercel:
1. Push this repo to GitHub (public)
2. Import it at [vercel.com](https://vercel.com) — it auto-detects the Vite build settings
3. Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under the project's Environment Variables
4. Deploy, then update Supabase's Site URL/Redirect URLs (step 5 above) to match the live domain

## Project Structure