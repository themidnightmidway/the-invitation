const STAGE_W = 1080;
const STAGE_H = 1920;

const posterShell = document.querySelector('.poster-shell');
const intro = document.getElementById('intro');
const enterButton = document.getElementById('enterButton');
const bulbsContainer = document.getElementById('bulbs');
// Reliable touch-device flag for iPhone/iPad Safari.
// Safari can sometimes emulate hover/focus in ways that CSS media queries alone don't catch.
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
if (isTouchDevice) document.documentElement.classList.add('touch-device');


// Paste your deployed Google Apps Script Web App URL here.
// Leave blank while designing. In demo mode, the form still shows the success state.
const GOOGLE_SCRIPT_URL = '';

function fitPoster() {
  const safeW = document.documentElement.clientWidth || window.innerWidth;
  const safeH = document.documentElement.clientHeight || window.innerHeight;
  const scale = Math.min(safeW / STAGE_W, safeH / STAGE_H);
  const scaledW = STAGE_W * scale;
  const scaledH = STAGE_H * scale;
  const x = (safeW - scaledW) / 2;
  const y = (safeH - scaledH) / 2;

  // Position the unscaled Photoshop stage at 0,0, then move and scale it in pixels.
  // This avoids desktop browsers trying to align the 1920px-tall pre-scaled box.
  posterShell.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

fitPoster();
window.addEventListener('resize', fitPoster, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(fitPoster, 80));

enterButton.addEventListener('click', () => {
  intro.classList.add('hidden');
  window.setTimeout(() => intro.remove(), 900);
});

// Exact bulb centers from the 18 named guide layers in TMM(invite)(3).psd.
// These are GLOBAL 1080x1920 Photoshop-stage coordinates, not marquee-local
// coordinates, because the light layer now sits above the full-page grunge texture.
const bulbPoints = [
  [366.5,603.5],[273,615],[172,624],[104,563],[134,473],[90,378],
  [236,302],[325,280],[410,251],[670,251],[758,280],[845,302],
  [990,378],[946,473],[974,563],[904,624],[806,615],[715,604]
];

const bulbNodes = [];

bulbPoints.forEach(([x,y], i) => {
  const bulb = document.createElement('span');
  bulb.className = 'bulb';
  if (i === 3) bulb.classList.add('bad');
  bulb.style.left = `${x}px`;
  bulb.style.top = `${y}px`;

  // Stagger every bulb so the marquee never breathes in sync.
  const pulseDur = 1.35 + (i % 6) * .16;
  const pulseDelay = -((i * .19) % 1.7);
  bulb.style.setProperty('--pulse-dur', `${pulseDur}s`);
  bulb.style.setProperty('--pulse-delay', `${pulseDelay}s`);

  bulbsContainer.appendChild(bulb);
  bulbNodes.push(bulb);
});

let randomFlickerTimer = null;

function scheduleRandomFlicker() {
  const delay = 700 + Math.random() * 1100;
  randomFlickerTimer = window.setTimeout(() => {
    const candidates = bulbNodes.filter(b => !b.classList.contains('bad') && !b.classList.contains('sputter'));
    const bulb = candidates[Math.floor(Math.random() * candidates.length)];
    if (bulb) {
      bulb.classList.add('sputter');
      window.setTimeout(() => bulb.classList.remove('sputter'), 620);
    }
    scheduleRandomFlicker();
  }, delay);
}

// CSS handles the continuous pulse automatically. JS only chooses random bulbs
// for the occasional harder electrical sputter.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scheduleRandomFlicker();
}

const dialogs = [...document.querySelectorAll('dialog')];

document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.dialog);
    if (!dialog) return;

    // Prevent iOS Safari from leaving the invisible hotspot focused after a tap.
    button.blur();

    // Focus the dialog itself instead of Safari auto-focusing the first control
    // (which was the close button and caused the blue box around the X).
    dialog.setAttribute('tabindex', '-1');
    dialog.showModal();

    requestAnimationFrame(() => {
      try {
        dialog.focus({ preventScroll: true });
      } catch {
        dialog.focus();
      }
    });
  });
});

document.querySelectorAll('.close-dialog').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog')?.close());
});

dialogs.forEach(dialog => {
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
});

const rsvpForm = document.getElementById('rsvpForm');
const rsvpSuccess = document.getElementById('rsvpSuccess');
const guestCount = document.getElementById('guestCount');
const guestField = document.querySelector('.ticket-guest-field');

// Always start a fresh page load with the success stamp hidden.
// This also protects against browsers restoring DOM state from back/forward cache.
rsvpForm.classList.remove('is-recorded');
rsvpSuccess.hidden = true;

// The artwork uses square boxes, but these are radio choices underneath so
// a guest can never accidentally answer both Yes and No.
rsvpForm.querySelectorAll('input[name=\"attendance\"]').forEach(choice => {
  choice.addEventListener('change', () => {
    if (!choice.checked) return;

    if (choice.value === 'Regretfully no') {
      guestCount.value = '0';
      guestCount.disabled = true;
      guestField?.classList.add('is-no');
    } else {
      guestCount.disabled = false;
      guestField?.classList.remove('is-no');
      if (!guestCount.value || guestCount.value === '0') guestCount.value = '1';
    }
  });
});

rsvpForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!rsvpForm.reportValidity()) return;

  const submit = rsvpForm.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'RECORDING ADMISSION…';

  const formData = new FormData(rsvpForm);
  if (guestCount.disabled) formData.set('guests', '0');
  formData.append('submittedAt', new Date().toISOString());

  try {
    if (GOOGLE_SCRIPT_URL.trim()) {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
    } else {
      // Demo mode so you can test the complete interaction before connecting Sheets.
      await new Promise(resolve => setTimeout(resolve, 650));
      console.info('RSVP demo submission:', Object.fromEntries(formData.entries()));
    }

    rsvpForm.classList.add('is-recorded');
    rsvpSuccess.hidden = false;
    rsvpSuccess.animate([
      { opacity:0 },
      { opacity:1 }
    ], { duration:360, easing:'ease-out', fill:'both' });
    const stamp = rsvpSuccess.querySelector('.ticket-stamp');
    stamp?.animate([
      { opacity:0, transform:'scale(1.35) rotate(-12deg)' },
      { opacity:1, transform:'scale(1) rotate(-7deg)' }
    ], { duration:430, easing:'cubic-bezier(.16,.88,.23,1.1)', fill:'both' });
  } catch (error) {
    console.error(error);
    submit.disabled = false;
    submit.textContent = 'TRY AGAIN';
    alert('The ticket booth glitched. Please try again.');
  }
});

// Make the Photoshop artwork itself react to its invisible HTML hotspot.
// Hover is only enabled for real mouse/trackpad devices so touchscreens do
// not get stuck in a browser's synthetic :hover state.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

document.querySelectorAll('.hotspot[data-art]').forEach(hotspot => {
  const art = document.getElementById(hotspot.dataset.art);
  if (!art) return;

  const hoverOn = () => {
    if (canHover.matches) art.classList.add('is-hovered');
  };
  const hoverOff = () => art.classList.remove('is-hovered');
  const focusOn = () => art.classList.add('is-focused');
  const focusOff = () => art.classList.remove('is-focused');
  const pressOn = () => art.classList.add('is-pressed');
  const pressOff = () => art.classList.remove('is-pressed');

  hotspot.addEventListener('pointerenter', hoverOn);
  hotspot.addEventListener('pointerleave', () => {
    hoverOff();
    pressOff();
  });
  hotspot.addEventListener('focus', focusOn);
  hotspot.addEventListener('blur', () => {
    focusOff();
    pressOff();
  });
  hotspot.addEventListener('pointerdown', pressOn);
  hotspot.addEventListener('pointerup', pressOff);
  hotspot.addEventListener('pointercancel', pressOff);
});
