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

  /* The card the dot is currently pointing at, or null when the rail is doing
     its ordinary job of reporting scroll position.

     ⭐ ONE variable is what makes this correct. The two modes -- reporting and
     pointing -- used to be separate code paths that both wrote to the same two
     elements, and they raced: a scroll queued a frame, a hover moved the dot,
     then the queued frame landed and moved it back while it was still lit. */
  let pointed = null;

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

    if (pointed) {
      place(ratioForCard(pointed));
    } else {
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

  function pointAt(card) {
    pointed = card;
    dot.classList.add('is-pointing');
    render();
  }

  function stopPointing() {
    pointed = null;
    dot.classList.remove('is-pointing');
    render();
  }

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mouseenter', function () { pointAt(card); });
    card.addEventListener('mouseleave', stopPointing);
    // The cards are focusable, so the same feedback has to reach the keyboard.
    // Without these, tabbing the timeline moves the reveal but leaves the dot
    // behind, pointing at nothing.
    card.addEventListener('focus', function () { pointAt(card); });
    card.addEventListener('blur', stopPointing);
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
