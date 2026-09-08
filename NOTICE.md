# Third-party content notice

OliveWeek is independently developed.

## Based Cooking recipe collection

Source repository: https://github.com/LukeSmithxyz/based.cooking

Pinned revision: `e34b4123fe82d5e5e026d1cdcffa7097113b1956`.

Content license statement: https://github.com/LukeSmithxyz/based.cooking/blob/e34b4123fe82d5e5e026d1cdcffa7097113b1956/README.md#license

The upstream README states that the website and all of its content are in the public domain and that contributors submit their text and images under that dedication. Its software license is the Unlicense. A copy is retained in `vendor/based-cooking/LICENSE.txt`.

OliveWeek preserves the original submitted Markdown and the source photograph for each included entry. `data/community.json` retains the recipe author, pinned source URL, original photo URL, image SHA-256 checksum and original Markdown path. The importer records the source archive hash and exclusions in `vendor/based-cooking/PROVENANCE.json`.

Photographs are copied without visual alteration. The UI crops them with CSS for thumbnails. Each photo's full content remains in its original locally served image file. Recipe adaptations can differ from the pictured source version, especially added side dishes or changed ingredients. The application describes this explicitly.

## Excluded entries

The following entries explicitly credit third-party publications or an adaptation and were removed from the active source collection and published website pending separate permission review:

- `couscous`: text credited to 196flavors.
- `yorkshire-puddings`: originally published by BBC Good Food.
- `tuscan-style-pork-roast`: adaptation attributed to Binging With Babish.

The blanket upstream license was not treated as independent permission to republish obviously attributed third-party content. Other contributor ownership has not been independently verified. Rights concerns should be reported with the affected file and supporting details. Maintainers should remove affected content while reviewing the concern.

## OliveWeek-authored adaptations and code

The UI, planner, storage layer, tests, build scripts, original mark and explicit weighed recipe adaptations are distributed under the MIT license in `LICENSE`. The upstream public-domain content is not made proprietary by that license.

No remote image service, stock-photo subscription or API credential is used. Generic ingredient nutrition estimates are separately described in `docs/NUTRITION.md` and are not attributed to a verified USDA import.
