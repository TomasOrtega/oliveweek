#!/usr/bin/env python3
"""Vendor new recipes from the pinned Public Domain Recipes continuation."""

import hashlib
import io
import json
import pathlib
import re
import urllib.request
import zipfile

from vendor_recipes import field, items, plain, section

REVISION = "da84378b36bd5b2e3cb35f610d64630bf1bd899d"
REPOSITORY = "ronaldl29/public-domain-recipes"
ROOT = pathlib.Path(__file__).resolve().parents[1]
EXCLUDED = {
    "beef-tips": "Modification of a recipe credited to Texas Cafe Classics.",
    "couscous": "Explicitly copied from 196flavors. Separate permission not verified.",
    "gumbo-shrimp-and-sausage": "Simplified from a recipe credited to AB's Seafood Gumbo.",
    "shrimp-and-grits": "Derived from a recipe credited to Smokin' & Grillin' wit AB.",
    "tuscan-style-pork-roast": "Adaptation attributed to Binging With Babish.",
    "yorkshire-puddings": "Originally published on BBC Good Food.",
}


def remove_previous(records):
    for record in records:
        for key in ("photo", "originalMarkdown"):
            relative = record.get(key)
            if relative and relative.startswith(
                ("assets/recipes/pdr-", "vendor/public-domain-recipes/")
            ):
                (ROOT / relative).unlink(missing_ok=True)


def main():
    output_path = ROOT / "data/public-domain-recipes.json"
    previous = json.loads(output_path.read_text()) if output_path.exists() else []
    url = f"https://codeload.github.com/{REPOSITORY}/zip/{REVISION}"
    request = urllib.request.Request(
        url, headers={"User-Agent": "OliveWeek-recipe-vendor/2.0"}
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read(120_000_001)
    if len(data) > 120_000_000:
        raise ValueError("Source archive exceeds the import limit")
    archive = zipfile.ZipFile(io.BytesIO(data))
    names = set(archive.namelist())
    prefix = archive.namelist()[0].split("/")[0] + "/"
    readme = archive.read(prefix + "README.md").decode()
    license_statement = "This website and all its content is in the public domain."
    if license_statement not in readme:
        raise ValueError("The pinned source no longer has the expected content license")

    base = json.loads((ROOT / "data/community.json").read_text())
    existing_slugs = {record["slug"] for record in base}
    photos = ROOT / "assets/recipes"
    upstream = ROOT / "vendor/public-domain-recipes"
    photos.mkdir(parents=True, exist_ok=True)
    upstream.mkdir(parents=True, exist_ok=True)
    remove_previous(previous)

    records = []
    format_skipped = {}
    duplicates_skipped = 0
    for name in sorted(names):
        if not name.startswith(prefix + "content/") or not name.endswith(".md"):
            continue
        slug = pathlib.PurePosixPath(name).stem
        if slug in existing_slugs:
            duplicates_skipped += 1
            continue
        if slug.startswith("_") or slug in EXCLUDED:
            continue
        text = archive.read(name).decode("utf-8")
        chunks = text.split("---", 2)
        if len(chunks) != 3:
            format_skipped[slug] = "Missing expected front matter."
            continue
        front, body = chunks[1:]
        title = field(front, "title")
        ingredients = items(section(body, ["Ingredients"]))
        steps = items(
            section(body, ["Directions", "Instructions", "Preparation", "Method"]),
            True,
        )
        if not title or not ingredients or not steps:
            missing = [
                label
                for label, value in (
                    ("title", title),
                    ("ingredients", ingredients),
                    ("numbered directions", steps),
                )
                if not value
            ]
            format_skipped[slug] = "Missing " + ", ".join(missing) + "."
            continue

        tags = []
        raw_tags = re.search(r"^tags:\s*\[(.*?)\]", front, re.MULTILINE)
        if raw_tags:
            tags = [tag.strip().strip("\"'") for tag in raw_tags.group(1).split(",")]
        author = field(front, "author", "Public Domain Recipes contributors")
        author_path = prefix + "data/authors/" + author + ".json"
        if author_path in names:
            try:
                author = json.loads(archive.read(author_path)).get("name", author)
            except (ValueError, TypeError):
                pass

        record = {
            "id": "pdr-" + slug,
            "slug": slug,
            "name": title,
            "collection": "Public Domain Recipes",
            "author": author,
            "tags": tags,
            "ingredientsText": ingredients,
            "steps": steps,
            "notes": plain(section(body, ["Notes"])),
            "source": f"https://github.com/{REPOSITORY}/blob/{REVISION}/content/{slug}.md",
            "sourcePage": f"https://publicdomainrecipes.com/{slug}/",
            "license": "Public domain (Unlicense)",
            "licenseSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#license",
            "revision": REVISION,
            "originalMarkdown": f"vendor/public-domain-recipes/{slug}.md",
        }
        image = re.search(r"!\[[^\]]*\]\(/pix/([a-zA-Z0-9_.-]+)\)", body)
        if image:
            source_image = prefix + "static/pix/" + image.group(1)
            if source_image in names:
                image_bytes = archive.read(source_image)
                suffix = pathlib.PurePosixPath(source_image).suffix.lower()
                if len(image_bytes) <= 3_000_000 and suffix in {
                    ".webp",
                    ".jpg",
                    ".jpeg",
                    ".png",
                }:
                    photo = f"assets/recipes/pdr-{slug}{suffix}"
                    (ROOT / photo).write_bytes(image_bytes)
                    record.update(
                        {
                            "photo": photo,
                            "photoSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/static/pix/{image.group(1)}",
                            "imageSha256": hashlib.sha256(image_bytes).hexdigest(),
                        }
                    )
        (upstream / f"{slug}.md").write_text(text)
        records.append(record)

    if len(base) + len(records) < 300:
        raise ValueError(
            f"Combined collection is too small: {len(base) + len(records)}"
        )
    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (upstream / "LICENSE.txt").write_bytes(archive.read(prefix + "LICENSE.md"))
    (upstream / "PROVENANCE.json").write_text(
        json.dumps(
            {
                "repository": REPOSITORY,
                "revision": REVISION,
                "archiveSha256": hashlib.sha256(data).hexdigest(),
                "licenseStatement": license_statement,
                "licenseStatementSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#license",
                "excluded": EXCLUDED,
                "duplicatesSkipped": duplicates_skipped,
                "formatSkipped": format_skipped,
                "count": len(records),
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Vendored {len(records)} new recipes at {REVISION}")


if __name__ == "__main__":
    main()
