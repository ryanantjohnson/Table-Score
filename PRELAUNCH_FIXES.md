# Guest access and earned contributor release preparation

Client prepared on a separate branch. Do not merge, publish the website, or dispatch native uploads as part of this draft. Backend dependencies below were applied on November 15, 2026. This does not change the Apple 1.0 (26.2) upload already processing.

## Included

- Guests can explore restaurants, use Run It, and open Settings. Rating, saving, following, and account management require sign-in.
- Run It brings its loading and shuffle stage into view before searching or cycling through options.
- Feed author names display existing account marks, with keyboard/tap explanations.
- Verified Contributor uses server-calculated eligibility: 250 qualifying Verified Visit ratings across at least 50 canonical Google restaurants. One contribution per restaurant per Central calendar day counts. Hidden, deleted, unverified, and future-dated ratings do not count. Legacy identity grants and follower counts cannot qualify.
- Profile and Settings show contributor progress. The existing golden fork artwork is retained. First Round and OG marks retain their meaning.

- Own-profile Ratings and Places are now buttons. History shows 20 items at a time with Show more; Places groups repeat visits and links to their ratings. Own rating data loads in stable pages instead of silently stopping at the API row cap.

## Backend dependencies — deployed November 15, 2026

1. Applied `supabase/launch-contributor-status.sql` to the intended project. It adds an owner/privacy-aware status RPC and server-owned rating submission timestamps. Existing timestamps are not rewritten. Deleted or moderated contributions can remove eligibility. The Central day boundary matches the current Texas launch; revisit this rule before expanding geographically.
2. Deployed `guest-restaurants` and `guest-where-to-eat` with the shared helper and the two `verify_jwt=false` entries in `supabase/config.toml`. Existing signed-in services are unchanged. These guest services expose discovery only, never restaurant creation. Existing cache/rate-limit RPCs and the same provider environment variables are dependencies.
3. Live HTTP checks confirmed gateway caller headers and production-origin CORS: guest search returned 20 restaurants and guest Run It returned 36. Additional checks cover rejected writes, disallowed origins, and invalid coordinates. Missing caller headers fail closed. Per-caller limits and a shared 60-request/minute guest budget bound provider usage; monitor and tune the shared ceiling against actual launch traffic.

Client fallback keeps First Round/OG marks available if the new status RPC is missing. Earned Contributor remains unavailable rather than displaying invented progress. Guest provider calls require the deployed guest endpoints.

## Validation and release sequence

- `npm ci --ignore-scripts --prefix tests` then `npm test --prefix tests` runs UI behavior, PostgreSQL eligibility/privacy/timestamp checks, and guest-handler tests with provider calls stubbed.
- `node --check app-platform.js`, `node --check app-intro.js`, `node native/prepare-web.mjs`, and `git diff --check` verify packaging/syntax.
- Browser preview verifies guest Settings layout with a local stub; it does not prove live provider discovery or native GPS.
- After backend staging verification, test signed-in and guest discovery on iPhone and Android, Run It animation at small viewport sizes, rating sign-in, account switching, feed marks, and real on-site Verified Visits. Confirm the existing location recovery fix on physical devices.
- Combine approved launch fixes into one tester build, then choose the final tested build for store review. Store build numbers remain assigned by the native workflows. No Pro subscription/billing integration is included.

## Backend deployment verification

- TableScore project `jyojnjkpwhwzgarfpepm`: contributor status function and timestamp trigger installed; a temporary schema check was rolled back before installation. No historic rating timestamps were changed.
- Public status lookup tested; private profiles are omitted for an anonymous viewer. Existing signed-in Edge Functions remain at nearby-restaurants v16 and where-to-eat v7. New guest functions are v2 with gateway JWT verification disabled specifically for guest use.
- Live testing found the existing limiter requires caller IDs of 16–128 characters. The global budget now uses a fixed SHA-256 identifier; the regression fixture enforces this live database constraint. Valid searches returned HTTP 200 after correction.
- Security advisors before/after have the same pre-existing categories. The only added function findings are the intentional anon/authenticated SECURITY DEFINER status RPC; access is bounded to available profiles permitted by the existing privacy helpers and returns counts/marks only. Existing warnings are not changed by this release.
- Local checks and automated CI do not replace physical-device location and guest-flow testing. Client PR remains a draft; no store workflow dispatched.
