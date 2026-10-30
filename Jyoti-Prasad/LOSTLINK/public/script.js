(function () {
  'use strict';

  var INTRO_KEY = 'lostlink-intro-seen';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rememberIntro() {
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch (error) {
      // Storage can be unavailable in private or file contexts.
    }
  }

  function unlockPage() {
    document.body.classList.remove('intro-active');
    root.classList.remove('intro-pending');
    root.classList.add('intro-done');
  }

  /* ---------- Opening animation ---------- */

  var intro = document.getElementById('intro');

  if (!intro || !root.classList.contains('intro-pending') || reduceMotion) {
    unlockPage();
  } else {
    startIntro(intro);
  }

  function startIntro(overlay) {
    var skipButton = document.getElementById('skipIntro');
    var cycleBox = document.getElementById('introCycle');
    var resolved = document.getElementById('introResolved');
    var status = document.getElementById('introStatus');
    var cycleIcons = Array.prototype.slice.call(overlay.querySelectorAll('.intro__icon'));
    var pinSource = document.querySelector('#introPin svg');
    var lensSource = document.querySelector('#introLens svg');
    var slotO = document.getElementById('logoSlotO');
    var slotI = document.getElementById('logoSlotI');

    var cycleTimer = null;
    var resolveTimer = null;
    var finishTimer = null;
    var iconIndex = 0;
    var finished = false;
    var flightClones = [];

    if (!skipButton || !cycleBox || !resolved || !status || !cycleIcons.length || !pinSource || !lensSource || !slotO || !slotI) {
      unlockPage();
      return;
    }

    document.body.style.setProperty(
      '--scrollbar-compensation',
      Math.max(0, window.innerWidth - document.documentElement.clientWidth) + 'px'
    );
    document.body.classList.add('intro-active');
    skipButton.focus({ preventScroll: true });

    cycleTimer = window.setInterval(function () {
      cycleIcons[iconIndex].classList.remove('is-active');
      iconIndex = (iconIndex + 1) % cycleIcons.length;
      cycleIcons[iconIndex].classList.add('is-active');
    }, 170);

    // Roughly 2s in total: cycle, resolve, then dock both icons in the wordmark.
    resolveTimer = window.setTimeout(function () {
      if (finished) return;
      window.clearInterval(cycleTimer);
      cycleBox.classList.add('is-hidden');
      resolved.classList.add('is-visible');
      status.textContent = 'Aligning brand anchors…';

      finishTimer = window.setTimeout(function () {
        whenFontsReady().then(function () {
          if (!finished) flyToLogo();
        });
      }, 330);
    }, 920);

    function whenFontsReady() {
      if (!document.fonts || !document.fonts.ready) return Promise.resolve();
      return Promise.race([
        document.fonts.ready,
        new Promise(function (resolve) {
          window.setTimeout(resolve, 350);
        })
      ]);
    }

    function flyToLogo() {
      var pinRect = pinSource.getBoundingClientRect();
      var lensRect = lensSource.getBoundingClientRect();
      var targetO = slotO.getBoundingClientRect();
      var targetI = slotI.getBoundingClientRect();

      if (!pinRect.width || !lensRect.width) {
        completeIntro(false);
        return;
      }

      var pinClone = makeClone(pinSource, pinRect);
      var lensClone = makeClone(lensSource, lensRect);
      flightClones = [pinClone, lensClone];
      overlay.classList.add('is-flying');
      status.style.opacity = '0';

      var pinAnimation = moveClone(pinClone, pinRect, targetO);
      var lensAnimation = moveClone(lensClone, lensRect, targetI);

      Promise.all([
        pinAnimation.finished.catch(function () {}),
        lensAnimation.finished.catch(function () {})
      ]).then(function () {
        // The overlay has already faded, so the header is visible behind the flight.
        completeIntro(false);
      });
    }

    function makeClone(sourceSvg, sourceRect) {
      var clone = document.createElement('div');
      var svg = sourceSvg.cloneNode(true);

      clone.className = 'flight-icon';
      clone.style.left = sourceRect.left + 'px';
      clone.style.top = sourceRect.top + 'px';
      clone.style.width = sourceRect.width + 'px';
      clone.style.height = sourceRect.height + 'px';
      clone.appendChild(svg);
      document.body.appendChild(clone);
      return clone;
    }

    function moveClone(clone, sourceRect, targetRect) {
      var deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
      var deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
      var scale = Math.min(targetRect.width / sourceRect.width, targetRect.height / sourceRect.height);

      return clone.animate(
        [
          { transform: 'translate3d(0, 0, 0) scale(1)' },
          {
            transform: 'translate3d(' + deltaX.toFixed(2) + 'px, ' + deltaY.toFixed(2) + 'px, 0) scale(' + scale.toFixed(4) + ')'
          }
        ],
        {
          duration: 760,
          easing: 'cubic-bezier(0.22, 0.8, 0.2, 1)',
          fill: 'forwards'
        }
      );
    }

    function clearFlight() {
      flightClones.forEach(function (clone) {
        clone.getAnimations().forEach(function (animation) {
          animation.cancel();
        });
        clone.remove();
      });
      flightClones = [];
    }

    function revealPage() {
      if (document.activeElement === skipButton) skipButton.blur();
      overlay.hidden = true;
      unlockPage();
    }

    function completeIntro(fade) {
      if (finished) return;
      finished = true;
      window.clearInterval(cycleTimer);
      window.clearTimeout(resolveTimer);
      window.clearTimeout(finishTimer);
      document.removeEventListener('keydown', onKeydown);
      rememberIntro();

      if (fade) {
        overlay.style.transition = 'opacity 0.25s ease';
        overlay.classList.add('is-fading');
        window.setTimeout(function () {
          clearFlight();
          revealPage();
        }, 270);
        return;
      }

      clearFlight();
      revealPage();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        completeIntro(true);
      }
    }

    skipButton.addEventListener('click', function () {
      completeIntro(true);
    });
    document.addEventListener('keydown', onKeydown);
  }

  /* ---------- Magnifier pointer response ---------- */

  var hero = document.querySelector('.hero');
  var lensArea = document.getElementById('lensArea');
  var lensTilt = document.getElementById('lensTilt');
  var lensShine = document.querySelector('.lens-shine');
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hero && lensArea && lensTilt && canHover && !reduceMotion) {
    initLensMovement(hero, lensArea, lensTilt, lensShine);
  }

  function initLensMovement(hoverArea, area, tilt, shine) {
    var current = { x: 0, y: 0, rx: 0, ry: 0 };
    var goal = { x: 0, y: 0, rx: 0, ry: 0 };
    var frame = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function draw() {
      var settled = true;
      var keys = ['x', 'y', 'rx', 'ry'];

      keys.forEach(function (key) {
        var delta = goal[key] - current[key];
        current[key] += delta * 0.08;
        if (Math.abs(delta) > 0.01) settled = false;
      });

      tilt.style.transform =
        'translate3d(' + current.x.toFixed(2) + 'px, ' + current.y.toFixed(2) + 'px, 0) ' +
        'rotateX(' + current.rx.toFixed(2) + 'deg) rotateY(' + current.ry.toFixed(2) + 'deg)';

      if (shine) {
        shine.style.transform =
          'translate3d(' + (current.x * -0.35).toFixed(2) + 'px, ' + (current.y * -0.35).toFixed(2) + 'px, 0)';
      }

      frame = settled ? null : window.requestAnimationFrame(draw);
    }

    function kick() {
      if (!frame) frame = window.requestAnimationFrame(draw);
    }

    hoverArea.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;

      var rect = area.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.4, 1.4);
      var ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1.4, 1.4);

      goal.x = nx * 10;
      goal.y = ny * 8;
      goal.ry = nx * 7;
      goal.rx = ny * -5;
      kick();
    });

    hoverArea.addEventListener('pointerleave', function () {
      goal.x = 0;
      goal.y = 0;
      goal.rx = 0;
      goal.ry = 0;
      kick();
    });
  }
})();
