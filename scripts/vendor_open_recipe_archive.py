#!/usr/bin/env python3
"""Vendor a reproducible, diverse sample of historical public-domain recipes."""

import concurrent.futures
import hashlib
import json
import pathlib
import re
import urllib.request

from vendor_recipes import items, section

REVISION = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8"
REPOSITORY = "AdamBouhmad/open-recipe-archive"
ROOT = pathlib.Path(__file__).resolve().parents[1]
COLLECTIONS = (
    "cozinha-brasileira",
    "cocina-mexicana",
    "chinese-kitchen",
    "filipino-kitchen",
    "indian-kitchen",
    "japanese-kitchen",
    "jewish-kitchen",
    "louisiana-creole",
    "ottoman-turkish",
    "west-indies",
)
PER_COLLECTION = 10


def download(url, limit):
    request = urllib.request.Request(
        url, headers={"User-Agent": "OliveWeek-recipe-vendor/2.0"}
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError(f"Source exceeds import limit: {url}")
    return data


def normalized_title(value):
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def remove_previous(records):
    for record in records:
        relative = record.get("originalMarkdown")
        if relative and relative.startswith("vendor/open-recipe-archive/"):
            (ROOT / relative).unlink(missing_ok=True)


def main():
    raw_root = f"https://raw.githubusercontent.com/{REPOSITORY}/{REVISION}"
    readme = download(f"{raw_root}/README.md", 100_000).decode()
    statement = "All recipes are sourced from public-domain materials"
    if statement not in readme:
        raise ValueError(
            "The pinned source no longer has the expected provenance statement"
        )
    license_bytes = download(f"{raw_root}/LICENSE.md", 100_000)

    output_path = ROOT / "data/open-recipe-archive.json"
    previous = json.loads(output_path.read_text()) if output_path.exists() else []
    remove_previous(previous)
    vendor = ROOT / "vendor/open-recipe-archive"
    vendor.mkdir(parents=True, exist_ok=True)

    existing = []
    for name in ("community.json", "public-domain-recipes.json"):
        existing.extend(json.loads((ROOT / f"data/{name}").read_text()))
    used_titles = {normalized_title(record["name"]) for record in existing}
    used_slugs = {record["slug"] for record in existing}
    selected = []
    data_files = {}
    collection_counts = {}

    for collection in COLLECTIONS:
        url = f"{raw_root}/collections/{collection}/recipes.jsonl"
        source_bytes = download(url, 30_000_000)
        data_files[collection] = hashlib.sha256(source_bytes).hexdigest()
        candidates = []
        for line in source_bytes.decode().splitlines():
            source = json.loads(line)
            title = str(source.get("title", "")).strip()
            slug = str(source.get("slug", "")).strip()
            body = str(source.get("body", ""))
            ingredients = items(section(body, ["Ingredients"]))
            steps = items(section(body, ["Directions"]), True)
            year = str(source.get("source_year", ""))
            source_url = str(source.get("source_url", ""))
            if (
                source.get("license") != "public-domain"
                or not title
                or len(title) > 160
                or not re.fullmatch(r"[a-z0-9-]+", slug)
                or slug in used_slugs
                or not ingredients
                or not steps
                or not re.fullmatch(r"\d{4}", year)
                or int(year) > 1930
                or not source_url.startswith("https://")
            ):
                continue
            candidates.append((source, ingredients, steps))
        candidates.sort(
            key=lambda candidate: hashlib.sha256(
                f"{collection}:{candidate[0]['slug']}".encode()
            ).hexdigest()
        )
        count = 0
        for source, ingredients, steps in candidates:
            title_key = normalized_title(source["title"])
            if title_key in used_titles:
                continue
            used_titles.add(title_key)
            used_slugs.add(source["slug"])
            selected.append((source, ingredients, steps))
            count += 1
            if count == PER_COLLECTION:
                break
        if count != PER_COLLECTION:
            raise ValueError(f"Only {count} eligible recipes in {collection}")
        collection_counts[collection] = count

    def fetch_markdown(selection):
        source, ingredients, steps = selection
        collection = source["collection"]
        slug = source["slug"]
        url = f"{raw_root}/collections/{collection}/recipes/{slug}.md"
        markdown = download(url, 500_000)
        if source["body"].encode() not in markdown:
            raise ValueError(f"JSONL body does not match Markdown: {collection}/{slug}")
        return selection, markdown

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        downloaded = list(executor.map(fetch_markdown, selected))

    records = []
    for (source, ingredients, steps), markdown in downloaded:
        collection = source["collection"]
        slug = source["slug"]
        markdown_path = f"vendor/open-recipe-archive/{collection}-{slug}.md"
        (ROOT / markdown_path).write_bytes(markdown)
        records.append(
            {
                "id": f"ora-{collection}-{slug}",
                "slug": f"{collection}-{slug}",
                "name": source["title"],
                "collection": "Open Recipe Archive",
                "sourceCollectionName": source["collection_name"],
                "culture": source["culture"],
                "author": source.get("author") or "Source author unknown",
                "tags": source.get("tags", []),
                "ingredientsText": ingredients,
                "steps": steps,
                "notes": "",
                "historical": True,
                "sourceTitle": source["source_title"],
                "sourceYear": source["source_year"],
                "source": f"https://github.com/{REPOSITORY}/blob/{REVISION}/collections/{collection}/recipes/{slug}.md",
                "sourcePage": source["source_url"],
                "license": "Public domain (historical source)",
                "licenseSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#provenance-and-licensing",
                "revision": REVISION,
                "markdownSha256": hashlib.sha256(markdown).hexdigest(),
                "originalMarkdown": markdown_path,
            }
        )
    records.sort(key=lambda record: record["name"].casefold())
    if len(records) != len(COLLECTIONS) * PER_COLLECTION:
        raise ValueError(f"Expected 100 recipes, found {len(records)}")

    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (vendor / "LICENSE.txt").write_bytes(license_bytes)
    (vendor / "PROVENANCE.json").write_text(
        json.dumps(
            {
                "repository": REPOSITORY,
                "revision": REVISION,
                "licenseStatement": statement,
                "licenseStatementSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#provenance-and-licensing",
                "selectionStrategy": "Ten deterministic SHA-256-ranked, non-duplicate, pre-1931 public-domain recipes from each selected collection.",
                "selectedCollections": collection_counts,
                "jsonlSha256": data_files,
                "count": len(records),
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Vendored {len(records)} historical recipes at {REVISION}")


if __name__ == "__main__":
    main()
