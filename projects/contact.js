/* =================================================================
   KONTAKT-FENSTER · für alle Seiten (Startseite, Projektseiten, About)
   Einbinden:  Startseite:      <script src="projects/contact.js" defer></script>
               Projektseiten:   <script src="contact.js" defer></script>
   Öffnet sich bei jedem Link, der auf "#contact" endet (z. B. "Contact"
   im Header) und bei Elementen mit data-contact. Die Seite dahinter
   wird weichgezeichnet. Versand wie bisher über Web3Forms.
   ================================================================= */
(function () {
  if (window.__wnContact) return;
  window.__wnContact = true;

  // Pfade relativ zu dieser Datei (liegt in /projects/)
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/[^/]*$/, '') : '';
  var THANKS = base + 'thankyou.html';
  var FONT = base + '../assets/fonts/bodoni-moda.woff2';

  var css = '' +
    '@font-face{font-family:"Bodoni Moda";src:url("' + FONT + '") format("woff2");font-weight:400 900;font-display:swap}' +
    '.cp{position:fixed;inset:0;z-index:2600;--cp-serif:"Bodoni Moda","Bodoni 72","Bodoni MT",Didot,"Times New Roman",serif;--cp-sans:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--cp-r:clamp(14px,1.7vw,22px);--cp-expo:cubic-bezier(.16,1,.3,1);--cp-quart:cubic-bezier(.25,1,.5,1)}' +
    '.cp[hidden]{display:none}' +
    '.cp *,.cp *::before,.cp *::after{box-sizing:border-box}' +
    '.cp-backdrop{position:absolute;inset:0;background:rgba(45,18,22,.22);-webkit-backdrop-filter:blur(22px) saturate(1.15);backdrop-filter:blur(22px) saturate(1.15);opacity:0;transition:opacity .45s var(--cp-quart)}' +
    '.cp-sheet{position:absolute;top:12px;right:12px;max-height:calc(100% - 24px);width:min(600px,calc(100vw - 24px));display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;padding:clamp(22px,3.4vh,40px) clamp(24px,3vw,40px);border-radius:var(--cp-r);background:rgba(248,244,244,.74);-webkit-backdrop-filter:blur(30px) saturate(1.3);backdrop-filter:blur(30px) saturate(1.3);box-shadow:0 0 0 1px rgba(255,255,255,.6) inset,0 40px 80px -30px rgba(30,10,14,.55);color:#1b1b19;font-family:var(--cp-sans);font-size:15px;line-height:1.5;text-align:left;opacity:0;transform:translateX(40px);transition:opacity .45s var(--cp-quart),transform .7s var(--cp-expo)}' +
    '.cp.is-open .cp-backdrop{opacity:1}' +
    '.cp.is-open .cp-sheet{opacity:1;transform:none}' +
    '.cp-close{appearance:none;position:absolute;top:14px;right:14px;width:42px;height:42px;margin:0;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.6);transition:background-color .25s}' +
    '.cp-close:hover{background:#fff}' +
    '.cp-close span{position:absolute;left:13px;right:13px;top:20px;height:1.5px;background:#1b1b19;border-radius:2px}' +
    '.cp-close span:first-child{transform:rotate(45deg)}.cp-close span:last-child{transform:rotate(-45deg)}' +
    '.cp-title{margin:0 52px clamp(8px,1.4vh,14px) 0;font-family:var(--cp-serif);font-weight:400;font-variation-settings:"opsz" 18;font-size:clamp(30px,min(3.4vw,5vh),46px);line-height:.95;letter-spacing:-.01em;text-transform:uppercase;color:#1b1b19}' +
    '.cp-intro{margin:0 0 clamp(14px,2.4vh,26px);font-size:.86rem;line-height:1.55;color:#4a4744}' +
    '.cp-intro p{margin:0 0 6px}' +
    '.cp-direct{margin:0}.cp-direct span{margin-right:6px}' +
    '.cp-direct a{color:#1b1b19;text-decoration:none;border-bottom:1px solid rgba(27,27,25,.3)}' +
    '.cp-direct a:hover{border-bottom-color:#1b1b19}' +
    '.cp form{display:flex;flex-direction:column;gap:clamp(10px,1.8vh,18px);margin:0}' +
    '.cp-q{display:block;margin:0 0 6px;font-family:var(--cp-serif);font-weight:400;font-variation-settings:"opsz" 18;font-size:clamp(1rem,2.1vh,1.2rem);line-height:1.2;letter-spacing:0;color:#1b1b19}' +
    '.cp-row{display:flex;gap:10px}.cp-row > *{flex:1;min-width:0}' +
    '.cp input:not([type=hidden]),.cp textarea{display:block;width:100%;height:clamp(40px,5.2vh,48px);margin:0;padding:0 18px;border:1px solid rgba(255,255,255,.85);border-radius:999px;background:rgba(255,255,255,.5);box-shadow:0 8px 20px -14px rgba(30,10,14,.35),inset 0 1px 0 rgba(255,255,255,.8);font:500 .92rem/1.3 var(--cp-sans);color:#1b1b19;outline:none;transition:background-color .25s,box-shadow .25s,border-color .25s}' +
    '.cp textarea{height:auto;min-height:clamp(84px,14vh,140px);padding:12px 18px;border-radius:20px;line-height:1.5;resize:vertical}' +
    '.cp input::placeholder,.cp textarea::placeholder{color:rgba(27,27,25,.5);opacity:1;font-weight:500;letter-spacing:0;text-transform:none}' +
    '.cp input:focus,.cp textarea:focus{background:rgba(255,255,255,.88);border-color:#fff;box-shadow:0 0 0 3px rgba(115,30,59,.18),0 8px 20px -14px rgba(30,10,14,.35)}' +
    '.cp input:-webkit-autofill{-webkit-text-fill-color:#1b1b19;box-shadow:0 0 0 1000px #fbf7f7 inset!important}' +
    '.cp-send{appearance:none;align-self:flex-start;height:clamp(42px,5.2vh,48px);margin:clamp(2px,.8vh,8px) 0 0;padding:0 24px;border:0;border-radius:999px;background:#1b1b19;color:#fff;font:500 .9rem/1 var(--cp-sans);letter-spacing:.3px;transition:background-color .25s,transform .4s var(--cp-expo)}' +
    '.cp-send:hover{background:#731e3b;transform:translateY(-1px)}' +
    '.cp :focus-visible{outline:2px solid #3b82f6;outline-offset:2px}' +
    'html.cp-lock,html.cp-lock body{overflow:hidden}' +
    '@media (max-width:760px){.cp-sheet{top:auto;left:0;right:0;bottom:0;width:100%;max-height:92svh;max-height:92dvh;border-radius:var(--cp-r) var(--cp-r) 0 0;transform:translateY(40px);padding-bottom:calc(24px + env(safe-area-inset-bottom))}.cp-row{flex-direction:column}.cp-row > *{flex:none}}' +
    '@media (prefers-reduced-motion:reduce){.cp-backdrop,.cp-sheet{transition:none}}';

  var html = '' +
    '<div class="cp-backdrop" data-cp-close></div>' +
    '<div class="cp-sheet" tabindex="-1">' +
      '<button class="cp-close" type="button" aria-label="Kontakt schließen" data-cp-close><span></span><span></span></button>' +
      '<h2 class="cp-title" id="cp-title" data-translate="text_contact_title">Kontakt</h2>' +
      '<div class="cp-intro">' +
        '<p data-translate="text_contact">Bitte erzähl ein wenig über dich. Fülle dieses Formular aus, damit ich dich und deine Bedürfnisse besser kennenlernen kann. Ich bemühe mich, deine Anfrage innerhalb von 24 bis 48 Stunden zu beantworten.</p>' +
        '<p class="cp-direct"><span data-translate="text_directcontact">Oder kontaktiere mich direkt:</span><a href="mailto:info@michelekillmaier.de">info@michelekillmaier.de</a></p>' +
      '</div>' +
      '<form action="https://api.web3forms.com/submit" method="POST">' +
        '<input type="hidden" name="access_key" value="dab9a72d-8d80-497a-8497-48e211c29ffb">' +
        '<input type="hidden" name="redirect" value="' + THANKS + '">' +
        '<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div><span class="cp-q" id="cp-q-name" data-translate="text_contact_name">Hello, mein Name ist</span>' +
          '<div class="cp-row">' +
            '<input type="text" id="cp-firstname" name="firstname" required autocomplete="given-name" placeholder="Vorname" aria-labelledby="cp-q-name">' +
            '<input type="text" id="cp-lastname" name="lastname" required autocomplete="family-name" placeholder="Nachname" aria-labelledby="cp-q-name">' +
          '</div></div>' +
        '<div><label class="cp-q" for="cp-email" data-translate="text_contact_mail">Deine Email</label>' +
          '<input type="email" id="cp-email" name="email" required autocomplete="email" placeholder="E-Mail-Adresse"></div>' +
        '<div><label class="cp-q" for="cp-org" data-translate="text_contact_organisation">Dein Unternehmen</label>' +
          '<input type="text" id="cp-org" name="orgname" required autocomplete="organization" placeholder="Unternehmen"></div>' +
        '<div><label class="cp-q" for="cp-msg" data-translate="text_contact_Problem">Das Problem, das es zu lösen gilt, ist</label>' +
          '<textarea id="cp-msg" name="message" rows="4" placeholder="Erzähl mir mehr …"></textarea></div>' +
        '<button type="submit" class="cp-send" data-translate="text_contact_send">Nachricht senden</button>' +
      '</form>' +
    '</div>';

  function init() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var cp = document.createElement('div');
    cp.className = 'cp';
    cp.id = 'contact-panel';
    cp.setAttribute('role', 'dialog');
    cp.setAttribute('aria-modal', 'true');
    cp.setAttribute('aria-labelledby', 'cp-title');
    cp.hidden = true;
    cp.innerHTML = html;
    document.body.appendChild(cp);

    var sheet = cp.querySelector('.cp-sheet'), root = document.documentElement, back = null, closeT;
    function open() {
      if (!cp.hidden && cp.classList.contains('is-open')) return;
      clearTimeout(closeT);
      back = document.activeElement;
      cp.hidden = false;
      root.classList.add('cp-lock');
      requestAnimationFrame(function () { requestAnimationFrame(function () { cp.classList.add('is-open'); }); });
      setTimeout(function () { var f = sheet.querySelector('#cp-firstname'); (f || sheet).focus({ preventScroll: true }); }, 380);
    }
    function close() {
      cp.classList.remove('is-open');
      root.classList.remove('cp-lock');
      closeT = setTimeout(function () { cp.hidden = true; }, 500);
      if (back && back.focus) back.focus({ preventScroll: true });
      if (location.hash === '#contact') history.replaceState(null, '', location.pathname + location.search);
    }
    window.wnContact = { open: open, close: close };

    // Alle "Contact"-Links und [data-contact] öffnen das Fenster
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.target.closest && e.target.closest('a[href$="#contact"], [data-contact]');
      if (!t || cp.contains(t)) return;
      e.preventDefault();
      open();
    });
    cp.querySelectorAll('[data-cp-close]').forEach(function (el) { el.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (cp.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {                                   // Fokus im Fenster halten
        var f = Array.prototype.filter.call(sheet.querySelectorAll('a[href], button, input:not([type=hidden]):not([name=website]), textarea'), function (x) { return x.offsetParent; });
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    // Seiten ohne Sprachumschalter (Startseite): Fenster trotzdem in der gemerkten Sprache
    var saved = 'de';
    try { saved = localStorage.getItem('lang') || 'de'; } catch (e) {}
    if (saved === 'en' && typeof window.changeLanguage !== 'function' && window.fetch) {
      fetch(base + 'lang_eng.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (tr) {
        if (!tr) return;
        cp.querySelectorAll('[data-translate]').forEach(function (el) {
          var k = el.getAttribute('data-translate');
          if (tr[k] !== undefined) el.innerHTML = tr[k];
        });
      }).catch(function () {});
    }
    if (location.hash === '#contact') setTimeout(open, 450);
    window.addEventListener('hashchange', function () { if (location.hash === '#contact') open(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();