# TableRec Pro interactive prototype

Status: standalone, session-only demo. No live app integration or deployment. Reservations excluded. Run It remains free and unlimited.

## Open and test
1. Open prototypes/tablerec-pro.html on this branch in GitHub.
2. Use Download raw file (the down-arrow button near Raw). Save as tablerec-pro.html, not .txt.
3. Open the downloaded file in Edge, Chrome, Firefox, or Safari. It needs no server, install, dependencies, or sign-in.
4. Use fictional inputs only. All profiles, restaurants, deal prices and dietary evidence are sample data. Changes reset when the tab refreshes. The prototype never saves dietary profiles in browser storage or sends them to a server.
5. To test on a phone, transfer the HTML file to the phone and open it in a browser that supports local HTML. Some mobile file viewers disable JavaScript; a hosted preview is preferable when an execution environment becomes available. This prototype is not yet hosted.

## Feature walkthrough
- Overview: open each feature from its card or navigation.
- Dining needs: Avery starts with peanut + milk + wheat. Cedar has sample ingredient evidence for all three; Juniper is missing wheat evidence; Ember reports peanut oil and wheat; Marlow has stale/conflicting evidence. None is represented as safe.
- Add sesame to Avery: Cedar must become incomplete. Turn on group mode: include Sam's halal and Jordan's vegetarian requirements, retaining all conflicts and unknowns.
- Select a manual-review medical profile: no automated suitability match should appear. This is a scope placeholder, not an implemented clinical module.
- View evidence: inspect named-dish scope, checked dates, peanut/arachis oil processing, preparation statements and halal supplier-only scope.
- Show dining card: inspect combined demo requirements. The card is not transmitted anywhere.
- Happy hours: change day and maximum price, save/unsave a deal, and add a sample deal to a trip. Deals are not allergy-filtered; all are fictional.
- Recipe Wheel: choose All/Quick/Comfort, spin, view ingredients and steps, save recipes, and reopen saved recipes. Recipes are not allergy/medical/religious matched.
- Trip planner: rename trip, set 1–5 days, budget, add/delete places, edit stop time/day/cost. Reducing day count moves affected stops to the last remaining day. Download itinerary exports only fictional itinerary data, not dietary profiles. No reservations are created.
- Dining journal: add and delete a fictional visit. Notes are escaped before display and stored in memory only.
- Refresh: all session edits disappear. Reset demo session also refreshes.
- Resize desktop browser to narrow width. Check touch targets, scrolling, focus, and dialog closing (Close button, Escape, backdrop).
- Verify no payments, reservation controls, live recommendation claims, or Pro Run It limit exist.

## Validation performed
34/34 checks passed in an isolated JavaScript evaluator, including pure matching tests and DOM-stubbed state/render actions. Complete combined script parsed successfully. No external resources or dependencies are loaded.
No real browser execution, screenshots, mobile testing, screen-reader testing, clinical review, religious certification review, export download test, or live app end-to-end test was possible in this session. DOM stubs validate logic but do not prove browser layout or accessibility.
The original twenty specification acceptance scenarios remain the production acceptance plan; this synthetic prototype implements only a subset.

Checks:
- PASS — All selected requirements evaluated
- PASS — Two of three is incomplete
- PASS — Peanut oil conflict retained
- PASS — Absent evidence is unknown
- PASS — Three documented claims found
- PASS — Stale source never complete
- PASS — Conflicting sources never complete
- PASS — Celiac separate from wheat
- PASS — Manual-only rules not matched
- PASS — Empty profile not a match
- PASS — All criteria needed
- PASS — Happy hour day and price filters
- PASS — overview renders
- PASS — needs renders
- PASS — happy renders
- PASS — recipes renders
- PASS — trip renders
- PASS — journal renders
- PASS — Profile toggles requirement
- PASS — Group combines all demo requirements
- PASS — Add itinerary day
- PASS — Reduce days retains stop
- PASS — Edit itinerary cost
- PASS — Remove itinerary stop
- PASS — Save happy hour
- PASS — Unsave happy hour
- PASS — Recipe enters spinning state
- PASS — Spin selects recipe
- PASS — Save recipe
- PASS — Journal escapes user content
- PASS — Journal deletes
- PASS — Oil evidence opens
- PASS — Dining card opens
- PASS — Private dietary data not persisted

## Implementation boundaries
The dietary matcher reads structured, preassigned sample evidence. It does not parse real menus, scrape sites, detect allergens from arbitrary text, or use a clinically validated derivative dictionary. It does not claim every condition is supported.
Halal is separate from allergy matching; supplier-only evidence never certifies the restaurant.
Allergy-related content is for product testing only. Do not use the prototype to decide what to eat.
No cloud authentication, subscription billing, API integration, production source ingestion, or cloud storage is implemented.

## Next implementation work
Browser QA and visual review; qualified review of dietary rules; reliable source collection and licensing; private account-scoped storage; Pro entitlement/billing integration; live data ingestion; accuracy/freshness pilot. Do not advertise or charge for live dietary matching before those prerequisites are satisfied.
