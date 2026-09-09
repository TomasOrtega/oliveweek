#!/usr/bin/env python3
"""Vendor pinned public-domain recipes and original photos, never at runtime."""

import hashlib
import io
import json
import pathlib
import re
import urllib.request
import zipfile

REVISION = "e34b4123fe82d5e5e026d1cdcffa7097113b1956"
REPOSITORY = "LukeSmithxyz/based.cooking"
ROOT = pathlib.Path(__file__).resolve().parents[1]
EXCLUDED = {
    "couscous": "Explicitly copied from 196flavors. Separate permission not verified.",
    "yorkshire-puddings": "Originally published on BBC Good Food. Separate permission not verified.",
    "tuscan-style-pork-roast": "Adaptation attributed to Binging With Babish. Omitted pending separate review.",
}


def plain(s):
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    return s.replace("**", "").replace("__", "").replace("`", "").strip()


def field(front, key, default=""):
    m = re.search(r"^" + key + r":\s*(.*?)\s*$", front, re.MULTILINE)
    return m.group(1).strip().strip("\"'") if m else default


def section(body, names):
    for name in names:
        m = re.search(
            r"^##\s+" + name + r"[^\n]*\n(.*?)(?=^##\s|\Z)",
            body,
            re.MULTILINE | re.DOTALL | re.IGNORECASE,
        )
        if m:
            return m.group(1).strip()
    return ""


def items(text, ordered=False):
    pattern = r"^\s*\d+[.)]\s+" if ordered else r"^\s*[-*]\s+"
    out = []
    for line in text.splitlines():
        if re.match(pattern, line):
            out.append(plain(re.sub(pattern, "", line)))
        elif line.strip() and out and not line.strip().startswith("!["):
            out[-1] += " " + plain(line)
    return [x for x in out if x]


def main():
    url = f"https://codeload.github.com/{REPOSITORY}/zip/{REVISION}"
    request = urllib.request.Request(
        url, headers={"User-Agent": "OliveWeek-recipe-vendor/2.0"}
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read(120_000_001)
    if len(data) > 120_000_000:
        raise ValueError("Source archive exceeds the import limit")
    z = zipfile.ZipFile(io.BytesIO(data))
    names = set(z.namelist())
    prefix = z.namelist()[0].split("/")[0] + "/"
    readme = z.read(prefix + "README.md").decode()
    if "This website and all its content is in the public domain." not in readme:
        raise ValueError("The pinned source no longer has the expected content license")
    out, photos, upstream = (
        ROOT / "data",
        ROOT / "assets/recipes",
        ROOT / "vendor/based-cooking",
    )
    for path in (out, photos, upstream):
        path.mkdir(parents=True, exist_ok=True)
    # Only prune explicitly named imported files, never arbitrary user assets.
    for slug in EXCLUDED:
        for suffix in (".webp", ".jpg", ".jpeg", ".png"):
            (photos / (slug + suffix)).unlink(missing_ok=True)
        (upstream / (slug + ".md")).unlink(missing_ok=True)
    records = []
    for name in sorted(names):
        if not name.startswith(prefix + "content/") or not name.endswith(".md"):
            continue
        slug = pathlib.PurePosixPath(name).stem
        if slug in EXCLUDED:
            continue
        text = z.read(name).decode("utf-8")
        chunks = text.split("---", 2)
        if len(chunks) != 3:
            continue
        front, body = chunks[1:]
        title = field(front, "title")
        image = re.search(r"!\[[^\]]*\]\(/pix/([a-zA-Z0-9_.-]+)\)", body)
        if not title or not image:
            continue
        source_image = prefix + "static/pix/" + image.group(1)
        if source_image not in names:
            continue
        image_bytes = z.read(source_image)
        if len(image_bytes) > 3_000_000:
            continue
        ingredients = items(section(body, ["Ingredients"]))
        steps = items(
            section(body, ["Directions", "Instructions", "Preparation", "Method"]), True
        )
        if not ingredients or not steps:
            continue
        suffix = pathlib.PurePosixPath(source_image).suffix.lower()
        if suffix not in {".webp", ".jpg", ".jpeg", ".png"}:
            continue
        photo = f"assets/recipes/{slug}{suffix}"
        (ROOT / photo).write_bytes(image_bytes)
        (upstream / (slug + ".md")).write_text(text)
        tags = []
        raw_tags = re.search(r"^tags:\s*\[(.*?)\]", front, re.MULTILINE)
        if raw_tags:
            tags = [t.strip().strip("\"'") for t in raw_tags.group(1).split(",")]
        author = field(front, "author", "Based Cooking contributors")
        author_path = prefix + "data/authors/" + author + ".json"
        if author_path in names:
            try:
                author = json.loads(z.read(author_path)).get("name", author)
            except (ValueError, TypeError):
                pass
        records.append(
            {
                "id": "bc-" + slug,
                "slug": slug,
                "name": title,
                "collection": "Based Cooking",
                "author": author,
                "tags": tags,
                "ingredientsText": ingredients,
                "steps": steps,
                "notes": plain(section(body, ["Notes"])),
                "photo": photo,
                "source": f"https://github.com/{REPOSITORY}/blob/{REVISION}/content/{slug}.md",
                "sourcePage": f"https://based.cooking/{slug}/",
                "photoSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/static/pix/{image.group(1)}",
                "license": "Public domain (Unlicense)",
                "licenseSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#license",
                "revision": REVISION,
                "imageSha256": hashlib.sha256(image_bytes).hexdigest(),
                "originalMarkdown": f"vendor/based-cooking/{slug}.md",
            }
        )
    if len(records) < 50:
        raise ValueError(f"Unexpectedly small collection: {len(records)} recipes")
    (out / "community.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    )
    (upstream / "LICENSE.txt").write_bytes(z.read(prefix + "LICENSE.md"))
    (upstream / "PROVENANCE.json").write_text(
        json.dumps(
            {
                "repository": REPOSITORY,
                "revision": REVISION,
                "archiveSha256": hashlib.sha256(data).hexdigest(),
                "licenseStatement": "This website and all its content is in the public domain.",
                "licenseStatementSource": f"https://github.com/{REPOSITORY}/blob/{REVISION}/README.md#license",
                "excluded": EXCLUDED,
                "count": len(records),
            },
            indent=2,
        )
        + "\n"
    )
    print(
        f"Vendored {len(records)} recipes and their original photographs at {REVISION}"
    )


if __name__ == "__main__":
    main()
