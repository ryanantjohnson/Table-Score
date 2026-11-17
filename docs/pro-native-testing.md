# TableRec Pro app testing

Pro is now rendered inside the existing TableRec app document as the `pro` screen. It uses the app header, bottom navigation, theme variables, cards, fields, and existing drill-screen/back-gesture handling. It does not use an iframe, duplicate site header, or separate page.

## iPhone installation
Run TableRec iOS Release on branch `pro/dining-needs-spec`, with `signed_release` and `upload_to_apple` enabled. After processing, assign the build only to Ryan's private TestFlight group. Keep automatic distribution off. Do not replace the 29.1 App Store submission.

## Features
Profile → TableRec Pro opens the membership screen. Dining Needs has multi-selection, an optional additional diner's requirement, result filters, and per-dish evidence with ingredient/oil/preparation details. Happy Hours has day/budget filters and saving. Recipe Wheel has category selection, recipes, and a saved collection. Trip Planner has editable stops, times, estimates, day counts, and a budget. Dining Journal supports private session entries and deletion.

Run It stays free and unlimited. No reservations or billing are included.

## Data boundaries
The restaurant, special, and evidence collection is illustrative and is labeled as such. No actual allergy suitability determination is made. Unknown, stale, conflicting, manual-review, and scope-limited evidence remains visible. Recipes are not dietary matched.

Data remains in memory for the app session and clears on account change/sign-out. No live sourcing, account persistence, clinical rule review, or subscription integration is connected. These are required before public release.

## Validation
Automated jsdom checks cover existing app chrome, no iframe, navigation/back, multi-need filtering, peanut-oil warnings, happy-hour filtering/saving, recipe selection/saving, trip edits, journal text escaping, and clearing across accounts. Bundle checks verify the retired HTML page is excluded and standard builds have no Pro entry.

On-device visual validation is still required: narrow and wide iPhone screens; scrolling with keyboard; night/electric themes; native back swipe; leaving and reopening Pro; account change. The current assistant environment cannot render the app or run an iOS simulator. Automated checks do not establish visual quality or App Store readiness.
