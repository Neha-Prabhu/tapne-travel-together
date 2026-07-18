## Overview

Add email verification, member blocking, guarded deactivation, application/place withdrawal, and read-only conversations. Remove permanent deletion. Everything remains inside existing pages, modals, and dashboard tabs — no new top-level routes.

## Backend surface (dev mock + config)

Extend `window.TAPNE_RUNTIME_CONFIG.api` and `src/lib/devMock.ts` with:

- `signup_start`, `signup_verify`, `signup_resend` — password signup now returns `pending_verification` with a 6-digit code (dev mode: code visible in console + toast; 10 min TTL; max 5 attempts; 60 s resend cooldown).
- `block`, `unblock`, `blocked_list` — user blocking.
- `account_deactivate` — returns `409 { blockers: [{ trip_id, title, role, pending, approved, enrolled_status, manage_url }] }` when active commitments exist.
- `trip_withdraw` — cancels a pending application or leaves an approved place; returns updated participant status + seat count.
- Conversation payloads gain `readonly: boolean` and `readonly_reason: 'blocked_by_you' | 'blocked_you' | 'deactivated'`; blocked pairs sharing a trip keep the thread but readonly.
- Remove `account_delete` from config and mock. 

## Frontend changes (scoped, no new pages)

**Auth**
- `LoginModal.tsx`: after `signup()` returns `pending_verification`, swap the form for a Verify step — 6 code slots (auto-advance, paste support), destination email, 10-min expiry hint, inline errors (invalid / expired / too many attempts / delivery failed), loading state, 60 s resend countdown, "Edit details" to return to the signup form. On success, sign in, close modal, run `pendingAuthAction`.
- `AuthContext.tsx`: extend `signup()` to return a discriminated result; add `verifySignupCode`, `resendSignupCode`. Login and Google OAuth paths untouched. On login of a deactivated account, surface reactivation toast "Welcome back — your account has been reactivated".

**Blocking**
- `Profile.tsx`: add Block button in the profile actions (own-profile hidden). Confirmation dialog → on success toast + navigate away (`/`). When the viewed profile is blocked-by-you or has-blocked-you, render an "Unavailable" state instead of the profile content; hide Follow / Message / social actions.
- `Settings.tsx`: add a "Blocked accounts" card listing avatar, display name, username, Unblock button with confirm + loading + empty + error states. Does not restore follow. Keep the existing 5 preference groups and their save behavior untouched.

**Delete removal**
- `Settings.tsx`: remove Delete permanently button, dialog, and handler. Keep Deactivate.
- `Profile.tsx` / `ProfileEdit.tsx`: remove any Delete account entry if present.

**Deactivation guard**
- `Settings.tsx`: on 409, keep dialog open, keep session, render a list of blocking trips (title, role, pending/approved counts or enrolled status, Manage trip link → `/trips/:id`). Success path (204) unchanged: toast + logout + Home.

**Withdraw**
- `TripDetail.tsx`: for a non-host traveler with `pending` or `approved` participation, show a Withdraw button in both the desktop sidebar CTA area and the mobile sticky bar. Confirmation copy distinguishes "Cancel request" vs "Leave trip". After success, refresh the trip + participant status + seat count in place. Add `apiPost(cfg.api.trip_withdraw, { trip_id })` in `devMock.ts`.

**Read-only conversations**
- `Messages.tsx`: read `thread.readonly` + `readonly_reason`. Render prior messages normally; replace composer with a muted explanation banner ("You blocked this member" / "This member is unavailable" / "This member's account is deactivated"). Applies on desktop and mobile.
- For blocked pairs still sharing an approved trip, the mock keeps the thread visible and readonly; social actions on the peer profile stay hidden.

## Files touched

- `src/lib/devMock.ts`, `src/lib/mode.ts` (config keys), `src/types/api.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/LoginModal.tsx`
- `src/pages/Profile.tsx`, `src/pages/ProfileEdit.tsx`
- `src/pages/Settings.tsx`
- `src/pages/TripDetail.tsx`
- `src/pages/Messages.tsx`

## Out of scope

Existing login, Google sign-in, profile editing, host trip management, host trip cancellation, general visual language, unrelated pages, search modes, dashboard tabs, and navigation stay as-is. The five Settings preferences and their save behavior are not modified. No new routes or nav entries are added.
