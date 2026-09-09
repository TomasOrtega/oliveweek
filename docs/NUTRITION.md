# Nutrition data and quantity conventions

## Current status

`data/foods.js` contains **generic starter estimates**. These are not a verified USDA import, not measurements of the finished dishes, and not independently checked product labels. Every bundled food carries `source.type = "starter-estimate"`. The built catalogue carries `nutritionStatus = "generic-starter-estimates-not-verified"`.

The app uses the words "approximate" or "estimates" and does not infer nutrient values for an unmapped community recipe. Correct arithmetic does not make an unverified ingredient value authoritative.

A clinician or registered dietitian should review special dietary requirements. Do not use these values for insulin dosing, clinical electrolyte limits, treatment of disease or another high-stakes nutritional calculation. The app does not claim complete vitamin/mineral coverage.

## Calculation

All nutrient vectors use a per-100-gram basis. Energy is kcal, sodium is mg, and protein, carbohydrate, fat, fiber and saturated fat are grams.

For an ingredient quantity `g` and a nutrient `n`, its contribution is:

```text
contribution[n] = g / 100 * food.per100g[n]
```

A recipe's base portion is the sum of its ingredient contributions. Increasing base portions scales every ingredient and every nutrient linearly. Daily nutrition is the sum of that day's meals, per person. Household size multiplies shopping and batch quantities, not individual daily targets.

Recipe-dialog nutrition is the total for all the selected base portions, as the dialog label states. Selecting seven portions displays the nutrition for seven portions, not for one serving.

## Weights

Every food record has an explicit `basis` string.

- Oats, rice, quinoa, bulgur, pasta and dry lentils are weighed **dry**.
- Chicken, other meat and fresh fish are weighed **raw and boneless**.
- Canned beans, tuna and similar canned foods use the specified **drained edible weight**.
- Produce quantities exclude inedible peel, cores and trim where stated.
- Lemon and lime quantities are **juice weights**, not the weight of the whole fruit.
- The full listed quantity of oil is counted even when a cook might discard some.

The grocery list aggregates these same edible quantities. It does not invent package sizes, assume a universal drained-can yield, or silently convert cooked weight to raw weight. Buy extra for trim and discarded liquid, then follow the stated cooking weights.

Cooking changes water content and can remove fat or nutrients with discarded liquids. This version does not estimate nutrient-retention factors or final cooked-dish mass. Portion the complete cooked batch according to its intended number of base portions rather than treating a gram of raw ingredients as a gram of finished food.

## Improving an ingredient record

For a branded item, read the current package label and convert its nutrition to 100 grams before entering a custom food in the app. Record the relevant raw/dry/drained basis. Add all known allergens and possible traces. For a public-catalogue change, retain a stable source URL, source identifier, retrieval date, food description and preparation state in the record's `source` metadata. Review every field, including sodium units.

For a USDA-based revision, use FoodData Central's downloadable data and an explicit food-ID mapping. Verify that each record's preparation state matches the recipes. Never use an automated fuzzy-name match as if it were a reviewed match. A future importer must retain those IDs and checksums. **No USDA dataset is bundled in this version.**

Official data documentation: https://fdc.nal.usda.gov/data-documentation.html

## Recipe adaptations

`data/planning-recipes.js`, `data/spreadsheet-recipes.js` and `data/open-planning-recipes.js` contain explicit, human-readable ingredient mappings and gram amounts for one base portion. Community entries are adaptations, not a claim that the upstream recipe author supplied these nutritional portions. The descriptions document substitutions and added sides. Original photos can show the original dish rather than those adaptations. The open planning pack is original OliveWeek content released under the project's MIT license.

Source-only recipes in `data/community.json` preserve text ingredient quantities. They are available for browsing, but are not used by the automatic planner and have no invented nutrition totals. The recipe editor allows users to make a weighed copy after checking those quantities themselves.

## Allergens and dietary labels

Recipe allergen flags are the union of the ingredient flags. They do not account for every manufacturing variation or cross-contact exposure. Bread and pita are conservatively flagged for multiple common potential allergens, even when a particular brand might not contain them. Oats are conservatively flagged for gluten unless a user adds an appropriate verified product.

Dietary labels use ingredient categories and explicit recipe flags. Choose vegan bread for vegan plans and appropriate vegetarian-rennet cheese for vegetarian plans. An ingredient's plant category is not a certification of an arbitrary product sold under that name.

## Targets and solver behavior

The planner uses seeded multi-start search and coordinate adjustment of portions. Its targets are soft. Recipe filters are hard. A generated week can miss a target, especially with a small compatible recipe pool, high protein demand, locked meals, or incompatible macro targets. The plan view reports those misses.

The optional adult calorie calculator uses Mifflin–St Jeor resting-energy coefficients and rough activity multipliers. The app does not store the calculator's body measurements, and never applies its result automatically. The example starting target is not a recommendation for every adult male.

Formula reference: Mifflin MD et al., *A new predictive equation for resting energy expenditure in healthy individuals*, American Journal of Clinical Nutrition, 1990. DOI: 10.1093/ajcn/51.2.241.
