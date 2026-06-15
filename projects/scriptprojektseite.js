document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a[href^='#']");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});



// curser
document.addEventListener("mousemove", (e) => {
  const circle = document.querySelector(".cursor-circle");
  if (!circle) return;

  circle.style.top = e.clientY + "px";
  circle.style.left = e.clientX + "px";
});

(function () {
  // Don't run on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.documentElement.classList.add('no-touch');
    document.documentElement.classList.add('no-custom-cursor');
    return;
  } else {
    document.documentElement.classList.add('no-touch');
  }

  // Erstelle Cursor-Element
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);

  // Position (verwende lerp/smoothing für weiche Bewegung)
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  const ease = 0.18; // kleiner => träger, größer => näher an Maus

  // Update Mausposition on move
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Stelle sicher, dass cursor sichtbar ist (wenn vorher ausgeblendet)
    cursor.style.display = '';
  });

  // Optional: hide cursor when leaving window (schöner Effekt)
  window.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
  });
  window.addEventListener('mouseenter', (e) => {
    cursor.style.display = '';
    mouseX = e.clientX || mouseX;
    mouseY = e.clientY || mouseY;
  });

  // Interaktion: klickbare Elemente erkennen
  const interactiveSelector = [
    'a[href]',
    'button',
    'input[type="button"]',
    'input[type="submit"]',
    'label',
    '[role="button"]',
    '[onclick]',
    '.clickable',
    'summary'
  ].join(',');

  // Event delegation: mouseover/mouseout auf Dokument
  document.addEventListener('pointerover', (e) => {
    const el = e.target;
    if (el && el.matches && el.matches(interactiveSelector)) {
      cursor.classList.add('cursor--hover');
    }
  });
  document.addEventListener('pointerout', (e) => {
    const el = e.target;
    if (el && el.matches && el.matches(interactiveSelector)) {
      cursor.classList.remove('cursor--hover');
    }
  });

  // Mousedown / mouseup Feedback
  document.addEventListener('mousedown', () => cursor.classList.add('cursor--down'));
  document.addEventListener('mouseup', () => cursor.classList.remove('cursor--down'));

  // Animation Loop (lerp)
  function raf() {
    cursorX += (mouseX - cursorX) * ease;
    cursorY += (mouseY - cursorY) * ease;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Accessibility-Reminder:
  // Wenn jemand Tastatur verwendet (Tab), darf der visuelle Fokus nicht verloren gehen.
  // Wir ändern deshalb niemals outline/focus-styles global.
})();


/* ===================== SLIDER Projektseite ===================== */
/* Zwei Varianten in EINER Initialisierung:
   - .slider--fade  → modernes Überblenden + Dots (gestapelte Slides)
   - sonst          → klassischer translateX-Slider (wie gehabt)
   Beide laufen sauber abgesichert (keine null-Fehler, wenn Pfeile
   oder Slides fehlen). */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.slider').forEach(slider => {
    if (slider.classList.contains('slider--fade')) {
      initFadeSlider(slider);
    } else {
      initSlideSlider(slider);
    }
  });

  /* ---- Klassischer translateX-Slider ---- */
  function initSlideSlider(slider) {
    const slides = slider.querySelector('.slides');
    if (!slides) return;

    const count = slides.children.length;   // img ODER picture
    if (count === 0) return;

    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    let index = 0;

    function updateSlider() {
      slides.style.transform = `translateX(${-index * 100}%)`;
    }
    function go(step) {
      index = (index + step + count) % count;
      updateSlider();
    }

    if (nextBtn) nextBtn.addEventListener('click', () => go(1));
    if (prevBtn) prevBtn.addEventListener('click', () => go(-1));

    // Autoplay nur, wenn keine reduzierte Bewegung gewünscht ist
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let timer = setInterval(() => go(1), 3000);
      slider.addEventListener('mouseenter', () => clearInterval(timer));
      slider.addEventListener('mouseleave', () => {
        timer = setInterval(() => go(1), 3000);
      });
    }
  }

  /* ---- Moderner Fade-Slider mit Dots ---- */
  function initFadeSlider(slider) {
    const track = slider.querySelector('.slides');
    if (!track) return;

    const items = Array.from(track.children); // img ODER picture
    if (items.length === 0) return;

    let current = 0;

    // Dots erzeugen
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'slider__dots';
    dotsWrap.setAttribute('role', 'tablist');
    dotsWrap.setAttribute('aria-label', 'Bildauswahl');

    const dots = items.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider__dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Bild ${i + 1} von ${items.length}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      return dot;
    });
    slider.appendChild(dotsWrap);

    function render() {
      items.forEach((el, i) => el.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-selected', String(active));
      });
    }

    function goTo(i) {
      current = (i + items.length) % items.length;
      render();
      restartAutoplay();
    }

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Tastatur
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });

    // Autoplay: standardmäßig 3s; abschaltbar via data-autoplay="0",
    // respektiert prefers-reduced-motion
    let timer = null;
    const attr = slider.dataset.autoplay;
    const interval = attr === undefined ? 3000 : parseInt(attr, 10);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function startAutoplay() {
      if (reduce || !interval || isNaN(interval)) return;
      timer = setInterval(next, interval);
    }
    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
    slider.addEventListener('focusin', stopAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    render();
    startAutoplay();
  }
});


// Burgermenü -mobilansicht (inkl. aria-expanded)
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("header nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    const open = nav.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
});


// Footer-Jahr dynamisch setzen
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});


/* ===================== SPRACHE DE / EN ===================== */
/* Lädt lang_de.json bzw. lang_eng.json und tauscht alle Texte mit
   [data-translate]. Nutzt innerHTML, damit <br> in den Texten
   erhalten bleiben. Vollständig abgesichert: läuft nur, wenn die
   Sprach-Buttons existieren. */
async function changeLanguage(lang) {
  try {
    const fileLang = lang === 'en' ? 'eng' : 'de';
    const response = await fetch(`lang_${fileLang}.json`);

    if (!response.ok) throw new Error(`Sprachdatei lang_${fileLang}.json konnte nicht geladen werden.`);
    const translations = await response.json();

    // Alle Elemente mit data-translate übersetzen
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[key] !== undefined) {
        element.innerHTML = translations[key]; // erlaubt <br>
      }
    });

    // Aktiven Button markieren (nur falls vorhanden)
    const btnDe = document.getElementById('btn-de');
    const btnEn = document.getElementById('btn-en');
    if (btnDe) btnDe.classList.toggle('active', lang === 'de');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');

    // Sprach-Attribut für SEO aktualisieren
    document.documentElement.lang = lang;

    // Auswahl merken, damit sie beim nächsten Seitenaufruf erhalten bleibt
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }

  } catch (error) {
    console.error("Fehler beim Sprachwechsel:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnDe = document.getElementById('btn-de');
  const btnEn = document.getElementById('btn-en');

  if (btnDe) {
    btnDe.addEventListener('click', (e) => {
      e.preventDefault();
      changeLanguage('de');
    });
  }
  if (btnEn) {
    btnEn.addEventListener('click', (e) => {
      e.preventDefault();
      changeLanguage('en');
    });
  }

  // Gespeicherte Sprache anwenden (nur wenn Buttons existieren)
  if (btnDe || btnEn) {
    let saved = 'de';
    try { saved = localStorage.getItem('lang') || 'de'; } catch (e) { /* ignore */ }
    changeLanguage(saved);
  }
});