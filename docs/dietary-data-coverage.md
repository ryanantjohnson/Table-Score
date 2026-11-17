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

## Remaining work before suitability recommendations

Obtain current item-level ingredient/allergen tables with reuse terms, map them to exact dishes and locations, retain source versions and changes, document oils and preparation separately, validate certification scope/expiry, review rules professionally, and expand primary-source coverage. Expired or missing data must stay unknown. Ingredient absence is not enough for an all-needs match.

The Pro app currently supplies the official reference library, known published concerns, private preferences, and questions to ask. It does not claim all major conditions are covered or suggest that a restaurant is medically safe.
