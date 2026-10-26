# Deal Flow v1 — Report

**Status:** Implemented + tested + screenshots. **NOT published.**

**Path:** `/workspace/deal-flow`  
**Visual twin of:** Earnings Flow (`/workspace/earnings-flow`)  
**Math twin of:** Deal Pro Forma (`/workspace/deal-proforma`) — identical `calc.ts` incl. IRR

## How it differs from Deal Pro Forma

| | Deal Pro Forma | Deal Flow |
|---|---|---|
| Primary UI | Form-first tabs (deal / saved / more) | Chart-first Sankey (Earnings Flow chrome) |
| Visual | Metric dash + long form sections | Income/cash-flow Sankey + sticky metric chips |
| Inputs | Full BOE form | Key inputs panel (price, LTV, rent, vacancy, hold…) live-updating the chart |
| Shared | Same formulas, demo deal, localStorage pattern, PWA, vitest, WebKit screens | Same |

## Flow nodes

GPR → Vacancy → EGI → OpEx buckets → NOI → Debt Service → BTCF  
Below-the-line pills: Total equity, Capex, Net sale proceeds, Equity reversion

## Demo metrics (111 First Street)

Cap 8.70% · CoC 10.29% · YoC 8.54% · DSCR 1.77x · IRR ~30.0% · EM 3.29x

## Screenshots (WebKit 440×956 @3)

- `/workspace/deal-flow/screens/01-flow-top.png`
- `/workspace/deal-flow/screens/02-sankey.png`
- `/workspace/deal-flow/screens/03-node-detail.png`
- `/workspace/deal-flow/screens/04-inputs.png`
- `/workspace/deal-flow/screens/05-monthly.png`
- `/workspace/deal-flow/screens/06-saved-list.png`
- `/workspace/deal-flow/screens/07-about.png`

## Tests

`npm test` — **21/21** passed (calc + flow graph).

## Git

Local commit only — **no push / no publish.**

## Fix — lock horizontal pan (2026-10-26)

Jackie (Chairman): chart/page must not move side-by-side.

- `.chartwrap`: `overflow: hidden` (was `overflow-x: auto`) + `overscroll-behavior-x: none`
- chart SVG: `touch-action: pan-y` (vertical page scroll OK; no horizontal pan)
- `html, body` + `.app`: `overflow-x: hidden`
- No d3-zoom; SVG width still matches container via ResizeObserver

Verified (WebKit 440×956): wrap/html scrollWidth == clientWidth; forced `scrollLeft`/`scrollX` stay 0.
