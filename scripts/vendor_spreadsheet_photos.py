#!/usr/bin/env python3
"""Vendor attributed Wikimedia Commons photos for spreadsheet recipes."""

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
    "pineapple-tofu": "File:JerkTofu.jpg",
    "gorditas": "File:Gorditas de setas.jpg",
    "mung-bean-pancake": "File:Korean mung bean pancake and rice wine-Bindaetteok and makgeolli.jpg",
    "vegetable-fajitas": "File:Vegetable Fajitas (4188499456).jpg",
    "vegetable-couscous": "File:Moroccan cuisine-Couscous with vegetables.jpg",
    "samosa-masoor-dal": "File:Dal Samosa.jpg",
    "beet-hummus": "File:Homemade Beetroot Hummus.jpg",
    "gazpacho": "File:Gazpacho in a white bowl.jpg",
    "zucchini-soup": "File:Crema de zanahoria, patata y calabacín - Carrot, potato and zucchini soup (5137418042).jpg",
    "vegetable-pizza": "File:Vegetarian Pizza.jpg",
    "vegan-carbonara": "File:Vegan carbonara - Carbonara vegana (6216924823).jpg",
    "tabbouleh": "File:Flickr - cyclonebill - Tabbouleh.jpg",
    "vegetarian-ramen": "File:Vegetable Miso Ramen - Shogun Ramen 2023-10-11.jpg",
    "vegan-enchiladas": "File:Vegetarian Mexican enchiladas with green salsa cheese sour cream and avocado 20260823 162514 (1).jpg",
    "vegetable-paella": "File:Vegan paella (7478857308).jpg",
    "falafel": "File:Vegan Falafel Plate at Nuba in Vancouver (3817524657).jpg",
    "baba-ganoush": "File:BABA GANOUSH - Efes Town Turkish Cuisine 2026-01-27.jpg",
    "japanese-curry": "File:Deep-fried Tofu Japanese Curry Rice - MOGUMOGU 2024-07-26.jpg",
    "spinach-pesto": "File:Spinach linguine with pesto and artichokes (43178770351).jpg",
    "vegan-bolognese": "File:Vegan bolognese (3084641957).jpg",
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
    extension = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(
        content_type
    )
    if not extension:
        raise ValueError(f"Unsupported Commons image type: {content_type}")
    return data, extension


def main():
    assets = ROOT / "assets" / "recipes"
    assets.mkdir(parents=True, exist_ok=True)
    records = []
    for slug, title in FILES.items():
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
        info = page["imageinfo"][0]
        metadata = info.get("extmetadata", {})

        def get_metadata(key):
            return clean(metadata.get(key, {}).get("value", ""))

        image, extension = download(info.get("thumburl") or info["url"])
        path = assets / f"excel-{slug}{extension}"
        path.write_bytes(image)
        records.append(
            {
                "id": slug,
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
                "retrieved": "2026-09-08",
            }
        )
        time.sleep(1.2)
    (ROOT / "data" / "spreadsheet-photo-sources.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Vendored {len(records)} Wikimedia Commons photographs")


if __name__ == "__main__":
    main()
