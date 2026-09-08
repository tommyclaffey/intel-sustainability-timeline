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
      return;
    }

    rail.classList.add('is-active');
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
