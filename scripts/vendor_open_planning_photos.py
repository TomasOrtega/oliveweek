#!/usr/bin/env python3
"""Vendor attributed Wikimedia Commons photos for the open planning pack."""

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
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "OliveWeek photo vendor/2.1 (github.com/TomasOrtega/oliveweek)"
FILES = {
    "overnight-oats": "File:Protein overnight oats.jpg",
    "yogurt-bowl": "File:Yogurt fruit bowl.jpg",
    "breakfast-smoothie": "File:Blueberry Smoothie.jpg",
    "egg-scramble": "File:Scrambled eggs on toast - Floral Cafe 2026-02-25.jpg",
    "tofu-scramble": "File:Tofu Scramble in New Orleans.jpg",
    "quinoa-bowl": "File:Vegan Quinoa Bowl (44040185371).jpg",
    "breakfast-tacos": "File:Breakfast tacos.jpg",
    "savory-oats": "File:Oatmeal (1).jpg",
    "energy-bites": "File:Raw-energy-balls (49658797242).jpg",
    "hummus": "File:Hummus with Olive Oil.jpg",
    "roasted-snack": "File:Roasted Veggies for Vegetable Stock (12912477183).jpg",
    "bean-spread": "File:Dip It Bean Dip - 50595012822.jpg",
}


def clean(value):
    value = re.sub(r"<[^>]+>", "", value or "")
    return html.unescape(value).strip()


def request_json(params):
    url = API + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(10 * (attempt + 1))


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=90) as response:
        content_type = response.headers.get_content_type()
        data = response.read(5_000_001)
    if len(data) > 5_000_000:
        raise ValueError("Commons thumbnail exceeds 5 MB")
    extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }.get(content_type)
    if not extension:
        raise ValueError(f"Unsupported Commons image type: {content_type}")
    return data, extension


def main():
    assets = ROOT / "assets" / "recipes"
    assets.mkdir(parents=True, exist_ok=True)
    records = []
    for photo_id, title in FILES.items():
        data = request_json(
            {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url|mime|sha1|extmetadata",
                "iiurlwidth": 960,
                "format": "json",
                "formatversion": 2,
            }
        )
        page = data["query"]["pages"][0]
        if page.get("missing"):
            raise ValueError(f"Commons file not found: {title}")
        info = page["imageinfo"][0]
        metadata = info.get("extmetadata", {})

        def get_metadata(key):
            return clean(metadata.get(key, {}).get("value", ""))

        image, extension = download(info.get("thumburl") or info["url"])
        path = assets / f"open-{photo_id}{extension}"
        path.write_bytes(image)
        records.append(
            {
                "id": photo_id,
                "file": page["title"],
                "photo": f"assets/recipes/{path.name}",
                "photoSource": info["descriptionurl"],
                "photoAuthor": get_metadata("Artist")
                or "Wikimedia Commons contributor",
                "photoLicense": get_metadata("LicenseShortName") or "See source page",
                "photoLicenseUrl": get_metadata("LicenseUrl").replace(
                    "http://", "https://"
                ),
                "commonsSha1": info.get("sha1", ""),
                "imageSha256": hashlib.sha256(image).hexdigest(),
                "retrieved": "2026-09-09",
            }
        )
        time.sleep(1.2)
    (ROOT / "data" / "open-planning-photo-sources.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Vendored {len(records)} Wikimedia Commons photographs")


if __name__ == "__main__":
    main()
