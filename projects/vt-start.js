/* =================================================================
   SEITENÜBERGANG + REVEAL · läuft im <head>, vor dem ersten Rendern
   1) html.rv: Scroll-Reveals sind aktiv (nicht bei „Bewegung
      reduzieren"). Folgebilder und Text starten dadurch verborgen
      und blitzen beim Laden nicht auf. projekt.js übernimmt danach.
   2) Kommt man per Klick von der Startseite, steht das Vorschaubild
      sofort an seiner alten Position, der Rest der Seite ist noch
      verborgen. Den Flug übernimmt projekt.js.
   Bei normalem Aufruf ohne Übergang passiert bei 2) nichts.
   ================================================================= */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Reveals aktivieren – mit Sicherheitsnetz, falls das Seitenscript nicht lädt
  if (!reduce) {
    root.classList.add('rv');
    setTimeout(function () { if (!root.classList.contains('rv-on')) root.classList.remove('rv'); }, 4000);
  }

  // 2) Startbild des Übergangs
  try {
    var d = JSON.parse(sessionStorage.getItem('wn-fly') || 'null');
    if (!d || Date.now() - d.t > 6000 || reduce) return;
    var s = root.style;
    s.setProperty('--vt-x', d.x + 'px');
    s.setProperty('--vt-y', d.y + 'px');
    s.setProperty('--vt-w', d.w + 'px');
    s.setProperty('--vt-h', d.h + 'px');
    s.setProperty('--vt-r', d.rad + 'px');
    s.setProperty('--vt-img', 'url("' + String(d.thumb || d.src).replace(/"/g, '%22') + '")');
    root.classList.add('vt-pending');
    setTimeout(function () { root.classList.remove('vt-pending'); }, 3000);
  } catch (e) {}
})();