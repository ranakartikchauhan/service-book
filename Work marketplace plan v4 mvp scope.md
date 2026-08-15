# Project Spec v4: MVP Scope — What to Actually Build First

> This is not a new feature list — it's the opposite. This document takes everything from `work-marketplace-plan.md`, `-v2-subscriptions.md`, and `-v3-notifications-safety.md`, and cuts it down to the smallest version that's genuinely usable and testable with real people. Everything else stays in the other docs as your roadmap — nothing is lost, just sequenced.

---

## 1. The Rule Used to Decide What's In vs Out

A feature made the MVP cut only if the core loop breaks without it:

**Core loop:** *Poster posts a job → Worker finds it and applies → Poster hires → Work happens → Poster pays → Both rate each other.*

If a feature makes that loop better but the loop still works without it, it's deferred — no matter how good the idea is.

---

## 2. MVP Scope — What's IN

### Auth
- Phone OTP login (both roles)

### Worker mode
- Basic profile: name, photo, skills (from a fixed category list), bio, service radius
- ID verification (upload only — admin manually approves/rejects, no automated checks yet)
- Browse nearby jobs — **list view only** (map view deferred), with category + distance filter
- Apply to a job with a proposed rate + short message
- In-app chat with matched poster
- Mark job as started / completed
- Basic push notification: application accepted/rejected, new message (instant only — no digest batching yet, no granular preference screen yet, just a single on/off toggle)

### Poster mode
- Post a job: category, description, photos, location, date, budget
- View applicants, see basic worker profile + rating
- Hire a worker
- In-app chat
- Mark job as completed (releases payment)
- Basic push notification: new applicant, worker marked complete

### Payments
- Razorpay one-time payment per job, held until poster confirms completion, then released to worker minus a **fixed flat commission** (no subscription-based discount tiers yet — just one flat rate, set once, editable by admin)

### Reviews
- Two-way star rating + comment after job completion

### Safety (the one thing pulled forward from v3, deliberately)
- **SOS button on active jobs** — even a simple version (shares location + flags to admin) belongs in MVP, not because it's part of the core loop, but because launching an in-home-service marketplace without any safety mechanism is a real risk, not just a missing feature

### Admin panel
- Worker verification queue (approve/reject)
- View all jobs and their status
- View/manage flat commission rate
- View active safety events (from the SOS feature)
- Basic user management (suspend/ban)

### Marketing website
- Simple landing page + app download links — doesn't need to be sophisticated for MVP, just needs to exist so people can find and install the app

---

## 3. What's OUT of MVP (deferred, not discarded)

| Deferred feature | Why it can wait | Where it's documented |
|---|---|---|
| Subscriptions (paid tiers, free tier limits) | Core loop works with just a flat commission; monetization refinement comes after you know people use the app | v2 doc |
| Map view for nearby jobs | List view is enough to validate the loop; map is a polish upgrade | Main plan, Section 6 (v2 addendum) |
| Saved search alerts / "Available now" toggle | Real retention features, but need real usage data to tune well — build once you have users to observe | v2 doc, Section 6 |
| Notification granularity + digest batching | Single on/off toggle is enough for MVP; the full preference system is a v1.1 refinement | v3 doc |
| Live location sharing during jobs | Real feature, but adds privacy/consent complexity — ship after the core loop is validated | v3 doc |
| Disputes dashboard | Handle early disputes manually via admin/support directly; build the formal flow once volume justifies it | Main plan, Section 7 |
| Recurring/scheduled jobs | Nice for retention, not needed to prove the core loop works at all | v2 doc |
| Badges, reliability scoring | Trust signals matter more at scale, once there's enough rating data to make them meaningful | v2 doc |
| Multi-language UI | English (or your primary language) only for MVP; add Hindi properly once you're validating with real local users, not guessing | v3 doc |
| Voice input | Nice accessibility feature, not required to test the core loop | v3 doc |
| Offline handling | Build once you see real connectivity issues from real users, not preemptively | v3 doc |
| Favorite/rehire worker, before/after photos, in-app wallet, weather rescheduling, earnings docs | All genuinely good, all genuinely optional at this stage | This conversation |
| Referral program, heatmaps, dynamic rate suggestions, quote/negotiation, worker teams | Growth/optimization features — need existing usage to optimize against | v2 doc |

---

## 4. Simplified MVP Data Models

Trimmed versions of the full models — build these first, extend later rather than building the full version now.

```js
// User
{ _id, name, phone, profilePhotoUrl, currentMode, createdAt }

// WorkerProfile
{ _id, userId, skills: [String], bio, serviceRadius, 
  verification: { status, idDocUrl }, rating: { average, count }, completedJobs }

// PosterProfile
{ _id, userId, rating: { average, count }, jobsPosted }

// Job
{ _id, posterId, category, title, description, location: {type:"Point", coordinates}, 
  scheduledDate, budgetAmount, photos: [String], status, statusHistory: [{status, timestamp}], 
  assignedWorkerId, createdAt }

// Application
{ _id, jobId, workerId, proposedRate, message, status, createdAt }

// Transaction
{ _id, jobId, posterId, workerId, amount, commission, workerPayout, 
  status, razorpayOrderId, razorpayPaymentId, createdAt, releasedAt }

// Review
{ _id, jobId, fromUserId, toUserId, rating, comment, createdAt }

// SafetyEvent
{ _id, userId, jobId, triggeredAt, location, status, adminNotes }

// Category (admin-managed, fixed list for MVP — no free-text "other" yet)
{ _id, name, active }
```

Everything else (SubscriptionPlan, UserSubscription, NotificationPreference, Dispute, EmergencyContact, etc.) stays designed in the other docs but **not built** until you're past MVP.

---

## 5. MVP Build Phases (tight — aim to actually finish these)

**Phase 1 — Backend foundation**
Express + MongoDB, all MVP models above, OTP auth.

**Phase 2 — Profiles + verification**
Worker/Poster profile CRUD, ID upload to Cloudinary, admin approval endpoint.

**Phase 3 — Job posting + nearby discovery (list view)**
Job CRUD, geospatial nearby query, category filter, fixed category list.

**Phase 4 — Applications + hiring**
Apply/accept/reject, job status transitions, `statusHistory` logging.

**Phase 5 — Chat**
Socket.io, basic real-time messaging per job.

**Phase 6 — Payments**
Razorpay one-time payment, escrow hold, release-on-completion, flat commission (admin-editable single value, not a plan system).

**Phase 7 — Reviews**
Two-way rating after completion.

**Phase 8 — SOS/safety**
Basic SOS button, `SafetyEvent` model, admin's active-safety-events view.

**Phase 9 — Basic notifications**
Single on/off push toggle, FCM integration for the handful of MVP-critical events (application accepted, new message, job completed).

**Phase 10 — Mobile app screens (worker + poster)**
All screens needed for the above — auth, profile, job browse/post, chat, payment, reviews, SOS button.

**Phase 11 — Admin panel**
Verification queue, job list, commission setting, safety events, user suspend/ban.

**Phase 12 — Marketing website**
Simple landing page + download links.

**Phase 13 — Launch polish**
Error handling, empty states, loading states, terms of service/privacy policy pages, basic rate limiting on OTP.

---

## 6. What "Done" Looks Like for MVP

You should be able to: post a real job, have a real worker apply and get hired, chat, complete the job, get paid through the app, and rate each other — with an admin who can approve workers and see if anything goes wrong safety-wise. That's it. That's the whole test. Everything in the other three documents is what you build **after** this loop is proven with actual people using it, not before.

---

## 7. Suggested Next Step

Don't keep expanding the plan. Either:
1. Start building Phase 1 now (I can generate the actual backend code), or
2. Hand Sections 4-5 of this document to a coding LLM/developer as the literal starting brief

Both are better next moves than another round of feature ideas — you have more than enough scoped out across all four documents to build something real and expand deliberately from a working base rather than from more planning.