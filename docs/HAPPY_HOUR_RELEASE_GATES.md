# TableRec: Happy Hour repair and Apple release gates

Status: work branch only. Do not merge or deploy until verified on actual TestFlight frontend.

## Verified backend observations (2026-11-20)
- Supabase function `discover-happy-hours` version 4 uses Google Places Nearby with `maxResultCount: 20`, types restaurant/bar/cafe, DISTANCE ranking.
- Each request inspects four websites and returns a cursor; unreadable/no website are unconfirmed, not offers.
- The current `development/pro-integration` frontend does not contain the pictured Happy Hour UI. Identify the source/build commit before altering the frontend.
- Existing `happy_hour_offers` table must be inspected and preserved. Do not conflate venue listings with verified offers.

## Acceptance tests
- Map loads pins for venues with valid coordinates; tap pin and tap list row open same details; map movement updates search center and list.
- Location label, map center, request coordinates, and returned results correspond; manual location works without GPS; no stale Georgetown/Killeen mismatch.
- Offer states: sourced with URL + observed timestamp; hours-only; unconfirmed; unavailable. Never display an unconfirmed venue as a confirmed happy hour.
- Discovery works in dense and sparse markets, with pagination, caching, explicit provider request budgets and clear no-results states.
- Handle unavailable websites, robots restrictions, provider failures and rate limits without fabricated specials.
- Maintain Pro server-side entitlement checks. Do not enable purchases until StoreKit, restore, disclosure and backend validation are ready.
- Test signed-in, guest, denied/approximate location, airplane mode, map pan, repeated search, and small-screen layouts.

## Mandatory Apple submission gate
Before each TestFlight/App Store build, review https://developer.apple.com/news/upcoming-requirements/ and https://developer.apple.com/app-store/review/guidelines/ against actual Xcode archive, SDK, minimum OS, privacy manifest, required-reason APIs, privacy labels, account deletion, user content moderation, permissions, and subscriptions. Check App Store Connect metadata/age rating directly.
As of 2026-11-20 Apple's upcoming requirements page lists Xcode 26/iOS 26 SDK since April 28 2026, and minimum iOS 13 deployment target since Sept 9 2026. Do not assume future deadlines not listed by Apple.

## Release sequence
1. Identify TestFlight build commit and Pro UI source.
2. Repair frontend pin/list interaction and center synchronization in a dedicated PR.
3. Revise backend candidate and test safely before deployment; preserve security, quotas and existing records.
4. Perform iOS/Android regression and Apple checklist review.
5. Merge/release only after owner approves tested candidate.
