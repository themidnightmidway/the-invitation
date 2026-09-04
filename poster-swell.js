(() => {
  const infoHotspots = [
    ['.hotspot-event', 'art-event'],
    ['.hotspot-costumes', 'art-costumes'],
    ['.hotspot-awaits', 'art-awaits'],
    ['.hotspot-legend', 'art-legend']
  ];

  const hotspotMap = new Map();

  infoHotspots.forEach(([selector, artId]) => {
    const hotspot = document.querySelector(selector);
    const art = document.getElementById(artId);
    if (!hotspot || !art) return;

    hotspot.dataset.swell = 'true';
    hotspot.setAttribute('aria-expanded', 'false');
    hotspotMap.set(hotspot, art);
  });

  let expandedHotspot = null;

  function collapseCurrent() {
    if (!expandedHotspot) return;

    const art = hotspotMap.get(expandedHotspot);
    art?.classList.remove('is-expanded');
    expandedHotspot.setAttribute('aria-expanded', 'false');
    expandedHotspot = null;
  }

  function expand(hotspot) {
    const art = hotspotMap.get(hotspot);
    if (!art) return;

    collapseCurrent();
    expandedHotspot = hotspot;
    art.classList.add('is-expanded');
    hotspot.setAttribute('aria-expanded', 'true');
  }

  /*
    Capture phase is deliberate:
    the original site already has click listeners that open text dialogs.
    We intercept ONLY the four informational poster clicks before those
    listeners run. RSVP is untouched and keeps opening the real RSVP form.
  */
  document.addEventListener('click', (event) => {
    const hotspot = event.target.closest?.('.hotspot[data-swell="true"]');

    if (hotspot && hotspotMap.has(hotspot)) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (expandedHotspot === hotspot) {
        collapseCurrent();
      } else {
        expand(hotspot);
      }
      return;
    }

    // Clicking/tapping anywhere else returns the enlarged poster to normal.
    collapseCurrent();
  }, true);

  // Escape also collapses an enlarged poster on desktop.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expandedHotspot) {
      collapseCurrent();
    }
  });
})();