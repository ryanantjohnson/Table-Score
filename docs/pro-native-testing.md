# TableRec Pro tester build

## What is integrated

- Discover: Happy Hours.
- Profile: private Dining Needs.
- Run It: Cook at Home with a conversational ingredient box, existing recipe matching and Run It among the matches. Restaurant Run It is unchanged, free, and unlimited.
- Nonmembers see Pro features with an access screen; purchases are disabled.

The feature screens live in TableRec's existing app document, use its header, bottom tabs, appearance variables, navigation, and typography, and do not load an iframe.

## Connected services

The existing Supabase project provides 3,796 attributed Wikibooks recipes, source-linked Central Texas happy-hour locations, server-checked Pro access, private dietary preferences, and revision-protected private notebook saves. Recipe and special saves survive app reloads. Legacy notebook fields are preserved, but Journal and Trip Planner interfaces are removed. Edits on another device cause an explicit conflict rather than silently overwriting that device's changes. Account changes discard in-memory state and stale requests.

The dietary source library contains 16 published US restaurant/brand guides. Restaurant references are matched conservatively by brand name, with additional Austin scope checks for local entries. This is source-linked guidance, not dish-level approval, certification validation, or a guarantee of suitability. No fictional restaurant evidence is used.

See data/dining-sources.json and docs/dietary-data-coverage.md for source scope and limitations. Initial dish evidence is now integrated; current local certification details, broad local coverage, and production payments remain unfinished.

## Private TestFlight installation

Run TableRec iOS Release on branch `pro/dining-needs-spec`, with signing and Apple upload enabled. Wait for Apple processing, then assign the new build only to Ryan's private group with automatic distribution disabled. Keep 29.1 selected for App Store review. Earlier TestFlight builds do not change when source code changes.

## Validation

Local checks exercise placements, server access, recipe search and attribution, preference consent, unknown dietary evidence, specials, saves, removal of retired interfaces, conflicting revisions, account switching, and delayed requests. Existing launch checks cover auth, badges, location, onboarding, and feedback.

A live database transaction verified recipe access, private preference writes, revision-protected notebook saves, and denial for an unrelated non-Pro account. All validation writes were rolled back.

Hosted browser tests render the actual app HTML and CSS using isolated fixture responses at 320, 390, 430, and 768 pixel widths. They capture screenshots for review. These tests do not replace native iPhone/TestFlight testing, keyboard testing, or App Review.

## Private tester scope
Happy Hours, Cook at Home, and Dining Needs are available for private review once this revision passes checks. Reservations and paid signup are not included. Happy Hour coverage remains a limited Central Texas catalog, and dietary evidence is not a verified-safe recommendation. Do not replace the public App Store candidate with this tester build.

## Cook at Home ingredient matching
The primary cooking flow now accepts up to 40 comma/newline-separated ingredient names. The additive match_pro_pantry_recipes endpoint ranks the existing 3,796 attributed recipes by required ingredient coverage, familiar everyday dishes on tied coverage, and supplied ingredients used. Results show matched/required counts, exact missing recipe lines, used and unused inputs. Optional ingredients do not count as missing requirements. Users can require every supplied ingredient and explicitly include water, salt and black pepper. Staples are never silently assumed. Recipe detail and saved recipes retain attribution and the match snapshot.

The matcher compares ingredient names, not inventory quantities, medical suitability or preparation readiness. It blocks common misleading matches such as egg/eggplant, chicken/stock or soup, rice/rice flour, milk/coconut milk, and butter/peanut butter; recognition remains conservative and incomplete. Users must review quantities and prepared forms. This is matching published recipes, with no AI generation service connected. Old wheel endpoints stay available for older installed builds.

## Happy Hour map and source expansion
Map uses the existing Google Maps integration, shows sourced listing pins, updates after map movement, supports return to the TableRec browsing area, and keeps the list usable when map loading fails. Sources added November 17: Fish City Grill Georgetown and Salt Traders Round Rock/Zilker. North Italia Domain and 2nd Street are also checked with their own bar-only menus and official coordinates. The League Avery Ranch, Bee Cave and Belterra are included using the official shared specials and listed open locations; their map coordinates are Census address estimates. Total catalog is 14 locations. Coverage remains insufficient for broad paid-service release. New source records and review dates are in data/happy-hour-expansion.json. Fish City marker uses a Census address match; Salt Traders coordinates are published by the restaurant. $2.99/month is the approved consumer Pro price direction; no real checkout is active.

## Dining Needs matching and search
The first 11 dish records are eight current CAVA bowls and three explicitly labelled Chipotle custom-order ideas. Dish suggestions compare all selected needs, show conflicts and unknowns, disclose shared preparation, retain dated source links, and block a full match for additional free-text needs. A restaurant search reaches Places beyond the initial saved-restaurant list without transmitting dietary preferences. No local kitchen or medical safety approval is implied. Active-now Happy Hours now use the restaurant’s current local day even when the browsing day differs.

## Map and detail behavior
Happy Hours uses a full-width map with the restaurant list underneath at all viewport widths. Each card shows a summary; the full offer opens in a snapshot. The list and numbered pins update automatically after pan or zoom settles. Browser maps use actual bounds. The existing native HTTPS bridge publishes center/zoom on idle; this preview derives the flat, north-up Mercator viewport without changing or deploying the shared map surface. The map is preserved while results update. Current catalog coverage remains 14 Central Texas locations.

A pin or result opens the same in-app snapshot overlay, preserving the mounted map and current area: all published schedule groups, local timezone, specials/restrictions, address, save and directions. The restaurant website is an optional evidence link. Returning restores the last browsing area and zoom. Native dragging/zooming and small-screen keyboard behavior still require device validation.

## Cook at Home final direction: published recipe matching
The primary flow is a chat-style ingredient entry, not AI generation. It accepts commas, semicolons, new lines, “and”, and an optional “I have” prefix. Search uses the existing cookbook RPC; the app does not call the generation endpoint or require an OpenAI account, API key, credits, or model. No provider calls are made when loading Cook at Home, matching, opening, saving, or running a recipe round.

Results with fewer than half their required ingredient names matched are omitted. Exact matches rank first, then coverage, used inventory and missing count from the existing server ranking. Cards show “You have everything” or matched counts and explicit missing ingredient lines. Quantities, prepared forms, optional ingredients, and recipe attribution remain visible in detail. The matcher is not a general language assistant; users should enter ingredient names rather than preparation requests.

Run It animates the matched recipe names, scrolls its stage into view before shuffling, prefers complete matches when present and avoids recent picks where possible. Reduced-motion users receive the result directly. Input/filter changes, navigation and account changes invalidate the round. A restaurant shortcut reopens the free restaurant selector. Restaurant Run It reserves scroll room below its reel so the additional Cook at Home entry cannot keep the animation off screen.

The previously deployed generation backend remains unactivated and is not referenced by this app flow. Its private ledger remains intact; no user data is deleted. The unused API key can be revoked and removed from Edge Function secrets. No API purchase or provider activation is needed for this build.

## Launch fixes carried into this Pro revision
The guest-access-and-earned-badges branch had not been carried into the Pro source. This revision brings across its existing guest endpoints/configuration, guest Settings, feed account marks and explanations, server-owned Verified Contributor eligibility, and full own-profile rating/place history. Ratings and Places are buttons; history pages in groups of 20, and server history loading follows actual returned row counts. The existing live contributor RPC and guest endpoints were confirmed present; those services were not redeployed.

Release notes now describe pantry matching, linked Happy Hours and the correct integrated feature locations. Journal and Trip Planner are not advertised. Local launch tests include real DOM clicks on both profile counters, 45-rating pagination, 23 distinct places, 1,201-row capped server paging, badge explanations, legacy verification rejection and account-switch race protection. Pro tests verify no generation calls, matching/error/empty/complete states, Run It, cancellation and entitlement guards. Live read-only recipe queries verified source links, methods, missing counts and coverage order. The revised device-feedback flows receive hosted browser checks before the next native build.

## November 17 device-feedback corrections
Happy Hours now uses a full-width map with its list below at every viewport width. Day/price/active-now controls are removed. All current sourced schedules are eligible; days, times and prices remain in snapshots. The native Mercator longitude conversion was shifted 180 degrees, incorrectly filtering out Central Texas offers; it now converts the viewport correctly. Regression checks assert that the initial native viewport includes real Central Texas fixture offers before testing an empty area. Empty coverage states offer a route back to the covered area, without implying no Happy Hours exist nearby. Coverage remains 14 sourced locations; no unsupported listings were invented.

Cook at Home defaults to Everyday Favorites, a rule-based familiar dish-family subset of 623 of the current 3,796 recipes. Matching still requires at least half the required ingredient names and ranks complete ingredient coverage first. All Recipes remains available. The additive match_pro_pantry_recipes_v2 RPC checks Pro access, applies the collection before ranking, preserves attribution and leaves the old endpoint intact for installed builds. Loading/results replace the form and receive scroll/focus immediately. Results begin with counts and recipe cards, with a compact Run It action and a visible stage when running. A Change Ingredients action restores the entry form.

Dining Needs now has a saved-needs summary, Find Restaurants for My Needs, a 1/3/5/10/15-mile selector, and optional manual restaurant search. Nearby search combines the existing Places nearby results with initial menu-covered CAVA/Chipotle searches, deduplicates locations and filters by coordinates within the selected radius. Only restaurant names/location are sent; saved dietary needs/notes are not. The list prioritizes locations with dishes whose evaluation is supported or requires restaurant confirmation for every selected need; missing information is grouped separately. Country scope, evidence expiry, all-needs comparisons, free-text/manual requirements and conflicts keep the existing conservative rules. Missing coordinates cannot qualify as nearby. This is not exhaustive search or local-kitchen approval; coverage is explicitly disclosed.

Restaurant details show the active saved needs, potential options, known conflicts and missing information. Official guides and questions to ask are supporting disclosures. Search failures and missing location have distinct recovery messages; account, preference and radius changes invalidate stale responses. No clinical recommendation or safe-restaurant badge is introduced.


## Current coverage and flexible pantry revision — November 17

This revision supersedes the earlier 50% minimum description for new Pro builds. `match_pro_pantry_recipes_v3` keeps complete/close matches first and also permits below-half matches when they use a named pantry ingredient beyond generic staples and need no more than three additional ingredients. "Use every ingredient" remains strict. With no Everyday matches, it tries All Recipes and labels that fallback. V2 and the original matcher remain unchanged for installed builds. Attribution and missing/unused ingredients remain visible; no AI generation calls or charges.

Live Happy Hour coverage expands from 14 to 27 active locations, including nine south of latitude 30.27. These are sourced records, not automatic discovery or exhaustive city coverage. Thirteen additions are versioned in `data/happy-hour-expansion.json` with location/coordinate provenance. Maudie's shared drinks menu is joined to its official location addresses and Monday closing hours; Pinthouse location pages and CARVE Barton Creek publish schedules and offers. Blue Corn's dated Round Rock calendar has a shorter November 24 review expiry. CARVE Central Austin is omitted because its page says temporarily closed. Conflicting Bouldin Happy Hour end times are withheld pending confirmation. Pan/zoom updates the list without day/price controls.

Dining coverage is now 18 official references and 34 dish/order records across six brands/venues: CAVA, Chipotle, Chick-fil-A, Five Guys, CARVE Barton Creek and Bouldin Creek Cafe. The latter two are exact-location scoped; missing or different identity cannot inherit their dishes. Brand discovery now supplements nearby results with all six catalog searches. Derived oils are separately disclosed and require confirmation; they are not silently interpreted as allergen-free or equivalent to intact-protein declarations. Where a source identifies the component behind a concern, it is shown. Vegan remains separate from milk/egg allergy evidence. Medical targets/certification/free-text and unestablished allergens remain unknown.

Checks: full existing launch suite, Pro integration, catalog validation and dietary evidence; live read-only SQL covers mixed pantry subsets, missing counts/order, strict all-ingredient input, All Recipes fallback, validation and Pro guards. Hosted layout CI also checks actual app CSS with isolated maps/backend fixtures. Test native gestures, keyboard focus, nearby Places results and restaurant details on the private TestFlight build before accepting this revision. The exact tester pantry that previously returned zero was not supplied; an odd mixed pantry (chicken, peanut butter, cinnamon) was reproduced as a regression scenario and now returns eight published options, each needing two or three ingredients.


## Pantry input and visible menus — November 18

Tester pantry: `Pasta milk cheese marinara beef chicken garlic flour sugar`, Use Every Ingredient OFF, water/salt/black pepper ON. Old comma/newline/and-only parsing produced one overlong ingredient and failed validation before the matcher ran. `native/pantry-input.js` now recognizes common single/multiword ingredient names locally, preferring longest phrases (ground beef, peanut butter, chicken broth, cream of mushroom soup, half and half). A visible list shows parsed names as the user types. Unrecognized fragments remain visible for review; unknown comma-separated names stay intact. It is a deterministic name parser, not a conversational AI or comprehensive food dictionary. Commas disambiguate combinations such as milk plus chocolate versus milk chocolate.

The exact input becomes nine names and, against the current live catalog, finds 98 candidate recipes; the first page includes Chicken and Pasta Alfredo, macaroni and cheese and skillet lasagna. No backend schema or matcher changes are required for this revision. A read-only assertion preserves this regression case in tests/pro-pantry-flexible.sql. Other filters and quantities still matter.

Pro now scrolls within a bounded panel beneath a fixed safe-area-aware app header, rather than letting text pan under the phone status bar. Visual viewport height/offset define the panel bounds. While a focused field and reduced viewport indicate an onscreen keyboard, bottom navigation is hidden to preserve typing space and restored afterward. This is scoped to Pro; ordinary screens retain their existing layout. Test actual iPhone keyboard opening, scrolling, dismissing, back navigation and rotation: hosted geometry tests simulate offset/reduced viewports and do not emulate iOS keyboard internals.

Dining discovery already requested six catalog brands on the prior branch. No evidence establishes that the tester was running a stale build or why a particular search returned only two matching brands. The previous flow also collapsed every restaurant lacking an all-needs match, and the catalog's other two national chains may lack evidence for a given set of restrictions; two local menus can be outside the radius. New UI keeps an initial group of insufficient-evidence restaurants visible, offers Show All, and provides six explicit published-menu reference cards independent of nearby discovery. Reference menus are labelled as not nearby recommendations. CARVE and Bouldin evidence stays attached to the exact location. Five Guys' full Burgers & Fries name variants are recognized without relaxing unrelated CAVA names. No missing medical/allergen evidence is converted into suitability.

Membership Details shows `pantry-input-4`, the actual store build number when available, and the bundled dish count, so device/source mismatches can be distinguished from matching or coverage failures. National Happy Hour expansion to 50+ sourced options per major metro, broader dietary evidence and the SDK maintenance upgrade remain outstanding. Reservations remain deferred until the regular app and Pro launch.

## Partial pantry matches and restaurant contact — November 18 follow-up

Current revision: `dining-contact-5`. Cook at Home no longer offers Use Every Ingredient. All new client requests use flexible matching (`p_require_all: false`); existing RPC strict mode remains intact for older clients. Missing/unused ingredients, collection/category controls and the staples checkbox remain.

Restaurant results continue to prioritize potential dish matches across every selected need, with insufficient evidence labelled separately. Opening a result now shows **What you could order** and **How to order** instructions first. Conflicting and insufficient-evidence dishes remain in a separate expandable section. No unlisted modification is invented, and the restaurant still needs to confirm preparation. The catalog remains 34 reviewed dish/order records across six brands/locations; this flow improvement does not expand national evidence coverage.

For a specific Places search result, `restaurant-contact` fetches that exact Place ID's contact details on opening. It checks the signed-in user, Pro entitlement and a per-user limit of 20 lookups/minute before one bounded Google Place Details request. Dietary needs are not sent. Contacts are kept only in account-scoped session memory, cleared on sign-out/account change; no Google response is written to the database. Missing phone numbers and request errors do not create a Call link; errors offer retry and a location-specific Google Maps listing. A generic brand menu reference does not show an invented branch phone number. Contact requests use the existing Places provider billing, not an AI service.

Device checks: open an actual nearby restaurant; confirm its address and phone, tap Call and verify the iPhone dial prompt (cancel without calling if only testing). Check a second branch independently, back navigation, missing contact recovery and the separation between potential dishes and conflicts. Automated handler checks cover auth, Pro denial, rate limits, exact ID, missing phone and provider failure. Real Google contact retrieval and the native dial prompt require authenticated device testing.
