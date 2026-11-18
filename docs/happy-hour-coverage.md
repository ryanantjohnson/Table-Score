# Happy Hour coverage and publication

## November 18 expansion

57 distinct locations in the greater Austin corridor, up from 27. Thirty additions: 18 Torchy's locations; Vacancy Brewing; Champions Austin; Brewtorium Highland; Cedar Door; Hopfields; DrinkWell; Little Woodrow's Burnet and Tech Ridge; House Wine; Bar Toti; Haymaker; FlutterFly Sports Bar & Food Truck Park.

Restaurants, bars, bars and grills, pubs, breweries, brewpubs, wine bars and sports bars qualify when published specials exist. FlutterFly is one bar location with independent food vendors; its drink specials are not assigned to every truck. Vacancy's Wednesday Salam's Grill fries offer is explicitly day-specific. No mobile truck is pinned to an assumed permanent address.

The 18 Torchy's pins use the current official directory's addresses and coordinates with the shared brand Hooky Hour page. Listings disclose shared brand scope and ask users to confirm local selection/availability; they are not 18 independently confirmed local offers. Beer and house margarita discounts only are described, rather than implying every appetizer or mocktail is discounted.

Official venue pages or their linked place pins supply coordinates where available. House Wine, Bar Toti, Haymaker and FlutterFly use exact-address US Census matches: these are interpolated street-address coordinates, not surveyed entrances. Their snapshots explicitly disclose approximate address-geocoded pins. The detailed coordinate URLs and methods are retained in the JSON. Generic Google search map centers were rejected because they did not resolve individual venues.

Brewtorium's Friday start conflicts between page body and footer; that day's schedule is withheld. DrinkWell's Saturday eligibility conflicts between its hero and FAQ/footer; Saturday is withheld. Existing withheld Bouldin and closed CARVE Central locations remain absent. Day-specific differences, age restrictions and DrinkWell's automatic 20% service charge are preserved in summaries.

New records were checked November 18 and expire December 2. Expiry prevents stale records from appearing; it does not automatically recheck or renew them. Source crawling, changes review and broad national coverage are still outstanding. This catalog is a checked expansion, not exhaustive Austin coverage or a claim of hundreds of current offers.

## Publishing and testing

`data/happy-hour-expansion.json` now contains the complete 57-row collection, including six original database rows previously absent from this file. Older rows retain their original review dates. Source and coordinate metadata remain versioned alongside the 13 existing database fields; the database schema is unchanged.

Run `node tests/pro-coverage.cjs` and `node tests/pro-native-smoke.cjs`. The integration fixture loads the full collection, expands map bounds, asserts every location has a card and pin, and opens brewery/wine-bar/food-truck-park snapshots.

Build the date-scoped, idempotent SQL with `node native/build-happy-hour-sql.mjs 2026-11-18`. It writes no credentials and performs no deployment. Review and execute the generated transaction through the database connector, then verify batch count, overall active distinct locations and that Pro-only access policies are intact.

Installed Pro builds already read active, unexpired `happy_hour_offers` rows on account load, so data publication requires no new native build. Fully close/reopen the app to load the expanded collection. The number shown under the map is only locations inside current visible bounds, not total metro coverage. Pan/zoom to include the greater area when testing.
