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

//filter Projekte hauptseite//
document.addEventListener("DOMContentLoaded", () => {
  const filterLinks = document.querySelectorAll(".work-categories a, .submenu a");
  const projects = [...document.querySelectorAll(".project")];
  const container = document.querySelector(".project-list");

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

  container.style.height = Math.max(...colHeights) + "px";
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

  window.addEventListener("resize", layoutMasonry);

  // 🔑 Layout erst nach dem Laden aller Bilder/Videos
  const media = document.querySelectorAll(".project img, .project video");
  let loaded = 0;

  media.forEach(el => {
    if (el.complete || el.readyState >= 3) {
      loaded++;
      if (loaded === media.length) layoutMasonry();
    } else {
      el.addEventListener("load", () => {
        loaded++;
        if (loaded === media.length) layoutMasonry();
      });
      el.addEventListener("loadeddata", () => {
        loaded++;
        if (loaded === media.length) layoutMasonry();
      });
    }
  });

  // Falls keine Medien vorhanden → sofort
  if (media.length === 0) layoutMasonry();
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
