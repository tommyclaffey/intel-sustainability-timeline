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

## Run it

Open `index.html` in a browser. No build step, no dependencies.
