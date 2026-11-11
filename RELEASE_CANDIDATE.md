# TableRec November 16 release candidate

Status: source prepared locally; not uploaded to GitHub or TestFlight. This is not a release sign-off.
Base: 2fabaf0fa683bfbcae476a8ffb43ff35a9c0217a (main).

## Included fixes

- Repair 44 incorrectly encoded source strings, including badge requirement checks, food badges, confetti and reward overlays. Escape and repair legacy badge text returned by the backend; preserve valid accented text and emoji.
- Route native location through pinned @capacitor/geolocation 8.2.4 instead of WebView geolocation. Silent foreground refresh only runs with an actual granted permission. Stop foreground watches when hidden; retain manual browsing areas. Permission revocation and approximate location remain OS-controlled.
- Treat absent coordinates as absent, never zero. A failed fresh visit-location read submits no visit coordinates. A manually chosen city cannot be reused as visit-verification evidence.
- Keep a visible Check your email panel after signup, with the email destination, three next steps, spam guidance, resend cooldown and sign-in action. Remember the pending verification on that device.
- Restore the action interrupted by sign-in. Release auth buttons after connection errors and direct unconfirmed accounts back to verification instructions.
- Use the existing deployed web app URL for password reset and account-deletion redirects instead of capacitor://localhost. The marketing homepage is not an auth callback; do not substitute tablerec.co until a working branded callback is deployed and allowlisted.
- Replace support references with support@tablerec.co in the app and legal page. Prepare branded confirmation, recovery and magic-link templates. Templates and sender settings still need dashboard deployment.
- Let long comments grow and scroll; restore the composer size after live updates. Prevent duplicate comment and follow-request actions; distinguish a saved comment from an enhancement failure.
- Clear rating fields and pending photos on new rating entry paths. Distinguish a saved rating with failed photos from a failed rating insert so users do not submit duplicates.
- Apply a quality floor of 8.0 overall and for the last 30 days, with at least two unique diners in the last seven days, to Hot Right Now. Keep Top Rated at 10 ratings from five unique diners.
- Provide an owner-only restaurant relinking RPC with a live-session check, while keeping the original privileged RPC restricted. Ordinary diners continue to use the existing restaurant-creation RPC.

## Backend changes already applied

Migration prelaunch_location_ranking_and_link_guard was applied to project jyojnjkpwhwzgarfpepm on November 11.

Verified:

- Surfing Crab Round Rock, score 6.32, is no longer hot-eligible.
- All qualifying hot rows satisfy the new score/activity rules.
- restaurant_rankings remains security_invoker=true.
- Authenticated non-owners are rejected by the new relinking RPC.
- The original privileged linking RPC remains inaccessible to ordinary authenticated users.
- All public base tables have row-level security enabled.

Existing backend advisors still flag authenticated SECURITY DEFINER functions for review and leaked-password protection being disabled. The function warning is not proof of a vulnerability; the new wrapper has an explicit owner/session guard. This is not a complete independent security audit.

## Validation completed

- All inline JavaScript parses; app-platform.js parses.
- Automated DOM/behavior checks pass: guest boot, signup verification, resend cooldown, reopening pending verification, sign-in callback, offline auth, unconfirmed sign-in, quality thresholds, every starter/secret badge, legacy text repair, permission states, manual area preservation, null coordinates, saved rating/photo failure, follow approval and native bridge calls.
- Both native projects generate and sync successfully with the geolocation plugin.
- git diff --check passes.
- Public auth settings confirm signup is enabled and email auto-confirm is disabled.

Run automated checks:

```sh
npm ci --prefix tests --ignore-scripts --no-audit --no-fund
npm test --prefix tests
node --check app-platform.js
node native/prepare-web.mjs
```

A real browser-rendering run was blocked by this execution environment's browser/socket restrictions. DOM tests do not verify iOS keyboard geometry, Safari behavior, camera hardware or OS permission prompts. No signed native archive or store upload has run here.

## Outstanding launch gates

### 1. Repository delivery

The GitHub connection returned 403 Resource not accessible by integration when creating the review branch. The local GitHub CLI is not authenticated. Restore write access to ryanantjohnson/Table-Score, push the prepared branch, review the diff and run the checks. No production app frontend has been changed by this session.

### 2. Outgoing account email

In Supabase Auth, configure a supported custom SMTP sender and test it. For the existing Porkbun mailbox, published settings are smtp.porkbun.com, port 587, STARTTLS, username support@tablerec.co, and the mailbox password. Enter the password only in the provider's secure settings, never source control or chat. Sender name: TableRec. Sender address: support@tablerec.co.

Apply the prepared templates to the matching confirmation/recovery/magic-link settings. Keep {{ .ConfirmationURL }} intact. Confirm the web app callback and query-string variants are allowlisted. Check Porkbun DKIM and SPF settings. Verify actual delivery, sender identity and links in Gmail and another mailbox; inbox placement cannot be guaranteed by code.

This session did not change SMTP credentials or publish the email templates. If using a dedicated transactional provider instead, authenticate the TableRec domain there first and use its SMTP credentials.

### 3. Build the exact release candidate

Run the iOS release workflow on the reviewed commit, generate a signed archive, upload a newer build to TestFlight, and distribute it to the external tester group. Generate the corresponding Android build and test it before updating the closed-test track. Preserve the approved version's release hold until the replacement build is verified and accepted by App Review. A previously approved build does not approve changed code automatically.

### 4. Real-device acceptance checks

Use a fresh installation and an upgraded installation of the exact candidate:

- Signup -> verification instructions -> email -> confirmation -> return -> sign-in -> intended action.
- Resend, duplicate-account attempt, wrong password, expired/used link, password reset and deletion verification.
- Stay signed in after backgrounding, force-close, restart and an overnight gap; explicit sign-out clears private UI.
- First location request; Allow While Using; approximate permission; denial; revocation; permission restored; reopen repeatedly without a new prompt when permission persists.
- Manual city survives ratings; travel updates the granted GPS area; missing coordinates never map a restaurant to 0,0.
- Search, nearby discovery, RUN IT, restaurant details, directions and saved restaurants.
- Complete all seven categories; submit; submit with denied location; submit with photos; edit/delete; next restaurant starts clean; interrupt the network during photo upload.
- Follow a private account; approve/reject from requests and notifications; report/block; confirm private data is not exposed to another account.
- Every badge/reward popup, requirement check, profile badge and notification renders without corrupted symbols.
- Type a 500-character multiline comment with the keyboard open, mention a person, receive a live thread update, and submit once under a slow connection.
- Small iPhone screen, larger text, Android back navigation, dark/light appearance, offline/slow-network recovery, camera/photos denied and allowed.
- Verify Google API restrictions, usage quotas and billing alerts against the intended launch budget; these were not changed here.

Do not mark release-ready until these checks pass against the uploaded build and blocking defects are resolved. One consolidated update is the goal; another build is warranted if testing finds a blocker.
