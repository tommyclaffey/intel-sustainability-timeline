/* ============================================================
   Intel — Sustainability Through the Ages
   Scroll progress for the horizontal timeline.
   ============================================================ */

// Wrapped in an IIFE so nothing here leaks into the global namespace --
// `track`, `fill` and `dot` are common enough names to collide with something
// added later.
(function () {
  'use strict';

  const track = document.querySelector('.track');
  const rail  = document.querySelector('.progress');
  const fill  = document.querySelector('.progress__fill');
  const dot   = document.querySelector('.progress__dot');

  // If any piece is missing, do nothing at all. A half-wired progress bar is
  // worse than none, and a null here would throw and take the rest of the
  // script with it.
  if (!track || !rail || !fill || !dot) return;

  /**
   * How far along the timeline we are, 0 to 1.
   *
   * scrollWidth is the full width of the content; clientWidth is how much of
   * it is visible. The difference is the only distance that can actually be
   * scrolled -- dividing by scrollWidth instead is the classic version of this
   * bug, and it makes the dot stop short of the end by exactly one screen.
   */
  function progress() {
    const scrollable = track.scrollWidth - track.clientWidth;
    if (scrollable <= 0) return null;          // nothing to scroll
    return track.scrollLeft / scrollable;
  }

  function render() {
    const p = progress();

    // Hidden when the content already fits -- on a phone, or a very wide
    // screen. A progress rail reporting on nothing is a control that lies.
    if (p === null) {
      rail.classList.remove('is-active');
      // The native scrollbar comes back with it. These two are one decision:
      // the timeline must always have exactly one scroll affordance, never two
      // and never none.
      document.documentElement.classList.remove('has-rail');
      return;
    }

    rail.classList.add('is-active');
    document.documentElement.classList.add('has-rail');
    const percent = (p * 100).toFixed(2) + '%';
    fill.style.width = percent;
    dot.style.left = percent;
    rail.setAttribute('aria-valuenow', Math.round(p * 100));
  }

  /* Scroll fires far more often than the screen refreshes. Without this the
     same work runs several times between paints, and the extra runs are
     invisible by definition -- they are overwritten before anything is drawn. */
  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      render();
    });
  }

  // `passive: true` promises the listener will not call preventDefault, which
  // lets the browser scroll without waiting to find out. On a touch device
  // that is the difference between smooth and sticky.
  track.addEventListener('scroll', onScroll, { passive: true });

  /* Resizing changes both scrollWidth and clientWidth, so the rail has to be
     recalculated -- including crossing the 768px breakpoint, where the track
     stops scrolling sideways entirely and the rail must hide itself. */
  window.addEventListener('resize', onScroll);

  /* ---- Pointing at a hovered card ----------------------------------------

     Hovering a card sends the dot to sit under that card's centre and lights
     it up, so the rail answers "which one am I looking at" as well as "how far
     along am I".

     Measured in VIEWPORT coordinates, not scroll coordinates. The dot's job is
     to point at where the card is on screen right now, and getBoundingClientRect
     already accounts for the scroll -- converting through scrollLeft would be
     doing the same arithmetic twice, in the wrong direction. */
  function pointAt(card) {
    const cardBox = card.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    if (railBox.width === 0) return;

    const centre = cardBox.left + cardBox.width / 2;
    let ratio = (centre - railBox.left) / railBox.width;

    // A card can be half off-screen at the ends of the scroll. Clamped, so the
    // dot stops at the rail rather than sliding off it.
    ratio = Math.max(0, Math.min(1, ratio));

    const percent = (ratio * 100).toFixed(2) + '%';
    dot.style.left = percent;
    // The fill follows to the same point, so the bar reads as one object
    // moving rather than a dot that has detached from its own track.
    fill.style.width = percent;

    // Only the DOT changes appearance. The fill keeps its gradient and just
    // moves — one action, one change of identity.
    dot.classList.add('is-pointing');
  }

  function stopPointing() {
    dot.classList.remove('is-pointing');
    render();                    // back to reporting scroll position
  }

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mouseenter', function () { pointAt(card); });
    card.addEventListener('mouseleave', stopPointing);
    // The cards are focusable, so the same feedback has to reach the keyboard.
    // Without these, tabbing through the timeline moves the reveal but leaves
    // the dot behind, pointing at nothing.
    card.addEventListener('focus', function () { pointAt(card); });
    card.addEventListener('blur', stopPointing);
  });

  /* Scrolling while pointing would leave the dot stale -- it was placed against
     a card position that has since moved. Pointing is dropped, and the normal
     scroll readout takes over. */
  track.addEventListener('scroll', function () {
    if (dot.classList.contains('is-pointing')) stopPointing();
  }, { passive: true });

  /* Click the rail to jump there. The rail already shows where you are; making
     it show where you COULD be costs four lines and turns a readout into a
     control. */
  rail.addEventListener('click', function (event) {
    const box = rail.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const scrollable = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: ratio * scrollable, behavior: 'smooth' });
  });

  /* Arrow keys, because the markup says role="slider" and tabindex="0".

     A slider that can be focused but not operated is a control that announces
     an ability it does not have -- the same defect as a button with no handler,
     except a screen reader has already told the user it works. Either the role
     comes off or the keys go in; the keys are four lines. */
  rail.addEventListener('keydown', function (event) {
    const step = track.clientWidth * 0.9;   // most of a screen, keeping context
    let delta = 0;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') delta = step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') delta = -step;
    else if (event.key === 'Home') delta = -track.scrollWidth;
    else if (event.key === 'End') delta = track.scrollWidth;
    else return;                            // not ours — let the browser have it

    event.preventDefault();
    track.scrollBy({ left: delta, behavior: 'smooth' });
  });

  // Images change the track's height, not its width, so they cannot move the
  // progress -- but a slow font or a late stylesheet can. One recalculation
  // after load covers it.
  window.addEventListener('load', render);

  render();
})();
