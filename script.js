let slides = document.querySelector(".slides") || null;
let index = 0;


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

function updateSlider() {
   if (!slides) return;
  slides.style.transform = `translateX(${-index * 100}%)`;
}

/* =================================================================
   
   - Das Masonry-Layout wird SOFORT gebaut (die width/height-Angaben
     der Bilder liefern die Proportionen), nicht erst wenn ALLE Bilder
     geladen sind. Dadurch erscheint die Seite sofort sortiert.
   - Jedes nachladende (lazy) Bild/Video löst ein gezieltes Re-Layout
     aus – die Kacheln rücken sauber nach, sobald ihr Bild da ist.
   - Resize wird "entprellt" (debounced), damit es flüssig bleibt.
   ================================================================= */

//filter Projekte hauptseite//
document.addEventListener("DOMContentLoaded", () => {
  const filterLinks = document.querySelectorAll(".work-categories a, .submenu a");
  const projects = [...document.querySelectorAll(".project")];
  const container = document.querySelector(".project-list");
  if (!container) return;

  function getColumnCount() {
    const w = window.innerWidth;
    if (w < 700) return 1;       // Smartphone
    if (w < 1000) return 2;      // Tablet
    return 3;                    // Desktop
  }

  function layoutMasonry() {
    const visibleProjects = projects.filter(p => p.style.display !== "none");
    const style = getComputedStyle(container);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);

    const containerWidth = container.clientWidth - paddingLeft - paddingRight;

    const columnCount = getColumnCount();
    const gap = 20;

    const colWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;
    const colHeights = Array(columnCount).fill(0);

    visibleProjects.forEach((p, i) => {
      const col = i % columnCount;       // feste Reihenfolge statt "kürzeste Spalte"
      const x = paddingLeft + col * (colWidth + gap);
      const y = colHeights[col];

      p.style.width = colWidth + "px";
      p.style.transform = `translate(${x}px, ${y}px)`;

      colHeights[col] += p.offsetHeight + gap;
    });

    container.style.height = Math.max(...colHeights, 0) + "px";
  }

  // Filter
  filterLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const filter = link.dataset.filter;

      projects.forEach(p => {
        if (!filter || filter === "all" || p.dataset.category === filter) {
          p.style.display = "block";
        } else {
          p.style.display = "none";
        }
      });

      layoutMasonry();
    });
  });

  // Resize entprellen (debounce) → flüssiger
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutMasonry, 120);
  });

  // 1) SOFORT layouten – dank width/height an den <img> stimmen die
  //    Proportionen schon, bevor die Bilddaten geladen sind. Die Seite
  //    erscheint also unmittelbar fertig sortiert (kein Warten).
  layoutMasonry();

  // 2) Jedes Medium, das später fertig lädt (lazy), stößt ein gezieltes
  //    Re-Layout an, damit die Kacheln exakt nachrücken.
  const media = document.querySelectorAll(".project img, .project video");
  media.forEach(el => {
    const done = () => layoutMasonry();
    if (el.tagName === "IMG") {
      if (!el.complete) {
        el.addEventListener("load", done, { once: true });
        el.addEventListener("error", done, { once: true });
      }
    } else { // VIDEO
      if (el.readyState < 1) {
        el.addEventListener("loadedmetadata", done, { once: true });
        el.addEventListener("error", done, { once: true });
      }
    }
  });

  // 3) Sicherheitsnetz: nach vollständigem Laden der Seite nochmal.
  window.addEventListener("load", layoutMasonry);
});




// Burgermenü -mobilansicht
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("header nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
});


/* =================================================================
   ABOUT-SEITE · PUNKT 1: Logo fix halten, Navi mitscrollen lassen
   Der Header scrollt auf der About-Seite normal mit (siehe CSS:
   position:absolute). Damit das Logo trotzdem oben links fixiert
   bleibt, fügen wir EINMALIG eine fixe Kopie des Logos ein.
   Greift nur auf <body class="aboutseite"> und nicht auf Mobile.
   ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("aboutseite")) return;

  const headerLogo = document.querySelector("header .logo");
  if (!headerLogo) return;

  // Nicht doppelt einfügen (z. B. bei Re-Init)
  if (document.querySelector(".logo-fixed")) return;

  // Fixe Logo-Kopie erstellen
  const fixedLogo = headerLogo.cloneNode(true);
  fixedLogo.classList.remove("logo");
  fixedLogo.classList.add("logo-fixed");
  fixedLogo.setAttribute("aria-hidden", "false");

  // Optional: Klick aufs Logo führt nach oben / zur Startseite
  const link = document.createElement("a");
  link.href = "../index.html";
  link.appendChild(fixedLogo);
  document.body.appendChild(link);
});


/*about Seite*/
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('.antwort');
  if (!target) {
    console.warn('Antwort-Container (.antwort) nicht gefunden.');
    return;
  }
  const textElement = document.getElementById('antwort-text');
  if (!textElement) {
    console.warn('#antwort-text nicht gefunden.');
    return;
  }

  // --- 1) Robust: alle Textknoten rekursiv in Zeichen-<span>s wickeln (BR bleibt unangetastet)
  function wrapTextNodes(node) {
    // Array.from, weil node.childNodes live NodeList ist
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const txt = child.nodeValue;
        // Wenn nur whitespace (z. B. Zeilenumbruch), trotzdem ersetzen, sonst können Lücken entstehen
        const frag = document.createDocumentFragment();
        for (const ch of txt) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          frag.appendChild(span);
        }
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // <br> sollte erhalten bleiben; rekursiv für alle anderen Elemente
        if (child.tagName !== 'BR') wrapTextNodes(child);
      }
    });
  }

  wrapTextNodes(textElement);

  const chars = textElement.querySelectorAll('.char');
  if (!chars.length) {
    console.warn('Keine Zeichen gefunden zum animieren.');
    return;
  }

  // Animation-Funktion: entfernt .hidden und setzt für jedes Zeichen gestaffelte Animation
  function animateChars() {
    // entferne initiale versteck-Klasse (falls genutzt)
    target.classList.remove('hidden');

    chars.forEach((span, i) => {
      // kleines Delay pro Zeichen (adjustierbar)
      const delay = i * 0.03; // 30ms pro Zeichen
      span.style.animation = `fadeInUp 0.04s ease forwards ${delay}s`;
    });
  }

  // IntersectionObserver: startet, sobald der Container sichtbar wird
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // animieren und Observer trennen (einmalig)
          animateChars();
          observer.disconnect();
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }); // triggert etwas früher
    obs.observe(target);
  } else {
    // Fallback: sofort animieren wenn kein Observer verfügbar
    animateChars();
  }

  // Optional: Debug-Ausgabe
  // console.log(`Bereit: ${chars.length} Zeichen verpackt; Observer gesetzt.`);
});





//aufklappen der Leistungen
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".leistungen .item");

  items.forEach(item => {
    const obert = item.querySelector(".oberthema");
    const details = item.querySelector(".details");

    item.addEventListener("mouseenter", () => {
      obert.style.opacity = "0";
      obert.style.transform = "translateY(-20%)";
      details.style.opacity = "1";
      details.style.transform = "translateY(0)";
    });

    item.addEventListener("mouseleave", () => {
      obert.style.opacity = "1";
      obert.style.transform = "translateY(0)";
      details.style.opacity = "0";
      details.style.transform = "translateY(20%)";
    });
  });
});






// cursor
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


// Funktion zum Laden der JSON-Sprachdatei und Aktualisieren der Texte
async function changeLanguage(lang) {
    try {
        const fileLang = lang === 'en' ? 'eng' : 'de';
        const response = await fetch(`lang_${fileLang}.json`); 
        
        if (!response.ok) throw new Error(`Sprachdatei lang_${fileLang}.json konnte nicht geladen werden.`);
        const translations = await response.json();

        // Alle Elemente mit dem Attribut "data-translate" übersetzen
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.innerHTML = translations[key]; // Ermöglicht <br> Absätze
            }
        });

        // CSS-Klassen für die Buttons anpassen (nur wenn die Buttons existieren!)
        const btnDe = document.getElementById('btn-de');
        const btnEn = document.getElementById('btn-en');
        
        if (btnDe && btnEn) {
            btnDe.classList.toggle('active', lang === 'de');
            btnEn.classList.toggle('active', lang === 'en');
        }
        
        // Sprach-Attribut im HTML-Tag für SEO aktualisieren
        document.documentElement.lang = lang;

    } catch (error) {
        console.error("Fehler beim Sprachwechsel:", error);
    }
}

// Event-Listener sicher einrichten (Prüft vorher, ob die Buttons im HTML existieren)
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
});




/* =================================================================
   LOGO-WECHSEL beim Scrollen (hell/dunkel je nach Hintergrund)
   Prüft bei jedem Scroll, ob das fixe Logo über einer als "dunkel"
   markierten Zone schwebt, und schaltet die Klasse .logo-on-dark.
   Dunkle Zonen: der untere Teil des Verlaufs + das Band.
   ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("aboutseite")) return;

  const logo = document.querySelector(".logo-fixed");
  if (!logo) return;

  // Elemente, deren Bereich als "dunkel" gilt
  const band = document.querySelector(".dyllic-not-great");
  const grain = document.querySelector(".grain-flow");

  function updateLogo() {
    // Mittelpunkt des Logos (vertikal) als Messpunkt
    const logoRect = logo.getBoundingClientRect();
    const logoY = logoRect.top + logoRect.height / 2;

    let onDark = false;

    // Das Band ist komplett dunkel
    if (band) {
      const b = band.getBoundingClientRect();
      if (logoY >= b.top && logoY <= b.bottom) onDark = true;
    }

    // Der Verlauf wird nach UNTEN hin dunkel: nur die untere Hälfte zählt
    if (grain) {
      const g = grain.getBoundingClientRect();
      const darkStart = g.top + g.height * 0.38; // ab ~38% (berechnet aus den Verlaufsstops) wird's dunkel genug
      if (logoY >= darkStart && logoY <= g.bottom) onDark = true;
    }

    logo.classList.toggle("logo-on-dark", onDark);
  }

  // Bei Scroll & Resize aktualisieren (passive für flüssiges Scrollen)
  window.addEventListener("scroll", updateLogo, { passive: true });
  window.addEventListener("resize", updateLogo);
  updateLogo(); // initial
});



/* =================================================================
   ABOUT · KARTEN SCROLL-REVEAL (Mobile)
   Setzt die Klasse .in-view auf jede Karte, sobald sie beim Scrollen
   in den Sichtbereich kommt. Greift nur auf schmalen Ansichten
   (≤760px), wo es kein Hover gibt. Auf Desktop bleibt das
   Hover-Verhalten unangetastet.

   Einbinden: ans Ende von script.js kopieren ODER als eigene Datei
   <script src="about-ergaenzungen.js"></script> NACH script.js laden.
   ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("aboutseite")) return;

  const cards = Array.from(document.querySelectorAll(".card"));
  if (!cards.length) return;

  // Nur auf schmalen Ansichten aktiv (dort kein Hover verfügbar).
  const mq = window.matchMedia("(max-width: 760px)");

  let observer = null;

  function enableReveal() {
    if (observer) return;
    if (!("IntersectionObserver" in window)) {
      // Fallback: einfach alle sichtbar schalten
      cards.forEach((c) => c.classList.add("in-view"));
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Beim Eintreten aufklappen; beim Verlassen wieder schließen,
          // damit der Effekt beim Hoch-/Runterscrollen wiederholbar ist.
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      {
        // Karte gilt als "dran", wenn sie etwa mittig im Viewport steht
        threshold: 0.35,
        rootMargin: "0px 0px -10% 0px",
      }
    );
    cards.forEach((c) => observer.observe(c));
  }

  function disableReveal() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // Auf Desktop keine erzwungene Klasse – Hover übernimmt
    cards.forEach((c) => c.classList.remove("in-view"));
  }

  function apply(e) {
    if (e.matches) enableReveal();
    else disableReveal();
  }

  // initial + bei Breitenwechsel
  apply(mq);
  // addEventListener('change') ist moderner Standard; Fallback addListener
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else if (mq.addListener) mq.addListener(apply);
});


