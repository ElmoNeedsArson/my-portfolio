# Canvas Card Changelog

This directory contains original versions of cards before structural changes were made.
Use these files to revert individual cards if needed.

---

## 2026-06-16 — Pentagon layout for the expertise areas (Part 3 of portfolio-changes-spec.md)

### Changes made

**`infiniteCanvasTypes.ts`** — `Connection.from`/`.to` are now optional, and `fromPoint`/
`toPoint` (literal `{x,y}`) were added as alternatives, plus `color`, `opacity`,
`gradient: [string,string]`, and `noArrowhead`. This is the "extend Connection with
literal endpoints" approach (per author decision, over an invisible-anchor-card
approach). `fromPoint`/`toPoint` are computed reactively from the Professional Skills
card's resolved position at render time, not stored as fixed pixels, so they stay
correct if upstream cards move.

**`CanvasArrow.svelte`** — added `color`, `opacity`, `gradient`, `noArrowhead` props.
Gradient strokes use an SVG `<linearGradient>` with a randomly generated id per arrow
instance.

**`src/lib/pentagonLayout.ts` (NEW)** — pentagon geometry (`PENTAGON_R = 3200`, vertex
dx/dy multipliers per EA), the 5 edge pairs for gradient lines, and the four hardcoded
in/out-arrow endpoints (`PENTAGON_IN_TOP_OFFSET` etc.), expressed as offsets from the
pentagon hub's centre. `buildPentagonConnections()` generates the dashed spokes,
gradient edges, and the 4 hardcoded-point arrows as `Connection[]`. EA spoke/edge colors
use the existing `EA_AREAS.base` colors (per author decision), not the spec's color-name
table, since the real colors are used everywhere else (chips, highlights).

**`InfiniteCanvas.svelte`** — computes `pentagonHubCenter` from the resolved
`professional-skills` card, calls `buildPentagonConnections()`, and merges the result
with the static `connections` array before building `arrowData`. `getArrowPoints`/
`resolveWaypointPoint` now check `fromPoint`/`toPoint` before falling back to
`getCardEdgePoint`.

**`canvasConnections.ts`** — removed the 5 `professional-identity -> past-X` fan
connections and the 5 `past-X-img -> past-conclusion` fan-in connections (both now
generated dynamically). Changed the T&R -> Beyond Education dashed line to originate
from `past-technology-and-realization-img` (the composite's right edge) instead of the
text card, so the long line doesn't cut through T&R's own images. Pre-pentagon version
archived at `archived/canvasConnections.pre-pentagon-2026-06-16.ts`.

**Card repositioning** — all five EA text cards (`12-past-b_e.json`, `13-past-c_a.json`,
`14-past-m_d_c.json`, `15-past-t_r.json`, `16-past-u_s.json`) now use
`relativeToCardId: "professional-skills"` with offsets derived from pentagon vertex
math (`R=3200`, composite half-width `1130` = half of text(600) + gap(60) + image(1600)).
Offsets mix numeric pentagon-position terms with `0.5pw`/`0.5ph`/`0.5ch` so they stay
centered on the hub and on each card's own (dynamically measured) size. Vertex-to-EA
assignment and colors: Top=B&E(`#4473C5`), Upper-right=C&A(`#ED7D31`),
Lower-right=T&R(`#FFC000`), Lower-left=M,D&C(`#7030A0`), Upper-left=U&S(`#70AD46`).

**`19b-professional-skills.json`** — moved from its Part 2 placeholder to
`relativeToCardId: "professional-identity"`, `offsetX: 6200`, `offsetY: "0.5ph-0.5ch"`,
`numberOrder: 11` (must resolve before all 5 EA cards, which anchor to it). The 6200px
offset was sized so the pentagon's leftmost vertex (upper-left, reaching `-4173px` from
hub centre) clears Professional Identity's right edge (1400px wide) with margin, since
PI's image card sits below it rather than beside it.

**`17-past-conc.json`** — re-anchored from the old EA-stack chain to
`relativeToCardId: "professional-skills"`, `offsetX: 4900` (clears the pentagon's
rightmost extent, ~4473px from hub centre, by ~400px), `offsetY: "0.5ph-0.5ch"` (centers
on the hub, which is also the pentagon's vertical center). No incoming dashed feed
now — only the two pentagon out-arrows reach it.

**`20-fmp-reflection.json`** — re-anchored to `relativeToCardId: "past-conclusion"`,
`offsetX: "1.2pw"`, `offsetY: "0.5ph-0.5ch"`, since its old fixed offset from
Professional Identity no longer made sense once Conclusion moved.

**`18-beyond-education.json`** — re-anchored to `relativeToCardId: "fmp-reflection"`,
`offsetX: "1.2pw"`, `offsetY: "0.5ph-0.5ch"`, for the same reason; its old fixed
9000px offset from PI would have collided with the new pentagon/conclusion/fmp cluster.

### Verified

`npm run build` succeeds (only a pre-existing a11y lint warning, unrelated). Loaded the
canvas in a real browser via the `/eindhoven?canvas=fullscreen` route: pentagon renders
with correct per-vertex EA colors, dashed spokes converge on the Professional Skills
card, gradient edges connect adjacent vertices, the two in-arrows from Professional
Identity clear the pentagon with no overlap, and the two out-arrows funnel cleanly into
Conclusion -> FMP Reflection -> Skills Sunburst -> Beyond Education with no card overlaps.

### Tuning pass (same day)

- **Spokes and pentagon edges are now straight lines**, not Bézier curves. Added a
  `straight` flag to `Connection`/`CanvasArrow.svelte` that draws `M...L...` instead of
  the S-curve math. The two in-arrows (PI -> pentagon) and two out-arrows
  (pentagon -> Conclusion) keep the Bézier S-curve, per spec 3.3's explicit instruction.
- **`PENTAGON_R` reduced from 3200 to 2100**, not all the way to 1600 (a straight halving)
  because the composite unit width is fixed at 2260px (text 600 + gap 60 + image 1600).
  At R=1600 the two bottom vertices (T&R and M,D&C, both on the pentagon's bottom edge)
  are only 1881px apart center-to-center, which is less than their combined half-widths
  (2260px) — they visibly overlapped when rendered. R=2100 is the smallest radius that
  keeps a ~200px gap on that edge; verified by rendering and visually confirming no
  overlap anywhere in the pentagon. `professional-skills` offsetX (PI clearance) and
  `past-conclusion` offsetX (pentagon clearance) were tightened to match (6200->4600,
  4900->3800).

### Round 2: 2.2, 2.5, Part 4, and tuning (same day)

**2.2 — EA contribution one-liners.** Implemented as labels directly on the spokes
(author's choice over a bridge-card approach, to avoid re-crowding the pentagon).
`EA_CONTRIBUTION_TEXT` added to `pentagonLayout.ts`. `InfiniteCanvas.svelte` derives
`spokeLabels` from the already-resolved spoke connection midpoints and renders each as
an SVG `<foreignObject>` containing a `.spoke-label` div, color-coded per EA.

**2.5 — Past/Present/Future in the status bar.** Implemented by relabeling the existing
4-act structure in `acts.ts` rather than adding a parallel segment: Act II
`'Act II · Expertise'` -> `'Act II · Past'` (description -> "Pre-FMP history and
evidence"), Act III `'Act III · Reflection'` -> `'Act III · Present'` (description ->
"FMP and synthesis"), with `professional-skills` added to Act III's `cardIds`. Act I and
Act IV needed no changes (Act IV was already labeled "Future"). `past-conclusion` was
already in Act III, matching the author's "Conclusion -> Present" decision. No Svelte
changes needed since `.context-bar` already renders `act.label`/`act.description`
directly.

**Part 4 — per-act reference strips.** Split the single `26-references.json` into two:
it was repurposed in place as `references-present` (ids: `obsidian3d`, `obsidian`,
still anchored below `skills-sunburst`), and a new `04c-references-act1.json` added
(ids: the other 8 keys, anchored below `professional-identity-img`). No "Future" strip
per spec ("Future: none"). `ReferencesCard.svelte` gained an optional `ids` prop that
filters `$citedSources` while still looking up each source's **global** number via
`$citationNumberMap` (not array index), so numbering stays continuous across strips with
no re-numbering. Citation click-through now resolves dynamically: added
`citationCardMap` (`citationStore.ts`) + `buildCitationCardMap()` (`citationUtils.ts`),
which scans all cards for `sveltecomponent` sections named `"references"` and maps each
id in their `componentProps.ids` back to that card's id. `CanvasCard.svelte`'s citation
buttons now set `data-cite-card` from this map instead of a hardcoded `"references"`.
Also fixed a now-stale `wordCountStats` filter in `InfiniteCanvas.svelte` that excluded
the old single `"references"` card id by id; updated to exclude both new ids.

**Audit correction:** initially miscounted citations when claiming the 5 Past EA cards
had none — missed that `15-past-t_r.json` cites `obsidian3d`/`obsidian`. Re-verified
with an exhaustive `\cite{}` grep across all live cards: exactly 10 keys, matching the
spec's Act I (8) + Present (2) lists with nothing left over. Doesn't change the
implementation, since Part 4's bucket assignment is an explicit curated list, not
derived from which card the citation happens to live in.

### Tuning pass 2 (same day)

- **`PENTAGON_R` reduced further, 3200 -> 2100** (not all the way to the requested half,
  1600 — see "Tuning pass" above for the overlap math forcing this floor). Re-verified
  by render: no overlaps anywhere, ~200px clearance on the previously-colliding bottom
  edge.
- **Spokes and pentagon edges are straight lines**, not Bézier — added a `straight` flag
  to `Connection`/`CanvasArrow.svelte` (`M...L...` instead of the S-curve math). The two
  in-arrows and two out-arrows keep the Bézier S-curve per spec 3.3.
- All verified live: build passes, no console/page errors, spoke label text content
  confirmed via DOM query (all 5 correct), act band labels confirmed (all 4 correct),
  both reference cards' content and continuous numbering confirmed (`[1]`-`[8]` then
  `[9]`-`[10]`), and citation click-through confirmed routing to the correct strip from
  both a Past-bucket card (T&R) and an Act I card (Professional Identity).

### Round 3: spoke geometry, alignment, brackets, band/reference fixes (same day)

**Spoke geometry overhaul.** Spokes previously used `from`/`fromSide`/`to`/`toSide`
(card-edge lookups), landing at inconsistent points (e.g. in the gap between a text
card and its image card) and at 5 different sides of the Professional Skills card.
Replaced with literal `fromPoint`/`toPoint`: `toPoint` is now the **exact same hub
centre point** for all 5 spokes, and `fromPoint` is computed via a new
`raySegmentBoxEntry()` (ray-vs-axis-aligned-box intersection, `pentagonLayout.ts`) —
the point where the straight line from hub-centre to the unit's true centre (the union
of its text+image bounding boxes) first crosses the unit's boundary. This guarantees
every spoke aims exactly at the hub and originates exactly on the edge facing it,
regardless of how tall/wide each EA's image block is. `buildPentagonConnections()`
signature changed to take a `getCardBox(id)` callback instead of relying on
`from`/`fromSide` card-edge resolution.

**Removed 2.2 entirely** (author decision: drop, not relocate). Deleted
`EA_CONTRIBUTION_TEXT`, the `spokeLabels` derived state, the `foreignObject` label
markup, and the `.spoke-label` CSS from `InfiniteCanvas.svelte`/`pentagonLayout.ts`.

**Same-height alignment for symmetric vertex pairs.** Removed the `-0.5ch` term from
the 4 paired vertices' `offsetY` (C&A/U&S and T&R/M,D&C), so each pair aligns by a
shared **top edge** instead of by mathematical center (which was already equal but
didn't read as "aligned" since card heights differ). Verified via
`getBoundingClientRect()`: C&A.y === U&S.y and T&R.y === M,D&C.y exactly.

**Corner-bracket frames** (author's choice over a full border+background, to keep it
minimal). Added `buildPentagonUnitFrames()` (`pentagonLayout.ts`) and a `.unit-bracket`
SVG render block in `InfiniteCanvas.svelte`: four L-shaped corner marks per EA unit,
in that EA's color, drawn around the text+image union box.

**Fixed act-band overlap.** Root cause: adding `professional-skills` to Act III's
`cardIds` (Round 2) put a card at the pentagon's centre into Act III, while all 5 EA
cards surrounding that same centre were in Act II — both bands' x-ranges became
near-identical, fully overlapping. Removed `professional-skills` from Act III's
`cardIds` (Act II's band already covers that region, since it geometrically contains
the whole pentagon). Verified via bounding-rect overlap check: 0px overlap between
every band pair.

**Repositioned the Present references strip** (`26-references.json`, T&R's citations).
Was anchored below `skills-sunburst` (far right, unrelated to where it's cited); now
`relativeToCardId: "professional-skills"`, horizontally centered under the hub
(`offsetX: "0.5pw-600"`), `offsetY: "3400+0.5ph"` to clear the lower vertices' image
blocks (tuned up from an initial 2600 after a render check showed a 54px overlap with
the M,D&C image card; verified clear afterward).

**Excluded both reference cards from default navigation.** Added an id check to
`sequentialCardIds` (prev/next arrows) and `navigationCards` (the Navigation dropdown)
in `InfiniteCanvas.svelte`. Verified: the Navigation dropdown lists 14 items, none of
them reference cards.

All verified live: build clean, the 5 spoke endpoints confirmed identical via SVG path
inspection, corner brackets confirmed (5 groups / 20 paths), act bands confirmed
non-overlapping, references-present confirmed clear of both lower EA image cards, and
the nav dropdown confirmed excluding both reference card ids.

### Round 4: edge geometry redesign, EA flips, spacing, bracket padding (same day)

**Removed the spokes entirely** (author: "it clutters"). Deleted the spoke-generation
loop from `buildPentagonConnections()`. Only the 5 gradient pentagon edges and the 4
hardcoded in/out arrows remain.

**Pentagon edges redesigned again** to fix two related complaints: the M,D&C<->T&R
edge landing at "center top" instead of center-right/center-left, and C&A/U&S each
receiving their two edges at inconsistent x positions. Root cause: edges previously
used idealized `vertexCenter()` math (assuming the old center-alignment), which
silently went stale once vertex cards were top-aligned (Round 3) — the real card
centers moved down, but the edge math didn't know that. Tried a center-to-center ray
clipped at each box first (`raySegmentBoxEntry`), which fixed the worst of it but
left a small residual tilt on the M,D&C<->T&R edge (centers differ in y when
composite heights differ, even with equal top edges) — verified via render: 68px
off true-centre on a ~1000-1300px tall card. Replaced with `sideCenterTowards(box,
target)`: for each box independently, picks whichever side (left/right or top/bottom)
is more aligned with the direction to the other unit's centre (normalized by the
box's own half-width/half-height so aspect ratio doesn't bias the choice), and
returns that side's **exact** centre point — never an interpolated point. Verified via
DOM inspection in canvas-space (reading the `.canvas-content` transform to convert
viewport rects back to canvas coordinates): T&R<->M,D&C edge now lands exactly on
each card's true vertical centre (matched to within float rounding), and C&A's two
edges share an identical x (9597.1), as do U&S's (5602.9) — both previously
inconsistent. `raySegmentBoxEntry()` removed as dead code since nothing calls it
anymore.

**Flipped U&S and M,D&C to image-left/text-right** (the other three EA units keep
text-left/image-right). Restructured the `relativeToCardId` chain: the image card
(`16b-images.json`, `14b-images.json`) now anchors directly to `professional-skills`
with the offset the text card used to have, and the text card (`16-past-u_s.json`,
`14-past-m_d_c.json`) now anchors to its own image card with `offsetX: "1pw+60"`.
Swapped their `numberOrder`s so the image (now the anchor) resolves first. The overall
composite footprint is unchanged, so this didn't require re-tuning any pentagon
geometry.

**More space between Professional Identity and the pentagon.** `professional-skills`
`offsetX` (relative to PI) 4600 -> 5900. Conclusion, FMP Reflection, and Beyond
Education all cascade further right automatically since they're chained relative to
the hub/each other; the four in/out-arrow offsets are relative to hub-centre too, so
they extend automatically without retuning.

**Corner brackets gained padding.** Added `FRAME_PADDING = 24` in
`buildPentagonUnitFrames()`, expanding the frame box outward on all sides instead of
sitting flush on the card edges.

All verified live: build clean, spoke count confirmed 0 (only the T&R->Beyond
Education dashed line remains), edge endpoints confirmed via canvas-space coordinate
math (not just screenshots), and the U&S/M,D&C flip and PI gap confirmed via
`getBoundingClientRect`.

### Round 5: level the T&R<->M,D&C edge (same day)

Author flagged the residual tilt noted at the end of Round 4 (each end pinned to its
own box's true centre, which differ slightly when composite heights differ). Fix per
author's direction: when both ends of a pentagon edge pick a left/right exit (a
roughly horizontal pair), average the two true centres' y and use that for both
endpoints instead of each box's individual centre. Verified live: T&R<->M,D&C edge
now has `y1 === y2` exactly, matching the midpoint of the two true centres to within
float rounding.

### Round 6: dead-code cleanup, thicker lines (same day)

Author manually retuned several offsets directly (pentagon vertex positions, in/out
arrow offsets, Conclusion's position) after the "how to tune it" explanation, and
flagged that `PENTAGON_R` looked unused. Confirmed via grep: `PENTAGON_R` and the
`dx`/`dy` fields on `PentagonVertex` were genuinely dead — left over from the original
idealized-vertex-math approach to pentagon edges, fully superseded once edges moved to
real-geometry `sideCenterTowards()` (Round 4) and EA card positions became hardcoded
per-card offsets instead of a formula derived from one shared radius. Removed both.
`PENTAGON_VERTICES` now only carries `eaKey`/`cardId` per vertex (still needed to
identify each unit's cards and EA color).

Increased connection stroke width in `CanvasArrow.svelte`: solid lines 10 -> 13,
dashed 5 -> 6.

**Flagged to author, not yet changed:** measured each EA unit's actual distance from
the hub centre after their manual retuning (`getBoundingClientRect` in canvas-space,
overview zoom) — top/B&E ~194, upper-right/C&A ~191, upper-left/U&S ~191, but
lower-right/T&R ~270 and lower-left/M,D&C ~284. The top and upper pair are now nearly
equidistant from the hub (good), but the lower pair sits roughly 40-45% farther out,
since only the upper pair's offset was pulled in during manual tuning while the lower
pair's (`1698.9+0.5ph` in `15-past-t_r.json`/`14b-images.json`) was untouched. Author
to decide whether to pull the lower pair in to match (~1100-1250 instead of 1698.9) or
leave as a deliberate asymmetric shape.

### Round 7: hardcoded connection points, no arrowheads, act-band fix, tighter pentagon (same day)

**Arrowheads removed entirely.** Deleted the `<polygon>` markup, the `angle`/`lastCP2`
tangent-tracking code (only existed to rotate the arrowhead), and the `noArrowhead`
prop/field from `CanvasArrow.svelte`, `Connection`, and all call sites — there's no
longer a concept of arrowheads anywhere in the canvas, not just suppressed on some
connections. Stroke widths bumped: solid 10 -> 13, dashed 5 -> 6.

**Act bands fixed.** Root cause: `actBands` computed its global Y-extent from
`stableCardPositions` (resolved with an empty heights object, so every "ph"/"ch"
offset fell back to a 300px default — inaccurate for the pentagon's real geometry)
plus a flat `CARD_HEIGHT_ESTIMATE = 3000` added under every card. That heuristic was
sized for the old single-column stacked layout; once cards sit at very different y
positions around a hub, adding a flat 3000px under each one blew the band height out
far past the actual content. Replaced with the real `cards`/`cardHeights` (already
available, already accurate) and each card's real height instead of the 3000
estimate. `stableCardPositions` removed (was only used here).

**Connection lines: hardcoded points, no live geometry computation** (author: "instead
of the entire blocks of code you added for it"). Removed `sideCenterTowards()` and the
per-frame box-measurement it depended on for connections entirely. Added
`PENTAGON_EDGE_POINTS` (a 5-entry array, index-aligned with `PENTAGON_EDGE_PAIRS`,
each `{ from, to }` as a hub-relative offset) and consolidated the four in/out-arrow
offsets into `PENTAGON_ARROW_POINTS`. The five edge-point pairs were derived by
rendering once with the previous (dynamic, real-geometry) implementation against the
new tightened card positions, reading the resulting SVG path coordinates back in
canvas-space, and baking those exact numbers in — so the hardcoded points start from
a render-verified, non-overlapping layout. `getCardBox` is no longer a parameter of
`buildPentagonConnections` (only `buildPentagonUnitFrames`, for the brackets, still
needs real card geometry — that part was kept).

**EA cards moved closer to the hub.** Tightened `12-past-b_e.json` (top, offsetY
`-2300` -> `-1350`), `13-past-c_a.json`/`16b-images.json` (upper pair, offsetX
separation ~3594 -> ~2750), and `14b-images.json`/`15-past-t_r.json` (lower pair,
offsetY `1698.9` -> `1250`). The lower pair's *horizontal* separation was left
untouched (still ~2470) since that's the hard floor found earlier — the composite
width (2260px) plus a safety margin — going tighter there reintroduces the T&R/M,D&C
overlap from Round 3. Verified via render: zero pairwise overlaps among all 5 EA
units after tightening.

All verified live: build clean, 0 arrowhead polygons, act band heights now ~646px
(viewport, overview zoom) and consistent across all 4 acts instead of wildly tall,
5 bracket groups still rendering correctly.

### Round 8: swap B&E and M,D&C positionally (same day)

Swapped which vertex slot each card occupies: B&E now at lower-left, M,D&C now at
top. Each unit kept its own internal text/image arrangement (B&E stays
text-left/image-right; M,D&C stays image-left/text-right) — only the slot changed.
Implementation: swapped the `offsetX`/`offsetY` position formulas between
`12-past-b_e.json` and `14b-images.json` (the two cards that anchor directly to
`professional-skills`; their respective partners follow automatically since they're
positioned relative to *them*, not to the hub). Also swapped the `eaKey`/`cardId`
under `top`/`lowerLeft` in `PENTAGON_VERTICES` (`pentagonLayout.ts`) so the pentagon
edge colors at those two slots match whichever card is actually there now — the
edges' hardcoded geometry didn't need to change, only the color lookup.

Caught a real overlap from the swap: M,D&C's composite is taller than B&E's was, so
at the top slot's old offsetY (`-1550`) it overlapped the upper pair (C&A/U&S) by
~195 canvas px. Pushed it to `-1900` instead; re-verified zero overlaps among all 5
units afterward.

### Known follow-ups

- `R=2100`, the four hardcoded in/out-arrow offsets, and the `3400+0.5ph` references
  strip offset are first-pass-after-tuning values; further taste-tuning is expected.

### How to revert

Restore `archived/canvasConnections.pre-pentagon-2026-06-16.ts` to
`src/components/canvas/canvasConnections.ts`, delete `src/lib/pentagonLayout.ts`, revert
the type/InfiniteCanvas/CanvasArrow changes via git, and restore each EA/Conclusion/FMP/
Beyond Education card's `relativeToCardId`/`offsetX`/`offsetY` to the values shown in the
"2026-06-14" entries above (EA cards) or via git history (Conclusion/FMP/Beyond Education).

---

## 2026-06-16 — Content sweep + Professional Skills card (Parts 1 and 2.1-2.4 of portfolio-changes-spec.md)

### Changes made

Pure text edits (language sweep, bold anchors, FMP method detail, EA competence-level
lines) were applied directly to `04-professional-identity.json`, `12-past-b_e.json`,
`13-past-c_a.json`, `14-past-m_d_c.json`, `15-past-t_r.json`, `16-past-u_s.json`,
`18-beyond-education.json`, `20-fmp-reflection.json` without archiving originals first —
git history is the revert path for these since no structure changed.

**`19b-professional-skills.json` (NEW)** — placeholder position only: `relativeToCardId:
"past-conclusion"`, `offsetY: "1.1ph"`, `numberOrder: 22.5`. Not yet wired into
`canvasConnections.ts`. Will move to the pentagon centre and gain dashed spokes in the
Part 3 pass.

**`17-past-conc.json`** — `width` 600 → 800, `color` alpha 0.3 → 0.45 (capstone visual
weight). Width capped at 800 rather than the spec's implied larger bump because
`offsetX: 2700` relative to `past-math-data-and-computing` puts its left edge at
`PI.x + 5900`; `fmp-reflection` sits at `PI.x + 6900`. 800 leaves a 200px gap. Will
reposition to the right of the pentagon in Part 3 per the spec.

Deferred to the Part 3 (pentagon) pass per author decision: section 2.2 (EA
contribution one-liners — no home until the pentagon bridge/spoke exists), section 2.5
(Past/Present/Future status bar labels), and Part 4 (per-act reference strips).

### How to revert

Use git history for the text-only files. For the new card, delete
`19b-professional-skills.json`. For Conclusion, revert `width` to 600 and `color` to
`rgba(249, 103, 67, 0.3)`.

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
