/* =========================================================
   MIDNIGHT MIDWAY CAMERA EFFECTS
   Random occasional jiggle + flash.
   Does not touch RSVP logic or Google Apps Script.
   ========================================================= */

(() => {
  const camera = document.getElementById('art-camera');
  const flash = document.getElementById('cameraFlash');
  const enterButton = document.getElementById('enterButton');

  if (!camera || !flash) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let started = false;
  let jiggleTimer = null;
  let flashTimer = null;

  const randomDelay = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  function restartClass(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function jiggleCamera() {
    restartClass(camera, 'camera-jiggle');
    window.setTimeout(() => camera.classList.remove('camera-jiggle'), 520);
  }
function swellCamera() {
  restartClass(camera, 'camera-intro-swell');
  window.setTimeout(() => camera.classList.remove('camera-intro-swell'), 1100);
}
  function fireFlash() {
    restartClass(flash, 'is-flashing');
    window.setTimeout(() => flash.classList.remove('is-flashing'), 520);

    /* Occasionally gives a tiny old-camera double-pop. */
    if (Math.random() < 0.18) {
      window.setTimeout(() => {
        restartClass(flash, 'is-flashing');
        window.setTimeout(() => flash.classList.remove('is-flashing'), 520);
      }, 190);
    }
  }

  function scheduleJiggle() {
    jiggleTimer = window.setTimeout(() => {
      jiggleCamera();
      scheduleJiggle();
    }, randomDelay(10000, 16000));
  }

  function scheduleFlash() {
    flashTimer = window.setTimeout(() => {
      fireFlash();
      scheduleFlash();
    }, randomDelay(18000, 28000));
  }

  function startCameraEffects() {
  if (started) return;
  started = true;

  /* Automatic “artifact” swells right after entering */
  window.setTimeout(swellCamera, 1400);
  window.setTimeout(swellCamera, 5200);

  /* Then the slower ambient camera behavior */
  window.setTimeout(jiggleCamera, randomDelay(8500, 11500));
  window.setTimeout(fireFlash, randomDelay(10000, 14500));

  scheduleJiggle();
  scheduleFlash();
}

  if (enterButton) {
    enterButton.addEventListener('click', () => {
      window.setTimeout(startCameraEffects, 1000);
    }, { once:true });
  } else {
    window.setTimeout(startCameraEffects, 1000);
  }

  window.addEventListener('pagehide', () => {
    if (jiggleTimer) window.clearTimeout(jiggleTimer);
    if (flashTimer) window.clearTimeout(flashTimer);
  });
})();
