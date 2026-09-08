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
                page.wait_for_function(
                    "[...document.querySelectorAll('.meal img')].every(i=>i.complete&&i.naturalWidth>0)"
                )
                check("all initial meal photographs load")
                capture(page, "oliveweek-desktop.png")

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

                page.locator(".meal").nth(1).locator('[data-action="swap"]').click()
                page.locator('[data-action="choose-swap"]').first.click()
                lunches = [
                    next(m for m in day["meals"] if m["slot"] == "lunch")
                    for day in state(page)["plan"]["days"]
                ]
                check(
                    "swap replaces repeated lunches together",
                    len({m["recipeId"] for m in lunches}) == 1,
                )
                old = state(page)
                page.reload(wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(4)
                check("actual reload restores the saved plan", state(page) == old)

                page.locator(".meal-picture").first.click()
                expect(page.locator("#dialog")).to_be_visible()
                page.wait_for_function(
                    "document.querySelector('#dialog img').naturalWidth>0"
                )
                check(
                    "recipe dialog has a photograph, weighed ingredients and source credit",
                    page.locator(".ingredients li").count() > 0
                    and page.get_by_role("link", name="Photo source").count() == 1,
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
                page.locator('#dialog input[name="protein"]').fill("80")
                page.get_by_role("button", name="Apply & generate").click()
                expect(page.locator("#dialog")).not_to_be_visible()
                check(
                    "preference changes generate a fresh plan",
                    state(page)["preferences"]["diet"] == "vegan",
                )

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
                        expect(page.locator(".meal")).to_have_count(4)
                        capture(page, "oliveweek-mobile.png")
                page.set_viewport_size({"width": 1440, "height": 1000})
                page.goto(BASE + "#plan", wait_until="networkidle")
                page.evaluate("navigator.serviceWorker.ready")
                page.wait_for_function("!!navigator.serviceWorker.controller")
                await_state = state(page)
                context.set_offline(True)
                page.reload(wait_until="networkidle")
                expect(page.locator(".meal")).to_have_count(4)
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
