# Sales playbook — first 1000 zł

This is the copy-paste operational layer for the three working assets in this repo
(`mcp-weather`, `mcp-sqlite`, `public-scraper`) plus the portfolio site in `site/`.
Strategy is grounded in the Fusion panel analysis: **one paid integration/scraping gig = the whole
1000 zł**, and the asset you point at it is *proof that already runs*, not a promise.

Pricing assumes ~3.80 PLN/USD (conservative). Adjust to the live rate.

---

## 0. Positioning (the one-line wedge)

> **"I wire Claude/Cursor into the systems you already run — APIs, databases, public data —
> typed, tested, and shipped."**

Don't compete as "a developer." Compete as the **MCP + hard-target integration** person. That niche
is hot, under-served, and exactly your stack (protobuf/API RE → wrapping any API as an MCP server).

---

## 1. Upwork profile

**Title:** `MCP server & AI integration engineer — connect Claude/Cursor to your API & database`

**Overview (paste, edit the first line to your voice):**

```
I connect AI assistants (Claude, Cursor) to the systems you already run — your REST/GraphQL API,
your database, or public data sources — by building Model Context Protocol (MCP) servers and
disciplined automation.

What you get is not a fragile demo. It's typed, tested, and verified with a real protocol handshake
before I hand it over. I come from a request-level/reverse-engineering background, so messy APIs,
binary protocols, and JS-heavy targets are the work I'm best at — not the work I avoid.

Recent reference builds (public, runnable):
• mcp-weather — wraps a REST API as a 3-tool MCP server (typed, tested, smoke-tested end to end)
• mcp-sqlite-safe — read-only database access for AI, with a SELECT-only guard and row caps
• public-scraper — polite, resilient public-data scraping (robots-aware, rate-limited)

If you can describe the system you want Claude to reach, I can wire it. Fixed scope, fixed price,
a date you can hold me to.
```

**Skills tags:** `MCP`, `Model Context Protocol`, `API Integration`, `Claude`, `Web Scraping`,
`Python`, `TypeScript`, `Automation`, `REST API`, `Data Extraction`.

**Rate:** start **$35–40/h** to win the first 1–2 reviews, then raise to $55–70.

---

## 2. Fiverr gigs (publish all three)

### Gig A — MCP server
- **Title:** `I will build a custom MCP server to connect Claude or Cursor to your API`
- **Packages:**
  - Basic **$60 / ~230 zł** — 1 API, up to 2 read tools, README + config. 3 days.
  - Standard **$150 / ~570 zł** — multi-endpoint, auth, error handling, tests. 5 days.
  - Premium **$280 / ~1070 zł** — multi-tool + access control + docs + 2 revisions. 7 days.
- **Tags:** mcp server, claude, model context protocol, api integration, ai agent.

### Gig B — Database access for AI
- **Title:** `I will connect Claude to your database with safe, read-only MCP access`
- **Packages:** Basic **$70** (1 DB, read-only query tool) / Standard **$160** (schema introspection +
  access control) / Premium **$300** (multi-DB + audit logging + docs).

### Gig C — Web scraping / automation
- **Title:** `I will build a resilient web scraper for public data (Python)`
- **Packages:** Basic **$40** (1 public source → CSV/JSON) / Standard **$110** (multi-page, scheduled,
  retries) / Premium **$250** (multi-source pipeline + DB output + monitoring).
- ⚠️ Gig description must state: *public, non-personal data only; no login/anti-bot bypass.*

---

## 3. Upwork proposal template (personalize every time)

```
Hi [name],

Short version: I can build this, and I have a runnable example of nearly the same thing.

[ONE sentence proving you read the post — restate their system + goal in your words.]

How I'd approach it:
1. [concrete step 1 tied to their stack]
2. [concrete step 2]
3. Verify with a real MCP handshake / a test run before handoff.

Reference I built that's close to this: [link to the relevant repo or the portfolio site].
It's public and you can run it yourself.

Scope: [X tools / Y sources]. Timeline: [N] days. Price: [$Z fixed].
Happy to start with a small paid milestone so you can see the quality before committing further.

— [you]
```

**Volume target:** 5–10 *personalized* proposals/day (never spam). 30–50 good proposals → 1–3 wins.

---

## 4. The decision filter (say no to keep yourself safe)

Before accepting ANY gig, all three must be true. If not — decline or redirect to a bug-bounty framing.

1. **Public & unauthenticated?** No login, no account, no paywall to defeat.
2. **No technical-protection bypass?** No anti-bot/CAPTCHA/SSL-pinning/integrity defeat. (This is the
   line that turns "automation" into a crime — PL art. 267/269b, US CFAA/DMCA §1201.)
3. **No personal data?** No scraping people's data from the EU (GDPR), even if "public."

Your RE skills monetize legally through **MCP/integration work** and **authorized bug bounty** —
never through selling bypasses as a service or product.

---

## 5. Payments & tax (PL)

- **Get paid:** Wise or Payoneer (both withdraw to PL bank). Start KYC *today* — it's the bottleneck.
- **Stay legal small:** *działalność nierejestrowana* 2026 — revenue cap **10 813,50 zł/quarter**, no
  ZUS, settle on PIT-36. 1000 zł sits comfortably under it. (Confirm you haven't run a JDG in 60 months.)
- **Polish alternative platform:** `useme.com` lets you invoice clients without a registered business —
  simpler than Upwork's hold/security period for a first, fast payout.

---

## 6. The week, condensed

| Day | Action |
|-----|--------|
| **Today** | KYC on Upwork + Fiverr + Wise/Payoneer. These assets are your portfolio — push them to GitHub. Send 3 proposals. |
| **Day 2** | Publish all 3 Fiverr gigs (copy above). Polish profile. |
| **Day 3–7** | 5–10 personalized Upwork proposals/day. Link the live demos every time. |
| **Day 5–10** | First contract. Deliver fast + over-spec (Claude does the code, you do QA + comms). |
| **Day 10–14** | First payout + first review. 1 gig @ $250 or 2 @ $130 ≈ 1000 zł. |

The review is worth more than the first 1000 zł — it unlocks the next ones at a higher rate.
