# TableRec Pro tester build

## What is integrated

- Discover: Happy Hours.
- Profile: private Dining Needs.
- Run It: a cook-at-home Recipe Wheel entry. Restaurant Run It is unchanged, free, and unlimited.
- Nonmembers see Pro features with an access screen; purchases are disabled.

The feature screens live in TableRec's existing app document, use its header, bottom tabs, appearance variables, navigation, and typography, and do not load an iframe.

## Connected services

The existing Supabase project provides 3,796 attributed Wikibooks recipes, six source-linked Central Texas happy-hour locations, server-checked Pro access, private dietary preferences, and revision-protected private notebook saves. Recipe and special saves survive app reloads. Legacy notebook fields are preserved, but Journal and Trip Planner interfaces are removed. Edits on another device cause an explicit conflict rather than silently overwriting that device's changes. Account changes discard in-memory state and stale requests.

The dietary source library contains 16 published US restaurant/brand guides. Restaurant references are matched conservatively by brand name, with additional Austin scope checks for local entries. This is source-linked guidance, not dish-level approval, certification validation, or a guarantee of suitability. No fictional restaurant evidence is used.

See data/dining-sources.json and docs/dietary-data-coverage.md for source scope and limitations. Reviewed dishes, current certification details, broad local coverage, and production payments remain unfinished.

## Private TestFlight installation

Run TableRec iOS Release on branch `pro/dining-needs-spec`, with signing and Apple upload enabled. Wait for Apple processing, then assign the new build only to Ryan's private group with automatic distribution disabled. Keep 29.1 selected for App Store review. Earlier TestFlight builds do not change when source code changes.

## Validation

Local checks exercise placements, server access, recipe search and attribution, preference consent, unknown dietary evidence, specials, saves, removal of retired interfaces, conflicting revisions, account switching, and delayed requests. Existing launch checks cover auth, badges, location, onboarding, and feedback.

A live database transaction verified recipe access, private preference writes, revision-protected notebook saves, and denial for an unrelated non-Pro account. All validation writes were rolled back.

Hosted browser tests render the actual app HTML and CSS using isolated fixture responses at 320, 390, 430, and 768 pixel widths. They capture screenshots for review. These tests do not replace native iPhone/TestFlight testing, keyboard testing, or App Review.

## Private tester scope
Happy Hours, Recipe Wheel, and Dining Needs are ready for private review once this revision passes checks. Reservations and paid signup are not included. Happy Hour coverage is six sourced locations and dietary guides are references, not verified-safe recommendations. Do not replace the public App Store candidate with this tester build.

## Recipe and Pro presentation refinement
Everyday favorites defaults to familiar dish-name families from the licensed catalog; Explore everything retains the full collection. Ingredient/category filters apply to both. This is a preference collection, not a dietary suitability filter. A server batch supplies 12 real candidates and the selected recipe; the reel cycles names, slows down, and reveals the result. Reduced-motion users skip the cycling. Repeated taps are blocked; leaving the screen or switching accounts discards a pending reveal. Pro entry cards now include benefit copy, feature icons and a stronger accent treatment.
