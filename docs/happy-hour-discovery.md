# On-demand Happy Hour discovery — first test version

This adds a geographically unrestricted discovery path alongside the reviewed collection. It is not exhaustive national coverage, an always-live tracker, or a completed commercial feature.

## User flow

Move the Happy Hour map to an area, then choose **Search this area**. Google Nearby Search supplies up to 20 operational restaurants, bars and cafes within 5 km of the center, nearest first. The first four venue websites are checked; **Check more nearby venues** continues the next batch. A site report needs an exact street/city match and explicit Happy Hour text. Reports with hours but no extracted deals are labelled hours-only. Unreadable, blocked, generic-brand/location-uncertain and incomplete mentions stay in Other checked venues instead of being promoted to Happy Hour pins.

Results open in-app snapshots containing a short published text excerpt and the source link. Source text is escaped and never executed. Website reports are explicitly automatic and require venue confirmation. Their normalized schedules are not invented; times and restrictions remain in the excerpt. Existing reviewed snapshots and saves are retained. Temporary automatically found reports cannot yet be saved.

Moving the map invalidates outstanding searches, and responses from old areas/accounts do not update the current view. Searches do not restart on every pan, limiting paid provider calls. This version searches a fixed circle around the center, not the entire viewport; the UI states the radius and checked count. Ordinary map filtering continues to use the visible viewport.

## Collection and refresh boundaries

`discover-happy-hours` validates the caller through Supabase Auth, checks Pro access, rejects extra input keys, applies six requests/user/minute and a global ceiling of 100 fresh Google requests/hour. Google API usage can incur existing provider charges; no AI or additional provider is used. Area results are cached ten minutes. Website reports, including failures, expire after six hours and are rechecked on the next search. This is access-triggered refresh, not scheduled background crawling. It does not automatically renew the manually reviewed collection.

Only the venue website supplied by Places is fetched. The reader upgrades HTTP declarations to HTTPS, restricts ports and credentials, resolves/rejects non-public IPv4 ranges, pins the selected public address into the HTTPS connection while retaining hostname TLS validation, and validates every redirect. Only same-host or www-alias redirects are allowed. Robots rules are checked before fetching a page. One homepage and at most one same-origin Happy Hour/specials link are checked; time and response sizes are bounded. DNS/website failure stays unconfirmed. No authorization headers or server keys go to venue websites.

Google/provider attribution stays visible. API input consists only of area coordinates/radius/batch cursor; no dietary preferences are sent. No new tables, RLS policies or auth grants are introduced; existing private cache/rate RPCs are called server-side.

## Validation and unresolved work

Automated tests exercise Detroit coordinates, batch continuation/cache, membership and budgets, malicious URLs/private DNS, robots rules, local-address mismatches, script removal, map movement during a search, and snapshots outside the curated area. Public HTML fetched from BESA Detroit produced a source report with hours and prices. Dietz Distillery in Fredericksburg produced an hours-only report. These checks exercise the production extractor on fetched pages, not a full authenticated live Places-to-website-to-native run.

Local outbound Node DNS is unavailable in this workspace; pinned HTTPS transport is tested with an injected transport. Hosted runtime behavior, actual authenticated Places responses and iPhone interactions require integration testing. PDFs, menu images/OCR, social-only specials, non-English patterns, most location directories, websites prohibiting crawling, and all results beyond the nearest 20 remain gaps. A genuine town with five venues and multiple distant metros must be tested before calling this production-ready. This first path removes the Austin-only dependency, but does not establish nationwide recall or solve freshness by itself.

## Hosted website transport fix
The hosted runtime rejected Node `ClientRequest.options.lookup`. Website reads now use Deno TCP connections to validated public IPs and `startTls` with the original hostname for certificate verification and SNI. A bounded HTTP/1.1 reader supports identity and chunked responses; failures stay unconfirmed. Node tests retain a pinned-address HTTPS reader. Website cache namespace v2 skips the previous unreadable reports.

Hosted checks loaded Rosa’s Cafe, Dietz Distillery and Asian Buffet Killeen pages with HTTP 200. Full website inspection extracted Dietz’s Thursday 4–7 pm hours-only report. This validates hosted transport and extraction, not exhaustive Killeen specials or all websites. Temporary diagnostic handling was removed before final deployment.

## Targeted venue discovery
Candidate retrieval now uses Google Places Text Search for `happy hour` biased around the requested coordinates, with an independent geodesic radius filter. It no longer fills the initial pool with the nearest generic restaurants/cafes. The 20-result inspection cap, Auth/Pro, provider budget and source checks remain. This can find bars, grills and other venue types returned by the query, but a listing alone never establishes a published special. Area cache namespace v2 avoids the older generic candidate pool.

A live hosted test at Killeen coordinates returned 13 in-radius candidates, including Vida Roxy, Backporch Drafthouse, Pluckers and Brick and Forge. Inspection of the first four extracted a published Vida Roxy report from its official specials page, with Tuesday/Wednesday/Thursday/Sunday 4–6 pm and discounted drinks. Other candidates remained unknown or unreadable. This is a measured Killeen improvement, not a guarantee of nationwide completeness. Temporary diagnostic handling was removed from deployment.
