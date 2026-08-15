# Project Spec Addendum: Subscriptions + Near-Me Discovery + More Feature Ideas

> Builds on `work-marketplace-plan.md`. This adds a subscription system (admin-managed, free tier included) for both workers and posters, fleshes out the "find work near me" feature properly, and lists further feature ideas worth considering.

---

## 1. Subscription Model — Overview

Two separate subscription tracks, since workers and posters get value from different things:

- **Worker subscriptions** — pay for more visibility, more applications, lower commission
- **Poster subscriptions** — pay for more job postings, priority support, recurring job scheduling

**Free tier exists for both**, with limits. Admin creates/edits/disables plans entirely through the admin panel — nothing is hardcoded, so pricing and limits can change without a code deploy.

---

## 2. New Data Models

### SubscriptionPlan (admin-managed)

```js
{
  _id: ObjectId,
  name: String,                    // "Free", "Worker Pro", "Poster Business"
  targetRole: String,              // "worker" | "poster"
  price: Number,                   // 0 for free tier
  billingCycle: String,            // "monthly" | "yearly" | "free"
  isFree: Boolean,
  active: Boolean,                 // admin can disable a plan without deleting it
  limits: {
    // worker-focused limits
    maxApplicationsPerMonth: Number,      // null/-1 = unlimited
    profileBoost: Boolean,                // shows higher in nearby search results
    commissionDiscountPercent: Number,    // e.g. 5 means platform takes 5% less
    multiCategoryListing: Boolean,        // list under more than 1 skill category
    prioritySupportAccess: Boolean,

    // poster-focused limits
    maxJobPostingsPerMonth: Number,
    recurringJobsAllowed: Boolean,
    priorityWorkerMatching: Boolean,      // gets shown to verified/top-rated workers first
    reducedPaymentProcessingFee: Boolean
  },
  displayFeatures: [String],       // human-readable bullet list shown on the pricing screen
  razorpayPlanId: String,          // for recurring billing via Razorpay Subscriptions
  createdAt: Date,
  updatedAt: Date
}
```

### UserSubscription

```js
{
  _id: ObjectId,
  userId: ObjectId,
  role: String,                    // "worker" | "poster" — a user could have one active sub per role
  planId: ObjectId,
  status: String,                  // "active" | "expired" | "cancelled" | "past_due"
  startDate: Date,
  endDate: Date,
  autoRenew: Boolean,
  razorpaySubscriptionId: String,
  usageThisCycle: {
    applicationsUsed: Number,      // reset each billing cycle
    jobsPostedUsed: Number
  },
  paymentHistory: [
    { amount: Number, paidAt: Date, razorpayPaymentId: String, status: String }
  ]
}
```

---

## 3. Enforcement Logic (how limits actually get applied)

- Every user without an active paid `UserSubscription` is automatically on the **Free** plan (a `SubscriptionPlan` with `isFree: true` should always exist and be un-deletable, just editable — admin controls what "free" means, but the tier itself always exists).
- Middleware (`checkSubscriptionLimits`) runs before the "apply to job" and "post job" actions:
  - Look up the user's active plan for that role
  - Check `usageThisCycle` against the plan's limit
  - If at limit → block the action, return a clear message ("You've used your 5 free applications this month — upgrade to Worker Pro for unlimited"), and show the pricing screen
- `usageThisCycle` resets via a scheduled job (cron) at the start of each billing cycle, or lazily on first action after the cycle rolls over (simpler to build, no cron needed)

---

## 4. Admin Panel Additions

- **Subscription plan management** — create/edit/disable plans, set pricing and limits per role, reorder how they're displayed to users
- **Subscriber list** — view all active/expired subscriptions, filter by plan/role/status
- **Revenue breakdown** — subscription revenue vs. job commission revenue, shown separately (these are two different income streams and you'll want to see both)
- **Manual override** — ability to manually grant/extend a subscription to a specific user (useful for support cases, promos, or comping early users)
- **Free tier limit editor** — since free tier limits will likely need tuning based on real usage (too generous = no one upgrades, too stingy = people leave), make this the easiest thing to adjust, no code changes needed

---

## 5. API Endpoints (additions)

```
GET    /api/subscriptions/plans?role=worker      # public — show pricing to users
POST   /api/subscriptions/subscribe               # create Razorpay subscription, start billing
POST   /api/subscriptions/cancel
GET    /api/subscriptions/my-subscription
POST   /api/subscriptions/webhook                  # Razorpay subscription lifecycle events

# Admin
GET    /api/admin/subscription-plans
POST   /api/admin/subscription-plans
PUT    /api/admin/subscription-plans/:id
PATCH  /api/admin/subscription-plans/:id/toggle-active
GET    /api/admin/subscribers
POST   /api/admin/subscribers/:userId/grant        # manual override
GET    /api/admin/revenue/subscriptions
```

---

## 6. "Find Work Near Me" — Full Feature Spec

This deserves more detail since it's core to daily usage, not a side feature.

**Worker-side experience:**
- On opening the app (worker mode), default view = **nearby open jobs**, sorted by distance, using the worker's current GPS location (with a manual "change location" override for planning ahead)
- **Map view + list view toggle** — map shows pins clustered by area, list shows cards (category, title, distance, budget, poster rating, posted time)
- **Filters:** category, distance radius (slider, e.g. 1km/5km/10km/25km), budget range, date (today/this week/flexible), sort by (distance / newest / highest budget / best-rated poster)
- **"Urgent/ASAP" flag** — posters can mark a job as needing someone today, these get visually highlighted and push-notified to nearby available workers immediately
- **Rate display** — show both the poster's proposed budget and, where relevant, the average rate other workers charge for that category in that area (helps workers price their applications competitively, and helps posters see if their budget is realistic)
- **Saved searches / alerts** — worker sets "notify me when a cleaning job appears within 5km," gets a push notification the moment a matching job is posted, without needing the app open (this is a strong retention feature — same mechanic as job-alert emails on LinkedIn/Indeed, but real-time and hyperlocal)
- **"Available now" toggle** — like ride-hailing apps, worker can mark themselves actively available right now, which boosts them in urgent-job matching and shows posters who's actually online

**Poster-side symmetry:**
- When posting a job, show a live preview: "12 workers within 5km do cleaning" — reassures the poster before they even finish posting
- After posting, see live applicant count and can watch applications come in in real time (Socket.io push)

**Technical implementation:**
- MongoDB geospatial queries (`$near`/`$geoWithin`) on both `Job.location` and worker's live location
- Worker's live location updates periodically while "Available now" is toggled on (battery-conscious — update every few minutes, not continuously)
- Saved-search alerts implemented as a background job that checks new job postings against saved search criteria and triggers FCM push notifications

---

## 7. Further Feature Ideas (beyond what's built so far)

**Directly tied to subscriptions (natural upsells):**
- **Profile boost placement** — Worker Pro subscribers appear higher in nearby search results (already in the data model above) — this is one of the most standard, proven gig-marketplace monetization levers (similar to how freelance platforms sell visibility)
- **Reduced commission** — paid worker tiers keep more of what they earn per job, which directly justifies the subscription cost in a way workers can calculate themselves
- **Recurring job scheduling for posters** — "every Saturday, kitchen cleaning" auto-posts weekly without the poster re-creating it — genuinely useful and a strong reason to pay, since recurring work is common for this category (cleaning, gardening)

**Trust/quality signals (cheap to build, high impact on conversion)**
- **Badges** — "Verified," "Top Rated" (e.g. 4.8+ over 20+ jobs), "Quick Responder" (replies to applications fast), "Reliable" (low cancellation rate) — visual trust signals that matter a lot when someone's deciding who enters their home
- **No-show / cancellation tracking** — affects a hidden reliability score (separate from the public star rating) that influences search ranking — protects posters from serial no-shows without needing to expose a shame-based public metric

**Discovery/matching improvements**
- **Quote/negotiation flow** — instead of a flat "apply with a rate," allow a short back-and-forth (poster counter-offers) before hiring — common in real informal work arrangements, and reduces mismatched-expectation cancellations
- **Worker teams** — for bigger jobs (e.g., "clean entire house before a big event"), allow a worker to bring 1-2 teammates, split via the same job/payment record
- **Instant match / auto-assign** — for urgent jobs, instead of waiting for applications, auto-notify the top 3 nearest available verified workers and first-to-accept gets it (classic ride-hailing pattern, works well for urgent/simple jobs)

**Admin-side operational tools**
- **Demand/supply heatmap** — admin sees which areas have lots of job postings but few available workers (or vice versa) — useful for targeted worker recruitment campaigns in underserved areas
- **Dynamic rate suggestions** — admin (or even the poster, at posting time) sees "average rate for kitchen cleaning in this area is ₹X" computed from historical completed jobs — helps prevent unrealistic budgets that never get applicants

**Growth**
- **Referral program** — both workers and posters get a small credit/discount for referring someone who completes their first job — cheap, effective growth lever for hyperlocal marketplaces specifically, since word-of-mouth is naturally strong in this category

---

## 8. Build Phases (continues from the main plan's Phase 14)

**Phase 15 — Subscription plan management (admin)**
`SubscriptionPlan` CRUD, free-tier-always-exists logic, admin plan editor UI.

**Phase 16 — Subscription billing (Razorpay Subscriptions)**
`UserSubscription` model, Razorpay recurring billing integration, webhook handling for renewal/failure/cancellation.

**Phase 17 — Limit enforcement**
`checkSubscriptionLimits` middleware, usage counters, upgrade-prompt UI when a limit is hit.

**Phase 18 — Near-me discovery (full spec)**
Map/list toggle, filters, urgent-job flagging, saved searches + alert push notifications, "Available now" toggle.

**Phase 19 — Trust signals**
Badges, reliability scoring, cancellation tracking.

**Phase 20 — Growth features**
Referral program, quote/negotiation flow.

**Phase 21 — Admin operational tools**
Demand/supply heatmap, dynamic rate suggestions, subscription revenue dashboard.

---

## 9. One Judgment Call Worth Flagging

Free tier limits (how many free applications/postings per month) will need real usage data to set well — starting too generous means no one ever upgrades, too stingy means people leave before seeing value. Suggest launching with a deliberately generous free tier (e.g., 10 free applications/month for workers, 3 free postings/month for posters), watching actual behavior for a few weeks, then tightening via the admin panel — since that's exactly the kind of thing the admin-managed design here lets you adjust without a redeploy.