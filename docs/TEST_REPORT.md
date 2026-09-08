# OliveWeek v2 verification report

Verified on 2026-09-08. The redesigned application, source recipes, original photographs, tests and publishing workflow are committed to the public `TomasOrtega/oliveweek` repository on `main`.

## Tested revision and result

Tested commit: `3a43fb4cb621d5a29162c40cabea2a13044c2db4`.

GitHub Actions run: https://github.com/TomasOrtega/oliveweek/actions/runs/34272269015

- **33 calculation, data and validation tests passed.**
- **41 real Chromium browser checks passed.**
- **No uncaught JavaScript errors** were recorded.
- **No third-party runtime requests** were recorded during the tested flows.
- The `Build and browser tests` job succeeded and uploaded the source snapshot, browser results and complete static website.

The later `Publish to GitHub Pages` job did not succeed. Its configuration step could not find an enabled Pages site. This is separate from the successful application tests. No live deployment is claimed.

## What is bundled

The verified static build contains **142 source recipes and 142 original photographs**, **26 weighed planning adaptations**, and **76 ingredient records**. Every built-in planning recipe has a photograph and source attribution. The build checks every photo against its recorded SHA-256 checksum.

Source recipes come from `LukeSmithxyz/based.cooking` at revision `e34b4123fe82d5e5e026d1cdcffa7097113b1956`. The source repository explicitly places its content, including contributed images, in the public domain. Three entries explicitly attributed to third-party publications were excluded pending separate permission review. See `NOTICE.md` and `vendor/based-cooking/PROVENANCE.json`.

The 26 weighed adaptations can be used by automatic planning, portion scaling, grocery aggregation and batch-prep calculations. The larger source-only collection is available for browsing and manual adaptation. It is **not** assigned invented nutrition totals or used by automatic planning before mapping. Source photographs may show the original version rather than changed ingredients or added sides, as the recipe notes explain.

The interface uses a white background, ordinary typography, compact top navigation, day tabs and actual food photographs. Shopping and prep are separate views. There is no application backend, subscription, runtime API key or account. Personal plans and pantry data remain in browser storage, with explicit backup import/export.

## Browser coverage

Tests ran on a GitHub-hosted Ubuntu runner with Node.js 22, Python 3.12, Playwright 1.55.0 and Chromium. The local HTTP server used the project path `/oliveweek/`, matching the structure of a GitHub Pages project site.

The browser checks covered initial generation and image loading, recipe locks, portion edits, replacing repeated lunches, actual reload persistence, credited recipe dialogs, batch scaling, shopping checkmarks and CSV downloads, pantry amounts, custom label-based ingredients, copied recipes with photographs, source-only nutrition handling, named plans, backup exports, invalid and valid imports, dietary changes, prep schedules and offline reloads.

All six main views were checked for horizontal page overflow at **390 px and 320 px** widths. Desktop, recipe-browser, recipe-dialog and mobile screenshots were captured. Screenshot capture explicitly waits for lazy photographs to decode and paint, rather than mistaking downloaded image headers for finished images.

Offline testing waited for the service worker to control the page, disabled network access, reloaded the app and used its shopping view. This does not mean every unviewed photograph is pre-cached. The app caches photographs as they are used.

## Issues found and fixed during verification

An export-helper typo initially prevented CSV and backup downloads. It was corrected and downloads passed in the subsequent real-browser runs. A test navigation selector matched both the wordmark and the Plan navigation link. It was narrowed to the navigation element. Custom-record saves were made transactional, so the new context is validated before changing saved state.

## Pages publication: one owner setting remains

In the repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. Then choose **Actions → Test and deploy OliveWeek → Run workflow** or rerun the failed publishing job while its Pages artifact is still available.

The publishing workflow is already committed. It does not provision a paid backend. GitHub's normal workflow token does not itself enable Pages for a new repository. The current connector has no Pages-administration action, so that owner setting was not changed.

Expected URL after a successful deployment: https://tomasortega.github.io/oliveweek/

## Limits of this report

Passing tests verify the tested software behavior, not the nutritional accuracy of the recipe catalogue. Ingredient values remain **generic starter estimates, not verified USDA records or brand-specific labels**. Recipes have not been kitchen-tested or reviewed by a dietitian. The planner uses a heuristic with soft nutrition targets and hard recipe restrictions, not a proof of dietary completeness or global optimality.

The browser suite uses Chromium. Safari and Firefox were not separately tested. GitHub Pages publication and the live HTTPS site remain unverified until the owner enables Pages and a deployment succeeds.
