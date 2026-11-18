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
Map uses the existing Google Maps integration, shows filtered listing pins, supports Search this area and return to the TableRec browsing area, and keeps the list usable when map loading fails. Sources added November 17: Fish City Grill Georgetown and Salt Traders Round Rock/Zilker. North Italia Domain and 2nd Street are also checked with their own bar-only menus and official coordinates. The League Avery Ranch, Bee Cave and Belterra are included using the official shared specials and listed open locations; their map coordinates are Census address estimates. Total catalog is 14 locations. Coverage remains insufficient for broad paid-service release. New source records and review dates are in data/happy-hour-expansion.json. Fish City marker uses a Census address match; Salt Traders coordinates are published by the restaurant. $2.99/month is the approved consumer Pro price direction; no real checkout is active.

## Dining Needs matching and search
The first 11 dish records are eight current CAVA bowls and three explicitly labelled Chipotle custom-order ideas. Dish suggestions compare all selected needs, show conflicts and unknowns, disclose shared preparation, retain dated source links, and block a full match for additional free-text needs. A restaurant search reaches Places beyond the initial saved-restaurant list without transmitting dietary preferences. No local kitchen or medical safety approval is implied. Active-now Happy Hours now use the restaurant’s current local day even when the browsing day differs.

## Map and detail behavior
Happy Hours keeps the scrolling restaurant list on the left and the map on the right, including phone widths. Compact phone cards show a summary; the full offer opens in a snapshot. The list and numbered pins update automatically after pan or zoom settles. Browser maps use actual bounds. The existing native HTTPS bridge publishes center/zoom on idle; this preview derives the flat, north-up Mercator viewport without changing or deploying the shared map surface. The map is preserved while results update. Current catalog coverage remains 14 Central Texas locations.

A pin or result opens the same in-app snapshot overlay, preserving the mounted map and current area: all published schedule groups, local timezone, specials/restrictions, address, save and directions. The restaurant website is an optional evidence link. Returning restores the last browsing area and zoom. Native dragging/zooming and small-screen keyboard behavior still require device validation.

## Cook at Home final direction: published recipe matching
The primary flow is a chat-style ingredient entry, not AI generation. It accepts commas, semicolons, new lines, “and”, and an optional “I have” prefix. Search uses the existing cookbook RPC; the app does not call the generation endpoint or require an OpenAI account, API key, credits, or model. No provider calls are made when loading Cook at Home, matching, opening, saving, or running a recipe round.

Results with fewer than half their required ingredient names matched are omitted. Exact matches rank first, then coverage, used inventory and missing count from the existing server ranking. Cards show “You have everything” or matched counts and explicit missing ingredient lines. Quantities, prepared forms, optional ingredients, and recipe attribution remain visible in detail. The matcher is not a general language assistant; users should enter ingredient names rather than preparation requests.

Run It animates the matched recipe names, scrolls its stage into view before shuffling, prefers complete matches when present and avoids recent picks where possible. Reduced-motion users receive the result directly. Input/filter changes, navigation and account changes invalidate the round. A restaurant shortcut reopens the free restaurant selector. Restaurant Run It reserves scroll room below its reel so the additional Cook at Home entry cannot keep the animation off screen.

The previously deployed generation backend remains unactivated and is not referenced by this app flow. Its private ledger remains intact; no user data is deleted. The unused API key can be revoked and removed from Edge Function secrets. No API purchase or provider activation is needed for this build.

## Launch fixes carried into this Pro revision
The guest-access-and-earned-badges branch had not been carried into the Pro source. This revision brings across its existing guest endpoints/configuration, guest Settings, feed account marks and explanations, server-owned Verified Contributor eligibility, and full own-profile rating/place history. Ratings and Places are buttons; history pages in groups of 20, and server history loading follows actual returned row counts. The existing live contributor RPC and guest endpoints were confirmed present; those services were not redeployed.

Release notes now describe pantry matching, linked Happy Hours and the correct integrated feature locations. Journal and Trip Planner are not advertised. Local launch tests include real DOM clicks on both profile counters, 45-rating pagination, 23 distinct places, 1,201-row capped server paging, badge explanations, legacy verification rejection and account-switch race protection. Pro tests verify no generation calls, matching/error/empty/complete states, Run It, cancellation and entitlement guards. Live read-only recipe queries verified source links, methods, missing counts and coverage order. Hosted browser checks and the next native build remain necessary after the branch upload is authorized.
