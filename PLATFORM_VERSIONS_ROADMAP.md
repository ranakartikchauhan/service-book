# 🚀 Local Work Marketplace — Version-Wise Platform Roadmap

> **This is the master reference document.** It consolidates all four planning documents (`work-marketplace-plan.md`, `v2-subscriptions.md`, `v3-notifications-safety.md`, `v4-mvp-scope.md`) into a single, version-separated build plan. Build version by version. Do not skip ahead.

---

## 📋 Platform Overview

A **mobile-first gig marketplace** for India connecting:
- **Workers** — people offering local informal services (cleaning, cooking, gardening, etc.)
- **Posters** — households/individuals who need work done

**Core loop:** *Poster posts a job → Worker finds it nearby and applies → Poster hires → Work happens → Poster pays via app → Both rate each other.*

**Tech Stack:**

| Layer | Choice |
|---|---|
| Mobile App | React Native (Expo) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (geospatial indexes) |
| Real-time | Socket.io |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Payments | Razorpay (escrow + payouts) |
| File Storage | Cloudinary |
| Maps/Location | Google Maps API |
| Admin Panel | React (web) |
| Marketing Site | Next.js |

---

---

# VERSION 1 — MVP (The Real First Ship)

> **Goal:** Prove the core loop works with real people. The smallest version that is genuinely usable. Nothing is built that the loop doesn't need.

**Target outcome:** A real poster can post a job, a real verified worker can apply and get hired, they can chat, complete the job, get paid through the app, and rate each other — with an admin monitoring safety and approving workers.

---

## V1 — Data Models (Minimal)

```js
// User
{ _id, name, phone, profilePhotoUrl, currentMode: "worker"|"poster", createdAt }

// WorkerProfile
{ _id, userId, skills: [String], bio, serviceRadius,
  verification: { status: "unverified"|"pending"|"verified"|"rejected", idDocUrl },
  rating: { average, count }, completedJobs }

// PosterProfile
{ _id, userId, rating: { average, count }, jobsPosted }

// Job
{ _id, posterId, category, title, description,
  location: { type: "Point", coordinates: [lng, lat] },
  scheduledDate, budgetAmount, photos: [String],
  status: "open"|"assigned"|"in_progress"|"completed"|"cancelled",
  statusHistory: [{ status, timestamp }],
  assignedWorkerId, createdAt }

// Application
{ _id, jobId, workerId, proposedRate, message,
  status: "pending"|"accepted"|"rejected"|"withdrawn", createdAt }

// Transaction
{ _id, jobId, posterId, workerId, amount, commission, workerPayout,
  status: "held_in_escrow"|"released"|"refunded",
  razorpayOrderId, razorpayPaymentId, createdAt, releasedAt }

// Review
{ _id, jobId, fromUserId, toUserId, rating: Number, comment, createdAt }

// SafetyEvent
{ _id, userId, jobId, triggeredAt, location: { type: "Point", coordinates },
  status: "active"|"acknowledged_by_admin"|"resolved"|"false_alarm", adminNotes }

// Category (admin-managed fixed list)
{ _id, name, active: Boolean }
```

---

## V1 — Feature Scope

### Auth
- Phone OTP login for both roles (Firebase Auth or MSG91/Twilio for OTP delivery)
- Single account, two modes: Worker / Poster (toggled in settings)

### Worker Mode
- Profile setup: name, photo, skills (fixed category list), bio, service radius
- ID verification upload (government ID to Cloudinary private storage) — status shown as pending until admin approves
  - Workers **cannot apply to jobs** until verified — non-negotiable for in-home safety
- Browse nearby open jobs — **list view only** (map view is V2)
- Filter by category + distance
- Apply to a job with a proposed rate + short message
- In-app chat with matched poster (Socket.io)
- Mark job as started / completed
- Basic push notification: application accepted/rejected, new message (single on/off toggle)

### Poster Mode
- Post a job: category, description, photos, location (map picker), date, budget (fixed amount)
- View applicants — see worker profile, rating, verification badge, proposed rate
- Hire a worker — triggers payment hold in escrow
- In-app chat with hired worker
- Mark job complete — releases payment to worker
- Basic push notification: new applicant, worker marked complete

### Payments (Razorpay — Escrow Flow)
```
Poster hires worker
    ↓
Backend creates Razorpay order
    ↓
Poster pays → funds held by platform (status: "held_in_escrow")
    ↓
Worker does the job, marks complete
    ↓
Poster marks complete → releases payment to worker
    (OR auto-release after X hours if poster doesn't respond)
    ↓
Backend triggers payout via Razorpay Payouts
minus flat commission (admin-editable single value in PlatformConfig)
    ↓
status: "released"
```

> Use **Razorpay Route/Payouts** (not just basic Payments) — check current Razorpay docs since payout/marketplace products have their own KYC compliance requirements.

### Reviews
- Two-way star rating + comment after job completion
- Aggregate rating updated on WorkerProfile / PosterProfile

### Safety — SOS (pulled into MVP deliberately)
- **SOS button** visible on the active-job screen during any "in_progress" job (both modes)
- On tap: shares GPS location with platform, creates `SafetyEvent`, flags to admin high-priority queue
- Not optional for a platform where strangers enter each other's homes

### Admin Panel
- Login
- **Worker verification queue** — view uploaded ID docs, approve/reject with reason
- View all jobs (filter by status)
- **View/manage flat commission rate** (stored as a PlatformConfig setting, not hardcoded)
- **Active Safety Events** — highest-priority view in the entire panel, above everything else
- Basic user management: view/suspend/ban users

### Marketing Website
- Simple landing page explaining the platform
- App Store / Play Store download links
- "How it works" section for workers vs posters

---

## V1 — Build Phases

| Phase | What Gets Built |
|---|---|
| **Phase 1** | Backend foundation: Express + MongoDB, all MVP models, OTP auth |
| **Phase 2** | Profiles + verification: Worker/Poster CRUD, ID upload to Cloudinary, admin approval endpoint |
| **Phase 3** | Job posting + nearby discovery (list view): Job CRUD, geospatial query, category filter |
| **Phase 4** | Applications + hiring: Apply/accept/reject, job status transitions, `statusHistory` logging |
| **Phase 5** | Chat: Socket.io setup, basic real-time messaging per job |
| **Phase 6** | Payments: Razorpay one-time payment, escrow hold, release-on-completion, flat commission |
| **Phase 7** | Reviews: Two-way rating after completion |
| **Phase 8** | SOS/Safety: SOS button, `SafetyEvent` model, admin's active-safety-events view |
| **Phase 9** | Basic notifications: FCM integration, single on/off toggle, MVP-critical events only |
| **Phase 10** | Mobile app screens: All screens for auth, profile, job browse/post, chat, payment, reviews, SOS |
| **Phase 11** | Admin panel: Verification queue, job list, commission setting, safety events, user management |
| **Phase 12** | Marketing website: Simple landing page + download links |
| **Phase 13** | Launch polish: Error handling, empty states, loading states, T&C/privacy policy, OTP rate limiting |

---

## V1 — API Endpoints

```
# Auth
POST   /api/auth/send-otp
POST   /api/auth/verify-otp

# Worker
GET    /api/worker/profile
PUT    /api/worker/profile
POST   /api/worker/verification/submit
GET    /api/worker/jobs/nearby
POST   /api/worker/jobs/:id/apply
GET    /api/worker/earnings

# Poster
POST   /api/poster/jobs
GET    /api/poster/jobs
GET    /api/poster/jobs/:id/applications
POST   /api/poster/jobs/:id/hire/:workerId
POST   /api/poster/jobs/:id/complete
POST   /api/poster/jobs/:id/cancel

# Shared
GET    /api/jobs/:id
POST   /api/reviews
GET    /api/chat/:jobId/messages
WS     /ws/chat

# Payments
POST   /api/payments/create-order
POST   /api/payments/webhook

# Safety
POST   /api/safety/sos

# Admin
POST   /api/admin/login
GET    /api/admin/verifications/pending
POST   /api/admin/verifications/:id/approve
POST   /api/admin/verifications/:id/reject
GET    /api/admin/jobs
GET    /api/admin/safety-events
GET    /api/admin/users
PATCH  /api/admin/users/:id/suspend
GET    /api/admin/config
PUT    /api/admin/config/commission
```

---

## V1 — Project Folder Structure

```
work-marketplace/
├── backend/
│   ├── models/
│   │   ├── User.js, WorkerProfile.js, PosterProfile.js
│   │   ├── Job.js, Application.js, Transaction.js
│   │   ├── Review.js, Category.js, ChatMessage.js
│   │   ├── SafetyEvent.js, PlatformConfig.js
│   ├── routes/
│   │   ├── auth.js, worker.js, poster.js, jobs.js
│   │   ├── payments.js, admin.js, chat.js, safety.js
│   ├── services/
│   │   ├── razorpayService.js
│   │   ├── otpService.js
│   │   ├── cloudinaryService.js
│   │   ├── fcmService.js
│   │   └── geoMatchingService.js
│   ├── middleware/
│   │   ├── verifyUserToken.js
│   │   └── verifyAdminToken.js
│   ├── sockets/
│   │   └── chatSocket.js
│   ├── config/db.js
│   └── server.js
├── mobile-app/                     # React Native (Expo)
│   └── src/
│       ├── screens/
│       │   ├── auth/
│       │   ├── worker/
│       │   ├── poster/
│       │   └── shared/
│       ├── components/
│       ├── navigation/
│       └── api/
├── admin-panel/                    # React web
│   └── src/
└── marketing-website/              # Next.js
    └── pages/
```

---

---

# VERSION 2 — Subscriptions + Near-Me Discovery

> **Unlock condition:** Core loop is proven with real users. You have usage data to tune free tier limits.

**Goal:** Introduce subscription monetization and fully build out the near-me discovery experience.

---

## V2 — New Data Models

```js
// SubscriptionPlan (admin-managed, nothing hardcoded)
{
  _id, name,
  targetRole: "worker"|"poster",
  price: Number,
  billingCycle: "monthly"|"yearly"|"free",
  isFree: Boolean,
  active: Boolean,
  limits: {
    maxApplicationsPerMonth: Number,    // worker
    profileBoost: Boolean,
    commissionDiscountPercent: Number,
    multiCategoryListing: Boolean,
    prioritySupportAccess: Boolean,
    maxJobPostingsPerMonth: Number,     // poster
    recurringJobsAllowed: Boolean,
    priorityWorkerMatching: Boolean,
    reducedPaymentProcessingFee: Boolean
  },
  displayFeatures: [String],
  razorpayPlanId: String,
  createdAt, updatedAt
}

// UserSubscription
{
  _id, userId,
  role: "worker"|"poster",
  planId: ObjectId,
  status: "active"|"expired"|"cancelled"|"past_due",
  startDate, endDate,
  autoRenew: Boolean,
  razorpaySubscriptionId: String,
  usageThisCycle: {
    applicationsUsed: Number,
    jobsPostedUsed: Number
  },
  paymentHistory: [{ amount, paidAt, razorpayPaymentId, status }]
}
```

---

## V2 — Subscription Logic

- Every user without an active paid subscription is **automatically on the Free plan**
- The Free plan `(isFree: true)` **always exists and is un-deletable** — admin can only edit its limits
- `checkSubscriptionLimits` middleware runs before "apply to job" and "post job" actions
- `usageThisCycle` resets lazily on first action after billing cycle rolls over

> **Free tier tuning note:** Launch generous (e.g., 10 free applications/month, 3 free postings/month), watch real behavior, then tighten via admin panel — no code deploy needed.

---

## V2 — Near-Me Discovery (Full Spec)

### Worker-Side
- Default home view: **nearby open jobs sorted by distance** (GPS + manual location override)
- **Map view + list view toggle** — map shows clustered pins, list shows cards
- **Filters:** category, distance radius slider (1/5/10/25km), budget range, date, sort options
- **Urgent/ASAP flag** — posters can mark a job as needing someone today; push-notified to nearby workers immediately
- **Rate display** — poster's budget + average rate other workers charge in that area/category
- **Saved searches / alerts** — "notify me when a cleaning job appears within 5km" → instant push on new match
- **"Available now" toggle** — worker marks themselves active; boosts them in urgent-job matching

### Poster-Side
- On posting: live preview "12 workers within 5km do cleaning"
- After posting: live applicant count with real-time updates (Socket.io)

### Technical
- MongoDB `$near`/`$geoWithin` on `Job.location` and worker live location
- Worker live location updates every few minutes while "Available now" is on (battery-conscious)
- Saved-search alerts: background job checks new job postings against saved searches → FCM push

---

## V2 — Subscription-Gated Features

- **Profile boost** — Worker Pro subscribers appear higher in nearby search results
- **Reduced commission** — paid worker tiers keep a larger percentage per job
- **Recurring job scheduling** — "every Saturday, kitchen cleaning" auto-posts weekly (poster plans only)

---

## V2 — Admin Panel Additions

- Subscription plan CRUD (create/edit/disable/reorder display)
- Subscriber list (filter by plan/role/status)
- Revenue breakdown: subscription revenue vs. commission revenue (separate views)
- Manual subscription override: grant/extend a subscription to any user
- Free tier limit editor — the most easily-adjustable thing, no code deploy

---

## V2 — New API Endpoints

```
# Subscriptions (user-facing)
GET    /api/subscriptions/plans?role=worker
POST   /api/subscriptions/subscribe
POST   /api/subscriptions/cancel
GET    /api/subscriptions/my-subscription
POST   /api/subscriptions/webhook

# Admin subscriptions
GET    /api/admin/subscription-plans
POST   /api/admin/subscription-plans
PUT    /api/admin/subscription-plans/:id
PATCH  /api/admin/subscription-plans/:id/toggle-active
GET    /api/admin/subscribers
POST   /api/admin/subscribers/:userId/grant
GET    /api/admin/revenue/subscriptions

# Near-me / saved searches
POST   /api/worker/saved-searches
GET    /api/worker/saved-searches
DELETE /api/worker/saved-searches/:id
PUT    /api/worker/availability-toggle
```

---

## V2 — Build Phases

| Phase | What Gets Built |
|---|---|
| **Phase 14** | Subscription plan management (admin): `SubscriptionPlan` CRUD, free-tier-always-exists logic, admin plan editor UI |
| **Phase 15** | Subscription billing: `UserSubscription` model, Razorpay recurring billing, webhook handling for renewal/failure/cancellation |
| **Phase 16** | Limit enforcement: `checkSubscriptionLimits` middleware, usage counters, upgrade-prompt UI when limit is hit |
| **Phase 17** | Map view + filters: map/list toggle, distance slider, urgent-job flagging |
| **Phase 18** | Saved searches + alerts: saved search model, background job, push notification on new match |
| **Phase 19** | "Available now" toggle + profile boost ordering in search results |

---

---

# VERSION 3 — Notifications, Safety (Full) & Accessibility

> **Unlock condition:** Active real users exist. You know which notification categories they care about.

**Goal:** Proper granular notification system, full safety stack, job status timeline, and foundational accessibility features.

---

## V3 — New Data Models

```js
// NotificationPreference (per user)
{
  _id, userId,
  categories: {
    newMatchingJob: "instant"|"daily_digest"|"off",
    applicationUpdates: "instant"|"off",
    messages: "instant"|"off",
    paymentUpdates: "instant"|"off",
    jobReminders: "instant"|"off",
    noApplicantsNudge: "instant"|"off",
    subscriptionBilling: "instant"|"off",
    marketing: "instant"|"weekly_digest"|"off"
  },
  quietHours: { start: String, end: String },
  updatedAt
}

// Notification (log + queue record)
{
  _id, userId, category: String,
  title, body,
  data: Object,                    // deep-link payload (jobId, chatId, etc.)
  channel: "push"|"sms"|"in_app",
  status: "queued"|"sent"|"failed"|"read",
  urgent: Boolean,                 // bypasses quiet hours (SOS-related only)
  createdAt, sentAt, readAt
}

// EmergencyContact (per user, optional)
{ userId, name, phone, relationship }
```

---

## V3 — Notification Architecture

```
Event fires
    ↓
Backend checks NotificationPreference for each candidate user
    ↓
"instant"       → send via FCM (respect quiet hours unless urgent: true)
"daily_digest"  → queue into batch, sent once/day via cron job
"off"           → skip push, still log in-app notification
    ↓
Notification record created regardless, for in-app notification center
```

- **In-app notification center:** bell-icon screen showing all notifications regardless of push settings
- **Digest batching:** cron job groups "daily_digest" notifications into one push ("5 new cleaning jobs near you today")

---

## V3 — Safety (Full)

### Full SOS Flow
1. SOS button on active-job screen during "in_progress" jobs
2. On tap:
   - Shares live GPS to platform
   - Flags job to admin as active safety event (dedicated high-priority queue)
   - Notifies pre-set emergency contact (SMS) if configured
   - Optional: triggers follow-up confirmation if user doesn't respond within a short window
3. Admin's "Active Safety Events" remains the highest-priority view

### Live Location Sharing During Active Jobs
- Opt-in only, active only from "worker marked on the way" → "job marked complete"
- Poster sees live map of worker approaching
- Location data deleted/anonymized after defined retention window
- Explicit consent screen required on first enable (not a buried toggle)

---

## V3 — Job Status Timeline

Visual strip on job detail screen (both roles see the same view):

```
Posted → Applied → Hired → On the way → In Progress → Completed → Paid
```

- Current stage highlighted, past stages checked, timestamp for each transition
- Built from `Job.statusHistory` (already exists from V1 — this just adds the UI layer)
- Doubles as the dispute audit trail for admin

---

## V3 — Accessibility

### Multi-Language Support
- Hindi + English (i18next with React Native)
- Architecture supports adding regional languages later without a rewrite
- Optional translate button per chat message (Google Translate API) — opt-in, not auto-replacing original

### Voice Input
- Voice-to-text for job posting description (mic icon, speech fills field, editable before posting)
- Voice-to-text for worker profile bio

### Offline / Low-Connectivity Handling
- Queue actions locally when offline (mark job complete, send chat message, apply to job) → sync on reconnect
- Clear "offline — will sync when back online" indicator
- Cache nearby-jobs list + active job details locally

---

## V3 — New API Endpoints

```
GET    /api/notifications
PATCH  /api/notifications/:id/read
GET    /api/notifications/preferences
PUT    /api/notifications/preferences
POST   /api/notifications/register-device

POST   /api/safety/emergency-contact
GET    /api/safety/emergency-contact
```

---

## V3 — Build Phases

| Phase | What Gets Built |
|---|---|
| **Phase 20** | Notification infrastructure: `NotificationPreference` + `Notification` models, FCM, in-app notification center, quiet hours logic |
| **Phase 21** | Digest batching: scheduled job for daily-digest grouping, digest notification formatting |
| **Phase 22** | Full SOS + emergency contacts: emergency contact setup, full SOS flow, admin safety view upgrades |
| **Phase 23** | Live location sharing: consent flow, live updates during active jobs, retention/deletion policy |
| **Phase 24** | Job status timeline: timeline UI component (data already exists from V1 `statusHistory`) |
| **Phase 25** | Multi-language: i18next setup, Hindi + English translations, language selector in settings |
| **Phase 26** | Voice input: speech-to-text for job posting + worker profile bio |
| **Phase 27** | Offline handling: local action queueing, sync-on-reconnect, offline indicators, local caching |

---

---

# VERSION 4 — Trust, Growth & Admin Intelligence

> **Unlock condition:** Active user base exists. Enough rating data and traffic to make trust signals meaningful and worth optimizing.

**Goal:** Trust/quality layer, growth mechanics, and admin operational intelligence.

---

## V4 — Trust & Quality Signals

### Badges (shown on worker profile + search results)
- **Verified** — completed ID verification
- **Top Rated** — 4.8+ average over 20+ completed jobs
- **Quick Responder** — responds to applications fast (based on response time tracking)
- **Reliable** — low cancellation rate

### Reliability Score (hidden, affects search ranking)
- Separate from public star rating
- Accounts for: no-show rate, cancellation rate, late completions
- Influences worker ordering in nearby search results
- Not shown publicly (avoids shame-based mechanics)

### Formal Dispute Resolution Dashboard
- Full dispute lifecycle: open → under_review → resolved
- Admin sees dispute details, full chat history, job timeline, decides resolution
- New `Dispute` model:
  ```js
  { _id, jobId, raisedBy, reason, description,
    status: "open"|"under_review"|"resolved",
    adminNotes, resolution: "refund_poster"|"release_worker"|"partial",
    resolvedAt, createdAt }
  ```
- Dispute window: job not fully closed until 48 hours after completion

---

## V4 — Growth Features

### Referral Program
- Workers and posters get a small credit/discount for referring someone who completes their first job
- Track referral source on signup (referral code / link)

### Quote/Negotiation Flow
- Allow short back-and-forth: poster counter-offers, worker accepts/rejects
- Reduces mismatched-expectation cancellations
- Extends the `Application` model with negotiation states

### Worker Teams
- For bigger jobs, allow a worker to bring 1-2 teammates
- Payment split via same job/transaction record

### Instant Match / Auto-Assign (urgent jobs)
- For urgent-flagged jobs: auto-notify top 3 nearest verified available workers
- First to accept gets the job (ride-hailing pattern)
- Only for urgent/simple jobs, not the default flow

---

## V4 — Admin Operational Tools

### Demand/Supply Heatmap
- Admin sees which areas have many job postings but few available workers (and vice versa)
- Used for targeted worker recruitment campaigns in underserved areas

### Dynamic Rate Suggestions
- At job posting time, poster sees "average rate for kitchen cleaning in this area is ₹X"
- Computed from historical completed jobs
- Prevents unrealistic budgets that never get applicants

### Full Revenue Analytics
- Subscription revenue vs. commission revenue (separate views)
- Jobs posted per category, completion rate, average time-to-hire
- Worker supply vs. poster demand by area

---

## V4 — Build Phases

| Phase | What Gets Built |
|---|---|
| **Phase 28** | Badges: badge logic, computation triggers, badge display on profiles and search results |
| **Phase 29** | Reliability scoring: hidden reliability score, cancellation/no-show tracking, affects search ordering |
| **Phase 30** | Formal dispute dashboard: `Dispute` model, full dispute lifecycle UI, admin resolution tools, dispute window |
| **Phase 31** | Referral program: referral code/link tracking, credit/discount system |
| **Phase 32** | Quote/negotiation flow: extended application model with negotiation states |
| **Phase 33** | Worker teams: team application model, split payment support |
| **Phase 34** | Instant match: auto-notify top 3 workers for urgent jobs, first-accept logic |
| **Phase 35** | Admin heatmap + dynamic rate suggestions |
| **Phase 36** | Full subscription revenue dashboard + analytics |

---

---

# 📊 Complete Phase Reference (All Versions)

| Phase | Version | Feature Area |
|---|---|---|
| 1 | V1 | Backend foundation |
| 2 | V1 | Profiles + verification |
| 3 | V1 | Job posting + nearby discovery (list view) |
| 4 | V1 | Applications + hiring |
| 5 | V1 | Chat (Socket.io) |
| 6 | V1 | Payments (Razorpay escrow) |
| 7 | V1 | Reviews |
| 8 | V1 | SOS / Safety |
| 9 | V1 | Basic notifications (FCM) |
| 10 | V1 | Mobile app screens (all) |
| 11 | V1 | Admin panel (V1 scope) |
| 12 | V1 | Marketing website |
| 13 | V1 | Launch polish |
| 14 | V2 | Subscription plan management (admin) |
| 15 | V2 | Subscription billing (Razorpay recurring) |
| 16 | V2 | Limit enforcement middleware |
| 17 | V2 | Map view + filters |
| 18 | V2 | Saved searches + alerts |
| 19 | V2 | "Available now" toggle + profile boost |
| 20 | V3 | Notification infrastructure |
| 21 | V3 | Digest batching |
| 22 | V3 | Full SOS + emergency contacts |
| 23 | V3 | Live location sharing |
| 24 | V3 | Job status timeline UI |
| 25 | V3 | Multi-language support |
| 26 | V3 | Voice input |
| 27 | V3 | Offline handling |
| 28 | V4 | Badges |
| 29 | V4 | Reliability scoring |
| 30 | V4 | Formal dispute dashboard |
| 31 | V4 | Referral program |
| 32 | V4 | Quote/negotiation flow |
| 33 | V4 | Worker teams |
| 34 | V4 | Instant match / auto-assign |
| 35 | V4 | Admin heatmap + dynamic rate suggestions |
| 36 | V4 | Full subscription revenue dashboard + analytics |

---

# 🔑 Key Decisions & Constraints

| Decision | Detail |
|---|---|
| **Phone OTP auth** | Right default for India/informal-work market. Use Firebase Auth or MSG91/Twilio. |
| **One app, two modes** | Simpler than two apps. Splitting later is possible but costly — validate first. |
| **ID docs in Cloudinary** | Must be private/restricted URLs — never public like job photos. Government ID storage is a real compliance area. |
| **Razorpay Route/Payouts** | Required for escrow-then-release flow — has its own KYC compliance requirements for the platform itself. |
| **Commission rate** | Store in `PlatformConfig`, never hardcoded. Admin-editable without a deploy. |
| **Free tier limits** | Admin-editable without a deploy. Launch generous, tune based on real data. |
| **Subscription free tier** | Always exists, un-deletable. Admin can edit limits, never remove the tier. |
| **"Any kind of work"** | Flexible but messy. Free-text "other" category needs active admin curation. Prioritize admin category tooling early. |
| **Dispute handling** | Handle manually in V1. Build formal flow in V4 once volume justifies it. |
| **Live location** | Opt-in only. Explicit consent screen. Delete/anonymize after retention window. Real legal weight. |

---

> **The rule:** Build one version at a time. Don't start V2 until real users have used V1. Don't add features to a version because they're good ideas — they'll be good ideas after the prior version is proven too.
