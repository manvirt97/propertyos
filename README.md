# Oakfolio — real estate investment intelligence

Oakfolio is a WORKING BRAND, not trademark-cleared. Its Canadian real estate product scope may overlap with the existing AppFolio trademark, so trademark-lawyer review is required before forming a company, purchasing a domain, or investing in permanent branding.

## What's implemented on this branch

- Premium responsive discovery-first dashboard, clear mobile navigation, and new sections for exploration, markets, refinancing, and strategy guidance.
- User-chosen market or opt-in coarse location selection across eight Canadian cities. No coordinates are retained or uploaded.
- Links to current REALTOR.ca multifamily search pages, not an unauthorized embedded MLS listing feed.
- Browser-local shortlist of up to 40 candidate properties with HTTPS links, price, units, and one-click prefilling of the Deal Analyzer.
- Official Bank of Canada rates via free Valet API, with explicit source dates, refresh controls and fail-closed unavailable states: V39079 overnight target, V80691311 major-bank prime, V39053 five-year government benchmark bond, V80691335 five-year posted mortgage rate.
- Refinance model with net cash-out less fees, maximum illustrative LTV, rate comparison, payment changes, DSCR and property value stress testing.
- Simplified income/debt and cash constraints for additional borrowing, and cash accumulation runway for a next investment.
- Rules-based strategy assistant with user-controlled copy to ChatGPT for optional generative research. There is no AI model, API secret, cloud account, or autonomous agent connected.
- Existing investment underwriting, local saved-deal records, JSON backup import/export, financial calculations and tests preserved.

## Important boundaries

CREA DDF access to listing data is permissioned and may involve licensing fees. See https://ddfapi-docs.realtor.ca/ and https://support.crea.ca/DDF/Home/reaw. Do not scrape REALTOR.ca or present provider listings as data retrieved by this app.

Mortgage calculations are illustrative, not lender quotes, verified appraisals, credit qualification, professional tax advice, guaranteed gains or financing approvals. Lending rules differ for 1–4 units, 5+ units, insurer programs and provincial requirements. Confirm with qualified professionals.

Browser rates use the official public Bank of Canada Valet API, which requires no subscription or API key. The app will show unavailable data instead of made-up values if the network is offline, the API fails, or browser CORS is blocked. Sources: https://www.bankofcanada.ca/valet/docs and https://www.bankofcanada.ca/rates/interest-rates/lookup-bond-yields/.

Personal tenant data, banking secrets, tax IDs, tenant payments and sensitive documents are NOT supported. No cloud authentication or storage is installed. Prospects and deal scenarios stay in local browser storage and do not sync to other devices.

## Preserving existing work

The old storage key propertyos.v1.deals is deliberately unchanged, and both PropertyOS and Oakfolio version-1 JSON backup headers are accepted. New exports use the Oakfolio name. This prevents losing local saved scenarios during an in-place rebrand.

Local storage is per website origin. If you move from propertyos-...pages.dev to a NEW oakfolio.pages.dev project, saved deals WILL NOT follow automatically. First export a JSON backup from the old URL, then import it on the new URL.

Rollback: preserve the pre-change GitHub main commit, use a feature branch and CI before merging, then use GitHub revert or Cloudflare rollback if needed. EquityClimb is unaffected.

## Tests and deployment

Node.js 20+; no external packages, paid APIs or secrets:

- npm test
- npm run syntax

Cloudflare Pages: repository manvirt97/propertyos, branch main, build command exit 0, output public. Deployments on main are automatic if GitHub integration is healthy. The new feature branch should be reviewed and tested before merging.

## Future gated work

Real internal listing cards and regular updates require an approved data agreement and backend; secure cross-device portfolios and tenant management require authentication and protected storage; real AI analysis requires a secure service and explicit cost/security approval. None of these are implied by this iteration.


## Verified market rates and resilience

Rate values are sourced from four distinct official Bank of Canada Valet series (overnight `V39079`, chartered bank prime `V80691311`, five-year Government of Canada bond `V39053`, and five-year posted conventional mortgage `V80691335`). A scheduled, free public GitHub Action runs on weekdays, collects **each series independently**, validates dates and percentages, and publishes `public/rates-snapshot.json` when observations change. Cloudflare serves this static file from the **same origin**; no paid API, Cloudflare Function, account upgrade or secret key is required. The dashboard labels the **actual observation date** for every series and clearly marks missing/old records; it never equates a posted rate to a lender offer. The browser retains only last-known verified public rates for graceful network failures.

The Market tab also includes a user-controlled Canadian fixed-rate mortgage payment sensitivity tool for ±1 percentage point; these are assumptions and not lender offers. For technical tests, run `npm test` and `npm run syntax`. If the scheduled update job fails, see the GitHub Actions workflow `Refresh official Bank of Canada rates`; do **not** replace unknown values with invented rates. Updating the JSON snapshot is not the same as confirming Cloudflare deployed the latest commit; verify the live `/rates-snapshot.json` response before claiming freshness.
