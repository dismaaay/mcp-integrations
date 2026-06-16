# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "httpx>=0.27",
#   "selectolax>=0.3.21",
# ]
# ///
"""
A polite, production-style web scraper for PUBLIC data.

Target: https://books.toscrape.com — a sandbox site published explicitly for
scraping practice (no login, no anti-bot, no personal data, intended for this).
Swap the parsing logic and this same skeleton scrapes any public catalog.

What makes it "professional" (and what a client pays for):
  • Respects robots.txt before fetching anything.
  • Rate-limited with jitter — never hammers the server.
  • Retries transient failures with exponential backoff.
  • Sets an honest, identifiable User-Agent.
  • Streams to CSV and JSON, resumable page-by-page.
  • Clear logging and a non-zero exit on failure.

Run:  uv run scraper.py            (scrapes everything)
      uv run scraper.py --max-pages 3 --out books
"""
from __future__ import annotations

import argparse
import csv
import json
import logging
import random
import sys
import time
import urllib.robotparser
from dataclasses import dataclass, asdict
from urllib.parse import urljoin

import httpx
from selectolax.parser import HTMLParser

BASE = "https://books.toscrape.com/"
CATALOGUE = urljoin(BASE, "catalogue/")
USER_AGENT = "portfolio-scraper/1.0 (+contact: your-email@example.com)"

RATING_WORDS = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s  %(levelname)-7s %(message)s"
)
log = logging.getLogger("scraper")


@dataclass
class Book:
    title: str
    price_gbp: float
    availability: str
    rating: int
    detail_url: str


def check_robots(client: httpx.Client) -> None:
    """Refuse to run if robots.txt disallows our path. Non-negotiable."""
    rp = urllib.robotparser.RobotFileParser()
    robots_url = urljoin(BASE, "robots.txt")
    try:
        resp = client.get(robots_url, timeout=10)
        rp.parse(resp.text.splitlines())
    except httpx.HTTPError:
        log.warning("Could not fetch robots.txt; proceeding conservatively.")
        return
    if not rp.can_fetch(USER_AGENT, CATALOGUE):
        log.error("robots.txt disallows scraping %s — aborting.", CATALOGUE)
        sys.exit(2)
    log.info("robots.txt allows scraping. Good to go.")


def get(client: httpx.Client, url: str, *, retries: int = 3) -> httpx.Response:
    """GET with exponential backoff on transient errors."""
    for attempt in range(1, retries + 1):
        try:
            resp = client.get(url, timeout=20)
            resp.raise_for_status()
            return resp
        except (httpx.HTTPStatusError, httpx.TransportError) as e:
            if attempt == retries:
                raise
            wait = 2 ** attempt + random.random()
            log.warning("  %s (attempt %d/%d) — retrying in %.1fs", e, attempt, retries, wait)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def parse_page(html: str) -> list[Book]:
    tree = HTMLParser(html)
    books: list[Book] = []
    for pod in tree.css("article.product_pod"):
        a = pod.css_first("h3 a")
        title = a.attributes.get("title", "").strip()
        href = a.attributes.get("href", "")
        detail_url = urljoin(CATALOGUE, href)

        price_text = pod.css_first("p.price_color").text().strip()
        price = float(price_text.replace("£", "").replace("Â", ""))

        avail = pod.css_first("p.instock.availability").text().strip()

        rating_el = pod.css_first("p.star-rating")
        rating_class = [c for c in rating_el.attributes.get("class", "").split() if c != "star-rating"]
        rating = RATING_WORDS.get(rating_class[0] if rating_class else "", 0)

        books.append(Book(title, price, avail, rating, detail_url))
    return books


def next_page_url(html: str, current_url: str) -> str | None:
    tree = HTMLParser(html)
    nxt = tree.css_first("li.next a")
    if not nxt:
        return None
    return urljoin(current_url, nxt.attributes.get("href", ""))


def scrape(max_pages: int | None, delay: float) -> list[Book]:
    all_books: list[Book] = []
    with httpx.Client(headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
        check_robots(client)
        url = urljoin(CATALOGUE, "page-1.html")
        page = 0
        while url:
            page += 1
            if max_pages and page > max_pages:
                break
            log.info("Fetching page %d: %s", page, url)
            resp = get(client, url)
            books = parse_page(resp.text)
            all_books.extend(books)
            log.info("  +%d books (total %d)", len(books), len(all_books))
            url = next_page_url(resp.text, url)
            if url:
                time.sleep(delay + random.random() * 0.4)  # polite jitter
    return all_books


def write_outputs(books: list[Book], out_stem: str) -> None:
    rows = [asdict(b) for b in books]
    with open(f"{out_stem}.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    with open(f"{out_stem}.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    log.info("Wrote %s.json and %s.csv (%d rows)", out_stem, out_stem, len(rows))


def main() -> int:
    ap = argparse.ArgumentParser(description="Polite public-data scraper (books.toscrape.com).")
    ap.add_argument("--max-pages", type=int, default=None, help="Limit pages (default: all 50).")
    ap.add_argument("--delay", type=float, default=0.5, help="Base delay between requests (s).")
    ap.add_argument("--out", default="books", help="Output file stem.")
    args = ap.parse_args()

    start = time.time()
    books = scrape(args.max_pages, args.delay)
    if not books:
        log.error("No books scraped — site layout may have changed.")
        return 1
    write_outputs(books, args.out)
    avg = sum(b.price_gbp for b in books) / len(books)
    log.info("Done in %.1fs — %d books, avg price £%.2f", time.time() - start, len(books), avg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
