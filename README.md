# PropertyOS

Property investing, made clear.

PropertyOS is an independent, Canada-first, browser-only property investment analysis and education foundation. It is **not** the existing EquityClimb product, and has no integration or shared data with EquityClimb.

## Current scope

- Property investment analyzer with Canadian fixed-rate mortgage math, NOI, cap rate, DSCR, debt yield, cash-on-cash return and illustrative risk scenarios.
- Browser-local saved analyses and backup/export tools. Data is **not** synced between devices.
- Beginner educational guidance on first rentals, financing, personal versus corporate ownership considerations and leverage risk.
- Mobile-responsive interface with no tenant payment processing or live listings.

**Not implemented:** live property or rent feeds, lender offers, secure multiuser accounts, real tenant management, bank transfers, accounting and automated background alerts. Do not enter private tenant records or credentials. Every analysis is illustrative and requires professional verification.

## Test locally

Node.js 20 or newer:

```sh
npm test
```

No npm installation, paid APIs, secrets or database are required for the test suite or the website.

## Deploy to Cloudflare Pages using GitHub

- Repository: this independent `propertyos` repository (not EquityClimb).
- Production branch: `main`
- Framework preset: **None**
- Root directory: repository root (`/`, default)
- Build command: `exit 0` (no framework/build required)
- Build output directory: `public`
- Environment variables: **none**

Cloudflare Pages serves `public/index.html` at the site root and automatically publishes commits after GitHub integration is connected. The output directory must be exactly `public` or the website will return 404. Verify the deployment and mobile UI before sharing the link.

## Privacy & safety

All saved user scenarios reside in local browser storage on the device and may be lost when storage is cleared; export backups regularly. This is not a secured tenant-record system. No financial credentials belong in GitHub or client code. Do not treat manually entered figures or sample scenarios as verified market data or lender approval.

## Repository visibility

GitHub repository visibility may be public, but that **does not** make saved browser-local financial scenarios public. The repository must contain only app code, non-sensitive static assets and tests. No personal financial data is committed.

## Source of calculations

See `public/finance.js` for deterministic formulas and `tests/finance.test.js` for independently checkable examples and edge cases. Tax and lender eligibility are not certified here.
