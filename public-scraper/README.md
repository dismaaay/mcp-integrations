# public-scraper

A polite, production-style **web scraper for public data**, demonstrated against
[`books.toscrape.com`](https://books.toscrape.com) — a sandbox site published specifically for
scraping practice (no login, no anti-bot, no personal data).

This is a reference implementation showing the *discipline* a paying client is actually buying:
not "a script that downloads a page," but a scraper that is **polite, resilient, and legally careful**.

## What it demonstrates

| Concern | How it's handled |
| --- | --- |
| **Legality** | Checks `robots.txt` and aborts if disallowed. Targets only public, non-personal data. |
| **Politeness** | Rate-limited with random jitter between requests — never hammers the server. |
| **Resilience** | Exponential-backoff retries on transient HTTP/network errors. |
| **Honesty** | Identifiable `User-Agent` with contact info (no spoofing). |
| **Usable output** | Streams to both `.csv` and `.json`. |
| **Operability** | Structured logging, pagination, `--max-pages` cap, non-zero exit on failure. |

## Run it

No manual install needed — [`uv`](https://docs.astral.sh/uv/) reads the inline dependencies:

```bash
uv run scraper.py                       # scrape all 50 pages (1000 books)
uv run scraper.py --max-pages 3 --out books   # quick demo
```

Output: `books.csv` + `books.json` with `title, price_gbp, availability, rating, detail_url`.

## Scope & ethics (read this)

This scraper is intentionally pointed at a **sandbox built for scraping**. The same skeleton adapts
to any **public, non-authenticated, non-personal** source. It deliberately does **not** include — and
I do **not** take work that requires — bypassing logins, defeating anti-bot/CAPTCHA, ignoring an
explicit opt-out, or collecting personal data. That keeps every engagement on the right side of CFAA,
the EU DSM Directive (2019/790), the GDPR, and Polish law.

## License

MIT.
