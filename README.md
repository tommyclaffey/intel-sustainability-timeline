# Intel — Sustainability Through the Ages

Coursework build. A responsive, interactive timeline of Intel's sustainability
milestones, using HTML, CSS and Flexbox.

## How it meets the brief

| Requirement | Where |
|---|---|
| Horizontal on large screens | `.track` is `display:flex; flex-wrap:nowrap; overflow-x:auto` |
| Stacks vertically on small screens | `@media (max-width: 768px)` flips it to `flex-direction: column` |
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

## Images

All photography is **CC0** (public domain, commercial use, no attribution
required). Sources are recorded in `assets/CREDITS.json`.

## The one piece of JavaScript

`script.js` drives the scroll-progress rail under the timeline: a dot that
travels as you scroll, a fill behind it, click-to-jump, and arrow-key support.

It was CSS scroll-driven animation first — `scroll-timeline` plus
`timeline-scope`, no script at all. That is the more elegant answer and it works
in Chrome, Edge and Safari 26, but not Firefox, where it degrades to a rail that
never moves. A progress rail is worse broken than absent, so it moved to fifteen
lines of JavaScript that work everywhere.

The script owns **position only**. Every colour, size and transition stays in
the stylesheet.

Two details in it worth knowing:

- Progress is `scrollLeft / (scrollWidth - clientWidth)`. Dividing by
  `scrollWidth` is the classic version of this bug and makes the dot stop short
  of the end by exactly one screen.
- Scroll events fire far more often than the screen refreshes, so updates are
  batched into `requestAnimationFrame`. Without it the same work runs several
  times between paints, and every run but the last is overwritten before
  anything is drawn.

## Run it

Open `index.html` in a browser. No build step, no dependencies.
