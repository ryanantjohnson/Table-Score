/* TableRec's welcome tour and curated release notes. No network or permissions. */
(() => {
  'use strict';
  // Change this ID and its copy together for each customer-facing release.
  // Store build numbers can differ across iOS and Android.
  const releaseNotesId = 'feedback-location-2';
  const build = window.tableRecBuild;
  const release = build ? `${releaseNotesId}:${build.platform}:${build.version}:${build.number}` : releaseNotesId;
  function versionLabel() {
    if (build) return `Version ${build.version} · Build ${build.number}`;
    return 'Version ' + (typeof TABLESCORE_VERSION !== 'undefined' ? TABLESCORE_VERSION : '1.0') + ' · Web preview';
  }
  const seenKey = 'tr_intro_release';
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const returning = !!(read(seenKey) || read('ts_current_screen') || read('ts_location_mode'));
  let shownThisSession = false, overlay, previousFocus, page = 0, mode = 'tour', timer;
  let background = [], previousOverflow = '';
  const slides = [
    ['Rate your bite.', 'Your taste. Your TableRec.', 'Find a restaurant in Rate, score the seven categories from 0 to 10, then save. Add a photo or a note if you like.', 'rate'],
    ['Find your next favorite.', 'Good food, closer to you.', 'Explore Discover for nearby restaurants and community ratings. Use your location or choose a city from the location pin.', 'discover'],
    ['Can’t decide? Run It.', 'Let dinner surprise you.', 'Open RUN IT, pick what you’re in the mood for, and spin. See a place you like? Open it for a closer look.', 'dice'],
    ['Bring your people.', 'Good bites are better shared.', 'Find friends with People search, follow them, and see their ratings in your feed. Keep your account private if you prefer.', 'people'],
    ['One last little step.', 'Check your inbox.', 'After signing up, open the TableRec email and confirm your account. Check spam or tap Resend email if it hasn’t arrived.', 'mail']
  ];
  const paths = {
    rate: '<path d="m48 18 8 17 19 3-14 14 3 20-16-9-17 9 3-20-14-14 19-3Z"/>',
    discover: '<path d="M69 40c0 16-21 37-21 37S27 56 27 40a21 21 0 1 1 42 0Z"/><circle cx="48" cy="40" r="7"/>',
    dice: '<rect x="23" y="23" width="50" height="50" rx="12" transform="rotate(-9 48 48)"/><circle cx="36" cy="36" r="3"/><circle cx="60" cy="36" r="3"/><circle cx="48" cy="48" r="3"/><circle cx="36" cy="60" r="3"/><circle cx="60" cy="60" r="3"/>',
    people: '<circle cx="40" cy="34" r="11"/><path d="M20 72v-8a20 20 0 0 1 40 0v8M63 25a11 11 0 0 1 0 21M68 53a18 18 0 0 1 12 17"/>',
    mail: '<rect x="17" y="28" width="62" height="43" rx="9"/><path d="m20 32 28 21 28-21"/>'
  };
  const icon = name => '<svg viewBox="0 0 96 96" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
  function install() {
    if (document.getElementById('trIntroStyles')) return;
    const style = document.createElement('style');
    style.id = 'trIntroStyles';
    style.textContent = `
      #trIntro{position:fixed;inset:0;z-index:2147483000;background:rgba(26,21,17,.7);display:grid;place-items:center;padding: max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));box-sizing:border-box;overscroll-behavior:contain}
      #trIntro *{box-sizing:border-box}#trIntro .tri-card{position:relative;width:100%;max-width:420px;max-height:100%;overflow:auto;overscroll-behavior:contain;background:#fff8ef;color:#242321;border:2px solid #edc5a6;border-radius:32px;padding:24px;box-shadow:0 12px 0 #1f181829,0 28px 80px #0004;font-family:inherit}
      #trIntro .tri-top{display:flex;align-items:center;justify-content:space-between;gap:12px}#trIntro .tri-brand{font-size:23px;font-weight:1000;letter-spacing:-1px;color:#d54f10}#trIntro button{font-family:inherit;cursor:pointer;touch-action:manipulation;min-height:44px;font-size:15px;font-weight:800;border-radius:16px;padding:10px 16px;border:2px solid #d85013;background:transparent;color:#bd420b}
      #trIntro .tri-skip{border:0;padding:8px;color:#665c52}#trIntro .tri-art{width:120px;height:120px;margin:26px auto 20px;border-radius:32px;transform:rotate(-5deg);background:#ffe2bf;color:#d65012;border:2px solid #efba8d;box-shadow:6px 7px 0 #f2c29b;display:grid;place-items:center}#trIntro svg{width:90px;height:90px}
      #trIntro .tri-eyebrow{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#b84614;text-align:center;margin:0 0 10px}#trIntro h2{font-size:32px;line-height:1.08;letter-spacing:-1px;font-weight:1000;text-align:center;margin:0 0 16px}#trIntro .tri-copy{font-size:16px;line-height:1.55;text-align:center;margin:0;color:#665c52}
      #trIntro .tri-progress{display:flex;justify-content:center;gap:7px;margin:22px 0 8px}#trIntro .tri-dot{width:7px;height:7px;border-radius:10px;background:#e4cfba}#trIntro .tri-dot.active{width:23px;background:#d85013}#trIntro .tri-count{text-align:center;font-size:12px;color:#796b5f;margin:0 0 16px}
      #trIntro .tri-actions{display:flex;gap:10px}#trIntro .tri-next{flex:1;background:#d85013;color:white;box-shadow:0 4px 0 #a63b0c}#trIntro button:focus-visible{outline:3px solid #242321;outline-offset:3px}#trIntro .tri-notes{list-style:none;margin:20px 0;padding:0;display:grid;gap:14px}#trIntro .tri-notes li{font-size:14px;line-height:1.45;border-left:3px solid #e66a25;padding-left:12px}#trIntro .tri-notes strong{display:block;font-size:15px;margin-bottom:2px}
      @media(max-height:650px){#trIntro .tri-card{padding:18px}#trIntro .tri-art{width:80px;height:80px;margin:12px auto 16px}#trIntro svg{width:64px;height:64px}#trIntro h2{font-size:27px}}
    `;
    document.head.append(style);
  }
  function remember() { shownThisSession = true; try { localStorage.setItem(seenKey, release); } catch (_) {} }
  function close() {
    remember();
    if (!overlay) return;
    overlay.remove(); overlay = null;
    for (const [element, wasInert] of background) element.inert = wasInert;
    background = []; document.body.style.overflow = previousOverflow;
    document.removeEventListener('keydown', keyboard);
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function keyboard(event) {
    if (!overlay) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const buttons = [...overlay.querySelectorAll('button')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  function render() {
    const tour = mode === 'tour', slide = slides[page];
    overlay.innerHTML = '<section class="tri-card" role="dialog" aria-modal="true" aria-labelledby="triTitle" aria-describedby="triBody">' +
      '<div class="tri-top"><span class="tri-brand">TableRec</span><button class="tri-skip" data-action="close">' + (tour ? 'Skip tour' : 'Close') + '</button></div>' +
      '<div class="tri-art">' + icon(tour ? slide[3] : 'rate') + '</div>' +
      '<p class="tri-eyebrow">' + (tour ? slide[1] : 'A little fresh sauce') + '</p>' +
      '<h2 id="triTitle" tabindex="-1">' + (tour ? slide[0] : 'What’s new') + '</h2>' +
      (tour ? '' : '<p class="tri-count" id="triVersion"></p>') +
      '<p class="tri-copy" id="triBody">' + (tour ? slide[2] : 'A smoother start. More time for good food.') + '</p>' +
      (tour ? '<div class="tri-progress" aria-hidden="true">' + slides.map((_, i) => '<span class="tri-dot' + (i === page ? ' active' : '') + '"></span>').join('') + '</div><p class="tri-count">' + (page + 1) + ' of ' + slides.length + '</p>' :
        '<ul class="tri-notes"><li><strong>Your ideas have a home</strong>Send suggestions, report a problem, or share something you love from Settings → A little help.</li><li><strong>Location that catches up</strong>Fresh GPS when you reopen the app, recovery when automatic updates stall, and more reliable city labels.</li><li><strong>Help when you need it</strong>Replay the welcome tour or these update notes anytime in Settings.</li></ul>') +
      '<div class="tri-actions">' + (tour && page > 0 ? '<button data-action="back">Back</button>' : '') + '<button class="tri-next" data-action="next">' + (tour ? (page === slides.length - 1 ? 'Let’s eat' : 'Next') : 'Let’s eat') + '</button></div></section>';
    if (!tour) overlay.querySelector('#triVersion').textContent = versionLabel();
    overlay.querySelector('#triTitle').focus();
  }
  function open(kind = 'tour') {
    clearTimeout(timer);
    install();
    if (!overlay) {
      previousFocus = document.activeElement;
      overlay = document.createElement('div'); overlay.id = 'trIntro';
      overlay.addEventListener('click', event => {
        const action = event.target.closest('button')?.dataset.action;
        if (action === 'close') close();
        else if (action === 'back') { page--; render(); }
        else if (action === 'next') { if (mode !== 'tour' || page === slides.length - 1) close(); else { page++; render(); } }
      });
      document.body.append(overlay);
      background = [...document.body.children].filter(el => el !== overlay).map(el => [el, el.inert]);
      for (const [element] of background) element.inert = true;
      previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', keyboard);
    }
    mode = kind === 'news' ? 'news' : 'tour'; page = 0; render();
  }
  function busy() {
    // Never cover confirmation, account recovery, deletion, or another task.
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(location.search);
    if (hash.has('access_token') || hash.has('error') || hash.has('type') || query.has('code') || query.has('recovery') || query.has('error')) return true;
    if (document.body.classList.contains('booting') || document.getElementById('trLaunch') || window.tableRecLocationIntroBusy) return true;
    return [...document.querySelectorAll('.modal, .account-mark-overlay')].some(el => !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none');
  }
  function maybeOpen() {
    if (shownThisSession || read(seenKey) === release || overlay) return;
    if (busy() || document.hidden) { timer = setTimeout(maybeOpen, 1500); return; }
    shownThisSession = true;
    open(returning ? 'news' : 'tour');
  }
  window.TableRecIntro = { open, close, maybeOpen };
})();
