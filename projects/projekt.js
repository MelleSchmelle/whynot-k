/* =================================================================
   PROJEKTSEITE · neue Vorlage (Prototyp: Kitchen)
   1  Seitenübergang: Bild gleitet von der Startseite in die Galerie
   2  Header: Höhe messen, Burger-Menü
   3  Galerie: feste Höhe, läuft beim vertikalen Scrollen seitlich
   4  Nächstes Projekt: gleicher Übergang in die nächste Seite
   5  Sprache DE/EN, Jahr (Cursor: cursor.js, Kontakt: contact.js)
   ================================================================= */

var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
var RV = document.documentElement.classList.contains('rv');   // gesetzt in vt-start.js
if (RV) document.documentElement.classList.add('rv-on');

/* 2a — Header-Höhe als CSS-Variable (früh, damit das Layout stimmt) */
(function () {
  var hdr = document.querySelector('.hdr');
  if (!hdr) return;
  var set = function () { document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px'); };
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(hdr);
})();


/* =================================================================
   1 — SEITENÜBERGANG (Ziel: erstes Bild der Galerie)
   Die Startseite übergibt per sessionStorage ("wn-fly") Position,
   Größe, Bild und eine Mini-Vorschau. vt-start.js im <head> zeigt das
   Bild schon vor dem ersten Rendern an der alten Stelle; hier gleitet
   es auf das Galeriebild.
   ================================================================= */
(function () {
  var root = document.documentElement;
  function release() { root.classList.remove('vt-pending'); }
  var data = null;
  try {
    data = JSON.parse(sessionStorage.getItem('wn-fly') || 'null');
    sessionStorage.removeItem('wn-fly');
  } catch (e) { return release(); }
  if (!data || Date.now() - data.t > 6000 || REDUCE) return release();

  // Ziel: das erste Galeriebild (die übrigen tauchen erst beim Scrollen auf).
  // Tipp: als erstes Bild dasselbe Motiv wie die Kachel auf der Startseite wählen.
  var first = document.querySelector('.pj-item, [data-fly]');
  var hero = first && (first.matches('img, video') ? first : first.querySelector('img, video'));
  if (!hero || !hero.animate) return release();
  var heroFig = hero.closest('.pj-item, [data-fly]');

  function bezier(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
    function b(p1, p2) { return 3 * p2 - 6 * p1; }
    function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      var t = x;
      for (var k = 0; k < 8; k++) {
        var d = at(t, x1, x2) - x, sl = slope(t, x1, x2);
        if (Math.abs(d) < 1e-5 || !sl) break;
        t -= d / sl;
      }
      return at(clamp(t, 0, 1), y1, y2);
    };
  }
  var ease = bezier(.65, 0, .25, 1);
  var DURATION = 1000;

  var tr = heroFig.getBoundingClientRect();
  var t = { x: tr.left, y: tr.top, w: tr.width, h: tr.height };
  var endRad = parseFloat(getComputedStyle(heroFig).borderTopLeftRadius) || 0;

  // Fliegendes Bild in ZIELGRÖSSE, bewegt nur per transform (Grafikkarte)
  var fly = document.createElement('div');
  fly.className = 'vt-fly';
  fly.setAttribute('aria-hidden', 'true');
  fly.style.left = t.x + 'px';
  fly.style.top = t.y + 'px';
  fly.style.width = t.w + 'px';
  fly.style.height = t.h + 'px';
  var pic = document.createElement('img');
  pic.alt = '';
  pic.decoding = 'sync';
  if (data.thumb) pic.style.background = '#dedcd6 center / cover no-repeat url("' + data.thumb + '")';
  if (!/\.(mp4|webm|mov)(\?|#|$)/i.test(data.src)) pic.src = data.src;   // Video-Kachel ohne Poster: nur Vorschaubild
  fly.appendChild(pic);

  function frameAt(p) {
    var sx = (data.w / t.w) + (1 - data.w / t.w) * p;
    var sy = (data.h / t.h) + (1 - data.h / t.h) * p;
    var dx = (data.x - t.x) * (1 - p);
    var dy = (data.y - t.y) * (1 - p);
    var u = Math.max(sx, sy);
    var r = data.rad + (endRad - data.rad) * p;
    return {
      outer: { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', borderRadius: (r / sx) + 'px / ' + (r / sy) + 'px' },
      inner: { transform: 'scale(' + (u / sx) + ',' + (u / sy) + ')' }
    };
  }
  var f0 = frameAt(0);
  fly.style.transform = f0.outer.transform;
  fly.style.borderRadius = f0.outer.borderRadius;
  pic.style.transform = f0.inner.transform;
  document.body.appendChild(fly);
  heroFig.style.opacity = '0';
  window.__vtFlying = true;                  // Galerie lässt das erste Bild in Ruhe, solange es fliegt

  Array.prototype.forEach.call(document.body.children, function (el) {
    if (el === fly || el.tagName === 'SCRIPT') return;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 120, easing: 'ease', fill: 'backwards' });
  });
  release();

  var done = false;
  function cleanup() {
    if (done) return;
    done = true;
    heroFig.style.opacity = '';
    window.__vtFlying = false;
    window.dispatchEvent(new Event('vt:landed'));
    var out = fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, delay: 40, easing: 'ease', fill: 'forwards' });
    out.onfinish = function () { fly.remove(); };
  }
  function revealWhenReady() {
    var ready = hero.tagName === 'VIDEO' ? hero.readyState >= 2 : hero.complete;
    if (ready) return cleanup();
    hero.addEventListener(hero.tagName === 'VIDEO' ? 'loadeddata' : 'load', cleanup, { once: true });
    hero.addEventListener('error', cleanup, { once: true });
    setTimeout(cleanup, 1500);
  }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    var outer = [], inner = [], N = 30;
    for (var i = 0; i <= N; i++) {
      var o = i / N, fr = frameAt(ease(o));
      fr.outer.offset = o; fr.inner.offset = o;
      outer.push(fr.outer); inner.push(fr.inner);
    }
    var opts = { duration: DURATION, easing: 'linear', fill: 'forwards' };
    var anim = fly.animate(outer, opts);
    pic.animate(inner, opts);
    anim.onfinish = revealWhenReady;
  }
  var decoded = pic.decode ? pic.decode().catch(function () {}) : Promise.resolve();
  Promise.race([decoded, new Promise(function (res) { setTimeout(res, 160); })])
    .then(function () { requestAnimationFrame(start); });
  setTimeout(cleanup, 4000);
})();


/* 2b — Burger-Menü */
(function () {
  var hdr = document.querySelector('.hdr');
  var btn = document.querySelector('.burger');
  var menu = document.getElementById('main-nav');
  if (!hdr || !btn || !menu) return;
  var set = function (open) {
    hdr.dataset.open = String(open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };
  set(false);
  btn.addEventListener('click', function (e) {
    var open = hdr.dataset.open !== 'true';
    set(open);
    if (open && e.detail === 0) { var a = menu.querySelector('a'); a && a.focus(); }
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', function (e) { if (hdr.dataset.open === 'true' && !hdr.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.dataset.open === 'true') { set(false); btn.focus(); } });
})();


/* =================================================================
   3 — GALERIE
   Der erste Bildschirm (Titel + Galerie) bleibt beim Scrollen stehen.
   Die Scrollstrecke entspricht genau der Breite der Bildreihe: normales
   Scrollen (Rad, Trackpad, Tastatur) schiebt die Bilder seitlich.
   Zusätzlich: mit der Maus ziehen, Pfeiltasten links/rechts.
   Auf dem Handy stehen die Bilder einfach untereinander.
   ================================================================= */
(function () {
  var stage = document.querySelector('.pj-stage');
  var sticky = document.querySelector('.pj-sticky');
  var gal = document.querySelector('.pj-gal');
  var track = document.querySelector('.pj-track');
  if (!stage || !sticky || !gal || !track) return;
  var items = Array.prototype.slice.call(track.querySelectorAll('.pj-item'));
  var ui = document.querySelector('.pj-ui');
  var countEl = document.querySelector('.pj-count b');
  var bar = document.querySelector('.pj-bar');
  var total = document.querySelector('.pj-total');
  if (total) total.textContent = String(items.length).padStart(2, '0');

  var mq = window.matchMedia('(min-width: 760px) and (min-height: 520px)');
  var travel = 0, cur = 0, tgt = 0, raf = 0, lastIdx = -1;

  /* Reveal der Folgebilder, gekoppelt an die Scrollposition (auch
     rückwärts). Desktop: nach horizontaler Position in der Galerie,
     Handy: nach vertikaler Position im Fenster.
     Variante über <html data-reveal="…">:
       peek   – Fokus-Galerie: aktives Bild 100 %, übrige 80 %, Ränder blenden aus (gewählt)
       center – Folgebilder öffnen sich beim Scrollen aus der Bildmitte
       none   – ohne Effekt */
  var MODE = 'peek', rvItems = [];
  function initReveal(mode) {
    MODE = mode || 'peek';
    items.forEach(function (fig, i) {                // alte Inline-Werte entfernen
      if (i === 0 && window.__vtFlying) return;      // erstes Bild fliegt gerade: nicht anfassen
      fig.style.clipPath = ''; fig.style.opacity = ''; fig.style.transform = '';
      var m = fig.querySelector('img, video'); if (m) m.style.transform = '';
      fig.classList.remove('rv-x');
    });
    rvItems = (RV && MODE !== 'none') ? items.slice(MODE === 'peek' ? 0 : 1).map(function (fig, i) {
      fig.classList.add('rv-x');
      return { fig: fig, media: fig.querySelector('img, video'), last: -1, first: fig === items[0] };
    }) : [];
  }
  initReveal(document.documentElement.dataset.reveal || 'peek');
  var radius = 0;
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  var PEEK_MIN = 0.2, PEEK_OTHER = 0.8;      // Vorschau: Deckkraft am Bildschirmrand / ganz sichtbare Bilder (das aktuelle: 1)
  var PEEK_SCALE = 0.8;                      // Vorschau: Größe am Bildschirmrand
  function setReveal(r, p, c) {
    if (MODE === 'peek') {
      // Fokus-Galerie: p = wie weit das Bild sichtbar ist, c = wie nah es der Mitte ist
      if (r.first && window.__vtFlying) return;
      c = c || 0;
      var key = Math.round(p * 1000) * 1000 + Math.round(c * 1000);
      if (key === r.last) return;
      r.last = key;
      // Nicht aktiv: linear an die Sichtbarkeit gekoppelt (bis zum Rand durchgehend),
      // höchstens PEEK_OTHER. Aktiv (c = 1): immer 100 % und volle Größe.
      var base = Math.min(PEEK_MIN + (1 - PEEK_MIN) * p, PEEK_OTHER);
      var op = base + (1 - base) * c;
      var sc = PEEK_SCALE + (1 - PEEK_SCALE) * p;
      sc = sc + (1 - sc) * c;
      r.fig.style.opacity = op.toFixed(3);
      r.fig.style.transform = sc >= 0.9995 ? 'none' : 'scale(' + sc.toFixed(4) + ')';
      return;
    }
    p = Math.round(p * 1000) / 1000;
    if (p === r.last) return;
    r.last = p;
    var e = easeOut(p);
    // Mitte: Maske öffnet sich aus der Bildmitte, Motiv zoomt leicht heraus
    if (e >= 0.999) {
      r.fig.style.clipPath = 'none';
      if (r.media) r.media.style.transform = '';
    } else {
      var k = ((1 - e) * 50).toFixed(2) + '%';
      r.fig.style.clipPath = 'inset(' + k + ' ' + k + ' ' + k + ' ' + k + ' round ' + radius + 'px)';
      if (r.media) r.media.style.transform = 'scale(' + (1 + 0.12 * (1 - e)).toFixed(4) + ')';
    }
  }
  /* Aktives Bild: das erste Bild von links, das noch vollständig zu sehen
     ist. Sobald es links angeschnitten wird, übernimmt sofort das nächste
     (weich über die ersten ~3 % seiner Breite). Am Ende der Galerie ist
     das letzte Bild aktiv. Liefert pro Bild 0…1; Zähler und Vorschau
     nutzen dasselbe Ergebnis. */
  var CUT = 0.03, hoverIdx = -1, introDone = false;
  function activeWeights() {
    var n = items.length, out = new Array(n);
    if (!travel) {                                    // alles passt ins Fenster: Fokus per Maus, sonst das erste Bild
      for (var j = 0; j < n; j++) out[j] = j === (hoverIdx < 0 ? 0 : hoverIdx) ? 1 : 0;
      return out;
    }
    var leftCut = items.map(function (fig) {          // Anteil, der links abgeschnitten ist
      return clamp(-(fig.offsetLeft - cur) / (fig.offsetWidth || 1), 0, 1);
    });
    for (var i = 0; i < n; i++) {
      var prevGone = i === 0 ? 1 : clamp(leftCut[i - 1] / CUT, 0, 1);
      out[i] = prevGone * (1 - clamp(leftCut[i] / CUT, 0, 1));
    }
    // Ende der Galerie: letztes Bild aktiv
    var t = travel ? clamp((cur / travel - 0.96) / 0.04, 0, 1) : 0;
    if (t > 0) for (var k = 0; k < n; k++) out[k] = k === n - 1 ? Math.max(out[k], t) : out[k] * (1 - t);
    return out;
  }
  function revealH() {                       // Desktop: horizontale Galerie
    if (!rvItems.length) return;
    var gw = gal.clientWidth, R = gw * 0.2;   // Mitte: schneller Aufbau
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var act = MODE === 'peek' ? activeWeights() : null;
    rvItems.forEach(function (r) {
      if (MODE === 'peek') {
        // Sichtbarer Anteil des Bildes (beim Hereinkommen UND Hinauswandern)
        var x = r.fig.offsetLeft - cur, w = r.fig.offsetWidth || 1;
        var vis = Math.max(0, Math.min(x + w, gw) - Math.max(x, 0)) / w;
        // Nähe zum Fokuspunkt: 1 = aktuelles Bild (100 %), sonst 90 %
        var c = act[items.indexOf(r.fig)];
        return setReveal(r, clamp(vis / 0.97, 0, 1), c);
      }
      if (!travel) return setReveal(r, 1);
      var s0 = Math.max(0, r.fig.offsetLeft - gw * 0.92);
      var e0 = Math.min(s0 + R, travel);
      s0 = Math.min(s0, e0 - 1);
      setReveal(r, clamp((cur - s0) / (e0 - s0), 0, 1));
    });
  }
  function revealV() {                       // Handy: Bilder untereinander
    if (!rvItems.length) return;
    var vh = innerHeight;
    rvItems.forEach(function (r) {
      var b = r.fig.getBoundingClientRect();
      if (MODE === 'peek') {
        var h = b.height || 1;
        var vis = Math.max(0, Math.min(b.bottom, vh) - Math.max(b.top, 0)) / h;
        var c = clamp(2 * (1 - Math.abs(b.top + h / 2 - vh / 2) / (h / 2 + 16)), 0, 1);
        return setReveal(r, clamp(vis / 0.97, 0, 1), c);
      }
      setReveal(r, clamp((vh * 0.96 - b.top) / (b.height * 0.35), 0, 1));
    });
  }
  var vRaf = 0;
  window.addEventListener('scroll', function () {
    if (travel || !rvItems.length || vRaf) return;
    vRaf = requestAnimationFrame(function () { vRaf = 0; revealV(); });
  }, { passive: true });

  function measure() {
    if (items[1]) radius = parseFloat(getComputedStyle(items[1]).borderTopLeftRadius) || 0;
    rvItems.forEach(function (r) { r.last = -1; });
    if (!mq.matches || !items.length) {
      stage.classList.remove('no-travel');
      stage.style.height = '';
      track.style.transform = '';
      travel = 0;
      revealV();
      return;
    }
    var last = items[items.length - 1];
    var padR = parseFloat(getComputedStyle(track).paddingRight) || 0;
    travel = Math.max(0, last.offsetLeft + last.offsetWidth + padR - gal.clientWidth);
    stage.style.height = (sticky.offsetHeight + travel) + 'px';
    stage.classList.toggle('no-travel', travel < 1);      // nichts zu scrollen: Zähler ausblenden
    if (!travel) {
      // Bilder kurz nach dem Laden einblenden (gestaffelt), danach Fokus per Hover
      if (introDone) revealH();
      else {
        introDone = true;
        rvItems.forEach(function (r, i) { if (!r.first) r.fig.style.transitionDelay = (0.25 + i * 0.12) + 's'; });
        setTimeout(function () {
          revealH();
          setTimeout(function () { rvItems.forEach(function (r) { r.fig.style.transitionDelay = ''; }); }, 1400);
        }, window.__vtFlying ? 700 : 120);
      }
    }
    onScroll(true);
  }

  function progress() {
    var top = stage.getBoundingClientRect().top;
    return travel ? clamp(-top / travel, 0, 1) : 0;
  }

  function paint() {
    track.style.transform = 'translate3d(' + (-cur).toFixed(2) + 'px,0,0)';
    revealH();
    var p = travel ? cur / travel : 0;
    if (bar) bar.style.setProperty('--p', p.toFixed(4));
    if (ui) ui.classList.toggle('is-end', p > .98);
    // Zähler: aktives Bild (gleiche Regel wie die Vorschau)
    var aw = activeWeights(), best = 0;
    for (var i = 1; i < aw.length; i++) if (aw[i] > aw[best]) best = i;
    if (best !== lastIdx && countEl) { countEl.textContent = String(best + 1).padStart(2, '0'); lastIdx = best; }
  }

  function loop() {
    var k = REDUCE ? 1 : 0.16;
    cur += (tgt - cur) * k;
    if (Math.abs(tgt - cur) < 0.3) cur = tgt;
    paint();
    raf = cur !== tgt ? requestAnimationFrame(loop) : 0;
  }

  function onScroll(jump) {
    if (!travel) return;
    tgt = progress() * travel;
    if (jump === true) { cur = tgt; paint(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', function () { onScroll(); }, { passive: true });
  var rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(measure, 120); });
  if (mq.addEventListener) mq.addEventListener('change', measure);
  measure();
  window.addEventListener('load', measure);
  // Bilder ohne Maßangaben: nach dem Laden die Galerie neu vermessen
  var mT;
  items.forEach(function (fig) {
    var m = fig.querySelector('img, video');
    if (!m) return;
    m.addEventListener(m.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', function () {
      clearTimeout(mT); mT = setTimeout(measure, 60);
    });
  });

  // Galerie ohne Scrollstrecke: Bild unter der Maus wird aktiv
  items.forEach(function (fig, i) {
    fig.addEventListener('mouseenter', function () {
      if (travel || !mq.matches || MODE !== 'peek') return;
      hoverIdx = i; revealH();
    });
  });
  gal.addEventListener('mouseleave', function () {
    if (travel || hoverIdx < 0) return;
    hoverIdx = -1; revealH();
  });

  window.addEventListener('vt:landed', function () {
    rvItems.forEach(function (r) { r.last = -1; });
    if (travel) revealH(); else revealV();
  });

  // Ziehen mit der Maus → Seite scrollt entsprechend
  var drag = null, suppress = false;
  gal.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !travel) return;
    drag = { x: e.clientX, last: e.clientX, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.last;
    if (!drag.moved && Math.abs(e.clientX - drag.x) > 5) { drag.moved = true; gal.classList.add('is-drag'); }
    if (drag.moved) window.scrollBy(0, -dx);
    drag.last = e.clientX;
  });
  window.addEventListener('pointerup', function () {
    if (drag && drag.moved) { suppress = true; setTimeout(function () { suppress = false; }, 60); }
    drag = null;
    gal.classList.remove('is-drag');
  });
  gal.addEventListener('click', function (e) { if (suppress) { e.preventDefault(); e.stopPropagation(); } }, true);
  gal.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // Pfeiltasten links/rechts: zum vorherigen/nächsten Bild
  window.addEventListener('keydown', function (e) {
    if (!travel || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var r = stage.getBoundingClientRect();
    if (r.top > 1 || r.bottom < innerHeight - 1) return;   // nur solange die Galerie steht
    var idx = clamp(lastIdx + (e.key === 'ArrowRight' ? 1 : -1), 0, items.length - 1);
    var padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    var x = clamp(items[idx].offsetLeft - padL, 0, travel);
    window.scrollTo({ top: window.scrollY + r.top + x, behavior: REDUCE ? 'auto' : 'smooth' });
    e.preventDefault();
  });
})();


/* =================================================================
   3b — TEXT-REVEAL
   .rv-lines: wird beim Erreichen in Zeilen geteilt, die nacheinander
              aus einer Maske nach oben gleiten. Danach wird der
              Originaltext wiederhergestellt (sauberer Umbruch beim
              Ändern der Fenstergröße, DE/EN funktioniert weiter).
   .rv-fade:  weich nach oben einblenden; Geschwister staffeln sich.
   ================================================================= */
(function () {
  if (!RV || !('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('rv');
    return;
  }
  var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  function splitLines(el) {
    var orig = el.innerHTML;
    el.__rvOrig = orig;                              // für den Sprachwechsel während der Animation
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="rv-w">' + esc(w) + '</span>'; }).join(' ');
    var lines = [], top = null;
    Array.prototype.forEach.call(el.querySelectorAll('.rv-w'), function (sp) {
      if (top === null || Math.abs(sp.offsetTop - top) > 2) { lines.push([]); top = sp.offsetTop; }
      lines[lines.length - 1].push(sp.textContent);
    });
    el.innerHTML = lines.map(function (l, i) {
      return '<span class="rv-line" style="--i:' + i + '"><span>' + esc(l.join(' ')) + '</span></span>';
    }).join('');
    el.classList.add('is-split');
    void el.offsetWidth;
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      if (el.classList.contains('is-split') && el.querySelector('.rv-line')) el.innerHTML = orig;
      el.classList.remove('is-split');
      el.classList.add('is-done');
    }, 1150 + lines.length * 90 + 120);
  }

  // Staffelung für Geschwister (z. B. die drei Textspalten)
  var groups = new Map();
  document.querySelectorAll('.rv-fade').forEach(function (el) {
    var n = groups.get(el.parentElement) || 0;
    el.style.setProperty('--rv-d', (n * 0.1) + 's');
    groups.set(el.parentElement, n + 1);
  });

  var pending = Array.prototype.slice.call(document.querySelectorAll('.rv-lines, .rv-fade'));
  function show(el) {
    var k = pending.indexOf(el);
    if (k < 0) return;
    pending.splice(k, 1);
    io.unobserve(el);
    if (el.classList.contains('rv-lines')) splitLines(el);
    else el.classList.add('is-in');
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) show(en.target); });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  pending.forEach(function (el) { io.observe(el); });

  // Absicherung bei Sprüngen (Ende-Taste, Anker): alles oberhalb der
  // Fensterunterkante wird in jedem Fall eingeblendet
  var sRaf = 0;
  window.addEventListener('scroll', function () {
    if (sRaf || !pending.length) return;
    sRaf = requestAnimationFrame(function () {
      sRaf = 0;
      pending.slice().forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) show(el); });
    });
  }, { passive: true });
})();


/* =================================================================
   4 — NÄCHSTES PROJEKT: gleicher Übergang wie von der Startseite
   ================================================================= */
(function () {
  var link = document.querySelector('.pj-next');
  if (!link) return;
  var box = link.querySelector('.pj-next-img');
  link.addEventListener('click', function (e) {
    if (REDUCE || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !box) return;
    var media = box.querySelector('img, video');
    if (!media) return;
    var src = media.tagName === 'VIDEO' ? (media.getAttribute('poster') || media.currentSrc) : (media.currentSrc || media.getAttribute('src'));
    if (!src) return;
    src = new URL(src, location.href).href;
    var key = decodeURIComponent(new URL(src).pathname.split('/').pop() || '').replace(/\.[^.]+$/, '');
    var r = box.getBoundingClientRect();
    var rad = parseFloat(getComputedStyle(box).borderTopLeftRadius) || 0;
    var thumb = '';
    try {
      var iw = media.naturalWidth || media.videoWidth, ih = media.naturalHeight || media.videoHeight;
      if (iw && ih) {
        var k = 160 / Math.max(iw, ih);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(iw * k));
        c.height = Math.max(1, Math.round(ih * k));
        c.getContext('2d').drawImage(media, 0, 0, c.width, c.height);
        thumb = c.toDataURL('image/jpeg', 0.7);
      }
    } catch (err) { thumb = ''; }
    try {
      sessionStorage.setItem('wn-fly', JSON.stringify({ src: src, key: key, thumb: thumb, x: r.left, y: r.top, w: r.width, h: r.height, rad: rad, t: Date.now() }));
    } catch (err) { return; }
    e.preventDefault();
    var ghost = document.createElement('img');
    ghost.alt = '';
    ghost.decoding = 'sync';
    ghost.src = src;
    if (media.tagName === 'VIDEO' && media.videoWidth) {
      try {                                           // Video: aktuelles Bild statt Poster fliegen lassen
        var dpr = Math.min(2, window.devicePixelRatio || 1), fc = document.createElement('canvas');
        fc.width = Math.round(r.width * dpr); fc.height = Math.round(r.height * dpr);
        var vk = Math.max(fc.width / media.videoWidth, fc.height / media.videoHeight);
        var vw = media.videoWidth * vk, vh = media.videoHeight * vk;
        fc.getContext('2d').drawImage(media, (fc.width - vw) / 2, (fc.height - vh) / 2, vw, vh);
        ghost.src = fc.toDataURL('image/jpeg', 0.85);
      } catch (err) { /* Poster bleibt */ }
    }
    ghost.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + rad + 'px;object-fit:cover;z-index:2147483000;pointer-events:none;margin:0;max-width:none';
    document.body.appendChild(ghost);
    var anims = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === ghost || el.tagName === 'SCRIPT' || (el.classList.contains('custom-cursor') || el.classList.contains('wn-cursor'))) return;
      anims.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease', fill: 'forwards' }));
    });
    var href = link.getAttribute('href');
    setTimeout(function () { location.href = href; }, 260);
    window.addEventListener('pageshow', function (ev) {
      if (!ev.persisted) return;
      anims.forEach(function (a) { a.cancel(); });
      ghost.remove();
    }, { once: true });
  });
})();


/* =================================================================
   5 — SPRACHE DE / EN
   Deutsch steht direkt im HTML. Englisch kommt aus lang_eng.json;
   beim Zurückschalten werden die deutschen Originaltexte wiederhergestellt.
   ================================================================= */
var I18N_DE = new Map();                       // Element → deutscher Originaltext
async function changeLanguage(lang) {
  try {
    var els = document.querySelectorAll('[data-translate]');
    els.forEach(function (el) {                  // Originaltext merken (nicht die Zeilen-Zerlegung der Animation)
      if (!I18N_DE.has(el)) I18N_DE.set(el, el.classList.contains('is-split') && el.__rvOrig ? el.__rvOrig : el.innerHTML);
    });
    var tr = null;
    if (lang === 'en') {
      var response = await fetch('lang_eng.json');
      if (!response.ok) throw new Error('Sprachdatei lang_eng.json konnte nicht geladen werden.');
      tr = await response.json();
    }
    els.forEach(function (el) {
      var key = el.getAttribute('data-translate');
      if (!tr) el.innerHTML = I18N_DE.get(el);
      else if (tr[key] !== undefined) el.innerHTML = tr[key];
    });
    var de = document.getElementById('btn-de'), en = document.getElementById('btn-en');
    if (de) de.classList.toggle('active', lang !== 'en');
    if (en) en.classList.toggle('active', lang === 'en');
    document.documentElement.lang = lang === 'en' ? 'en' : 'de';
    try { localStorage.setItem('lang', lang === 'en' ? 'en' : 'de'); } catch (e) {}
  } catch (error) {
    console.error('Fehler beim Sprachwechsel:', error);
  }
}
document.addEventListener('DOMContentLoaded', function () {
  var de = document.getElementById('btn-de'), en = document.getElementById('btn-en');
  if (de) de.addEventListener('click', function (e) { e.preventDefault(); changeLanguage('de'); });
  if (en) en.addEventListener('click', function (e) { e.preventDefault(); changeLanguage('en'); });
  var saved = 'de';
  try { saved = localStorage.getItem('lang') || 'de'; } catch (e) {}
  if (saved === 'en' && (de || en)) changeLanguage('en');
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});


/* Cursor: siehe cursor.js (gemeinsam für alle Seiten) */


/* =================================================================
   6 — ERZÄHLSEITE (body.pj-story): Hintergrund Tag → Nacht
   Startpunkt: [data-st-start] erreicht die Bildschirmmitte.
   Endpunkt:   Mitte von [data-st-end] erreicht die Bildschirmmitte.
   Dazwischen wird --pj-bg weich gemischt; Header und Footer folgen
   automatisch (Ton in Ton). Ab der Hälfte: body.is-night.
   ================================================================= */
(function () {
  var body = document.body;
  if (!document.querySelector('.st-seq')) return;      // Bildfolge vorhanden → Reveal; Tag/Nacht nur mit body.pj-story
  var a = document.querySelector('[data-st-start]');
  var b = document.querySelector('[data-st-end]');
  var story = body.classList.contains('pj-story') && a && b;
  var cs = getComputedStyle(body);
  var DAY = cs.getPropertyValue('--st-day').trim() || '#ecebe7';
  var NIGHT = cs.getPropertyValue('--st-night').trim() || '#0c0321';
  var smooth = function (x) { return x * x * (3 - 2 * x); };
  var last = -1, raf = 0;

  function update() {
    raf = 0;
    if (!story) return;
    var mid = innerHeight / 2;
    var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var s = ra.top - mid;                         // > 0: Start noch unterhalb der Mitte
    var e = rb.top + rb.height / 2 - mid;
    var t = s >= 0 ? 0 : clamp(-s / Math.max(1, e - s), 0, 1);
    t = Math.round(smooth(t) * 1000) / 1000;
    if (t !== last) {
    last = t;
    body.style.setProperty('--pj-bg', t <= 0 ? DAY : t >= 1 ? NIGHT
      : 'color-mix(in oklch, ' + NIGHT + ' ' + (t * 100).toFixed(1) + '%, ' + DAY + ')');
    body.classList.toggle('is-night', t >= 0.5);
    }
  }
  /* Bildfolge: Reveal + Parallax, direkt an die Scrollposition gekoppelt */
  var figs = Array.prototype.map.call(document.querySelectorAll('.st-seq .st-fig'), function (fig) {
    var img = fig.querySelector('img');
    var clip = document.createElement('span');          // Maske um das Bild
    clip.className = 'st-clip';
    img.parentNode.insertBefore(clip, img);
    clip.appendChild(img);
    var row = fig.closest('.st-row');
    return { fig: fig, clip: clip, img: img, flat: fig.classList.contains('is-plan'), lag: row && fig !== row.firstElementChild ? 0.14 : 0, last: '' };
  });
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  function reveal() {
    var vh = innerHeight;
    figs.forEach(function (f) {
      var r = f.fig.getBoundingClientRect();
      if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;   // weit außerhalb: nichts tun
      // 0 → Bild kommt unten herein, 1 → oberes Drittel erreicht
      var p = clamp((vh - r.top) / (vh * 0.62) - f.lag, 0, 1);
      var e = easeOut(p);
      var k = (1 - e) * 16;                                       // Maske: aus der Mitte auf
      var par = REDUCE || f.flat ? 0 : clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1) * -4;   // Parallax in %
      var sc = f.flat ? 1 : 1.08 + 0.17 * (1 - e);              // Pläne (is-plan): nie beschneiden
      var key = k.toFixed(2) + '|' + par.toFixed(2);
      if (key === f.last) return;
      f.last = key;
      f.clip.style.clipPath = k < 0.05 ? 'none' : 'inset(' + k.toFixed(2) + '% ' + k.toFixed(2) + '% round ' + radius + 'px)';
      f.clip.style.opacity = Math.min(1, e * 2.2).toFixed(3);
      f.img.style.transform = 'translate3d(0,' + par.toFixed(2) + '%,0) scale(' + sc.toFixed(4) + ')';
    });
  }
  var radius = figs.length ? parseFloat(getComputedStyle(figs[0].clip).borderTopLeftRadius) || 10 : 10;
  figs.forEach(function (f) {                           // nach dem Laden neu messen (Bilder ohne Maßangaben)
    if (!f.img.complete) f.img.addEventListener('load', function () { f.last = ''; req(); }, { once: true });
  });
  if (REDUCE || !document.documentElement.classList.contains('rv')) {
    figs.forEach(function (f) { f.clip.style.clipPath = 'none'; f.clip.style.opacity = '1'; f.img.style.transform = 'none'; });
    reveal = function () {};
  }
  var updateBg = update;
  update = function () { updateBg(); reveal(); };
  function req() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  update();

  // Bildpaare: gleiche Höhe – Breite im Verhältnis der Seitenformate
  Array.prototype.forEach.call(document.querySelectorAll('.st-row > .st-fig img'), function (img) {
    function set() {
      if (img.naturalWidth) img.closest('.st-fig').style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
      var row = img.closest('.st-row'), sum = 0, all = true;
      Array.prototype.forEach.call(row.querySelectorAll('img'), function (m) {
        if (m.naturalWidth) sum += m.naturalWidth / m.naturalHeight; else all = false;
      });
      if (all) { row.style.setProperty('--sum', sum.toFixed(4)); row.style.setProperty('--gaps', row.children.length - 1); }
      req();
    }
    if (img.complete) set(); else img.addEventListener('load', set, { once: true });
  });
})();


/* =================================================================
   7 — LUPE (.st-lens): Kreis folgt der Maus, zeigt darin die KI-Fassung.
   Ohne Maus gleitet er zurück auf data-x / data-y. Touch: antippen/ziehen.
   ================================================================= */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.st-lens'), function (box) {
    var hx = (box.dataset.x || 50) + '%', hy = (box.dataset.y || 50) + '%';
    function home() { box.classList.remove('is-live'); box.style.setProperty('--x', hx); box.style.setProperty('--y', hy); }
    function to(e) {
      var b = box.getBoundingClientRect();
      box.style.setProperty('--x', clamp(e.clientX - b.left, 0, b.width) + 'px');
      box.style.setProperty('--y', clamp(e.clientY - b.top, 0, b.height) + 'px');
    }
    home();
    box.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      to(e);                                            // weich hinüber gleiten …
      setTimeout(function () { box.classList.add('is-live'); }, 220);   // … dann direkt folgen
    });
    box.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && box.classList.contains('is-live')) to(e); });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') home(); });
    box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { box.classList.remove('is-live'); to(e); } });
    box.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse' && e.pressure > 0) { box.classList.add('is-live'); to(e); } });
    box.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') box.classList.remove('is-live'); });
  });
})();


/* =================================================================
   8 — VORHER / NACHHER-REGLER (.st-cmp)
   Ziehen (Maus/Finger), Klick/Tipp springt hin, Pfeiltasten.
   Beim ersten Erscheinen gleitet der Regler kurz hin und her.
   ================================================================= */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.st-cmp'), function (box) {
    if (box.dataset.cmp) return; box.dataset.cmp = '1';
    var v = 50, tagA = box.querySelector('.st-cmp-tag.is-a'), tagB = box.querySelector('.st-cmp-tag.is-b');
    function set(x) {
      v = clamp(x, 0, 100);
      box.style.setProperty('--pos', v.toFixed(2) + '%');
      box.setAttribute('aria-valuenow', Math.round(v));
      if (tagA) tagA.style.opacity = v < 16 ? 0 : 1;
      if (tagB) tagB.style.opacity = v > 84 ? 0 : 1;
    }
    function at(e) { var b = box.getBoundingClientRect(); return (e.clientX - b.left) / b.width * 100; }
    var drag = null;
    box.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: e.pointerType === 'mouse' };
      if (drag.on) { box.setPointerCapture(e.pointerId); box.classList.add('is-drag'); set(at(e)); }
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {                                   // Touch: erst bei waagerechter Bewegung übernehmen
        if (Math.abs(e.clientX - drag.x) > 8 && Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y)) {
          drag.on = true; box.classList.add('is-drag');
        } else return;
      }
      set(at(e));
    });
    function end(e) {
      if (!drag) return;
      if (!drag.on && e && e.type === 'pointerup') set(at(e));   // Tipp: dorthin springen
      drag = null; box.classList.remove('is-drag');
    }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', function () { drag = null; box.classList.remove('is-drag'); });
    box.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowLeft' ? -4 : e.key === 'ArrowRight' ? 4 : e.key === 'Home' ? -100 : e.key === 'End' ? 100 : 0;
      if (!d) return; e.preventDefault(); set(v + d);
    });
    set(+(box.dataset.start || 50));
    if (REDUCE || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var from = v, t0 = null;
      setTimeout(function () {
        requestAnimationFrame(function step(ts) {
          if (drag) return;
          if (t0 === null) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1600);
          set(from - Math.sin(k * Math.PI * 2) * 16 * (1 - k));
          if (k < 1) requestAnimationFrame(step);
        });
      }, 450);
    }, { threshold: 0.55 });
    io.observe(box);
  });
})();