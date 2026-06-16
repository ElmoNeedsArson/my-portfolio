# Canvas Card Changelog

This directory contains original versions of cards before structural changes were made.
Use these files to revert individual cards if needed.

---

## 2026-06-14 — Professional Identity restructure + Bézier arrows

### Changes made

**Professional Identity (04) — images split out to 04b**
- `04-professional-identity.json`: removed all `images` sections; kept only `content` sections
- `04b-professional-identity-img.json` (NEW): all images from the original card, laid out in 3 side-by-side rows (matching the EA card pattern)
  - Row 1: Data Physicalization + Low-Poly Video Game
  - Row 2: Exomembra/Startup + Information System
  - Row 3: Wordbond + FMP HCD + Tactone
- `12-past-b_e.json`: added `relativeToCardId: "professional-identity"` so its position stays fixed after the new 04b card was inserted at numberOrder 4.5

**Arrow style — CanvasArrow.svelte**
- Replaced rounded right-angle corners (quadratic Bézier at waypoints) with smooth cubic Bézier S-curves
- For 2-point connections: S-curve with control points at the horizontal (or vertical) midpoint
- For multi-point connections: Catmull-Rom spline through all waypoints
- Arrowhead angle now follows the true Bézier tangent at the endpoint (via last control point)
- `fromSide` and `toSide` props added for precise tangent control at endpoints

### How to revert a specific card

Copy the original file from `archived/` back to `canvasCards/`:
```
archived/04-professional-identity.json → canvasCards/04-professional-identity.json
archived/12-past-b_e.json              → canvasCards/12-past-b_e.json
```
Then delete `canvasCards/04b-professional-identity-img.json`.
For arrows, revert `CanvasArrow.svelte` and remove the `fromSide`/`toSide` props from `InfiniteCanvas.svelte`.

---

## 2026-06-14 — Phase 2: Layout fixes, position cascade, connection overhaul

### Changes made

**04b-professional-identity-img.json (rewritten)**
- Changed from 3 side-by-side rows to stacked layout: 4 full-width `type: "images"` sections (data-physicalization, video-game, startup, information-system) each with `cols: 3`, followed by 1 `type: "row"` for the methodology trio (wordbond, fmp-hcd, tactone at 33% each)
- imageHeight reduced to 230 (was 290) to keep the taller stacked card compact

**Position cascade: EA column shifted right**
- `12-past-b_e.json`: `offsetX` 1700 → 3200 (clears professional-identity-img right edge at +2920, 280px gap)
- `20-fmp-reflection.json`: `offsetX` 5300 → 6900 (clears past-conclusion right edge at ~+6500, 400px gap)
- `18-beyond-education.json`: `offsetX` 7500 → 8600 (clears fmp-reflection right edge at +8100, 500px gap)
- All other positions cascade automatically via `relativeToCardId` chains

**canvasConnections.ts (rewritten)**
- Removed ALL waypoints from every connection (were causing kinks with the new Bézier renderer)
- `professional-identity → past-business-and-entrepreneurship`: changed `fromSide` from `"bottom"` to `"right"`
- Added 4 new fan-out connections from `professional-identity` to the remaining 4 EA text cards (all `fromSide: "right"`, `toSide: "left"`)
- Removed the waypoint-only intermediate steps; `past-conclusion` remains the combining node

### How to revert Phase 2

```
archived/canvasConnections.ts       → src/components/canvas/canvasConnections.ts
archived/18-beyond-education.json   → canvasCards/18-beyond-education.json
```
Restore `12-past-b_e.json` offsetX to 1700 and `20-fmp-reflection.json` offsetX to 5300.
Replace `04b-professional-identity-img.json` with the Phase 1 version (3 side-by-side rows).
