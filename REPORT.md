# Deal Flow — Report (money input formatting)

**Status:** Implemented + tested + screenshots. **NOT published.** Awaiting Chairman Publish widget.

**Path:** `/workspace/deal-flow`  
**Live (confirm only — this change not pushed):** https://bludiamond888-rgb.github.io/deal-flow/

## Fix: purchase price / money inputs

Bug (Chairman): editing purchase price left a leading zero (`$ 02000`) and large $ values lacked thousand separators.

| Behavior | Detail |
|---|---|
| No leading zeros | `sanitizeDraft('02000')` → `2000` while typing |
| Commas on blur | `$25,000,000`, `$1,225`, `$2,000` via `formatGrouped` |
| Edit UX | Strip commas on focus; select-all; reformat on blur; parse for live calc |
| Empty ok | Clearing the field is allowed while editing |
| Scope | Purchase price + avg rent (`format="money"`); % fields plain; units/hold plain numbers |
| PWA | Still iPhone Home Screen friendly; prior no-horizontal-clip grid (`minmax(0,1fr)`) kept |

Helpers live in `src/format.ts` (`sanitizeDraft`, `parseDraft`, `toEditDraft`, `formatGrouped`). Field uses `type="text"` + `inputMode="decimal"` (not native `type="number"`).

Sibling **Deal Pro Forma** got the same pattern (`src/numInput.ts`).

## Screenshots (WebKit 440×956 @3)

- `screens/04-inputs.png` — `$25,000,000` / `$1,225` with commas
- `screens/04b-price-editing.png` — typing `02000` cleans to `2000` (no leading 0)
- `screens/04c-price-formatted.png` — blur → `$2,000`
- plus existing flow / sankey / saved / terms / about shots

## Tests

`npm test` — **30/30** passed (calc + flow + format helpers).

## Git

Local commit only. **Do not push / do not publish** until Chairman Publish widget.
