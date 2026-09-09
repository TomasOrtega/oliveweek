#!/usr/bin/env python3
"""Vendor a reproducible, diverse sample of historical public-domain recipes."""

import hashlib
import io
import json
import pathlib
import re
import urllib.request
import zipfile

from vendor_recipes import items, section

REVISION = "ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8"
REPOSITORY = "AdamBouhmad/open-recipe-archive"
ROOT = pathlib.Path(__file__).resolve().parents[1]
COLLECTION_TARGETS = {
    "cozinha-brasileira": 62,
    "cocina-mexicana": 62,
    "chinese-kitchen": 62,
    "filipino-kitchen": 62,
    "indian-kitchen": 62,
    "japanese-kitchen": 62,
    "jewish-kitchen": 61,
    "louisiana-creole": 61,
    "ottoman-turkish": 61,
    "west-indies": 45,
}


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
    archive_bytes = download(
        f"https://codeload.github.com/{REPOSITORY}/zip/{REVISION}", 250_000_000
    )
    archive = zipfile.ZipFile(io.BytesIO(archive_bytes))
    prefix = archive.namelist()[0].split("/")[0] + "/"
    readme = archive.read(prefix + "README.md").decode()
    statement = "All recipes are sourced from public-domain materials"
    if statement not in readme:
        raise ValueError(
            "The pinned source no longer has the expected provenance statement"
        )
    license_bytes = archive.read(prefix + "LICENSE.md")

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

    for collection, target in COLLECTION_TARGETS.items():
        source_bytes = archive.read(f"{prefix}collections/{collection}/recipes.jsonl")
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
            if count == target:
                break
        if count != target:
            raise ValueError(f"Only {count} eligible recipes in {collection}")
        collection_counts[collection] = count

    downloaded = []
    for selection in selected:
        source, ingredients, steps = selection
        collection = source["collection"]
        slug = source["slug"]
        markdown = archive.read(f"{prefix}collections/{collection}/recipes/{slug}.md")
        if len(markdown) > 500_000:
            raise ValueError(f"Markdown exceeds import limit: {collection}/{slug}")
        if source["body"].encode() not in markdown:
            raise ValueError(f"JSONL body does not match Markdown: {collection}/{slug}")
        downloaded.append((selection, markdown))

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
    expected = sum(COLLECTION_TARGETS.values())
    if len(records) != expected:
        raise ValueError(f"Expected {expected} recipes, found {len(records)}")

    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (vendor / "LICENSE.txt").write_bytes(license_bytes)
    (vendor / "PROVENANCE.json").write_text(
        json.dumps(
            {
                "repository": REPOSITORY,
                "revision": REVISION,
                "archiveSha256": hashlib.sha256(archive_bytes).hexdigest(),
                "licenseStatement": statement,
                "licenseStatementSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#provenance-and-licensing",
                "selectionStrategy": "Six hundred deterministic SHA-256-ranked, non-duplicate, pre-1931 public-domain recipes across ten selected regional collections.",
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
