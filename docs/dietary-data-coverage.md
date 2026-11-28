# Dietary source coverage

The initial source register contains 16 published guides, reviewed November 16, 2026. Sources and paraphrased findings are versioned in data/dining-sources.json and bundled in native/dining-sources.js.

## Available references

Chipotle, Chick-fil-A, Five Guys, McDonald's US, CAVA, sweetgreen, P.F. Chang's, Panera Bread, Jersey Mike's, Red Robin, Olive Garden, First Watch, Cabo Bob's, Picnik Austin, Pita Pita Illinois, and the specified H-E-B Kosher Deli in Austin.

Each record includes country, scope, aliases, source URL, check date, and review due date. Claims distinguish published ingredient absence, reported ingredients/derivatives, preparation concerns, and reported certification. None creates a restaurant-wide safe label. Source checking is manual; this version does not claim a live crawling or automatic menu-refresh service.

## Important distinctions

- Peanut-derived oil stays visible even when highly refined oil does not receive the same allergen flag as peanut protein.
- Ingredients, preparation equipment, supplier substitutions, location, and menu scope are separate questions.
- Wheat allergy and celiac disease are separate requirements.
- A gluten-free menu claim, dedicated fryer, or ingredient exclusion does not establish absence of cross-contact.
- Kosher and halal require current, location-specific certification or documented scope. Pita Pita must not match Pita Pit or Pita-Rita. A particular H-E-B counter must not label all H-E-B stores kosher.
- Medical targets such as carbohydrate, sodium, potassium, phosphorus, FODMAP, and alpha-gal need individual review. Saving them does not activate an automated clinical recommender.
- Free-text requirements are stored privately but are not interpreted as automated matching rules.

## Dish-level matching added November 17

The first catalog has 11 US records: eight CAVA menu bowls using the allergen PDF currently linked by CAVA, and three explicitly labelled TableRec custom-order ideas built from Chipotle’s published vegan ingredients. Data is versioned in data/dining-dishes.json; native/build-dining-data.mjs regenerates the bundled public catalogs. These are initial references, not broad local coverage.

Every selected need is evaluated separately. Published conflicts stay visible. Unmarked allergens become “Ask before ordering,” never allergen-free. CAVA’s salmon/shrimp-specific columns do not establish absence of all fish or shellfish; those broader requirements remain unknown unless a positive ingredient concern is documented. Missing requirements, stale evidence, free-text needs and unsupported medical targets block a full ingredients-fit result. Vegan labels do not establish milk-allergy suitability. Certification requires dated evidence for the exact dish and location; no halal or kosher dish in this catalog is marked supported.

The Profile screen offers restaurant search through the existing Places service, with no dietary preferences or notes sent in the request. Exact-location results can open available brand dish evidence; no local kitchen is marked verified. The dish library can also be searched directly and explains every result.

## Remaining work before broad suitability recommendations

Obtain current item-level ingredient/allergen tables with reuse terms, map them to exact dishes and locations, retain source versions and changes, document oils and preparation separately, validate certification scope/expiry, review rules professionally, and expand primary-source coverage. Expired or missing data must stay unknown. Ingredient absence is not enough for an all-needs match.

The Pro app supplies the official reference library, initial dish comparisons, known published concerns, private preferences, and questions to ask. It does not claim all major conditions are covered or suggest that a restaurant is medically safe.

## Guided nearby discovery
The Pro tester flow applies saved needs to nearby Places results, with supplemental searches for the two brands in the initial dish catalog. It offers a distance selector and separates potential dish options from insufficient evidence. This changes discovery and presentation, not evidence coverage: the catalog still has 11 US dish/order records. Comparisons remain local to the app, and no restrictions or notes are sent to Places. Missing location/country/coordinates and extra free-text needs cannot be treated as established matches.


## Current expansion — November 17 (supersedes initial counts above)
18 official references; 34 dish/order records across six brands/venues. Added nine Chick-fil-A/Five Guys ingredient/order comparisons, six CARVE Barton Creek options and eight Bouldin Creek Cafe vegan dishes/order options. Existing 11 CAVA/Chipotle records remain. This is an incremental expansion, not broad local or medical coverage.

Sources: Chick-fil-A's individual item pages, Five Guys' official September 2026 US Nutrition & Allergen Guide, CARVE's Barton Creek location menu, and Bouldin's currently linked menu PDF. Exact source URLs and review dates are on each record. CARVE's live page provides its Google place identity; Bouldin uses its exact normalized street address. No CARVE dish evidence is assigned to the temporarily closed Central Austin restaurant.

Oils are distinguished from protein allergen declarations: Chick-fil-A's sandwich lists refined peanut oil, grilled nuggets/fries list soy-derived oil, and Five Guys fries disclose refined peanut oil. These remain "Ask before ordering" concerns even when the brand's displayed allergen chart does not flag that oil as a major allergen. The UI can show which component caused the concern where published. No absence claims are inferred from vegan labels, generic tempeh, unspecified flour, dairy-free-friendly or gluten-free-friendly menu tags. Confirm all modifications and preparation with the restaurant.
