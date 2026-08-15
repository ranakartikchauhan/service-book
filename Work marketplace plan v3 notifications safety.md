# Project Spec Addendum v3: Notifications, Safety, and Accessibility

> Builds on `work-marketplace-plan.md` and `work-marketplace-plan-v2-subscriptions.md`. This adds a proper notification system, safety features (SOS, live location sharing), a job status timeline, and accessibility features (multi-language, voice input, offline handling).

---

## 1. Notification System — Architecture

**Core principle:** granular, per-category control — never one global on/off switch. Users who get annoyed by one noisy category shouldn't lose the useful ones too.

### NotificationPreference (per user)

```js
{
  _id: ObjectId,
  userId: ObjectId,
  categories: {
    newMatchingJob: String,        // "instant" | "daily_digest" | "off"
    applicationUpdates: String,    // "instant" | "off"  (accept/reject — usually always instant)
    messages: String,              // "instant" | "off"
    paymentUpdates: String,        // "instant" | "off"
    jobReminders: String,          // "instant" | "off"  (1hr before scheduled job)
    noApplicantsNudge: String,     // "instant" | "off"  (poster-side, "consider raising budget")
    subscriptionBilling: String,   // "instant" | "off"
    marketing: String              // "instant" | "weekly_digest" | "off" — separate from transactional
  },
  quietHours: { start: String, end: String },  // e.g. no non-urgent pushes 10pm-7am
  updatedAt: Date
}
```

### Notification (log/queue record)

```js
{
  _id: ObjectId,
  userId: ObjectId,
  category: String,               // matches NotificationPreference keys
  title: String,
  body: String,
  data: Object,                   // deep-link payload (jobId, chatId, etc.)
  channel: String,                // "push" | "sms" | "in_app"
  status: String,                 // "queued" | "sent" | "failed" | "read"
  urgent: Boolean,                // bypasses quiet hours (e.g. SOS-related, not marketing)
  createdAt: Date,
  sentAt: Date,
  readAt: Date
}
```

### How it works

```
Event happens (e.g. new job posted matching a saved search)
        ↓
Backend checks NotificationPreference for each candidate user
        ↓
"instant" → send immediately via FCM (respecting quiet hours unless urgent)
"daily_digest" → queue into a batch, sent once/day via a scheduled job
"off" → skip, but still log an in-app notification (visible in-app even if push is off)
        ↓
Notification record created either way, for the in-app notification 
center / read history
```

**In-app notification center:** a simple bell-icon screen showing all notifications regardless of push settings — push is just the "interrupt" channel, the in-app list is the full record. This matters because users who turn off push for a category shouldn't lose the information entirely, just the interruption.

**Digest batching:** a scheduled job (cron, e.g. runs once daily at a set time) groups all "daily_digest" notifications per user into a single push ("5 new cleaning jobs near you today") rather than 5 separate ones.

---

## 2. API Endpoints (notifications)

```
GET    /api/notifications                    # in-app list, paginated
PATCH  /api/notifications/:id/read
GET    /api/notifications/preferences
PUT    /api/notifications/preferences
POST   /api/notifications/register-device     # save FCM device token
```

---

## 3. Safety Features

### SOS / Emergency Alert

**Flow:**
1. A visible SOS button on the active-job screen (both worker and poster mode) during any job with status "in_progress"
2. Tapping it:
   - Immediately shares live GPS location with the platform (and, if configured, a pre-set emergency contact)
   - Flags the job/session to admin as an active safety event — surfaces in a dedicated, high-priority admin queue (not the regular dispute queue — this needs faster response)
   - Optionally triggers a confirmation call/SMS from support if the user doesn't respond to a follow-up check within a short window
3. Admin has a real-time "Active Safety Events" view — this should be the single most urgent thing in the entire admin panel, above everything else

### EmergencyContact (per user, optional but encouraged at signup)

```js
{
  userId: ObjectId,
  name: String,
  phone: String,
  relationship: String
}
```

### SafetyEvent

```js
{
  _id: ObjectId,
  userId: ObjectId,
  jobId: ObjectId,
  triggeredAt: Date,
  location: { type: "Point", coordinates: [Number, Number] },
  status: String,                 // "active" | "acknowledged_by_admin" | "resolved" | "false_alarm"
  adminNotes: String,
  resolvedAt: Date
}
```

### Live Location Sharing During a Job

- Opt-in, only active between "worker marked as on the way" and "job marked complete" — not tracked at any other time
- Poster can see a live map of the worker's location approaching, similar to ride-hailing apps
- This is both a safety feature (poster knows who's coming and when) and a trust/convenience feature (no "are you almost here?" texting)
- Location data for a completed job should be deleted or anonymized after a reasonable retention window — no reason to keep precise historical location trails indefinitely

**Note:** live location tracking has real privacy/legal weight (especially if you ever operate beyond one jurisdiction) — worth a clear, explicit consent screen the first time a user enables it, not just a buried settings toggle.

---

## 4. Job Status Timeline (UI feature, simple to build, high clarity value)

A visual horizontal strip on the job detail screen:

```
Posted → Applied → Hired → On the way → In Progress → Completed → Paid
```

- Current stage highlighted, past stages checked off, with a timestamp for each transition
- Both worker and poster see the exact same timeline (no ambiguity about whose "turn" it is)
- Doubles as the audit trail for disputes — if something goes wrong, the timeline with timestamps is the first thing admin looks at

This requires no new data model — it's a UI representation of `Job.status` transitions, but worth explicitly logging each transition with a timestamp (add a `statusHistory: [{status, timestamp}]` array to the `Job` model from the main spec) rather than only storing current status, so the timeline can actually be rendered.

---

## 5. Multi-Language Support

- UI localization: Hindi + English at minimum for v1, architecture should support adding more regional languages later without a rewrite (use a standard i18n library — `i18next` works well with React Native)
- **Job descriptions and chat messages should support both languages naturally** — don't force English-only input; a poster typing in Hindi and a worker reading in Hindi (or vice versa) should just work
- Consider **auto-translation as an optional layer** (not forced) — e.g., a "translate" button on a chat message if sender/receiver have different preferred languages, using Google Translate API — but keep it opt-in per message, since auto-translated text can occasionally be wrong or awkward and shouldn't silently replace the original

---

## 6. Voice Input

- **Voice-to-text for job posting**: poster taps a mic icon, speaks the job description naturally, speech-to-text fills the description field (they can still edit before posting)
- **Voice-to-text for worker profile/bio**: same mechanic, lowers the barrier for workers less comfortable typing
- Can reuse whatever speech-to-text approach you pick elsewhere in your broader project set (e.g., Google Cloud Speech-to-Text) — no need for a different provider just for this
- This is a relatively small addition on top of standard mobile speech-to-text APIs (React Native has libraries for on-device or cloud STT) — doesn't need to be complex

---

## 7. Offline / Low-Connectivity Handling

- Queue certain actions locally when offline (mark job complete, send a chat message, submit an application) and sync automatically when connectivity returns
- Show a clear "offline — will sync when back online" indicator, not just a silent failure
- Cache the worker's nearby-jobs list and their own active job details locally so the app isn't blank on poor connectivity — refresh when back online
- This matters specifically for this platform because workers doing physical labor (cleaning, gardening) may be in basements, remote areas, or simply not checking their phone constantly — the app shouldn't lose their action just because connectivity blipped

---

## 8. Build Phases (continues from v2's Phase 21)

**Phase 22 — Notification infrastructure**
`NotificationPreference` and `Notification` models, FCM integration, in-app notification center UI, quiet hours logic.

**Phase 23 — Digest batching**
Scheduled job for daily-digest grouping, digest notification formatting.

**Phase 24 — Safety: SOS + emergency contacts**
`SafetyEvent` model, SOS button + flow, admin's high-priority active-safety-events view, emergency contact setup at signup.

**Phase 25 — Live location sharing during active jobs**
Opt-in consent flow, live location updates during "on the way"/"in progress" states, retention/deletion policy for location data.

**Phase 26 — Job status timeline**
`statusHistory` tracking on the Job model, timeline UI component.

**Phase 27 — Multi-language support**
i18next setup, Hindi + English translations, language selector in settings.

**Phase 28 — Voice input**
Speech-to-text for job posting and profile bio fields.

**Phase 29 — Offline handling**
Local action queueing, sync-on-reconnect logic, offline UI indicators, local caching of nearby jobs/active job data.

---

## 9. Priority Call-Out

If you're prioritizing rather than building all of this at once: **notification granularity and the SOS/safety feature are the two I'd genuinely build before anything else in this document.** Notifications directly drive whether people keep opening the app; the SOS button isn't really optional once real people are entering real strangers' homes through this platform — it's closer to a legal/ethical baseline than a nice-to-have.

Multi-language, voice input, and offline handling are all valuable but can reasonably wait for a v1.1 once the core loop (post job → get hired → pay → rate) is proven with real users.