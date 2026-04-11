# Claude Code Guidelines for Psychi Mobile

## Rules

**Standing instructions for Claude when working on this codebase:**

1. **Always report findings and show current code before making any changes.** Read the relevant file(s) first, display key snippets, then propose edits.

2. **Make only minimal surgical edits — never rewrite entire functions** unless explicitly requested. Preserve existing logic, formatting, and surrounding context.

3. **Before modifying any file listed in the "Do Not Revert" section below, re-read that section first.** Understand why those fixes exist before touching the code.

---

## Do Not Revert

The following fixes are **critical** and must not be accidentally reverted or rewritten. Each entry includes the file path, what was fixed, and why reverting would cause a regression.

### 1. Session Entered Notification Suppression
**File:** `lib/notifications.ts` (line 46)
**Fix:** Added `session_entered` to the list of notification types suppressed while user is in an active session.
```typescript
if (data?.type === 'chat_message' || data?.type === 'supporter_message' || data?.type === 'post_call_message' || data?.type === 'session_entered') {
```
**Why:** Prevents duplicate "joined the chat" push notifications when the user is already viewing the session. Reverting causes users to receive distracting notifications for their own actions.

---

### 2. Session Loading Retry Logic (Auth Delay)
**File:** `app/session/[id].tsx` (lines 94-109)
**Fix:** Added auth retry logic with 1.5 second delay when `user` is initially undefined.
```typescript
if (!user) {
  if (!authRetryAttempted.current) {
    authRetryAttempted.current = true;
    console.log('[Session] Auth appears unloaded, retrying after delay...');
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, 1500);
    return;
  }
```
**Why:** The auth context may not be loaded when navigating directly to a session (deep link or notification). Without this retry, users see "Session not found" errors. Reverting breaks session access from push notifications.

---

### 3. Entered Notification Database Flag Check
**File:** `app/session/[id].tsx` (line 499) and `lib/database.ts` (lines 5046-5080)
**Fix:** Before sending a "session_entered" notification, atomically check and set a database flag (`client_entered_notified` or `supporter_entered_notified`) to prevent duplicates.
```typescript
const shouldSend = await checkAndMarkEnteredNotificationSent(
  sessionData.id,
  currentUserRole as 'client' | 'supporter'
);
if (!shouldSend) {
  console.log('[Session] Notification already sent (database flag), skipping');
  enteredNotificationSent.current = true;
  return;
}
```
**Why:** Component remounts (navigation, app backgrounding) can trigger multiple notification sends. The database flag ensures exactly-once semantics. Reverting causes duplicate "X joined the chat" notifications.

**Related Migration:** `supabase/migrations/20260411000000_add_entered_notification_flags.sql`

---

### 4. Auto-Reset Supporter in_session Flag (Database Trigger)
**File:** `supabase/migrations/20260410000000_auto_reset_in_session_trigger.sql`
**Fix:** Database trigger automatically resets `profiles.in_session = false` when a session ends (status becomes `completed`, `cancelled`, or `no_show`).
**Why:** If the app crashes or loses network during session end, the supporter would be permanently marked "busy" and unable to receive new live support requests. The trigger acts as a safety net. Reverting causes supporters to get stuck in "in session" state.

---

### 5. Stripe Webhook Idempotency and v2 API Support
**File:** `supabase/functions/stripe-webhooks/index.ts` (lines 43-72, 99-161)
**Fix:** Added idempotency check using `processed_webhook_events` table, plus handling for Stripe v2 thin events (`v2.core.account.updated`).
**Why:** Stripe can retry webhooks, causing duplicate earnings credits or status updates. The v2 API sends "thin" events requiring a follow-up API call. Reverting causes double-charging supporters' earnings and breaks Connect account status updates.

---

### 6. Subscription Fallback in Stripe Webhook
**File:** `supabase/functions/stripe-webhooks/index.ts` (lines 204-259)
**Fix:** When `payment_intent.succeeded` fires for a subscription payment, the webhook upserts the subscription as a fallback if the client-side update failed (app crash, network issue).
**Why:** If the client-side subscription update fails, the user would have paid but not received their subscription. The webhook ensures subscriptions are always activated. Reverting causes paid subscriptions to not activate if app crashes during checkout.

---

### 7. Live Support Session Credit Deduction
**File:** `supabase/migrations/20260411100000_fix_live_support_session_credits.sql`
**Fix:** Updated `accept_live_support_request` function to decrement `sessions_remaining` from the subscriptions table when a live support session is accepted for a subscribed user.
**Why:** Live support sessions for subscribed users were not deducting from their session allowance, giving them unlimited free sessions. Reverting breaks subscription session limits.

---

### 8. VideoCall.tsx videoSource Boolean Fix
**File:** `components/session/VideoCall.tsx` (lines 159-163)
**Fix:** Changed `videoSource` from web SDK constraints object format to React Native boolean format.
```typescript
// Note: React Native Daily SDK uses simple booleans for videoSource/audioSource
// Video constraints (width, height, etc.) are not supported in RN SDK - those are web-only
const call = Daily.createCallObject({
  videoSource: isVideoEnabled, // true or false
  audioSource: true,
```
**Why:** The Daily.co React Native SDK does not support the `{ width: {...}, height: {...} }` constraints object. Using it causes "property 'videoSource': undefined" error and video calls fail to connect. Reverting breaks all video calls.

---

### 9. RLS Policies for Admin Operations
**Files:**
- `supabase/migrations/20260315000000_add_admin_update_supporter_details_policy.sql`
- `supabase/migrations/20260315000001_add_admin_view_policies.sql`
- `supabase/migrations/20260316000000_add_admin_update_profiles_policy.sql`
- `supabase/migrations/20260312000001_add_admin_delete_policies.sql`

**Fix:** Added Row Level Security policies allowing admin role to update/delete supporter details, profiles, and other tables.
**Why:** Without these policies, admin operations (approve/reject supporters, manage users) fail with RLS violations. Reverting breaks the admin panel.

---

### 10. Weekly Call Allowance Reset System
**Files:**
- `supabase/migrations/20260411200000_add_weekly_calls_reset.sql`
- `supabase/migrations/20260411200001_add_weekly_calls_reset_cron.sql`
- `supabase/functions/stripe-webhooks/index.ts` (lines 211-215)
- `types/liveSupport.ts` (lines 8-14)

**Fix:** Implemented proper weekly/monthly reset schedule for subscription allowances:
- **Calls (phone/video)**: Reset WEEKLY via pg_cron job (every Monday at 00:00 UTC)
- **Chats**: Reset MONTHLY with subscription renewal

Tier allowances:
- Basic ($55/mo): 1 call/week, 2 chats/month
- Standard ($109/mo): 2 calls/week, 3 chats/month
- Premium ($149/mo): 3 calls/week, unlimited chats

**Why:** Without the weekly reset, call allowances would only reset monthly with subscription renewal. This gave subscribers fewer calls than promised. Also fixed `stripe-webhooks/index.ts` initial values which were incorrect (e.g., basic had `phone: 0` instead of `phone: 1`). Reverting causes subscribers to receive incorrect call allowances.

---

## Quick Reference

| Issue | File | Key Lines |
|-------|------|-----------|
| Duplicate session_entered notifications | `lib/notifications.ts` | 46 |
| Session page auth timeout | `app/session/[id].tsx` | 94-109 |
| Duplicate entered notifications | `app/session/[id].tsx`, `lib/database.ts` | 499, 5046-5080 |
| Stuck in_session flag | Migration `20260410000000` | - |
| Stripe webhook duplicates | `stripe-webhooks/index.ts` | 43-72 |
| Stripe v2 thin events | `stripe-webhooks/index.ts` | 99-161 |
| Subscription payment fallback | `stripe-webhooks/index.ts` | 204-259 |
| Live support credits not deducted | Migration `20260411100000` | - |
| Video call connection error | `VideoCall.tsx` | 159-163 |
| Admin RLS violations | Migrations `202603*` | - |
| Weekly call allowance reset | Migration `20260411200000`, `20260411200001` | - |
