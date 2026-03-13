# Session Flow Manual Testing Checklist

Pre-launch testing checklist for the complete session lifecycle.

---

## Prerequisites

- [ ] Two test devices (or simulators) available
- [ ] Test client account with active subscription (basic/standard/premium)
- [ ] Test client account without subscription (for PAYG testing)
- [ ] Test supporter account with completed onboarding (W9, bank, training)
- [ ] Stripe test mode enabled with test cards
- [ ] Supabase project connected and migrations applied

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

---

## 1. Booking a Session (Client)

### 1.1 Session Type Selection
- [ ] All three session types display (Chat, Phone, Video)
- [ ] Duration shows correctly (Chat: 25 min, Phone/Video: 45 min)
- [ ] Remaining quota shows for subscribed users (e.g., "2 left")
- [ ] "Included" shows for sessions covered by subscription
- [ ] PAYG price shows when quota exhausted ($7/$15/$20)

### 1.2 Quota Enforcement
- [ ] **With subscription + remaining quota**: Shows "$0" / "Included"
- [ ] **With subscription + exhausted quota**: Shows PAYG price
- [ ] **Without subscription**: Shows PAYG price for all types
- [ ] Cannot book more than tier allows without paying

### 1.3 Date Selection
- [ ] Only dates with supporter availability appear
- [ ] Past dates are not selectable
- [ ] Today's date shows only future time slots

### 1.4 Time Selection
- [ ] Time slots grouped by Morning/Afternoon/Evening
- [ ] Slots already booked are not shown
- [ ] Current time + buffer excluded for today

### 1.5 Confirmation & Payment
- [ ] Session details display correctly (supporter, date, time, duration)
- [ ] **Covered by subscription**:
  - [ ] Price shows "$0"
  - [ ] "Covered by subscription" text visible
  - [ ] Button says "Confirm Booking"
  - [ ] No payment sheet appears
- [ ] **PAYG required**:
  - [ ] Correct price shown
  - [ ] "Pay-as-you-go" text visible
  - [ ] Button says "Confirm & Pay"
  - [ ] Stripe payment sheet appears
  - [ ] Test card `4242...` succeeds
  - [ ] Declined card shows error, booking not created

### 1.6 Post-Booking
- [ ] Success alert appears
- [ ] Session appears in client's "Sessions" tab
- [ ] Session appears in supporter's dashboard
- [ ] Supporter receives push notification (if enabled)
- [ ] Session reminders scheduled (check via notification center)

---

## 2. Joining a Session

### 2.1 Pre-Session (Client)
- [ ] "Join Session" button appears 15 min before scheduled time
- [ ] Button disabled if > 15 min before session
- [ ] Tapping "Join" opens session screen

### 2.2 Pre-Session (Supporter)
- [ ] Session card shows on dashboard
- [ ] "Join" button appears at appropriate time
- [ ] Can access session details

### 2.3 Session Screen Loading
- [ ] **Payment verification**: Session blocked if `payment_status !== 'completed'`
- [ ] Camera/microphone permissions requested
- [ ] Connecting spinner shows while joining Daily.co room
- [ ] "Encrypted" badge visible

### 2.4 Video Call Connection
- [ ] Local video preview shows (for video calls)
- [ ] Connection established within 30 seconds
- [ ] Remote participant video/audio appears when they join
- [ ] Call duration timer starts

### 2.5 Voice Call Connection
- [ ] Audio connected successfully
- [ ] Speaker/earpiece toggle works
- [ ] Mute/unmute works

### 2.6 Chat Session
- [ ] Chat interface loads
- [ ] Messages send and receive in real-time
- [ ] Encryption indicator visible
- [ ] Typing indicators work

---

## 3. During Session

### 3.1 Controls (Video/Voice)
- [ ] Mute/unmute audio works
- [ ] Camera on/off works (video only)
- [ ] Speaker/earpiece toggle works
- [ ] End call button visible

### 3.2 Time Tracking
- [ ] Duration timer updates every second
- [ ] Warning appears at 40 minutes (5 min before max)
- [ ] Session auto-ends at 45 minutes

### 3.3 Connection Issues
- [ ] If participant disconnects:
  - [ ] Alert shows within seconds
  - [ ] "Wait (2 min)" and "End Now" options appear
  - [ ] Auto-ends after 2 minutes if no rejoin
- [ ] Reconnection works if network restored

---

## 4. Emergency Button Accessibility

### 4.1 Chat Session
- [ ] Emergency button (red "!") visible in header
- [ ] Not hidden behind any menu
- [ ] Tapping opens emergency options modal

### 4.2 Video/Voice Call
- [ ] Emergency button visible in top bar throughout call
- [ ] Accessible during active call (not just pre-call)
- [ ] Visible even when controls overlay hidden

### 4.3 Emergency Flow
- [ ] Modal shows 911 and 988 options
- [ ] Selecting 911:
  - [ ] Confirmation dialog appears
  - [ ] "Call 911" initiates phone call
  - [ ] Does NOT end the session
- [ ] Selecting 988:
  - [ ] Confirmation dialog appears
  - [ ] "Call 988" initiates phone call
  - [ ] Does NOT end the session
- [ ] Cancel button closes modal without action
- [ ] Emergency report sent to Psychi (check logs/email)

---

## 5. Ending a Session

### 5.1 Manual End (Client or Supporter)
- [ ] End button works
- [ ] Confirmation if needed
- [ ] "Session ended" alert appears
- [ ] Redirected to post-call screen

### 5.2 Auto-End (45-minute limit)
- [ ] Session ends automatically at 45 minutes
- [ ] Alert shows informing of max duration
- [ ] No user interaction required to end

### 5.3 Auto-End (Participant Left)
- [ ] If one participant leaves and doesn't return:
  - [ ] 2-minute countdown starts
  - [ ] Session auto-ends after timeout

### 5.4 Post-Call Flow
- [ ] Post-call contact screen appears (if applicable)
- [ ] Feedback prompt (if applicable)
- [ ] Return to dashboard works

---

## 6. Session Status in Dashboards

### 6.1 Client Dashboard
- [ ] Session status changes to "Completed"
- [ ] Completed session appears in history
- [ ] Session details (date, time, duration) correct
- [ ] Cannot rejoin completed session

### 6.2 Supporter Dashboard
- [ ] Session status changes to "Completed"
- [ ] Completed session appears in history
- [ ] Session count increments

### 6.3 Admin Dashboard (if applicable)
- [ ] Session visible in admin session list
- [ ] Status shows "Completed"
- [ ] Transcript available (for chat sessions)

---

## 7. Billing & Payment Confirmation

### 7.1 Payment Capture (at booking)
- [ ] Stripe dashboard shows PaymentIntent created
- [ ] Status: `succeeded` for test card
- [ ] Amount correct for session type
- [ ] Metadata includes `supporter_id`, `session_type`

### 7.2 Webhook Processing
- [ ] `payment_intent.succeeded` webhook received
- [ ] Check Supabase logs for webhook processing
- [ ] `processed_webhook_events` table has event ID (idempotency)

### 7.3 Payment Status in Database
- [ ] `sessions.payment_status` = `'completed'`
- [ ] `sessions.stripe_payment_intent_id` populated
- [ ] `payments` table has record (if applicable)

### 7.4 Session Usage Recording
- [ ] `session_usage` table has record
- [ ] `charged_as_payg` correct (true if PAYG, false if subscription)
- [ ] `billing_period_start` matches current period

---

## 8. Supporter Payout

### 8.1 Earnings Credited
- [ ] After session payment succeeds:
  - [ ] `supporter_details.pending_payout` increased by 75% of payment
  - [ ] `supporter_details.total_earnings` increased by 75% of payment
- [ ] Check via Supabase dashboard or supporter profile

### 8.2 Payout Initiation
- [ ] Supporter can view pending payout in "Earnings" section
- [ ] Manual payout request (if supported) works
- [ ] Or: Scheduled payout triggers at configured time

### 8.3 Stripe Connect Transfer
- [ ] Transfer created in Stripe dashboard
- [ ] Transfer amount = 75% of session price
- [ ] Transfer destination = supporter's connected account
- [ ] `transfer.paid` webhook updates `payouts` table

### 8.4 Edge Cases
- [ ] **Refund issued**:
  - [ ] Supporter earnings reversed (75% of refund)
  - [ ] `pending_payout` and `total_earnings` decreased
- [ ] **Dispute/chargeback**:
  - [ ] Earnings immediately reversed
  - [ ] If dispute won: earnings restored

---

## 9. Edge Case Testing

### 9.1 Session Stuck in "In Progress"
- [ ] If both users disconnect without ending:
  - [ ] `cleanup-stale-sessions` cron marks as completed after buffer
  - [ ] Verify via manual function invocation or wait for cron

### 9.2 No-Show Sessions
- [ ] If session never started (15+ min past scheduled):
  - [ ] Cleanup function marks as `no_show`
  - [ ] Refund policy applied (if configured)

### 9.3 Payment Failures
- [ ] Declined card prevents booking
- [ ] Session not created if payment fails
- [ ] Clear error message to user

### 9.4 Network Issues During Booking
- [ ] Offline banner appears if no connection
- [ ] Booking blocked with appropriate message

---

## 10. Final Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check recent sessions
SELECT id, client_id, supporter_id, session_type, status, payment_status, scheduled_at
FROM sessions
ORDER BY created_at DESC
LIMIT 10;

-- Check session usage
SELECT * FROM session_usage
ORDER BY created_at DESC
LIMIT 10;

-- Check supporter earnings
SELECT supporter_id, pending_payout, total_earnings
FROM supporter_details
WHERE pending_payout > 0;

-- Check webhook idempotency
SELECT * FROM processed_webhook_events
ORDER BY processed_at DESC
LIMIT 10;

-- Check recent payments
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

---

## Sign-Off

| Section | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| 1. Booking | | | | |
| 2. Joining | | | | |
| 3. During Session | | | | |
| 4. Emergency Button | | | | |
| 5. Ending Session | | | | |
| 6. Dashboard Status | | | | |
| 7. Billing | | | | |
| 8. Supporter Payout | | | | |
| 9. Edge Cases | | | | |

**Final Approval**: _________________ Date: _________
