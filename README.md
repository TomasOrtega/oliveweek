# OliveWeek

OliveWeek is a free, local-first meal planner with photographed recipes, nutrition estimates, grocery lists and batch-prep guidance. It uses plain HTML, CSS and JavaScript, with no account, subscription, database or runtime API key.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```bash
git clone https://github.com/TomasOrtega/oliveweek.git
cd oliveweek
npm start
```

Open <http://localhost:4173>. `npm start` builds the static site into `dist/` before serving it.

## Features

- Generates 1–7 day meal plans around calorie, protein, diet and ingredient preferences.
- Choose zero, one or two daily snacks in Preferences → Meals each day.
- Supports meal locking, swapping, household scaling and batch cooking.
- Two prep sessions use different meals for days 1–3 and 4–7 when dietary filters allow, with consistent portions within each batch.
- Combines ingredients into a pantry-aware grocery list with CSV and print exports.
- Saves plans and custom recipes locally and supports JSON backup and restore.
- Includes a source recipe browser alongside the nutrition-mapped planning collection.
- Works offline after the first successful load.

All data stays in the browser. There is no cloud synchronization.

## Recipes and nutrition

The source recipe collection and photographs come from [LukeSmithxyz/based.cooking](https://github.com/LukeSmithxyz/based.cooking) at revision `e34b4123fe82d5e5e026d1cdcffa7097113b1956`. Provenance, exclusions and checksums are recorded in [`vendor/based-cooking/PROVENANCE.json`](vendor/based-cooking/PROVENANCE.json) and [`NOTICE.md`](NOTICE.md).

Planning recipes are weighed adaptations, so a photograph may show the source version rather than the exact adapted serving. Source-only recipes without mapped quantities are excluded from automatic planning and do not receive estimated macros.

Bundled nutrition values are generic estimates, not verified clinical data. Recipes have not been kitchen-tested or dietitian-reviewed. See [`docs/NUTRITION.md`](docs/NUTRITION.md) before relying on the planner for dietary decisions.

## Test and build

```bash
npm test
```

This builds the production site and runs the calculation, storage and data-integrity tests. With [uv](https://docs.astral.sh/uv/), run Python checks and the Chromium integration suite:

```bash
uv sync --locked
uv run ruff check .
uv run ruff format --check .
uv run playwright install chromium
npm run build
npm run test:browser
```

CI runs these checks using `uv.lock`. Dependabot checks Python packages and GitHub Actions for updates weekly.

## License

OliveWeek code is MIT licensed. Vendored recipes and photographs retain their upstream public-domain dedication and provenance. See [`LICENSE`](LICENSE), [`NOTICE.md`](NOTICE.md) and [`vendor/based-cooking/LICENSE.txt`](vendor/based-cooking/LICENSE.txt).
