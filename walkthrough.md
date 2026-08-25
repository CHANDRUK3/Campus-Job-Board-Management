# Campus Placement Portal — Verification Walkthrough

## Prerequisites

1. **MongoDB** running locally on `mongodb://localhost:27017/jobboard`
2. **Node.js** installed

## Setup

```bash
# Terminal 1 — Backend
cd Backend
npm install
node seed-drives.js          # Populate companies, drives, users
npm run dev                  # Starts server on http://localhost:5000

# Terminal 2 — Frontend
cd Job
npm install
npm run dev                  # Starts Vite on http://localhost:5173

# Terminal 3 — Backend smoke test
node test-backend.js
```

## Seed Credentials

| Role     | Email                    | Password       | Notes                          |
|----------|--------------------------|----------------|--------------------------------|
| Admin    | admin@campus.edu         | Admin123!      | Full admin access              |
| Recruiter| recruiter@techcorp.com   | Recruiter123!  | Can post drives                |
| Student  | john@student.edu         | Student123!    | Verified, CSE, CGPA 8.2        |
| Student  | jane@student.edu         | Student123!    | Verified, ECE, CGPA 6.5        |
| Student  | bob@student.edu          | Student123!    | No profile — onboarding test   |

## Seeded Drives

| Company          | Role              | Min CGPA | allowPlaced |
|------------------|-------------------|----------|-------------|
| TechCorp         | Software Engineer | 6.5      | true        |
| DataFlow         | Data Analyst      | 6.0      | true        |
| CloudTech        | DevOps Intern     | 7.5      | false       |

---

## Manual Verification Checklist

### 1. New Student Onboarding

1. Login as `bob@student.edu` / `Student123!`
2. **Expected:** Redirect to `/profile-setup` (profile not verified)
3. Fill roll number, department, CGPA, upload PDF resume, submit
4. **Expected:** "Verification Pending" screen; drives are locked

### 2. Admin Profile Verification

1. Login as `admin@campus.edu` / `Admin123!`
2. Go to **Profile Verification** tab in admin dashboard
3. Find Bob's pending profile → click **Verify**
4. **Expected:** Bob receives in-app notification

### 3. Eligibility Engine (Jane — CGPA 6.5)

1. Login as `jane@student.edu` / `Student123!`
2. Open **Placement Drives** tab
3. **Data Analyst (6.0 cutoff):** Shows **✓ Eligible**
4. **DevOps Intern (7.5 cutoff):** Shows **✕ Not Eligible** with reason "CGPA is 6.5, but cutoff is 7.5"
5. **Software Engineer (6.5 cutoff):** Shows **✓ Eligible**

### 4. Opt-In & Application

1. As Jane, click **Opt-In & Apply** on Data Analyst drive
2. Confirm in modal
3. Switch to **Applications Tracker** tab
4. **Expected:** Application appears with status `APPLIED`

### 5. Admin Pipeline — Schedule Test

1. Login as admin → **Application Pipeline** tab
2. Find Jane's application
3. Set date/time/venue, optionally add meeting link
4. Click **Schedule Test / Interview**
5. **Expected:** Application status → `test_scheduled`

### 6. Student Timeline Update

1. Login as Jane → **Applications Tracker** → **Track Application**
2. **Expected:** Stepper shows `Test Scheduled` as active
3. **Expected:** Schedule panel shows date, time, venue, meeting link
4. Check **Notification Center** tab for schedule alert

### 7. Placement Status Check (Multiple Offers)

1. As admin, move Jane's application to **selected**
2. As Jane, try to opt-in to **DevOps Intern** (allowPlaced: false)
3. **Expected:** Blocked with "already placed" reason

---

## API Endpoints Reference

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/drives`                         | List all recruitment drives    |
| GET    | `/api/companies/profiles`             | List company profiles          |
| GET    | `/api/profile/:userId`                | Get student profile            |
| PUT    | `/api/profile/:userId`                | Create/update profile          |
| POST   | `/api/student/applications`           | Apply to drive (`jobId`)       |
| GET    | `/api/student/eligibility/:driveId`   | Check eligibility              |
| GET    | `/api/admin/students/pending`         | Pending profiles               |
| PUT    | `/api/admin/students/:id/verify`      | Verify/reject profile          |
| PUT    | `/api/admin/applications/:id/stage`   | Update pipeline stage          |
| PUT    | `/api/admin/applications/:id/details` | Schedule test/interview        |

---

## Build Verification

```bash
cd Job && npm run build    # Must complete without errors
node test-backend.js       # Must pass health + drives endpoints
```
