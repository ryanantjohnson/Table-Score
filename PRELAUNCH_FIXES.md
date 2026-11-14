# Guest access and earned contributor release preparation

Prepared on a separate branch. Do not merge, publish the website, deploy backend changes, or dispatch native uploads as part of this draft. This does not change the Apple 1.0 (26.2) upload already processing.

## Included

- Guests can explore restaurants, use Run It, and open Settings. Rating, saving, following, and account management require sign-in.
- Run It brings its loading and shuffle stage into view before searching or cycling through options.
- Feed author names display existing account marks, with keyboard/tap explanations.
- Verified Contributor uses server-calculated eligibility: 250 qualifying Verified Visit ratings across at least 50 canonical Google restaurants. One contribution per restaurant per Central calendar day counts. Hidden, deleted, unverified, and future-dated ratings do not count. Legacy identity grants and follower counts cannot qualify.
- Profile and Settings show contributor progress. The existing golden fork artwork is retained. First Round and OG marks retain their meaning.

## Backend dependencies — prepared, not deployed

1. Review and apply `supabase/launch-contributor-status.sql` to the intended project. It adds an owner/privacy-aware status RPC and server-owned rating submission timestamps. Existing timestamps are not rewritten. Deleted or moderated contributions can remove eligibility. The Central day boundary matches the current Texas launch; revisit this rule before expanding geographically.
2. Deploy `guest-restaurants` and `guest-where-to-eat` with the shared helper and the two `verify_jwt=false` entries in `supabase/config.toml`. Existing signed-in services are unchanged. These guest services expose discovery only, never restaurant creation. Existing cache/rate-limit RPCs and the same provider environment variables are dependencies.
3. Verify real gateway caller headers, allowed production origins, canonical restaurant results, and rate-limit responses in staging before publishing the client. Missing caller headers fail closed. Per-caller limits and a shared 60-request/minute guest budget bound provider usage; monitor and tune the shared ceiling against actual launch traffic.

Client fallback keeps First Round/OG marks available if the new status RPC is missing. Earned Contributor remains unavailable rather than displaying invented progress. Guest provider calls require the new guest endpoints, so do not ship the client first.

## Validation and release sequence

- `npm ci --ignore-scripts --prefix tests` then `npm test --prefix tests` runs UI behavior, PostgreSQL eligibility/privacy/timestamp checks, and guest-handler tests with provider calls stubbed.
- `node --check app-platform.js`, `node --check app-intro.js`, `node native/prepare-web.mjs`, and `git diff --check` verify packaging/syntax.
- Browser preview verifies guest Settings layout with a local stub; it does not prove live provider discovery or native GPS.
- After backend staging verification, test signed-in and guest discovery on iPhone and Android, Run It animation at small viewport sizes, rating sign-in, account switching, feed marks, and real on-site Verified Visits. Confirm the existing location recovery fix on physical devices.
- Combine approved launch fixes into one tester build, then choose the final tested build for store review. Store build numbers remain assigned by the native workflows. No Pro subscription/billing integration is included.
