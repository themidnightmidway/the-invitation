(() => {
  const poster = document.getElementById('poster');
  if (!poster) return;

  const HOTSPOTS = {
    event: document.querySelector('.hotspot-event'),
    costumes: document.querySelector('.hotspot-costumes'),
    awaits: document.querySelector('.hotspot-awaits'),
    legend: document.querySelector('.hotspot-legend')
  };

  const ART = {
    event: document.getElementById('art-event'),
    costumes: document.getElementById('art-costumes'),
    awaits: document.getElementById('art-awaits'),
    legend: document.getElementById('art-legend')
  };

  // The two flip wrappers use the exact front/back bounds from TMM(invite)(6).psd.
  // That lets the illustrated back PNGs line up with the front artwork without
  // forcing either image into a fake CSS card shape.
  const FLIP_DATA = {
    costumes: {
      id: 'costume-flip-stage',
      x: 705, y: 621, w: 424, h: 585,
      scale: 1.66,
      front: { src: 'assets/costumes.png', x: 57, y: 22, w: 355, h: 563 },
      back:  { src: 'assets/costume-back.png', x: 0, y: 0, w: 424, h: 584 }
    },
    legend: {
      id: 'legend-flip-stage',
      x: 403, y: 1405, w: 366, h: 478,
      scale: 1.84,
      front: { src: 'assets/legend.png', x: 14, y: 0, w: 349, h: 478 },
      back:  { src: 'assets/legend-back.png', x: 0, y: 4, w: 366, h: 471 }
    }
  };

  function makeFace(face, className) {
    const img = document.createElement('img');
    img.className = `flip-face ${className}`;
    img.src = face.src;
    img.alt = '';
    img.draggable = false;
    img.style.left = `${face.x}px`;
    img.style.top = `${face.y}px`;
    img.style.width = `${face.w}px`;
    img.style.height = `${face.h}px`;
    return img;
  }

  function makeFlipStage(key, data) {
    const stage = document.createElement('div');
    stage.id = data.id;
    stage.className = `poster-flip-stage poster-flip-${key}`;
    stage.style.left = `${data.x}px`;
    stage.style.top = `${data.y}px`;
    stage.style.width = `${data.w}px`;
    stage.style.height = `${data.h}px`;
    stage.style.setProperty('--flip-scale', data.scale);

    const inner = document.createElement('div');
    inner.className = 'poster-flip-inner';
    inner.appendChild(makeFace(data.front, 'flip-face-front'));
    inner.appendChild(makeFace(data.back, 'flip-face-back'));
    stage.appendChild(inner);
    poster.appendChild(stage);
    return stage;
  }

  const FLIP = {
    costumes: makeFlipStage('costumes', FLIP_DATA.costumes),
    legend: makeFlipStage('legend', FLIP_DATA.legend)
  };

  Object.values(HOTSPOTS).forEach(hotspot => {
    if (!hotspot) return;
    hotspot.dataset.swell = 'true';
    hotspot.setAttribute('aria-expanded', 'false');
  });

  let activeKey = null;
  let flipTimer = null;
  let collapseTimer = null;

  function clearTimers() {
    if (flipTimer) clearTimeout(flipTimer);
    if (collapseTimer) clearTimeout(collapseTimer);
    flipTimer = null;
    collapseTimer = null;
  }

  function finishFlipCollapse(key) {
    const stage = FLIP[key];
    if (!stage) return;
    stage.classList.remove('is-expanded', 'is-flipped');
    stage.classList.remove('is-active');
    ART[key]?.classList.remove('flip-source-hidden');
    HOTSPOTS[key]?.setAttribute('aria-expanded', 'false');
    if (activeKey === key) activeKey = null;
  }

  function collapse(key = activeKey, immediate = false) {
    if (!key) return;
    clearTimers();

    if (key === 'costumes' || key === 'legend') {
      const stage = FLIP[key];
      stage?.classList.remove('is-flipped');

      if (immediate) {
        finishFlipCollapse(key);
      } else {
        collapseTimer = setTimeout(() => finishFlipCollapse(key), 430);
      }
      return;
    }

    ART[key]?.classList.remove('is-expanded');
    HOTSPOTS[key]?.setAttribute('aria-expanded', 'false');
    if (activeKey === key) activeKey = null;
  }

  function expandSimple(key) {
    clearTimers();
    if (activeKey && activeKey !== key) collapse(activeKey, true);

    const art = ART[key];
    if (!art) return;
    activeKey = key;
    art.classList.add('is-expanded');
    HOTSPOTS[key]?.setAttribute('aria-expanded', 'true');
  }

  function expandFlip(key) {
    clearTimers();
    if (activeKey && activeKey !== key) collapse(activeKey, true);

    const stage = FLIP[key];
    const source = ART[key];
    if (!stage || !source) return;

    activeKey = key;
    source.classList.add('flip-source-hidden');
    stage.classList.add('is-active');

    requestAnimationFrame(() => {
      stage.classList.add('is-expanded');
      HOTSPOTS[key]?.setAttribute('aria-expanded', 'true');
    });

    // Swell first, then turn over like a physical tag/handbill.
    flipTimer = setTimeout(() => {
      if (activeKey === key) stage.classList.add('is-flipped');
    }, 280);
  }

  function toggle(key) {
    if (activeKey === key) {
      collapse(key);
      return;
    }

    if (key === 'costumes' || key === 'legend') {
      expandFlip(key);
    } else {
      expandSimple(key);
    }
  }

  // Capture phase prevents the older informational dialog listeners in the
  // main script.js from firing. RSVP is not included here and stays unchanged.
  document.addEventListener('click', event => {
    const hotspot = event.target.closest?.('.hotspot[data-swell="true"]');

    if (hotspot) {
      const key = Object.keys(HOTSPOTS).find(name => HOTSPOTS[name] === hotspot);
      if (!key) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle(key);
      return;
    }

    // Clicking/tapping anywhere else returns the active piece to the collage.
    if (activeKey) collapse();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeKey) collapse();
  });
})();
