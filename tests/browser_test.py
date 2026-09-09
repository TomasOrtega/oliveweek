#!/usr/bin/env python3
"""Integration tests against the built site in real Chromium.
Install test-only dependencies with: uv sync --locked
Then: uv run playwright install chromium && npm run test:browser
"""

import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-results"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:4173/oliveweek/"
checks = []


def check(name, condition=True):
    if not condition:
        raise AssertionError(name)
    checks.append(name)
    print("PASS:", name, flush=True)


def state(page):
    return page.evaluate("JSON.parse(localStorage.getItem('oliveweek.v2'))")


def close_dialog(page):
    page.locator('#dialog [data-action="close"]').click()


def capture(page, name):
    """A completed network load is not the same as a decoded, painted image.

    Force below-fold lazy images to load for the full-page test photograph,
    await decode(), and let two rendering frames finish. This changes only
    the test browser, not application code or stored user preferences.
    """
    expect(page.locator("#toast")).not_to_be_visible(timeout=6000)
    count = page.evaluate("""async () => {
        window.scrollTo(0, 0);
        const images = [...document.querySelectorAll('#main img, #dialog[open] img')];
        if (!images.length) throw new Error('No recipe photographs in the view');
        for (const image of images) image.loading = 'eager';
        await Promise.all(images.map(image => image.decode()));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return images.filter(image => image.complete && image.naturalWidth > 0).length;
    }""")
    check("decoded photographs before " + name, count > 0)
    page.screenshot(path=str(OUT / name), full_page=True)


def run():
    env = dict(os.environ, PREFIX="/oliveweek", PORT="4173")
    server = subprocess.Popen(["node", "scripts/serve.mjs", "dist"], cwd=ROOT, env=env)
    try:
        for _ in range(100):
            try:
                urllib.request.urlopen(BASE, timeout=1).close()
                break
            except Exception:
                time.sleep(0.1)
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            context = browser.new_context(
                viewport={"width": 1440, "height": 1000}, device_scale_factor=1
            )
            page = context.new_page()
            page.set_default_timeout(20000)
            errors = []
            requests = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("request", lambda request: requests.append(request.url))
            page.on("dialog", lambda dialog: dialog.accept())
            try:
                page.goto(BASE, wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(4)
                check("initial plan renders under /oliveweek/")
                days = state(page)["plan"]["days"]
                check(
                    "two prep sessions offer different meals for every slot",
                    all(
                        first["recipeId"] != second["recipeId"]
                        for first, second in zip(days[0]["meals"], days[3]["meals"])
                    ),
                )
                capture(page, "oliveweek-desktop.png")
                check(
                    "all initial meals show a loaded photograph or fallback",
                    page.evaluate(
                        """[...document.querySelectorAll('.meal')].every(meal => {
                            const image = meal.querySelector('img');
                            return image
                                ? image.complete && image.naturalWidth > 0
                                : Boolean(meal.querySelector('.photo-empty'));
                        })"""
                    ),
                )

                first = state(page)["plan"]["days"][0]["meals"][0]
                page.locator(".meal").first.locator('[data-action="lock"]').click()
                page.get_by_role("button", name="Generate plan", exact=True).click()
                expect(
                    page.get_by_role("button", name="Generate plan", exact=True)
                ).to_be_enabled()
                locked = state(page)["plan"]["days"][0]["meals"][0]
                check(
                    "locked recipe and portion survive regeneration",
                    locked["recipeId"] == first["recipeId"]
                    and locked["servings"] == first["servings"]
                    and locked["locked"],
                )
                page.locator(".meal").first.locator('[data-action="lock"]').click()
                page.locator('input[data-change="portion"]').first.fill("1.25")
                page.locator('input[data-change="portion"]').first.press("Tab")
                check(
                    "portion changes update persisted state",
                    state(page)["plan"]["days"][0]["meals"][0]["servings"] == 1.25,
                )

                previous_lunches = [
                    next(m for m in day["meals"] if m["slot"] == "lunch")
                    for day in state(page)["plan"]["days"]
                ]
                page.locator(".meal").nth(1).locator('[data-action="swap"]').click()
                page.locator('[data-action="choose-swap"]').first.click()
                lunches = [
                    next(m for m in day["meals"] if m["slot"] == "lunch")
                    for day in state(page)["plan"]["days"]
                ]
                check(
                    "swap replaces repeated lunches together",
                    lunches[0]["recipeId"] != previous_lunches[0]["recipeId"]
                    and all(
                        after["recipeId"] == lunches[0]["recipeId"]
                        if before["recipeId"] == previous_lunches[0]["recipeId"]
                        else after == before
                        for before, after in zip(previous_lunches, lunches)
                    ),
                )
                old = state(page)
                page.reload(wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(4)
                check("actual reload restores the saved plan", state(page) == old)

                page.locator(".meal-picture").first.click()
                expect(page.locator("#dialog")).to_be_visible()
                dialog_image = page.locator("#dialog img")
                if dialog_image.count():
                    dialog_image.evaluate("image => image.decode()")
                    credited = (
                        page.get_by_role("link", name="Photo source").count() == 1
                    )
                else:
                    expect(page.locator("#dialog .photo-empty")).to_be_visible()
                    credited = (
                        page.get_by_role("link", name="Recipe source").count() == 1
                        and page.get_by_role("link", name="Content license").count()
                        == 1
                    )
                check(
                    "recipe dialog has media, weighed ingredients and source credit",
                    page.locator(".ingredients li").count() > 0 and credited,
                )
                page.locator("#recipe-servings").fill("5")
                page.locator("#recipe-servings").press("Tab")
                expect(page.locator("#recipe-servings")).to_have_value("5")
                check("batch ingredient scaling is available")
                capture(page, "oliveweek-recipe.png")
                close_dialog(page)

                page.locator('.header nav a[href="#shopping"]').click()
                expect(page.locator(".grocery-item")).not_to_have_count(0)
                page.locator(".grocery-item input").first.check()
                check(
                    "shopping checkboxes persist", any(state(page)["checked"].values())
                )
                with page.expect_download() as dl:
                    page.get_by_role("button", name="CSV", exact=True).click()
                dl.value.save_as(OUT / "shopping.csv")
                check(
                    "CSV export contains aggregated weights",
                    "Buy (g)" in (OUT / "shopping.csv").read_text(),
                )

                page.locator('.header nav a[href="#pantry"]').click()
                page.locator('select[name="foodId"]').select_option("oats")
                page.locator('input[name="grams"]').fill("350")
                page.get_by_role("button", name="Set amount").click()
                check("pantry quantities persist", state(page)["pantry"]["oats"] == 350)

                page.get_by_role("button", name="Add ingredient", exact=True).click()
                page.locator('#dialog input[name="name"]').fill(
                    "Test lentils from label"
                )
                page.locator('#dialog input[name="basis"]').fill("dry weight")
                for key, value in {
                    "kcal": "350",
                    "protein": "25",
                    "carbs": "60",
                    "fat": "1",
                    "fiber": "10",
                    "sodium": "5",
                    "saturatedFat": "0.1",
                }.items():
                    page.locator(f'#dialog input[name="{key}"]').fill(value)
                page.get_by_role("button", name="Save ingredient", exact=True).click()
                check(
                    "label-based custom ingredients are saved",
                    len(state(page)["customFoods"]) == 1,
                )

                page.locator('.header nav a[href="#recipes"]').click()
                expect(page.locator(".recipe-tile")).not_to_have_count(0)
                capture(page, "oliveweek-recipes.png")
                page.locator(".tile-open").first.click()
                page.get_by_role("button", name="Make a copy", exact=True).click()
                page.locator('#dialog input[name="name"]').fill(
                    "My photographed recipe"
                )
                page.get_by_role("button", name="Save recipe copy").click()
                check(
                    "custom recipe retains credited original photograph",
                    len(state(page)["customRecipes"]) == 1
                    and bool(state(page)["customRecipes"][0]["photo"]),
                )

                page.locator('select[data-change="scope"]').select_option("all")
                page.locator("#recipe-search").fill("shakshouka")
                expect(page.locator(".recipe-tile")).to_have_count(1)
                page.locator(".tile-open").click()
                expect(page.locator("#dialog")).to_contain_text(
                    "No calorie or macro values are inferred"
                )
                check(
                    "unmapped source recipes never invent nutritional totals",
                    page.locator("#dialog .inline-nutrients").count() == 0,
                )
                close_dialog(page)

                page.locator("#recipe-search").fill("Spaghetti aglio e olio")
                expect(page.locator(".recipe-tile")).to_have_count(1)
                expect(page.locator(".recipe-tile .photo-empty")).to_be_visible()
                page.locator(".tile-open").click()
                expect(page.locator("#dialog")).to_contain_text("Public Domain Recipes")
                expect(page.get_by_role("link", name="Content license")).to_be_visible()
                close_dialog(page)

                page.locator("#recipe-search").fill("Aadi Pilaw")
                expect(page.locator(".recipe-tile")).to_have_count(1)
                page.locator(".tile-open").click()
                expect(page.locator("#dialog")).to_contain_text("Historical recipe")
                expect(
                    page.get_by_role("link", name="Historical source")
                ).to_be_visible()
                close_dialog(page)

                page.locator('.header nav a[href="#plan"]').click()
                page.get_by_role("button", name="Save plan", exact=True).click()
                page.locator('#dialog input[name="name"]').fill("Integration test week")
                page.locator('#dialog button[type="submit"]').click()
                check("named plans are saved", len(state(page)["savedPlans"]) == 1)
                with page.expect_download() as dl:
                    page.locator('footer [data-action="backup"]').click()
                dl.value.save_as(OUT / "backup.json")
                exported = json.loads((OUT / "backup.json").read_text())
                check(
                    "backup export includes recipes, pantry and saved plans",
                    exported == state(page),
                )
                before = state(page)
                page.locator("#backup-file").set_input_files(
                    {
                        "name": "invalid.json",
                        "mimeType": "application/json",
                        "buffer": b"{invalid",
                    }
                )
                expect(page.locator("#toast")).to_contain_text("not valid JSON")
                check(
                    "invalid backup does not overwrite existing data",
                    state(page) == before,
                )
                page.locator("#backup-file").set_input_files(str(OUT / "backup.json"))
                expect(page.locator("#toast")).to_contain_text("Backup imported")
                check("valid backup imports and validates", state(page) == exported)

                page.locator('.header [data-action="settings"]').click()
                page.locator('#dialog select[name="diet"]').select_option("vegan")
                page.locator('#dialog select[name="meals"]').select_option(
                    label="Plus two snacks"
                )
                page.locator('#dialog input[name="protein"]').fill("80")
                page.get_by_role("button", name="Apply & generate").click()
                expect(page.locator("#dialog")).not_to_be_visible()
                check(
                    "preference changes generate a fresh plan",
                    state(page)["preferences"]["diet"] == "vegan",
                )
                expect(page.locator(".meal")).to_have_count(5)
                expect(
                    page.get_by_label("Snack 1 portions", exact=True)
                ).to_be_visible()
                expect(
                    page.get_by_label("Snack 2 portions", exact=True)
                ).to_be_visible()
                check("two snacks can be selected in preferences")

                first_snacks = [d["meals"][3] for d in state(page)["plan"]["days"]]
                second_before = state(page)["plan"]["days"][0]["meals"][4]
                page.locator('[data-action="swap"][data-slot="snack2"]').click()
                expect(page.locator("#dialog-title")).to_have_text("Replace Snack 2")
                page.locator('[data-action="choose-swap"]').first.click()
                check(
                    "swapping snack 2 leaves snack 1 unchanged",
                    [d["meals"][3] for d in state(page)["plan"]["days"]] == first_snacks
                    and state(page)["plan"]["days"][0]["meals"][4]["recipeId"]
                    != second_before["recipeId"],
                )
                page.locator(".meal").nth(3).locator(".meal-picture").click()
                page.get_by_role("button", name="Use in plan", exact=True).click()
                page.locator('#dialog select[name="slot"]').select_option(
                    label="Snack 2"
                )
                page.get_by_role("button", name="Replace meal", exact=True).click()
                check(
                    "a snack recipe can be placed in either snack slot",
                    state(page)["plan"]["days"][0]["meals"][4]["recipeId"]
                    == first_snacks[0]["recipeId"]
                    and [d["meals"][3] for d in state(page)["plan"]["days"]]
                    == first_snacks,
                )
                page.get_by_label("Snack 2 portions", exact=True).fill("1.35")
                page.get_by_label("Snack 2 portions", exact=True).press("Tab")
                page.get_by_role("button", name="Lock Snack 2", exact=True).click()
                locked_snack = state(page)["plan"]["days"][0]["meals"][4]
                page.get_by_role("button", name="Generate plan", exact=True).click()
                expect(
                    page.get_by_role("button", name="Generate plan", exact=True)
                ).to_be_enabled()
                check(
                    "snack 2 retains its lock and portion after regeneration",
                    locked_snack["servings"] == 1.35
                    and state(page)["plan"]["days"][0]["meals"][4] == locked_snack,
                )
                page.get_by_role("button", name="Week view", exact=True).click()
                expect(page.locator(".week-table tbody th")).to_have_text(
                    [
                        "Breakfast",
                        "Lunch",
                        "Dinner",
                        "Snack 1",
                        "Snack 2",
                        "Daily total",
                    ]
                )
                check("week view displays both snacks")
                page.get_by_role("button", name="Day view", exact=True).click()
                snack_state = state(page)
                page.reload(wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(5)
                check("reload preserves the two-snack plan", state(page) == snack_state)

                with page.expect_download() as dl:
                    page.locator('footer [data-action="backup"]').click()
                dl.value.save_as(OUT / "two-snacks.json")
                page.locator("#backup-file").set_input_files(
                    str(OUT / "two-snacks.json")
                )
                expect(page.locator("#toast")).to_contain_text("Backup imported")
                check("two-snack backup round-trips", state(page) == snack_state)

                page.locator('.header nav a[href="#prep"]').click()
                expect(page.locator(".prep-job")).not_to_have_count(0)
                check(
                    "prep view shows batch quantities and storage guidance",
                    "within 3 days" in page.locator("#main").inner_text(),
                )
                page.get_by_role("button", name="Batch quantities").first.click()
                check(
                    "prep job opens its scaled recipe",
                    float(page.locator("#recipe-servings").input_value()) > 0,
                )
                close_dialog(page)

                for width in (390, 320):
                    page.set_viewport_size({"width": width, "height": 844})
                    for route in (
                        "plan",
                        "recipes",
                        "shopping",
                        "prep",
                        "pantry",
                        "saved",
                    ):
                        page.goto(BASE + "#" + route, wait_until="networkidle")
                        page.wait_for_selector("#main h1")
                        check(
                            f"{route} has no page overflow at {width}px",
                            page.evaluate(
                                "document.documentElement.scrollWidth <= innerWidth+1"
                            ),
                        )
                    if width == 390:
                        page.goto(BASE + "#plan", wait_until="networkidle")
                        expect(page.locator(".meal")).to_have_count(5)
                        capture(page, "oliveweek-mobile.png")
                page.set_viewport_size({"width": 1440, "height": 1000})
                page.goto(BASE + "#plan", wait_until="networkidle")
                page.evaluate("""async () => {
                    await navigator.serviceWorker.ready;
                    if (!navigator.serviceWorker.controller) {
                        await new Promise(resolve => navigator.serviceWorker.addEventListener(
                            'controllerchange', resolve, {once: true}));
                    }
                }""")
                await_state = state(page)
                context.set_offline(True)
                page.reload(wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(5)
                check(
                    "offline reload loads the app and saved plan",
                    state(page) == await_state,
                )
                page.locator('.header nav a[href="#shopping"]').click()
                expect(page.locator(".grocery-item")).not_to_have_count(0)
                check("offline grocery list works")
                context.set_offline(False)
                check(
                    "no third-party runtime requests",
                    all(u.startswith("http://127.0.0.1:4173/") for u in requests),
                )
                check("no uncaught JavaScript errors", not errors)
            except Exception:
                page.screenshot(path=str(OUT / "failure.png"), full_page=True)
                (OUT / "failure.html").write_text(page.content())
                raise
            finally:
                (OUT / "browser-report.json").write_text(
                    json.dumps(
                        {
                            "passed": len(checks),
                            "checks": checks,
                            "javascriptErrors": errors,
                        },
                        indent=2,
                    )
                )
                browser.close()
    finally:
        server.terminate()
        server.wait(timeout=10)


if __name__ == "__main__":
    run()
    print(f"{len(checks)} browser checks passed.")
