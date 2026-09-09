# Intel — Sustainability Through the Ages

Coursework build. A responsive, interactive timeline of Intel's sustainability
milestones, using HTML, CSS and Flexbox.

## How it meets the brief

| Requirement | Where |
|---|---|
| Horizontal on large screens | `.track` is `display:flex; flex-wrap:nowrap; overflow-x:auto` |
| Stacks vertically on small screens | `@media (max-width: 768px)` flips it to `flex-direction: column` |
| Two breakpoints, not one | The hero stacks at **1024px**, the timeline at **768px** — they fail at different widths |
| Hover reveals detail | `.card__reveal` is `opacity:0` → `1` on `:hover` **and `:focus-within`** |
| Intel-branded styling | Tokens at the top of `styles.css` — `#0068B5`, `#00285A`, `#00C7FD` |
| Image on every card | 8 cards, 8 images, all with real `alt` text |
| **LevelUp — scroll snap** | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` |
| **LevelUp — transforms** | `translateY(-8px) scale(1.02)` + shadow lift, transitioned |
| **LevelUp — custom images** | 8 sourced photos, one per milestone |

## Two decisions worth explaining

**The reveal is not hover-only.** `:focus-within` is included, so tabbing to a
card shows the same detail a mouse gets. And on screens below 768px the detail
is shown inline instead — a touch screen has no hover, so a hover-only reveal
would hide that content permanently rather than making it interactive.

**Type scales with `clamp()` rather than a media query.** The headline is
`clamp(2rem, 6vw, 4rem)`: never smaller than 2rem, never larger than 4rem, fluid
between. One line replaces three breakpoints.

## Milestone sourcing

Every date is checked against Intel's own material, not written from memory:

| Milestone | Source |
|---|---|
| 2007 lead-free 45nm | Intel press release, 22 May 2007 |
| 2008 largest US green power purchaser | Intel press release, 28 Jan 2008 |
| 2020 RISE, 2030 goals | Intel 2030 goals announcement |
| 2040 net-zero Scope 1 & 2 | Intel press release, 2022 |
| 2050 net-zero upstream Scope 3 | Intel Climate Transition Action Plan |

⚠️ Two dates were wrong in the first version and both were found by checking
rather than by reading it back. Lead-free was dated 2008 (it was announced in
2007), and the green power milestone was dated 2012 (Intel took the top spot in
2008). The second error also put two milestones in the same year, which the
timeline had no way to show.

## Images

All photography is **CC0** (public domain, commercial use, no attribution
required). Sources are recorded in `assets/CREDITS.json`.

## The one piece of JavaScript

`script.js` drives the scroll-progress rail under the timeline: a dot that
travels as you scroll, a fill behind it, click-to-jump, and arrow-key support.
It **replaces** the native scrollbar rather than sitting beside it.

⚠️ The scrollbar is hidden by a `.has-rail` class the script adds, not by CSS
alone. Hiding it unconditionally would mean a blocked or failed script left
scrollable content with no scrollbar *and* no rail — nothing on screen saying
it scrolls. The affordance is swapped, never removed.

It was CSS scroll-driven animation first — `scroll-timeline` plus
`timeline-scope`, no script at all. That is the more elegant answer and it works
in Chrome, Edge and Safari 26, but not Firefox, where it degrades to a rail that
never moves. A progress rail is worse broken than absent, so it moved to fifteen
lines of JavaScript that work everywhere.

The script owns **position only**. Every colour, size and transition stays in
the stylesheet.

**The one worth writing about:** which card is "active" is derived from
geometry, not remembered from a `mouseenter` event. `mouseenter` and CSS
`:hover` both fire on *pointer* movement — neither reliably updates when an
element slides under a cursor that is holding still. So scrolling past cards
left the dot pointing at the wrong one and the reveal not firing at all.
Recording the pointer position and asking *"which card is nearest it right
now"* is correct at every moment, because it is recomputed rather than
remembered.

Two more details:

- Progress is `scrollLeft / (scrollWidth - clientWidth)`. Dividing by
  `scrollWidth` is the classic version of this bug and makes the dot stop short
  of the end by exactly one screen.
- Scroll events fire far more often than the screen refreshes, so updates are
  batched into `requestAnimationFrame`. Without it the same work runs several
  times between paints, and every run but the last is overwritten before
  anything is drawn.

## Run it

Open `index.html` in a browser. No build step, no dependencies.
