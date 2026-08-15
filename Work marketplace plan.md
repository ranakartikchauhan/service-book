# Project Spec: Local Work/Gig Marketplace (Mobile App + Marketing Website)

> **How to use this document:** A separate, standalone project from the listening platform. Hand this to any coding LLM in phases (Section 10). This connects individuals/households who need work done (cleaning, cooking, kitchen cleaning, planting, and any similar informal work) with workers offering those services — with in-app payments and admin oversight.

---

## 1. Product Summary

A **mobile app** (not a website) where:
- **Workers** create a profile, list their skills/services, and find nearby jobs to apply for or get matched with
- **Posters** (mostly individual households) post jobs — "need kitchen deep-cleaned this Saturday," "need someone to plant a small garden bed" — and hire from applicants
- **Payment happens inside the app** (Razorpay, since this is India-focused) — poster pays into the platform, released to the worker once the job is marked complete
- A **separate marketing website** (not the app itself) exists purely to explain the platform, drive app downloads, and rank in search — think a simple, fast landing site, not a functional part of the product

This is structurally similar to Urban Company/TaskRabbit, but open to informal/any-category work rather than a fixed curated service list.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile app | **React Native (Expo)** | One app, two roles (Worker / Poster) — see Section 3. Expo speeds up dev and simplifies push notification + build setup |
| Backend | Node.js + Express | Shared API for the app and the admin panel |
| Database | MongoDB + Mongoose | Geospatial indexes for location-based job/worker matching |
| Real-time | Socket.io | In-app chat, live job status updates |
| Push notifications | Firebase Cloud Messaging (FCM) | "New job near you," "Your application was accepted," etc. |
| Payments | **Razorpay** (India) | Escrow-style flow — see Section 6 |
| File storage | Cloudinary | Profile photos, ID/verification docs, job photos |
| Maps/location | Google Maps API (Places + Geocoding) | Job location picking, distance-based worker discovery |
| Admin panel | React (web) | Separate web app, not part of the mobile app |
| Marketing website | Next.js (or plain React) | Static/SEO-friendly, links to app store / play store, not connected to live app data beyond maybe testimonials |

---

## 3. User Roles

**One mobile app, two modes** (simpler than two separate apps — most people in this market may do both at different times, e.g., someone who both needs a plumber sometimes and does cleaning work other times):

- **Worker mode:** browse/apply to jobs, manage profile & skills, see earnings, chat with posters
- **Poster mode:** post jobs, review applicants, hire, chat, pay, rate

A single account can switch between modes (toggle in app settings) — but each mode has its own profile completeness requirements (worker mode requires ID verification before applying to jobs; poster mode doesn't).

**Admin:** separate web dashboard, not part of the mobile app at all.

---

## 4. Core Data Models

### User (base account)

```js
{
  _id: ObjectId,
  name: String,
  phone: String,                 // primary identifier — phone + OTP login is standard for this market
  email: String,                 // optional
  passwordHash: String,          // if using password auth alongside/instead of OTP
  profilePhotoUrl: String,
  currentMode: String,           // "worker" | "poster" — last used mode
  homeLocation: {
    type: "Point",
    coordinates: [Number, Number]  // [lng, lat]
  },
  createdAt: Date
}
```

### WorkerProfile

```js
{
  _id: ObjectId,
  userId: ObjectId,
  skills: [String],              // ["cleaning", "cooking", "kitchen_deep_clean", "gardening", "planting"]
  bio: String,
  experienceYears: Number,
  hourlyRateRange: { min: Number, max: Number },
  availability: [
    { day: String, startTime: String, endTime: String }
  ],
  serviceRadius: Number,          // km, how far they're willing to travel
  verification: {
    status: String,               // "unverified" | "pending" | "verified" | "rejected"
    idDocUrl: String,              // Cloudinary URL, government ID
    idType: String,                // "aadhaar" | "voter_id" | "passport" etc.
    verifiedAt: Date,
    rejectionReason: String
  },
  rating: {
    average: Number,
    count: Number
  },
  completedJobs: Number,
  earningsTotal: Number,
  payoutDetails: {
    bankAccountNumber: String,     // encrypted at rest
    ifscCode: String,
    upiId: String
  }
}
```

### PosterProfile

```js
{
  _id: ObjectId,
  userId: ObjectId,
  rating: { average: Number, count: Number },
  jobsPosted: Number,
  savedAddresses: [
    { label: String, address: String, coordinates: [Number, Number] }
  ]
}
```

### Job

```js
{
  _id: ObjectId,
  posterId: ObjectId,
  category: String,               // "cleaning" | "food_prep" | "kitchen_clean" | "planting" | "other"
  customCategoryNote: String,     // free text if category is "other" — since scope is "any kind of work"
  title: String,
  description: String,
  location: {
    type: "Point",
    coordinates: [Number, Number],
    addressText: String
  },
  scheduledDate: Date,
  estimatedDurationHours: Number,
  budgetType: String,             // "fixed" | "hourly"
  budgetAmount: Number,
  photos: [String],                // Cloudinary URLs — e.g. photo of the kitchen to be cleaned
  status: String,                  // "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "disputed"
  assignedWorkerId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Application (a worker applying to a job)

```js
{
  _id: ObjectId,
  jobId: ObjectId,
  workerId: ObjectId,
  proposedRate: Number,
  message: String,
  status: String,                 // "pending" | "accepted" | "rejected" | "withdrawn"
  createdAt: Date
}
```

### Transaction

```js
{
  _id: ObjectId,
  jobId: ObjectId,
  posterId: ObjectId,
  workerId: ObjectId,
  amount: Number,
  platformCommission: Number,
  workerPayout: Number,
  status: String,                 // "held_in_escrow" | "released" | "refunded" | "disputed"
  razorpayOrderId: String,
  razorpayPaymentId: String,
  createdAt: Date,
  releasedAt: Date
}
```

### Review

```js
{
  _id: ObjectId,
  jobId: ObjectId,
  fromUserId: ObjectId,
  toUserId: ObjectId,
  rating: Number,                 // 1-5
  comment: String,
  createdAt: Date
}
```

### Dispute

```js
{
  _id: ObjectId,
  jobId: ObjectId,
  raisedBy: ObjectId,
  reason: String,
  description: String,
  status: String,                 // "open" | "under_review" | "resolved"
  adminNotes: String,
  resolution: String,             // "refund_poster" | "release_worker" | "partial" 
  resolvedAt: Date,
  createdAt: Date
}
```

### Category (admin-managed)

```js
{
  _id: ObjectId,
  name: String,                   // "Cleaning", "Food Preparation", "Kitchen Deep Clean", "Planting/Gardening"
  icon: String,
  active: Boolean
}
```

### ChatMessage

```js
{
  _id: ObjectId,
  jobId: ObjectId,
  senderId: ObjectId,
  text: String,
  sentAt: Date,
  readAt: Date
}
```

---

## 5. Feature List

### Worker mode (mobile app)
- Sign up / phone OTP login
- Build profile: skills, bio, availability, service radius, hourly rate range
- **ID verification flow** — upload government ID photo, status shown as pending until admin approves (workers can't apply to jobs until verified — this matters a lot for trust in an in-home-service context)
- Browse nearby open jobs (map view + list view), filter by category/distance/date
- Apply to a job with a proposed rate + short message
- Get notified when accepted/rejected
- In-app chat with poster once matched
- Mark job as "started" / "completed" (poster confirms completion to release payment)
- Earnings dashboard: total earned, pending payouts, completed job history
- Rate the poster after job completion
- Withdraw earnings to bank account/UPI

### Poster mode (mobile app)
- Sign up / phone OTP login
- Post a job: category (or "other" + free text), description, photos, location (map picker), date/time, budget (fixed or hourly)
- Review applicants: see worker profile, rating, verification badge, proposed rate
- Hire a worker (triggers payment hold in escrow)
- Chat with hired worker
- Mark job complete → releases payment to worker
- Rate the worker after completion
- Cancel a job (before assignment — refund logic if already paid)
- Raise a dispute if something goes wrong

### Admin panel (web)
- Login
- **Worker verification queue** — review uploaded ID docs, approve/reject with reason
- Manage categories (add/edit/deactivate)
- View all jobs (filter by status), intervene if needed
- **Dispute resolution dashboard** — view dispute details, chat/job history, decide refund vs release vs partial, with notes
- Transaction oversight — view all payments, commission earned, pending payouts
- User management — view/suspend/ban users (workers or posters) for policy violations
- Basic analytics: jobs posted per category, completion rate, average time-to-hire, revenue

### Marketing website (separate, simple)
- Landing page explaining the platform, how it works for workers vs posters
- App store / Play store download links
- Testimonials/reviews section (can pull curated review data, doesn't need live API connection for v1)
- Basic "How it works," "Categories we support," "Contact/Support" pages
- SEO-focused — this is a lead-gen tool, not a functional part of the product

---

## 6. Payment Flow (Escrow-style, via Razorpay)

```
Poster hires a worker for a job
        ↓
Backend creates a Razorpay order for the agreed amount
        ↓
Poster pays → funds held by platform (status: "held_in_escrow")
        ↓
Worker does the job
        ↓
Poster marks job "completed" (or auto-release after X hours if poster 
doesn't respond and worker marked it done — needs a dispute window)
        ↓
Backend triggers payout to worker's bank/UPI via Razorpay Payouts,
minus platform commission
        ↓
Transaction status: "released"
```

**If disputed:** funds stay in escrow, admin reviews via the Dispute dashboard, manually triggers refund or release based on their decision.

**Commission model:** decide a flat percentage (e.g., 10-15%) taken from the job amount — store this as a configurable admin setting (`PlatformConfig` collection), not hardcoded, since you'll likely want to tune it.

---

## 7. Trust & Safety (important for an in-home-service marketplace)

- **Mandatory ID verification for workers** before they can apply to any job — non-negotiable given people will be entering others' homes
- **In-app chat only** — discourage sharing phone numbers before a job is confirmed, to keep communication (and dispute evidence) on-platform
- **Two-way ratings** — posters also get rated by workers, so bad-actor posters (non-payment attempts, unsafe conditions) get flagged too, not just workers
- **Report/block functionality** — either party can report a user or a specific job
- **Dispute window** — a job isn't fully closed (payment fully released, no more disputes allowed) until, say, 48 hours after completion

---

## 8. API Endpoints (high-level)

```
# Auth
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/login-password        # if supporting password auth too

# Worker
GET    /api/worker/profile
PUT    /api/worker/profile
POST   /api/worker/verification/submit
GET    /api/worker/jobs/nearby         # geospatial query
POST   /api/worker/jobs/:id/apply
GET    /api/worker/earnings
POST   /api/worker/payout

# Poster
POST   /api/poster/jobs
GET    /api/poster/jobs
GET    /api/poster/jobs/:id/applications
POST   /api/poster/jobs/:id/hire/:workerId
POST   /api/poster/jobs/:id/complete
POST   /api/poster/jobs/:id/cancel

# Shared
GET    /api/jobs/:id
POST   /api/jobs/:id/dispute
POST   /api/reviews
GET    /api/chat/:jobId/messages
WS     /ws/chat                        # real-time messaging

# Payments
POST   /api/payments/create-order
POST   /api/payments/webhook           # Razorpay webhook for payment confirmation

# Admin
POST   /api/admin/login
GET    /api/admin/verifications/pending
POST   /api/admin/verifications/:id/approve
POST   /api/admin/verifications/:id/reject
GET    /api/admin/disputes
POST   /api/admin/disputes/:id/resolve
GET    /api/admin/categories
POST   /api/admin/categories
GET    /api/admin/analytics
GET    /api/admin/transactions
```

---

## 9. Suggested Folder Structure

```
work-marketplace/
├── backend/
│   ├── models/
│   │   ├── User.js, WorkerProfile.js, PosterProfile.js
│   │   ├── Job.js, Application.js, Transaction.js
│   │   ├── Review.js, Dispute.js, Category.js, ChatMessage.js
│   ├── routes/
│   │   ├── auth.js, worker.js, poster.js, jobs.js
│   │   ├── payments.js, admin.js, chat.js
│   ├── services/
│   │   ├── razorpayService.js
│   │   ├── otpService.js
│   │   ├── cloudinaryService.js
│   │   ├── fcmService.js           # push notifications
│   │   └── geoMatchingService.js   # nearby job/worker queries
│   ├── middleware/
│   │   ├── verifyUserToken.js
│   │   └── verifyAdminToken.js
│   ├── sockets/
│   │   └── chatSocket.js
│   ├── config/db.js
│   └── server.js
├── mobile-app/                     # React Native (Expo)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/ (Login, OTPVerify)
│   │   │   ├── worker/ (Profile, JobBrowse, JobDetail, Earnings, Verification)
│   │   │   ├── poster/ (PostJob, MyJobs, Applicants, JobDetail)
│   │   │   ├── shared/ (Chat, Reviews, Settings, ModeSwitch)
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── api/
│   │   └── App.tsx
├── admin-panel/                    # React web app
│   └── src/ (similar structure to prior projects' admin dashboards)
└── marketing-website/              # Next.js
    └── pages/ (Home, HowItWorks, Categories, Contact)
```

---

## 10. Build Phases

**Phase 1 — Backend foundation**
Express server, MongoDB connection, all core models, OTP auth (or password auth as a faster stand-in for OTP during dev).

**Phase 2 — Worker & Poster profile APIs**
Profile CRUD, ID verification submission endpoint (upload to Cloudinary, status pending).

**Phase 3 — Job posting & discovery**
Job CRUD, geospatial nearby-jobs query, category management.

**Phase 4 — Applications & hiring flow**
Apply/accept/reject logic, job status transitions.

**Phase 5 — Chat**
Socket.io setup, ChatMessage model, real-time messaging scoped per job.

**Phase 6 — Payments (Razorpay escrow flow)**
Order creation, webhook handling, transaction status management, payout on completion.

**Phase 7 — Reviews & ratings**
Two-way review system, aggregate rating calculation.

**Phase 8 — Disputes**
Dispute creation, admin resolution flow, refund/release logic tied back to payments.

**Phase 9 — Mobile app: Worker mode screens**
Signup/login, profile setup, verification upload, job browse/apply, earnings.

**Phase 10 — Mobile app: Poster mode screens**
Job posting, applicant review, hire flow, payment, job tracking.

**Phase 11 — Mobile app: shared screens**
Chat UI, reviews, mode switching, push notification handling (FCM).

**Phase 12 — Admin panel**
Verification queue, dispute dashboard, category management, transaction oversight, analytics.

**Phase 13 — Marketing website**
Landing page, how-it-works, category showcase, app download links.

**Phase 14 — Polish & compliance**
Error handling, loading states, empty states, terms of service / privacy policy pages (important given ID docs + payments are involved), rate limiting on OTP endpoints (prevent abuse).

---

## 11. Notes Worth Knowing Before You Build

- **Phone OTP auth** is the right default for this market (India, informal work, individual users) — password-based auth alone will lose users who don't want to remember another password. Consider Firebase Auth or an SMS provider like MSG91/Twilio for OTP delivery.
- **Razorpay Route/Payouts** (not just basic Payments) is what you'll need specifically for the escrow-then-release-to-worker flow — check Razorpay's current product docs for this, since payout/marketplace-specific products change and have their own compliance requirements (KYC for the platform itself, not just workers).
- **ID verification is a real compliance/liability area**, not just a UI feature — you're storing government ID images. Make sure Cloudinary storage for these is set to private/restricted access, not public URLs like regular job photos.
- **"Any kind of work" is a double-edged design choice** — it's flexible and matches your ask, but it also means category/quality control matters more (the free-text "other" category will get messy fast). The admin category management + the ability to review/merge miscategorized jobs is worth prioritizing early, not deferring.
- **Two-app vs one-app-two-modes**: this spec assumes one app with mode switching. If you find in practice that workers and posters want very different navigation/UX, splitting into two apps later is possible but means more maintenance — worth validating with real users before committing either way.