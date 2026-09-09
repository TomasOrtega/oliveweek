#!/usr/bin/env python3
"""Vendor one pinned open-license photograph for each open planning recipe."""

import argparse
import hashlib
import html
import json
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
API = "https://api.openverse.org/v1/images/"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "OliveWeek photo vendor/3.0 (github.com/TomasOrtega/oliveweek)"
LICENSES = "cc0,pdm,by,by-sa"
LICENSE_NAMES = {
    "cc0": "CC0",
    "pdm": "Public Domain Mark",
    "by": "CC BY",
    "by-sa": "CC BY-SA",
}
COMMONS_OVERRIDES = {
    "snack-spread-edamame-ginger-cucumber": (
        "File:Cucumber Slices (Alabama Extension).jpg"
    ),
    "snack-spread-edamame-ginger-pepper": "File:Sliced Bell pepper.jpg",
}


def clean(value):
    return html.unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


def request_json(url, params=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == 5:
                raise
            time.sleep(5 * (attempt + 1))


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                content_type = response.headers.get_content_type()
                data = response.read(5_000_001)
            break
        except (urllib.error.HTTPError, urllib.error.URLError):
            if attempt == 5:
                raise
            time.sleep(5 * (attempt + 1))
    if len(data) > 5_000_000:
        raise ValueError("Openverse thumbnail exceeds 5 MB")
    extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type)
    if not extension:
        raise ValueError(f"Unsupported Openverse image type: {content_type}")
    return data, extension


def commons_candidate(title):
    data = request_json(
        COMMONS_API,
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|sha1|extmetadata",
            "iiurlwidth": 960,
            "format": "json",
            "formatversion": 2,
        },
    )
    page = data["query"]["pages"][0]
    if page.get("missing"):
        raise ValueError(f"Commons file not found: {title}")
    info = page["imageinfo"][0]
    metadata = info.get("extmetadata", {})

    def metadata_value(key):
        return clean(metadata.get(key, {}).get("value", ""))

    return {
        "id": f"commons:{info['sha1']}",
        "title": page["title"],
        "thumbnail": info.get("thumburl") or info["url"],
        "foreign_landing_url": info["descriptionurl"],
        "creator": metadata_value("Artist") or "Wikimedia Commons contributor",
        "license_label": metadata_value("LicenseShortName") or "See source page",
        "license_url": metadata_value("LicenseUrl").replace("http://", "https://"),
        "provider": "Wikimedia Commons",
        "source": "wikimedia",
    }


def recipe_queries(recipe_id):
    slug = recipe_id.removeprefix("open-")
    parts = slug.split("-")
    if slug == "ow-plant-overnight-oats":
        return ["plant based overnight oats", "overnight oats", "oatmeal breakfast"]
    if slug == "ow-plant-blueberry-smoothie":
        return [
            "plant based blueberry smoothie",
            "blueberry smoothie",
            "fruit smoothie",
        ]
    if slug.startswith("breakfast-overnight-"):
        return [
            f"{parts[2]} overnight oats",
            "overnight oats",
            "oatmeal bowl",
            "oatmeal breakfast",
            "fruit porridge",
            "porridge breakfast",
            "muesli bowl",
            "granola breakfast",
            "breakfast cereal bowl",
        ]
    if slug.startswith("breakfast-yogurt-"):
        return [
            f"{parts[2]} yogurt bowl",
            "fruit yogurt bowl",
            "yogurt granola",
            "yoghurt breakfast",
            "yogurt breakfast",
            "yogurt bowl",
        ]
    if slug.startswith("breakfast-smoothie-"):
        return [
            f"{parts[2]} smoothie",
            "fruit smoothie",
            "breakfast smoothie",
            "smoothie glass",
        ]
    if slug.startswith("breakfast-egg-scramble-"):
        return [
            "scrambled eggs toast",
            "scrambled egg breakfast",
            "scrambled eggs",
            "egg scramble",
        ]
    if slug.startswith("breakfast-tofu-scramble-"):
        return [
            "tofu scramble",
            "scrambled tofu",
            "tofu breakfast",
            "vegan scrambled eggs",
            "tofu brunch",
            "tofu breakfast plate",
            "tofu",
        ]
    if slug.startswith("breakfast-quinoa-bowl-"):
        return [
            "quinoa breakfast bowl",
            "quinoa vegetable bowl",
            "quinoa bowl",
            "quinoa salad",
            "cooked quinoa",
        ]
    if slug.startswith("breakfast-breakfast-tacos-"):
        return ["breakfast tacos", "vegetable tacos"]
    if slug.startswith("breakfast-savory-oats-"):
        return [
            "savory oatmeal",
            "vegetable oatmeal",
            "porridge bowl",
            "oatmeal dish",
            "breakfast grain bowl",
            "vegetable breakfast bowl",
            "grain bowl",
            "vegetable bowl",
        ]
    if slug.startswith("snack-bites-"):
        return [
            f"{parts[2]} energy balls",
            "energy balls",
            "oat snack balls",
            "protein balls",
            "date balls",
            "healthy snack",
            "granola bars",
            "oat cookies",
            "date snack",
            "fruit snack",
            "nut snack",
            "dried fruit snack",
            "trail mix",
            "nuts snack",
        ]
    if slug.startswith("snack-hummus-"):
        flavor = " ".join(parts[2:-1])
        return [
            f"{flavor} hummus",
            "hummus dip",
            "hummus plate",
            "hummus bowl",
            "hummus platter",
            "hummus",
            "chickpea dip",
        ]
    if slug.startswith("snack-roasted-"):
        base_end = 4 if parts[2:4] == ["sweet", "potato"] else 3
        base = " ".join(parts[2:base_end])
        return [
            f"roasted {base}",
            f"crispy {base}",
            f"{base} food",
            f"{base} beans",
            f"{base} appetizer",
            f"{base} snack",
            f"{base} dish",
            f"{base} bowl",
            base,
            "roasted vegetable snack",
        ]
    if slug.startswith("snack-spread-"):
        spread_parts = parts[2:-1]
        if spread_parts[-1] in {"carrot", "cucumber", "pepper", "pita", "tortilla"}:
            spread_parts = spread_parts[:-1]
        spread = " ".join(spread_parts)
        base = f"{parts[2]} bean" if parts[2] in {"white", "black"} else parts[2]
        if parts[2] == "edamame":
            if parts[-1] == "carrot":
                return ["carrots food", "carrot snack", "carrots"]
            dipper = {
                "cucumber": "cucumber slices",
                "pepper": "pepper strips",
                "pita": "pita wedges",
                "tortilla": "corn tortilla chips",
            }[parts[-1]]
            return [dipper, f"{dipper} snack", parts[-1]]
        queries = [
            f"{spread} dip",
            f"{spread} spread",
            f"{base} dip",
            f"{base} spread",
        ]
        queries.extend([base, "bean dip"])
        return queries
    raise ValueError(f"No Openverse search rule for {recipe_id}")


def anchor_terms(recipe_id):
    slug = recipe_id.removeprefix("open-")
    if slug == "ow-plant-overnight-oats":
        return {"oats", "oatmeal", "porridge", "muesli", "granola"}
    if slug == "ow-plant-blueberry-smoothie":
        return {"smoothie", "shake"}
    if slug.startswith("breakfast-overnight-"):
        return {"oats", "oatmeal", "porridge", "muesli", "granola"}
    if slug.startswith("breakfast-yogurt-"):
        return {"yogurt", "yoghurt", "parfait"}
    if slug.startswith("breakfast-smoothie-"):
        return {"smoothie", "shake"}
    if slug.startswith("breakfast-egg-scramble-"):
        return {"scrambled egg", "scramble"}
    if slug.startswith("breakfast-tofu-scramble-"):
        return {"tofu", "scramble"}
    if slug.startswith("breakfast-quinoa-bowl-"):
        return {"quinoa"}
    if slug.startswith("breakfast-breakfast-tacos-"):
        return {"taco", "tacos"}
    if slug.startswith("breakfast-savory-oats-"):
        return {
            "oats",
            "oatmeal",
            "porridge",
            "grain bowl",
            "vegetable bowl",
            "breakfast bowl",
        }
    if slug.startswith("snack-bites-"):
        return {
            "energy ball",
            "protein ball",
            "date ball",
            "bliss ball",
            "snack ball",
            "energy bite",
            "granola bar",
            "oat cookie",
            "healthy snack",
            "fruit snack",
            "nut snack",
            "dried fruit",
            "trail mix",
            "nuts",
        }
    if slug.startswith("snack-hummus-"):
        return {"hummus", "humus", "hommos", "chickpea dip"}
    if slug.startswith("snack-roasted-"):
        parts = slug.split("-")
        return {"sweet potato" if parts[2:4] == ["sweet", "potato"] else parts[2]}
    if slug.startswith("snack-spread-"):
        if slug.startswith(("snack-spread-white-", "snack-spread-black-")):
            return {"bean"}
        if slug.startswith("snack-spread-edamame-"):
            dipper = slug.rsplit("-", 1)[-1]
            return {
                "corn tortilla" if dipper == "tortilla" else dipper,
                "pita" if dipper == "pita" else dipper,
            }
        if slug.startswith("snack-spread-lentil-"):
            return {"lentil"}
        return {"avocado", "guacamole"}
    raise ValueError(f"No relevance rule for {recipe_id}")


def searchable_recipes():
    path = ROOT / "dist" / "data" / "catalogue.json"
    if not path.exists():
        raise ValueError("Run npm run build once before discovering photographs")
    catalogue = json.loads(path.read_text())
    recipes = [
        recipe
        for recipe in catalogue["recipes"]
        if recipe.get("collection") == "OliveWeek Recipe Pack"
    ]
    legacy_ids = {
        "ow-plant-overnight-oats",
        "ow-plant-blueberry-smoothie",
    }
    legacy = [recipe for recipe in catalogue["recipes"] if recipe["id"] in legacy_ids]
    if len(recipes) != 200 or len(legacy) != 2:
        raise ValueError(
            f"Expected 200 open recipes and 2 legacy overrides, "
            f"found {len(recipes)} and {len(legacy)}"
        )
    return [*recipes, *legacy]


def search(query, cache):
    if query not in cache:
        results = []
        response = None
        for page in range(1, 4):
            response = request_json(
                API,
                {
                    "q": query,
                    "page": page,
                    "page_size": 20,
                    "license": LICENSES,
                    "category": "photograph",
                },
            )
            results.extend(response["results"])
            if page >= response["page_count"]:
                break
            time.sleep(0.35)
        cache[query] = results
        print(f"{query}: {response['result_count']} results")
        time.sleep(0.35)
    return cache[query]


def acceptable(candidate, recipe_id, used_ids, used_sources):
    title = (candidate.get("title") or "").lower()
    denied = {
        "church",
        "movie",
        "tennis",
        "track and field",
        "football",
        "nebula",
        "honour board",
        "woman holding",
        "hosta",
        "nuts on clark",
        "plot ",
        "disected",
        "eggplant ginger",
        "active late",
        "porridge radio",
    }
    return (
        f"openverse:{candidate['id']}" not in used_ids
        and candidate.get("foreign_landing_url") not in used_sources
        and candidate.get("thumbnail")
        and candidate.get("foreign_landing_url")
        and candidate.get("license") in LICENSE_NAMES
        and candidate.get("mature") is False
        and (candidate.get("width") or 0) >= 480
        and (candidate.get("height") or 0) >= 360
        and (candidate.get("license") in {"cc0", "pdm"} or candidate.get("creator"))
        and any(term in title for term in anchor_terms(recipe_id))
        and not any(term in title for term in denied)
    )


def license_name(candidate):
    name = LICENSE_NAMES[candidate["license"]]
    version = candidate.get("license_version")
    return f"{name} {version}" if version else name


def discover():
    recipes = searchable_recipes()
    assets = ROOT / "assets" / "recipes"
    assets.mkdir(parents=True, exist_ok=True)
    checkpoint = ROOT / "data" / ".open-planning-photo-discovery.json"
    cache = {}
    records = json.loads(checkpoint.read_text()) if checkpoint.exists() else []
    used_ids = {record["mediaId"] for record in records}
    used_sources = {record["photoSource"] for record in records}
    used_hashes = {record["imageSha256"] for record in records}
    completed = {record["id"] for record in records}

    for index, recipe in enumerate(recipes, 1):
        photo_id = recipe["id"].removeprefix("open-")
        if photo_id in completed:
            continue
        selected = None
        if photo_id in COMMONS_OVERRIDES:
            candidate = commons_candidate(COMMONS_OVERRIDES[photo_id])
            image, extension = download(candidate["thumbnail"])
            image_hash = hashlib.sha256(image).hexdigest()
            selected = (
                "Wikimedia Commons override",
                candidate,
                image,
                extension,
                image_hash,
            )
        else:
            for query in recipe_queries(recipe["id"]):
                for candidate in search(query, cache):
                    if not acceptable(candidate, recipe["id"], used_ids, used_sources):
                        continue
                    try:
                        image, extension = download(candidate["thumbnail"])
                    except (ValueError, urllib.error.HTTPError, urllib.error.URLError):
                        continue
                    image_hash = hashlib.sha256(image).hexdigest()
                    if image_hash in used_hashes:
                        continue
                    candidate["id"] = f"openverse:{candidate['id']}"
                    selected = (query, candidate, image, extension, image_hash)
                    break
                if selected:
                    break
        if not selected:
            raise ValueError(f"No unique photograph found for {recipe['name']}")

        query, candidate, image, extension, image_hash = selected
        path = assets / f"open-{photo_id}{extension}"
        path.write_bytes(image)
        used_ids.add(candidate["id"])
        used_sources.add(candidate["foreign_landing_url"])
        used_hashes.add(image_hash)
        records.append(
            {
                "id": photo_id,
                "recipe": recipe["name"],
                "searchQuery": query,
                "mediaId": candidate["id"],
                "file": candidate.get("title") or "Untitled photograph",
                "photo": f"assets/recipes/{path.name}",
                "photoSource": candidate["foreign_landing_url"],
                "photoAuthor": candidate.get("creator") or "Unknown creator",
                "photoLicense": candidate.get("license_label")
                or license_name(candidate),
                "photoLicenseUrl": candidate.get("license_url") or "",
                "provider": candidate.get("provider") or "",
                "mediaSource": candidate.get("source") or "",
                "imageSha256": image_hash,
                "retrieved": "2026-09-09",
            }
        )
        checkpoint.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
        print(
            f"[{index:03}/{len(recipes)}] {recipe['name']} <- {candidate.get('title')}"
        )

    records_by_id = {record["id"]: record for record in records}
    records = [records_by_id[recipe["id"].removeprefix("open-")] for recipe in recipes]
    manifest = ROOT / "data" / "open-planning-photo-sources.json"
    manifest.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    checkpoint.unlink()
    print(f"Vendored {len(records)} unique open-license photographs")


def verify():
    manifest = ROOT / "data" / "open-planning-photo-sources.json"
    records = json.loads(manifest.read_text())
    if len(records) != 202:
        raise ValueError("Use --discover to create the 202-photo manifest")
    for record in records:
        path = ROOT / record["photo"]
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != record["imageSha256"]:
            raise ValueError(f"Checksum mismatch: {record['id']}")
    for key in ("id", "photo", "photoSource", "mediaId", "imageSha256"):
        if len({record[key] for record in records}) != len(records):
            raise ValueError(f"Duplicate {key} in photo manifest")
    print("Verified 202 pinned, distinct open-license photographs")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--discover",
        action="store_true",
        help="replace the manifest by searching Openverse and downloading results",
    )
    args = parser.parse_args()
    discover() if args.discover else verify()


if __name__ == "__main__":
    main()
