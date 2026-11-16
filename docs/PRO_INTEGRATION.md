# Pro preparation — separate from the free app launch

Status: development foundation, NOT a finished paid product. Nothing in this branch is deployed to production. Do not merge or upload this branch as the free launch candidate. Continue tester builds from the existing prelaunch branch until that work is merged.

## Implemented
- Hidden Settings entry and matching upgrade dialog: Recipe Wheel, Happy Hour Locator, Reservations. Core Run It stays free; no journal or trip planner.
- Monthly/annual options read localized prices from the store, not a guessed price. No introductory/free-trial promise.
- Pinned Capacitor RevenueCat SDK and bundled native adapter; configure with separate public iOS/Android keys and a signed-in Supabase UUID. Serialized SDK identity changes and transactions.
- Restore purchases, subscription-management links, cancellation/error/unconfirmed-payment copy, and account-switch state reset.
- Undeployed authenticated `pro-status` function verifies the caller, reads active First Round marks from the existing server RPC, and checks the RevenueCat REST API. No client-supplied account, receipt, mark, or cached local boolean grants access.
- First Round = complimentary Pro; no card required. Legacy influencer verification does not grant Pro. OG alone does not grant it.
- Expiration, refunds, grace periods, and production rejection of sandbox purchases covered by policy tests. Canceling renewal does not immediately revoke a still-paid period.

## Off by default
`pro-config.js`: showEntry=false, purchasesEnabled=false, all feature readiness flags=false, no SDK keys. Native SDK does not configure or create customers until an explicit store action. `TableRecPro.open()` opens a developer preview. No purchase is possible with default config.
Backend defaults also disable sales. Do not enable just because banking is complete. Real feature readiness and native store tests are mandatory.

## Provider setup after business preparation
Proposed implementation uses RevenueCat as the Apple/Google subscription adapter. It is an additional service, not the payment recipient: stores collect customer payment details and send developer proceeds according to their agreements. No RevenueCat account or financial agreement has been created on the user's behalf.
1. Complete store business/tax/bank agreements. Create RevenueCat project, iOS and Android app entries, connect store credentials on the server/dashboard only.
2. Create auto-renewing monthly and annual products (final prices still require owner approval). No free trial. Map both to entitlement `tablerec_pro` and offering `tablerec_pro`; offer only MONTHLY and ANNUAL packages.
3. Set RevenueCat transfer policy deliberately: keep subscriptions with their original TableRec account; test restore on a different signed-in account to prevent accidental transfers. Keep refunds and store notifications flowing to RevenueCat.
4. Set public SDK keys in `pro-config.js`. Never add a secret key to an app or repository. Pin iOS In-App Purchase capability and Android launchMode standard/singleTop in generated native workflows; this is still pending.
5. Deploy pro-status with JWT verification and set REVENUECAT_SECRET_KEY securely. Set PRO_ALLOW_SANDBOX=true only in a dedicated test project, never the production backend. Sandbox verification is currently not configured.
6. Validate purchases with native builds on physical iOS/Android store test accounts. No real transactions have been tested in this branch.
7. On final readiness set server PRO_FEATURES_READY=true and PRO_PURCHASES_ENABLED=true and corresponding app flags, then submit the paid-feature update for review. This requires a new app release, not only entering bank details.

## Remaining product work before paid activation
- Recipe Wheel: hundreds of distinct useful recipes from original writing or explicitly licensed sources; retain source/license attribution and rights evidence. No copied publisher instructions/photos. Dietary filters and repeat avoidance; confirm the catalog contents and food safety instructions.
- Happy Hour: map/list tied to viewport, restaurant deal detail, local schedules/time zones, last-confirmed dates, and a trustworthy owner/editor data workflow. Provider restaurant presence is not evidence of current deals.
- Reservations: availability source/restaurant partner integration; party/date/time, details form, server confirmation, duplicate prevention, confirmation and cancellation. A time button alone is not a booking.
- Server feature endpoints must independently enforce Pro with the same server membership policy. Client UI checks alone are insufficient.
- Restaurant business plan is separate. Complimentary founding location is granted to the FIRST OWNER WHO PARTNERS, not the first restaurant rated. Partner selection, ownership verification, and location entitlements are not implemented here.
- Review legal subscription terms, account deletion/active-subscription behavior, refunds, upgrades/downgrades, pending approval, expired billing grace, same-account cross-device, offline behavior, accessibility, and resumed app status.

## Verification
Run `node tests/pro-smoke.cjs` and existing suites. Run `node native/prepare-web.mjs` to verify bundled SDK packaging. No native signing, store review, live provider credentials, or production backend changes are implied by those tests.
