# TableRec Pro: Your Dining Needs
Date: 2026-11-16
Status: Implementation specification and pilot plan. Not implemented or clinically reviewed.
Owner: Ryan Johnson
Scope: Private dining profiles, multiple-restriction discovery, sourced restaurant information.
Existing product decision: Run It remains free and unlimited.

## 1. Product outcome
Help diners with several requirements narrow their choices, inspect the evidence, and communicate with restaurant staff. Reduce repetitive research without promising that staff confirmation can be skipped.
Do not describe restaurants or dishes as safe, compliant, guaranteed allergen-free, medically suitable, or a percentage safe. An evidence match is not clearance to eat.

Example: Peanut + milk + wheat.
Each requirement receives an independent result. Information for peanut and milk cannot hide an unknown wheat status. A confirmed conflicting ingredient must remain visible alongside any uncertainty.

## 2. Coverage and release boundaries
Build an extensible catalog rather than promising every allergy or disease is covered.
Profiles may combine allergy, medical, religious, preference, and custom requirements; these categories are never silently substituted.

### Initial allergy catalog
The FDA nine: milk, egg, peanut, tree nuts, wheat, soy, sesame, fish, crustacean shellfish.
Allow individual nut and fish/shellfish species selections; do not silently treat all seafood as one allergen.
Extended catalog candidates: molluscs, mustard, celery, lupin, and other individually specified foods.
Sulfites and other sensitivities must be represented separately from protein allergy categories.
Custom restrictions are supported as user text but remain "manual review required" until a reviewed matching rule exists.
Cross-reactivity is not inferred: do not automatically equate peanut and lupin or every legume.

### Medical needs
Celiac disease/gluten avoidance and lactose intolerance require rules distinct from wheat allergy and milk allergy.
Additional candidates for specialist-reviewed modules: alpha-gal syndrome, low-FODMAP needs, and clinician-directed sodium, carbohydrate, potassium, or phosphorus limits.
No generic diabetes-safe, kidney-safe, heart-safe, or disease-approved result.
Nutrient comparisons require applicable serving sizes and reliable numeric data. No treatment recommendation or inferred personal limit. Users may enter clinician-directed limits; missing nutrient values mean unknown.
Complex condition modules remain labeled unsupported until reviewed and validated. A condition label alone must never enable an unvalidated matching engine.

### Religious and personal requirements
Halal, kosher, vegan, vegetarian, pescatarian, and explicit ingredient exclusions (such as pork or alcohol).
Offer user-defined details rather than assuming everyone follows identical practices.
"No pork" is not equivalent to halal. Vegetarian is not equivalent to kosher. Lactose-free is not milk-allergy clearance.
Certification is a separate evidence type. Record issuer, identifier, location, covered products/services, expiry where available, and verification source.
Distinguish certified location, certified ingredient/supplier, and restaurant-reported options.
Do not infer certification from cuisine, name, reviews, or a logo photograph.
Validate religious rules and certification presentation with qualified relevant advisers.

## 3. Ingredient and derivative dictionary
Each entry needs canonical ID, aliases, language/region, source ingredient, processing details, clinical/religious interpretation where reviewed, source references, version, reviewer, and review date.
The dictionary is not just keyword search. Parse complete ingredient words, aliases, nested subingredients, and context. "Peanut-free" must not become "contains peanut" from keyword matching; the claim still requires evidence review. "Cocoa butter" must not automatically become milk butter.
Distinguish documented presence, explicit source claims of absence, ambiguous references, and cross-contact statements.
Dish names or menu omission never establish absence.

Seed examples for review (not a complete production ruleset):
- Peanut: peanut butter, flour, meal, protein, oil; arachis oil.
- Milk: whey, casein/caseinates, butter, ghee, milk powder.
- Sesame: tahini, sesame paste/oil, gingelly oil.
- Gluten/celiac: wheat, barley, rye, triticale and reviewed derivatives such as barley malt.
These examples require validation against authoritative references before use.

### Oils and processing
Store source, refining/processing type, brand/product where supplied, use (frying, finishing, spray, marinade), location, and source date.
Peanut oil: distinguish highly refined, unrefined/cold-pressed/expelled/extruded, and processing unknown.
Show all known peanut-derived oils in a peanut profile. Do not automatically approve highly refined oil; show processing and clinician-guidance context.
"Vegetable oil" without a specified source is unknown, not allergen absent.
Do not generalize the handling of refined peanut oil to sesame oil or other oils.
Oil blends need every constituent and applicable processing evidence.
An oil's ingredients and a shared fryer's cross-contact status are separate checks.

### Compound ingredients
Cover sauces, dressings, marinades, stock, breading, spice mixes, toppings, garnishes, cooking sprays, butter finishes, and bought-in products.
Unknown subingredients propagate uncertainty to relevant requirements.
Supplier substitutions invalidate affected ingredient evidence until reviewed.

## 4. Evidence model
All claims are location-specific and, where relevant, dish/variant-specific.
Required fields:
- location and optional dish/variant/product ID
- criterion ID and exact claim
- ingredient / oil / preparation / certification / nutrition category
- source type: official restaurant publication, authorized restaurant response, certification source, supplier documentation, or diner report
- source URL/document and excerpt; usage permission/license where needed
- publication date if known, checked date, reviewer, expiry/recheck due date
- scope, conflicts, active/superseded status, and change history

"Checked" means a source was checked, not that a kitchen was inspected.
Restaurant responses are authenticated before publication but remain restaurant-reported claims.
User experiences are displayed separately. A Verified Visit does not verify ingredient composition, clinical expertise, certification, or future safety.
Do not fabricate real restaurant data for a demo.

## 5. Matching rules
Store two independent axes:
A. Ingredient evidence: reported present / source reports absent within stated scope / unknown / conflicting.
B. Preparation evidence: stated precautions / shared equipment reported / unknown / conflicting.
Also retain freshness, source scope, and clinician/diet-specific rule status.

Aggregation:
1. Evaluate every selected requirement; evaluate all necessary components of a chosen dish, not unrelated dishes.
2. Display all reported conflicts prominently. Never let a favorable claim override a conflict.
3. Missing, stale, incomplete, unreviewed custom rules, or contradictory evidence prevents a complete information match.
4. A complete information match means required current evidence exists; it is never a safety guarantee.
5. No probability or confidence score may be presented as probability of safe dining.
6. Include uncertain options only in a clearly separated section when requested. Explain why an option is omitted.
7. No unqualified restaurant-wide clearance based on one menu item.
8. A user can inspect evidence and contact the restaurant even when an item is excluded.
9. Do not auto-apply these filters to free Run It in the first release. Any future integration must preserve free unlimited use and clearly disclose missing data and filters.

Proposed labels:
- "Published information found for all selected needs" (with preparation details and limitations)
- "Information missing for wheat"
- "Restaurant reports peanut oil; processing not confirmed"
- "Shared fryer reported"
- "Sources disagree"
- "Information needs an update"
Never use a green safety shield or medically reassuring checkmark.

## 6. User experience
Profile setup:
- Explicit opt-in; select multiple requirements and individual allergens.
- Clarify condition versus preference without grading an allergy as mild enough to ignore.
- Explain supported matching versus manual-only entries.
- Optional private dining companions identified by nicknames; avoid collecting full birth dates or diagnostic records.
- Separate controls for searching and sharing. A dining card is never automatically sent to a restaurant.

Restaurant detail:
- Per-requirement evidence, ingredients, oil processing, preparation, relevant certification, source, date, and unknowns.
- Link to official information and phone contact; a short question checklist.
- Explain that ingredients and practices can change; confirm with staff before ordering.
- No collection of emergency treatment instructions or personalized medical advice.

Pro proposal:
Saved multi-restriction profiles, combined group search, comparisons, collections, and planning.
Publicly displayed restaurant warnings should remain visible regardless of subscription. Final entitlement details still need product approval.
No Pro charging for coverage that has not been established.

Draft notice for legal/clinical review, not approved production legal copy:
"TableRec organizes published and restaurant-reported dining information. Ingredients, suppliers, menus, and preparation practices can change, and information may be incomplete or outdated. A match is not a guarantee of suitability or freedom from cross-contact. Confirm your requirements with the restaurant before ordering. TableRec does not provide medical advice."
Do not claim that this wording eliminates liability.

## 7. Restaurant questionnaire
Require branch name/address, respondent name/role, response date, and authorization to publish answers.
For each selected allergen or requirement:
1. Which exact dishes/variants have ingredient information? Attach the current ingredient/allergen guide.
2. Are compound ingredients and supplied products covered? Identify missing information.
3. Which oils, blends, sprays, or butter finishes are used, and for which items? Provide source and processing details.
4. Are fryers/oil, grills, utensils, preparation surfaces, storage, or serving equipment shared? Describe practices separately.
5. Can staff discuss ingredients and preparation before ordering? Supply the branch's contact route.
6. For halal/kosher claims, specify scope, certificate issuer/reference, expiry if applicable, and official verification source.
7. Which ingredient/supplier substitutions occur, and how will changes be reported?
8. What permission is granted to reproduce the supplied information?
Every field supports unknown or not provided; optional answers cannot default to "no allergen."

## 8. Freshness and corrections
Proposed pilot policy, not an externally established standard:
Review location claims at least every 30 days; apply shorter source expiries when specified. A recent page fetch does not make an undated menu newly published.
Mark evidence with unknown age clearly. Suspend matching for affected claims immediately on credible change reports or conflicting evidence, pending review.
Expire certifications according to their recorded validity, never the general 30-day schedule.
Log corrections and notify affected saved-profile users only with consent and without exposing their restrictions.
Archived claims remain audit records, never current matching input.

## 9. Privacy and access
Dietary profiles can reveal health and religious information. Keep them private and separate from public ratings/follows.
Owner-scoped access on all profile and companion data; enforce access on the server.
Use explicit consent for cloud storage and sharing; provide export/deletion.
Do not include dietary selections in advertising, third-party analytics events, public URLs, crash logs, or marketing segments.
Do not claim HIPAA compliance or comprehensive regulatory compliance without assessment.
Obtain legal/privacy review before storing pilot participants' sensitive profiles. Synthetic fixtures can be used for initial development.

## 10. Build stages and release checks
Stage A (this change): specification, sample questionnaire, coverage boundaries, acceptance scenarios.
Stage B: isolated prototype with synthetic restaurant evidence and a provisional expert-reviewed dictionary; private multiple-profile selection and evidence display.
Stage C: collection pilot with a small, explicitly scoped Austin-area restaurant set; manual source review; test with consenting diners managing multiple needs.
Stage D: validated production matching and Pro entitlements; expand coverage based on reviewed data, not restaurant count alone.

Before public claims or paid rollout:
- qualified food-allergy clinical review of supported rules and interface
- religious/certification review for applicable features
- legal/privacy review of notices, data use, and marketing claims
- source licensing/permissions established
- measured pilot evidence accuracy and freshness; no invented success threshold
- users understand unknowns and matching limitations
- functional privacy, deletion, correction, and source audit controls

## 11. Acceptance scenarios
1. Peanut + milk + wheat: wheat unknown => incomplete; show all three statuses.
2. Arachis oil => peanut-derived ingredient detected; processing unknown stays unknown.
3. Highly refined peanut oil => explicitly displayed; no automatic safety approval.
4. "Vegetable oil" alone => oil source unknown.
5. Tahini or gingelly oil => reviewed sesame mapping.
6. Casein, whey, or ghee => reviewed milk mapping; lactose-free claim does not clear milk allergy.
7. Barley malt with no wheat => evaluate gluten/celiac independently from wheat.
8. Cocoa butter alone => do not misclassify as milk solely because it says butter.
9. Peanut-free claim and peanut sauce in another source for the same dish => conflict shown, no complete match.
10. A dish with documented ingredient exclusions but a shared fryer => preparation warning remains visible.
11. Halal-certified supplier only => do not label whole restaurant certified.
12. Source reaches recheck deadline or changes supplier => affected evidence no longer current.
13. One branch's statement => no inheritance to another branch.
14. Custom allergy without a reviewed rule => manual review required.
15. Missing sodium or serving size => cannot evaluate a sodium limit.
16. Expired certification => no current certification badge.
17. Diner review says "safe" => remains an anecdote, not establishment evidence.
18. Account B cannot access account A's profiles or companions.
19. Profile deletion removes active private data according to published retention policy.
20. No data/empty result => explain coverage gap, never silently show a medically reassuring match.

## 12. Authoritative starting references
These guide requirements; they do not make the dictionary clinically validated.
- FDA major allergens: https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies
- FARE peanut derivatives and oils: https://www.foodallergy.org/living-food-allergy/food-allergy-essentials/common-allergens/peanut
- FARE milk derivatives: https://www.foodallergy.org/living-food-allergy/food-allergy-essentials/common-allergens/milk
- FARE sesame derivatives: https://www.foodallergy.org/living-food-allergy/food-allergy-essentials/common-allergens/sesame
- FARE cross-contact: https://www.foodallergy.org/resources/avoiding-cross-contact
- NIDDK celiac diet: https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease/eating-diet-nutrition

No restaurant partnership, data license, clinician review, certification verification, API integration, app deployment, or clinical validation is represented as completed by this document.
