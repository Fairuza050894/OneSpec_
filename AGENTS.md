<!-- antislop:start -->
## antislop & OneSpec Engineering Mandate

antislop active: during (session override).

For all UI, copywriting, accessibility, responsive layout, and code generation tasks in this repository:
1. Read `DESIGN.md` first as the authoritative source of visual direction, color tokens, typography, and Liveliness Dials (ENERGY 2 / RHYTHM 3 / MOTION 1).
2. Apply `antislop.md` rules R-01 through R-40 in `during` mode:
   - FORBIDDEN: blue-to-purple gradients, glowing orbs, sparkle icons, emoji bullets in UI headers, pill-shaped card radii, fake unmeasured metrics, dead buttons, welcome cards, hero marketing banners, and conversational AI filler (R-01, R-11, R-24, R-39, R-40).
   - MANDATORY: Full-viewport (`100vh x 100vw`, `overflow-hidden`) 3-pane IDE workbench layout using `react-resizable-panels`, `cmdk` Command Palette (`Cmd+K`), WCAG AA/AAA contrast ratios, `cursor: pointer` on all enabled controls, `tabular-nums` on all numeric/latency columns, and clean ISO/IEC/IEEE 29148, BPMN 2.0 (ISO 19510), and ISO 29119 terminology.
3. Architecture & Library Lock:
   - Layout: Fixed `100vw x 100vh`, `36px` top header bar, Left Explorer Pane (`18%`), Center Work Area (`54%`), Right Contextual Inspector (`28%`), and Bottom Collapsible Terminal Drawer.
   - Styling: Dark Linear / Vercel Geist Desktop Engineering Workbench tokens (`#0B0C0E` canvas, `#111317` panel, `#16191F` header, `#22262E` hairline borders). Max border radius is `4px` (`rounded-sm`), `0px` on layout panes.
4. Read `ARCHITECTURE_AND_SDLC_SPEC.md` for system boundaries, data schemas, and `morluto/rea` (`rea-agents`) integration contracts.
5. Close EVERY implementation turn with the mandatory 4-block **Anti-Slop Delivery Gate Report** (Block 1: Hard Gate R-01..R-40 PASS/FAIL, Block 2: Purpose Gate, Block 3: Quality Locks & Contrast, Block 4: Functional Parity Verification).
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
