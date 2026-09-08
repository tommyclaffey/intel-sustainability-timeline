/* ============================================================
   Intel — Sustainability Through the Ages
   Scroll progress for the horizontal timeline.
   ============================================================ */

(function () {
  'use strict';

  const track = document.querySelector('.track');
  const rail  = document.querySelector('.progress');
  const fill  = document.querySelector('.progress__fill');
  const dot   = document.querySelector('.progress__dot');
  const root  = document.documentElement;

  // If any piece is missing, do nothing. A half-wired progress bar is worse
  // than none, and a null here would throw and take the rest of the file down.
  if (!track || !rail || !fill || !dot) return;

  const cards = Array.prototype.slice.call(document.querySelectorAll('.card'));

  /* ⚠️ Which card is "active" is DERIVED from geometry, not remembered from a
     mouseenter event.

     That was the bug. mouseenter and mouseleave fire when the POINTER moves --
     not when the element moves under a pointer that is holding still. So
     scrolling slid cards past a stationary cursor without firing either event,
     and the dot went on pointing at the card the mouse had originally entered,
     following it off the end of the rail while a different card sat under the
     cursor.

     Storing the last pointer position and asking "which card is under this X
     right now" is correct at every moment, because it is recomputed rather than
     remembered. Scroll, resize and pointer movement all land in the same place
     and none of them can disagree. */
  let pointerX = null;      // last known pointer position, viewport coords
  let focusedCard = null;   // keyboard overrides the pointer

  /**
   * How far along the timeline we are, 0 to 1, or null if nothing can scroll.
   *
   * scrollWidth is the full content width; clientWidth is how much is visible.
   * The difference is the only distance that can actually be scrolled --
   * dividing by scrollWidth is the classic version of this bug and stops the
   * dot short of the end by exactly one screen.
   */
  function progress() {
    const scrollable = track.scrollWidth - track.clientWidth;
    if (scrollable <= 1) return null;
    return track.scrollLeft / scrollable;
  }

  /** Put the dot (and the fill behind it) at a 0–1 position along the rail. */
  function place(ratio) {
    const percent = (Math.max(0, Math.min(1, ratio)) * 100).toFixed(2) + '%';
    dot.style.left = percent;
    fill.style.width = percent;
  }

  /**
   * Where a card sits on the rail.
   *
   * Measured in VIEWPORT coordinates. getBoundingClientRect already accounts
   * for the scroll, so converting through scrollLeft would apply it twice.
   * Because it is live, this stays correct while the track scrolls underneath
   * -- which is why scrolling no longer has to cancel pointing.
   */
  function ratioForCard(card) {
    const cardBox = card.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    if (railBox.width === 0) return 0;
    const centre = cardBox.left + cardBox.width / 2;
    return (centre - railBox.left) / railBox.width;
  }

  /**
   * The card the dot should point at, or null to report scroll position.
   *
   * NEAREST CENTRE rather than "the card containing X". Strict containment
   * leaves the pointer in the gap between two cards belonging to neither, so
   * the dot dropped back to scroll position and re-lit on every gap crossed --
   * a flicker on the way between every pair of cards.
   */
  function activeCard() {
    if (focusedCard) return focusedCard;
    if (pointerX === null || cards.length === 0) return null;

    let best = null;
    let bestDistance = Infinity;
    for (let i = 0; i < cards.length; i += 1) {
      const box = cards[i].getBoundingClientRect();
      const distance = Math.abs((box.left + box.width / 2) - pointerX);
      if (distance < bestDistance) { bestDistance = distance; best = cards[i]; }
    }
    return best;
  }

  /* The single place either mode is drawn. Both used to write to the same
     elements from different functions; now there is one writer and one rule
     for which value it uses. */
  function render() {
    const p = progress();

    // Nothing to scroll -- on a phone, or a very wide screen. The rail hides
    // and the native scrollbar comes back with it, so the timeline always has
    // exactly one scroll affordance: never two, and never none.
    if (p === null) {
      rail.classList.remove('is-active');
      root.classList.remove('has-rail');
      return;
    }

    rail.classList.add('is-active');
    root.classList.add('has-rail');

    const card = activeCard();

    /* The CARD is marked too, not just the dot.

       CSS :hover has the same weakness as mouseenter -- browsers re-evaluate it
       lazily after a scroll, so a card sliding under a stationary cursor often
       does not light up until the mouse is nudged. The reveal looked
       intermittent for exactly the reason the dot did.

       `.is-active` is applied from the same geometry that moves the dot, so the
       two can never disagree about which card is being looked at. The :hover
       rules stay in the stylesheet, so the reveal still works with no JS at
       all -- this makes it consistent, it does not make it possible. */
    cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });

    if (card) {
      dot.classList.add('is-pointing');
      place(ratioForCard(card));
    } else {
      dot.classList.remove('is-pointing');
      place(p);
      rail.setAttribute('aria-valuenow', Math.round(p * 100));
    }
  }

  /* Scroll fires far more often than the screen repaints, so the work batches
     into one frame. Every listener goes through this -- an unbatched render()
     anywhere else silently undoes the batching for the whole file. */
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      render();
    });
  }

  // `passive: true` promises this never calls preventDefault, so the browser
  // can scroll without waiting to find out.
  track.addEventListener('scroll', schedule, { passive: true });

  // Resizing changes scrollWidth and clientWidth both, including across the
  // 768px breakpoint where the track stops scrolling sideways altogether.
  window.addEventListener('resize', schedule);

  /* ---- Pointing at a hovered card ---------------------------------------- */

  /* On the TRACK, not on each card. One listener that records where the pointer
     is, rather than sixteen that try to remember which card it was last inside.
     Scrolling then resolves to the right card for free, because the answer is
     recomputed from the new positions. */
  track.addEventListener('mousemove', function (event) {
    pointerX = event.clientX;
    schedule();
  }, { passive: true });

  track.addEventListener('mouseleave', function () {
    pointerX = null;
    schedule();
  });

  // The cards are focusable, so the same feedback has to reach the keyboard --
  // without this, tabbing the timeline moves the reveal but leaves the dot
  // behind. Focus outranks the pointer: the last deliberate action wins.
  cards.forEach(function (card) {
    card.addEventListener('focus', function () { focusedCard = card; render(); });
    card.addEventListener('blur', function () { focusedCard = null; render(); });
  });

  /* ---- The rail as a control --------------------------------------------- */

  // Click anywhere on it to jump there.
  rail.addEventListener('click', function (event) {
    const box = rail.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const scrollable = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: ratio * scrollable, behavior: 'smooth' });
  });

  /* Arrow keys, because the markup says role="slider" and tabindex="0".

     A slider that can be focused but not operated announces an ability it does
     not have -- the same defect as a button with no handler, except a screen
     reader has already told the user it works. */
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

  // A late font or stylesheet can change the track's measurements after the
  // first paint.
  window.addEventListener('load', render);

  render();
})();
