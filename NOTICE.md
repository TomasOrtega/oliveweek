# Third-party content notice

OliveWeek is independently developed.

## Based Cooking recipe collection

Source repository: https://github.com/LukeSmithxyz/based.cooking

Pinned revision: `e34b4123fe82d5e5e026d1cdcffa7097113b1956`.

Content license statement: https://github.com/LukeSmithxyz/based.cooking/blob/e34b4123fe82d5e5e026d1cdcffa7097113b1956/README.md#license

The upstream README states that the website and all of its content are in the public domain and that contributors submit their text and images under that dedication. Its software license is the Unlicense. A copy is retained in `vendor/based-cooking/LICENSE.txt`.

OliveWeek preserves the original submitted Markdown and the source photograph for each included entry. `data/community.json` retains the recipe author, pinned source URL, original photo URL, image SHA-256 checksum and original Markdown path. The importer records the source archive hash and exclusions in `vendor/based-cooking/PROVENANCE.json`.

Photographs are copied without visual alteration. The UI crops them with CSS for thumbnails. Each photo's full content remains in its original locally served image file. Recipe adaptations can differ from the pictured source version, especially added side dishes or changed ingredients. The application describes this explicitly.

## Public Domain Recipes collection

Source repository: https://github.com/ronaldl29/public-domain-recipes

Pinned revision: `da84378b36bd5b2e3cb35f610d64630bf1bd899d`.

Content license statement: https://github.com/ronaldl29/public-domain-recipes/blob/da84378b36bd5b2e3cb35f610d64630bf1bd899d/README.md#license

Public Domain Recipes is a continuation of Based Cooking. Its README dedicates submitted text and images to the public domain, and its software license is the Unlicense. A copy is retained in `vendor/public-domain-recipes/LICENSE.txt`.

OliveWeek imports only recipes not already present in the pinned Based Cooking collection. Original Markdown is stored in `vendor/public-domain-recipes`; `data/public-domain-recipes.json` retains collection, author, source, license and revision metadata. The one new contributor photograph is stored locally with its source URL and SHA-256 checksum. The pinned archive hash, duplicate count, format skips and exclusions are recorded in `vendor/public-domain-recipes/PROVENANCE.json`.

## Open Recipe Archive historical collection

Source repository: https://github.com/AdamBouhmad/open-recipe-archive

Pinned revision: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

Provenance and licensing statement: https://github.com/AdamBouhmad/open-recipe-archive/blob/ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8/README.md#provenance-and-licensing

Open Recipe Archive identifies its historical corpus records as public domain and records the original book title, year and source URL for each recipe. OliveWeek includes only records explicitly marked `public-domain` with source years no later than 1930. Its repository uses the Unlicense; a copy is retained in `vendor/open-recipe-archive/LICENSE.txt`.

OliveWeek selects ten non-duplicate recipes from each of ten regional collections using a deterministic SHA-256 ordering. The 100 original Markdown files are retained in `vendor/open-recipe-archive`; their parsed records are in `data/open-recipe-archive.json`. The source JSONL checksums, selection method, collection counts and pinned revision are recorded in `vendor/open-recipe-archive/PROVENANCE.json`. These recipes are labeled as historical because their language, measurements, ingredients and food-safety assumptions may be outdated.

## Excluded entries

The following entries explicitly credit third-party publications, channels or adaptations and were removed from the active source collection and published website pending separate permission review:

- `beef-tips`: modification of a Texas Cafe Classics recipe.
- `couscous`: text credited to 196flavors.
- `gumbo-shrimp-and-sausage`: simplified from AB's Seafood Gumbo.
- `shrimp-and-grits`: derived from Smokin' & Grillin' wit AB.
- `yorkshire-puddings`: originally published by BBC Good Food.
- `tuscan-style-pork-roast`: adaptation attributed to Binging With Babish.

The blanket upstream licenses were not treated as independent permission to republish obviously attributed third-party content. Other contributor ownership has not been independently verified. Rights concerns should be reported with the affected file and supporting details. Maintainers should remove affected content while reviewing the concern.

## OliveWeek-authored adaptations and code

The UI, planner, storage layer, tests, build scripts, original mark and explicit weighed recipe adaptations are distributed under the MIT license in `LICENSE`. The upstream public-domain content is not made proprietary by that license.

No remote image service, stock-photo subscription or API credential is used. Generic ingredient nutrition estimates are separately described in `docs/NUTRITION.md` and are not attributed to a verified USDA import.
