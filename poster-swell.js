(() => {
  /* =======================================================
     MIDNIGHT MIDWAY
     Tap-to-swell + flip-card behavior

     Replace your existing poster-swell.js with this file.
     The main script.js is NOT changed, so your RSVP /exec
     URL remains untouched.
     ======================================================= */

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

  /* -------------------------------------------------------
     Create the two reverse sides in HTML.
     No additional image assets are needed.
     ------------------------------------------------------- */

  function copyPhotoshopPosition(front, back) {
    ['--x', '--y', '--w', '--h'].forEach(prop => {
      back.style.setProperty(prop, front.style.getPropertyValue(prop));
    });
  }

  function makeBack(id, front, html) {
    const back = document.createElement('div');
    back.id = id;
    back.className = 'flip-card-back';
    copyPhotoshopPosition(front, back);
    back.innerHTML = `<div class="flip-card-copy">${html}</div>`;
    poster.appendChild(back);
    return back;
  }

  const costumeBack = makeBack(
    'costume-card-back',
    ART.costumes,
    `
      <h3>Dark Carnival Attire</h3>
      <div class="attire-list">
        Vintage Carnival • Ringmaster<br>
        Cabaret • Sideshow
      </div>
      <p class="required">Costumes Required</p>
      <p class="disclaimer">
        *Feel free to also wear a costume you're comfortable in.
      </p>
    `
  );

  const legendBack = makeBack(
    'legend-card-back',
    ART.legend,
    `
      <h3>The Legend</h3>
      <div class="legend-story">
        <p>
          They say every carnival has a midway, the stretch of lights and noise
          where games, booths, prizes, food, and rides crowd together after dark.
        </p>
        <p>
          But old stories say the midway is more than a place. Once the bulbs glow
          and the music starts, the outside world begins to feel very far away.
        </p>
        <p>
          Hours pass. Luck changes hands. And the longer the lights stay on, the
          more it feels like somewhere you were always meant to find.
        </p>
      </div>
    `
  );

  const backs = {
    costumes: costumeBack,
    legend: legendBack
  };

  /* Mark only the informational hotspots.
     RSVP is intentionally NOT included. */
  Object.values(HOTSPOTS).forEach(hotspot => {
    if (!hotspot) return;
    hotspot.dataset.swell = 'true';
    hotspot.setAttribute('aria-expanded', 'false');
  });

  let activeKey = null;
  let flipTimer = null;
  let collapseTimer = null;

  function clearTimers() {
    if (flipTimer) {
      clearTimeout(flipTimer);
      flipTimer = null;
    }
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
  }

  function finishCollapse(key) {
    const art = ART[key];
    const back = backs[key];

    art?.classList.remove('is-expanded', 'is-flipped');
    back?.classList.remove('is-expanded', 'is-flipped');

    HOTSPOTS[key]?.setAttribute('aria-expanded', 'false');

    if (activeKey === key) activeKey = null;
  }

  function collapse(key = activeKey, immediate = false) {
    if (!key) return;

    clearTimers();

    const art = ART[key];
    const back = backs[key];

    if (key === 'costumes' || key === 'legend') {
      /* Turn the card face-up first... */
      art?.classList.remove('is-flipped');
      back?.classList.remove('is-flipped');

      /* ...then let it settle back into the collage. */
      if (immediate) {
        finishCollapse(key);
      } else {
        collapseTimer = setTimeout(() => finishCollapse(key), 430);
      }
    } else {
      finishCollapse(key);
    }
  }

  function expandSimple(key) {
    clearTimers();

    if (activeKey && activeKey !== key) {
      collapse(activeKey, true);
    }

    const art = ART[key];
    if (!art) return;

    activeKey = key;
    art.classList.add('is-expanded');
    HOTSPOTS[key]?.setAttribute('aria-expanded', 'true');
  }

  function expandAndFlip(key) {
    clearTimers();

    if (activeKey && activeKey !== key) {
      collapse(activeKey, true);
    }

    const art = ART[key];
    const back = backs[key];
    if (!art || !back) return;

    activeKey = key;

    /* First the physical object swells in its original spot. */
    art.classList.add('is-expanded');
    back.classList.add('is-expanded');
    HOTSPOTS[key]?.setAttribute('aria-expanded', 'true');

    /* Then it turns over. */
    flipTimer = setTimeout(() => {
      if (activeKey !== key) return;
      art.classList.add('is-flipped');
      back.classList.add('is-flipped');
    }, 270);
  }

  function toggle(key) {
    if (activeKey === key) {
      collapse(key);
      return;
    }

    if (key === 'costumes' || key === 'legend') {
      expandAndFlip(key);
    } else {
      expandSimple(key);
    }
  }

  /* -------------------------------------------------------
     Stop the original informational dialogs from opening.
     Capture phase runs before the listeners in main script.js.
     RSVP is untouched.
     ------------------------------------------------------- */

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

    /* Tapping the visible BACK itself turns it face-up and shrinks it. */
    if (
      event.target.closest?.('#costume-card-back') ||
      event.target.closest?.('#legend-card-back')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      collapse();
      return;
    }

    /* Any other click/tap returns the active card/poster to normal. */
    if (activeKey) collapse();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeKey) {
      collapse();
    }
  });
})();
