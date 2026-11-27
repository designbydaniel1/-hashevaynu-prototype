/* Hashevaynu app prototype: a clickable preview of the iOS app design.
   Plays real shiurim from the SoundCloud feed snapshot in data.js. */
(() => {
  'use strict';

  // ---------- Data ----------
  const EP = window.EPISODES || [];
  const byId = Object.fromEntries(EP.map((e) => [e.id, e]));
  // Real SoundCloud playlists, synced every 6 hours into the app repository.
  const PLAYLISTS_URL = 'https://raw.githubusercontent.com/designbydaniel1/hashevaynu-ios/main/data/playlists.json';
  let PL = null; // { categories, playlists }
  const plById = {};
  const SERIES_OF = { daf: 'daf' };
  function loadPlaylists() {
    return fetch(PLAYLISTS_URL, { cache: 'no-cache' }).then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d || !d.playlists) return;
      d.playlists.forEach((p) => {
        plById[p.id] = p;
        p.eps = p.tracks.filter((t) => t.audio).map((t) => {
          const known = byId[t.id];
          const e = known || { id: t.id, title: t.title, date: t.date, dur: t.duration, audio: t.audio, link: t.link,
            series: SERIES_OF[p.category] || (/mishnah berurah/i.test(p.title) ? 'mb' : /moonlight/i.test(p.title) ? 'me' : 'other'),
            speaker: /dov elias/i.test(p.title + t.title) ? 'R’ Dov Elias' : 'Rabbi Avi Zakutinsky' };
          if (!known) { if (e.series === 'other') { e.badge = p.badge; e.tint = p.color; } e.art = t.artwork || p.artwork; byId[t.id] = e; }
          e.cover = e.cover || t.artwork || p.artwork || d.avatar;
          return e;
        }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      });
      // Newest daf from the live playlists, in case it is newer than the built-in snapshot.
      const dp = d.playlists.find((p) => p.category === 'daf');
      const latest = dp && dp.eps[0];
      const parsed = latest && parseDaf(latest.title);
      if (parsed && parsed.mas === today.mas && (latest.date || '') > ((todayDaf && todayDaf.date) || '')) {
        todayDaf = latest; today = parsed; dafEps = dp.eps;
        cur.released = cur.today = parsed.daf; cur.progress[parsed.daf - 1] = cur.progress[parsed.daf - 1] || 0.4;
      }
      PL = d; render();
    }).catch(() => { /* offline: keep the built-in series */ });
  }
  const SERIES = {
    daf: { name: 'Daf Yomi', short: 'Daf Yomi', badge: 'DY', tint: 'var(--accent)', total: '269 shiurim', sub: 'Rabbi Avi Zakutinsky' },
    mb: { name: 'Mishnah Berurah Yomi', short: 'Mishnah Berurah', badge: 'MB', tint: '#1F5F8B', total: '131 shiurim', sub: 'Dirshu cycle' },
    me: { name: 'moonLight of Emuna', short: 'moonLight of Emuna', badge: 'ME', tint: '#4C3A8C', total: '31 shiurim', sub: 'R’ Dov Elias' },
    ss: { name: 'Semicha Shiurim', short: 'Semicha', badge: 'SS', tint: '#8A4B12', total: '22 shiurim', sub: 'Basar B’Chalav' },
    ah: { name: 'Assorted Halachos', short: 'Halachos', badge: 'AH', tint: '#0F6B5C', total: 'Practical halacha', sub: 'Rabbi Avi Zakutinsky' },
    ch: { name: 'Chassidus', short: 'Chassidus', badge: 'CH', tint: '#7A2E2E', total: 'Parsha & Yomim Tovim', sub: 'Rabbi Avi Zakutinsky' },
    other: { name: 'More Shiurim', short: 'More', badge: 'HS', tint: '#475569', total: 'Shiurim', sub: 'Hashevaynu' }
  };
  const SERIES_ORDER = ['daf', 'mb', 'me', 'ss', 'ah', 'ch'];
  // Speakers, bios and sefarim from hashevaynu.org (Learning, speaker and Sefarim pages).
  const SPEAKERS = [
    { id: 'avi', name: 'Rabbi Avi Zakutinsky', initials: 'AZ', topics: 'Daf Yomi, Halacha, Semicha', photo: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/1603762635352-UFOM3MG8PY7K2ZLZURSJ/image-asset.png?format=500w',
      bio: 'Rabbi Avi Zakutinsky is the author of the Hebrew Seforim Umekareiv Biyamin (3 volumes) on halachic questions posed to those in kiruv and The Gates of Joy, an English Sefer on the laws and customs of the Jewish wedding. He currently teaches at Yeshivas Hashevaynu in Queens.',
      links: [['Email Rabbi Avi', 'mailto:avizakutinsky@gmail.com'], ['Halacha blog', 'https://halachablog.com'], ['TorahAnytime', 'https://www.torahanytime.com'], ['YUTorah', 'https://www.yutorah.org']],
      match: (t) => !/dov elias|moonlight|nesivos|chovas|rabbi zakutinsky/i.test(t),
      books: [
        { title: 'Umekareiv Biyamin', he: 'ומקרב בימין', sub: 'Sefer on Kiruv · 3 volumes · Hebrew', cover: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/1625371110395-A59GWHERKS6YNP6XSK5C/WhatsApp+Image+2021-07-03+at+11.45.10+PM.jpeg?format=500w',
          about: 'An in-depth analysis of the questions most often asked of kiruv rabbanim: pidyon haben when one does not know if the child is a kohen, levi or yisrael, attending a wedding in a conservative synagogue, secular tunes for davening, naming children after non-observant Jews, and more.',
          actions: [['Volume 1 · Read free', 'https://hebrewbooks.org/pdfpager.aspx?pgnum=1&req=51347'], ['Volume 2 · Read free', 'https://hebrewbooks.org/pdfpager.aspx?pgnum=1&req=58755'], ['Volume 3 · Buy', 'mailto:avizakutinsky@gmail.com?subject=Umekareiv%20Biyamin%20Volume%203']] },
        { title: 'The Gates of Joy', he: '', sub: 'The laws and customs of the Jewish wedding · 400 pages · English', cover: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/1625371812104-GE924PFIWOAC0Q3XOEXU/Sefarim1.jpeg?format=500w',
          about: 'Walks any couple through engagement and marriage, explaining the halachos and customs of Ashkenazim, Sephardim and Chassidim, including Chabad, for laymen and rabbis alike.',
          actions: [['Buy · contact Rabbi Avi', 'mailto:avizakutinsky@gmail.com?subject=The%20Gates%20of%20Joy']] },
        { title: 'Toras Hashevaynu', he: '', sub: 'Torah journal of halacha and hashkafa for the Seder', cover: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/473ff1d5-1a00-4302-b6f7-330062662f6c/Hagadah.png?format=500w',
          about: 'Halacha and hashkafa for Pesach and the Seder, written by Rabbi Avi.',
          actions: [['Download free', 'https://www.hashevaynu.org/s/FINAL-BOOKLET-Peasch-Pamphlet-FULL.pdf']] }
      ] },
    { id: 'yehuda', name: 'Rabbi Yehuda Zakutinsky', initials: 'YZ', topics: 'Founding Director', photo: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/1603768842375-01HDXFIZO93S2S4IKKOC/Rabbi+Yehuda+Zakutinsky.png?format=500w',
      bio: 'Rabbi Yehuda Zakutinsky is the founding Director of Hashevaynu. He is one of the pioneers of the kiruv movement and a leading authority on Jewish outreach. Hashevaynu’s ultimate goal is to make all Jews who pass through its doors feel like cherished members of the family who know that their problems are our problems and their joys are our joys.',
      links: [], match: (t) => /rabbi zakutinsky/i.test(t), books: [] },
    { id: 'dov', name: 'R’ Dov Elias', initials: 'DE', topics: 'moonLight of Emuna, Chassidus', photo: 'https://images.squarespace-cdn.com/content/v1/5d6b53a89e0b8f0001645836/1603752858225-0HQKCIQ0S2T5YX6BYS31/image-asset.png?format=500w',
      bio: 'R’ Dov Elias is an attorney by training, a real estate investor by trade, but his passion is in chesed and teaching. He is a lecturer at Hashevaynu in Queens, NY, a Daf Yomi maggid shiur, and the translator and adaptor of the Light of Emuna. The “moonLight of Emuna” recordings developed out of a weekly shiur he gives: in each, he draws on ideas from the sefarim hakedoshim to craft a relevant message for the week.',
      links: [['The Light of Emuna', 'https://www.tloe.us']], match: (t) => /dov elias|moonlight|nesivos|chovas/i.test(t), books: [] }
  ];
  const MASECHTA_LEN = { Eirachin: 34, Temurah: 34, Kerisus: 28, Meilah: 22, Kinnim: 25, Tamid: 33, Middos: 37, Niddah: 73, Bechoros: 61, Chullin: 142, Menachos: 110 };

  let dafEps = EP.filter((e) => e.series === 'daf');
  let todayDaf = dafEps[0];
  const parseDaf = (t) => { const m = /^([A-Za-z’' ]+?)\s+(\d+)[ab]?\b/.exec(t || ''); return m ? { mas: m[1].trim(), daf: +m[2] } : null; };
  let today = parseDaf(todayDaf && todayDaf.title) || { mas: 'Eirachin', daf: 6 };

  const fill = (from, to, v, m) => { for (let d = from; d <= to; d++) m[d] = v; return m; };
  const cur = { key: 'current', name: today.mas, num: 33, last: MASECHTA_LEN[today.mas] || 34, released: today.daf, today: today.daf,
    progress: (() => { const m = fill(2, Math.max(1, today.daf - 2), 1, {}); m[today.daf - 1] = 0.4; m[today.daf] = 0.3; return m; })(), reviews: { 2: 2 } };
  const bech = fill(2, 20, 1, {}); bech[9] = 0.5; bech[14] = 0.7; bech[25] = 1; fill(31, 45, 1, bech); bech[46] = 0.2; bech[47] = 1; fill(56, 61, 1, bech);
  const men = fill(2, 70, 1, {}); men[71] = 0.6; fill(85, 88, 1, men);
  // Every masechta in the Daf Yomi cycle with its last daf, newest first.
  const SHAS = [["Brachos", 64], ["Shabbos", 157], ["Eiruvin", 105], ["Pesachim", 121], ["Shekalim", 22], ["Yoma", 88], ["Succah", 56], ["Beitzah", 40], ["Rosh Hashana", 35], ["Taanis", 31], ["Megillah", 32], ["Moed Katan", 29], ["Chagigah", 27], ["Yevamos", 122], ["Kesubos", 112], ["Nedarim", 91], ["Nazir", 66], ["Sota", 49], ["Gittin", 90], ["Kiddushin", 82], ["Baba Kamma", 119], ["Baba Metziah", 119], ["Bava Basra", 176], ["Sanhedrin", 113], ["Makkos", 24], ["Shavuos", 49], ["Avodah Zara", 76], ["Horayos", 14], ["Zevachim", 120], ["Menachos", 110], ["Chullin", 142], ["Bechoros", 61], ["Eirachin", 34]];
  const MASECHTOS = {};
  SHAS.map((m, i) => [i + 1, m[0], m[1]]).reverse().forEach(([num, name, last]) => {
    const key = name.toLowerCase().replace(/[^a-z]/g, '');
    if (name === today.mas) { cur.num = num; cur.last = last; MASECHTOS.current = cur; return; }
    MASECHTOS[key] = { key, name, num, last, released: last, progress: {}, reviews: {} };
  });
  Object.assign(MASECHTOS, {
    bechoros: { key: 'bechoros', name: 'Bechoros', num: 32, last: 61, released: 61, progress: bech, reviews: { 3: 2, 17: 2, 33: 3, 47: 2 } },
    chullin: { key: 'chullin', name: 'Chullin', num: 31, last: 142, released: 142, progress: fill(2, 142, 1, {}), reviews: { 2: 2, 60: 2 } },
    menachos: { key: 'menachos', name: 'Menachos', num: 30, last: 110, released: 110, progress: men, reviews: {} }
  });
  if (!MASECHTOS.current) MASECHTOS.current = cur;

  // ---------- State (saved on this device) ----------
  const STORE = 'hashevaynu-prototype-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } };
  const saved0 = load();
  const seedPositions = {};
  if (todayDaf) seedPositions[todayDaf.id] = Math.round(todayDaf.dur * 0.3);
  if (dafEps[2]) seedPositions[dafEps[2].id] = Math.round(dafEps[2].dur * 0.7);
  const firstMB = EP.find((e) => e.series === 'mb'); if (firstMB) seedPositions[firstMB.id] = Math.round(firstMB.dur * 0.4);
  const S = Object.assign({
    tab: 'main', stack: [], playerOpen: false, current: null, playing: false,
    saved: EP.filter((e, i) => i === 4 || i === 9).map((e) => e.id),
    positions: seedPositions, finished: dafEps.slice(3, 6).map((e) => e.id),
    rate: 1, sleep: 0, dl: {}, smart: true, alerts: true, follow: true, remind: true, autodl: true,
    theme: 'system', query: '', scope: 'all',
    mas: today.mas === 'Bechoros' ? 'current' : 'bechoros', sel: null, overrides: {}, siyum: false,
    notif: { freq: '3', days: [0, 2, 4], time: 2, news: true, events: true, daf: true, sponsor: false }
  }, saved0, { stack: [], playerOpen: false, playing: false, sel: null, siyum: false, query: '' });
  const persist = () => {
    const keep = ['alerts', 'saved', 'positions', 'finished', 'rate', 'smart', 'follow', 'remind', 'autodl', 'theme', 'notif', 'overrides', 'current', 'dl'];
    try { localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(keep.map((k) => [k, S[k]])))); } catch (e) { /* storage unavailable */ }
  };
  const applyTheme = () => {
    if (S.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
  };
  applyTheme();

  // ---------- Helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); const now = new Date().getFullYear();
    return MONTHS[+m - 1] + ' ' + (+d) + (+y !== now ? ', ' + y : ''); };
  const fmtMin = (s) => Math.max(1, Math.round(s / 60)) + ' min';
  const clock = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const ser = (e) => SERIES[e.series] || SERIES.other;
  const pos = (e) => S.positions[e.id] || 0;
  const progress = (e) => S.finished.includes(e.id) ? 1 : (e.dur ? Math.min(pos(e) / e.dur, 1) : 0);
  const isSaved = (e) => S.saved.includes(e.id);
  const tile = (e, size) => e.art
    ? `<img src="${esc(e.art)}" alt="" loading="lazy" style="width:${size}px;height:${size}px;border-radius:12px;object-fit:cover;flex:none;background:var(--fill)">`
    : `<div class="tile" style="width:${size}px;height:${size}px;background:${e.tint || ser(e).tint};font-size:${size > 48 ? 15 : 13}px">${esc(e.badge || ser(e).badge)}</div>`;
  const plTile = (p, size) => p.artwork
    ? `<img src="${esc(p.artwork)}" alt="" loading="lazy" style="width:${size}px;height:${size}px;border-radius:16px;object-fit:cover;display:block;background:var(--fill)">`
    : `<div style="width:${size}px;height:${size}px;border-radius:16px;background:${p.color};color:#fff;padding:12px;display:flex;flex-direction:column;justify-content:flex-end">
        <b style="font-size:${p.category === 'daf' ? 34 : 24}px;line-height:1;font-weight:800">${esc(p.badge)}</b>${p.category === 'daf' ? `<span style="font-size:14px;font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.short)}</span>` : ''}</div>`;
  const plName = (p) => p.category === 'daf' ? p.short : p.title;
  const plCard = (p, w) => `<button data-act="go" data-arg="pl:${p.id}" style="width:${w ? w + 'px' : '100%'};display:flex;flex-direction:column;gap:6px;text-align:left">
      ${w ? plTile(p, w) : `<div style="width:100%;aspect-ratio:1">${plTile(p, '100%').replace(/width:100%px;height:100%px/, 'width:100%;height:100%')}</div>`}
      <span style="font-size:14px;line-height:18px;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(plName(p))}</span>
      <span class="row-meta" style="margin-top:-4px">${p.trackCount} shiurim</span></button>`;

  const I = {
    search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    play: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>`,
    pause: (s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>`,
    bookmark: (on, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1z"/></svg>`,
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chevron)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    down: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    skip: (dir, n, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dir < 0 ? '<path d="M4 12a8 8 0 1 0 2.34-5.66"/><path d="M4 4v4.5h4.5"/>' : '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/>'}<text x="12" y="15.5" text-anchor="middle" font-size="7.5" font-weight="700" fill="currentColor" stroke="none" font-family="Inter, sans-serif">${n}</text></svg>`,
    share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7"/></svg>',
    moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    dl: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/></svg>',
    wave: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h3l2-5 3 10 2-5h6"/></svg>',
    check: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    whatsapp: (sz = 26) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3l-1.9-.9c-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5v-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.5z"/></svg>`,
    heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>',
    flame: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c.5 3.2 4.5 5.6 4.5 10.2a4.5 4.5 0 0 1-9 0c0-1.8.8-3.3 1.8-4.3.2 1.6 1 2.6 2 2.9-.6-3 .2-6.3.7-8.8z"/></svg>',
    trophy: (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>`,
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sort: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/></svg>'
  };
  const TABS = [
    ['main', 'Shiurim', '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/></svg>'],
    ['daf', 'Daf', '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/></svg>'],
    ['series', 'Series', '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M6.5 5h11M9 2.5h6"/></svg>'],
    ['saved', 'Saved', '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1z"/></svg>'],
    ['more', 'More', '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>']
  ];

  // ---------- Shared pieces ----------
  const tabbar = () => `<nav class="tabbar" aria-label="Tabs">${TABS.map(([k, label, icon]) =>
    `<button class="tab" data-act="tab" data-arg="${k}" aria-label="${label}" ${S.tab === k ? 'aria-current="page"' : ''}>${icon}<span class="tab-label">${label}</span></button>`).join('')}</nav>`;
  const searchBtn = (onAccent) => `<button class="icon-btn search-btn" data-act="go" data-arg="search" aria-label="Search" ${onAccent ? 'style="background:rgba(255,255,255,0.18);color:#fff"' : ''}>${I.search}</button>`;
  const backBtn = (label) => `<button class="back" data-act="back">${I.back}${esc(label)}</button>`;

  const epRow = (e) => {
    const p = progress(e), playing = S.current === e.id, saved = isSaved(e);
    return `<div class="row">
      <button class="row-main" data-act="play" data-arg="${e.id}" aria-label="Play ${esc(e.title)}">
        ${tile(e, 52)}
        <div class="row-text">
          <span class="row-title" style="color:${playing ? 'var(--accent-text)' : 'var(--text)'}">${esc(e.title)}</span>
          <span class="row-meta">${fmtDate(e.date)} · ${fmtMin(e.dur)}${S.dl[e.id] === 2 ? ' · Downloaded' : ''}</span>
          ${p >= 1 ? '<span class="row-meta" style="display:flex;align-items:center;gap:4px;color:var(--accent-text)">' + I.check(12) + 'Played</span>'
            : p > 0 ? `<div class="bar" style="width:120px;margin-top:3px"><i style="width:${Math.round(p * 100)}%"></i></div>` : ''}
        </div>
      </button>
      <button class="icon-btn" style="background:none;color:${saved ? 'var(--save)' : 'var(--tab)'}" data-act="save" data-arg="${e.id}" aria-label="${saved ? 'Remove from Saved' : 'Save for later'}">${I.bookmark(saved)}</button>
    </div>`;
  };

  const mini = () => {
    const e = byId[S.current]; if (!e) return '';
    const p = e.dur ? (audio.currentTime || pos(e)) / e.dur : 0;
    return `<div class="mini${enter('mini', S.current)}">
      <button class="mini-open" data-act="openPlayer" aria-label="Open player">
        ${tile(e, 42)}
        <span class="mini-title" style="min-width:0;font-size:15px">${esc(e.title)}</span>
      </button>
      <button class="icon-btn" style="background:none;color:var(--text)" data-act="toggle" aria-label="${S.playing ? 'Pause' : 'Play'}">${S.playing ? I.pause(24) : I.play(24)}</button>
      <button class="icon-btn" style="background:none;color:var(--text)" data-act="skip" data-arg="30" aria-label="Skip forward 30 seconds">${I.skip(1, 30)}</button>
      <div class="mini-progress" id="mini-progress" style="width:${Math.round(p * 1000) / 10}%"></div>
    </div>`;
  };

  /** Everything uploaded in the last 30 days, newest first. */
  const recentShiurim = () => {
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return (PL ? Object.values(byId) : EP).filter((e) => (e.date || '') >= cutoff).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  };

  // ---------- Screens ----------
  const screens = {};

  screens.main = () => {
    const cont = EP.filter((e) => { const p = progress(e); return p > 0 && p < 1; }).slice(0, 6);
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="main">
      <div class="pad" style="padding-right:64px"><h1 class="title">Hashevaynu</h1><p class="sub">${PL ? PL.playlists.length + ' playlists · ' + PL.playlists.reduce((n, p) => n + p.trackCount, 0).toLocaleString() + ' shiurim' : 'Shiurim from Rabbi Avi Zakutinsky and R’ Dov Elias'}</p></div>
      ${todayDaf ? `<div class="pad" style="margin-top:16px"><div class="card-accent">
        <div style="display:flex;justify-content:space-between;font-size:12px;opacity:.85"><b style="letter-spacing:.08em;text-transform:uppercase">Today’s Daf</b><span>${fmtDate(todayDaf.date)} · ${fmtMin(todayDaf.dur)}</span></div>
        <div style="font-size:24px;line-height:30px;font-weight:800;letter-spacing:-.01em">${esc(todayDaf.title.replace(' (Daf Yomi)', ''))}</div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;opacity:.9">Rabbi Avi Zakutinsky</span>
          <button class="pill white" style="height:40px;padding:0 16px 0 12px" data-act="play" data-arg="${todayDaf.id}">${S.current === todayDaf.id && S.playing ? I.pause(16) + 'Pause' : I.play(16) + 'Play'}</button></div>
      </div></div>` : ''}
      ${cont.length ? `<div class="sec-head"><h2 class="h2">Continue listening</h2></div>
      <div class="hscroll">${cont.map((e) => `<div style="width:250px;padding:12px;border-radius:16px;background:var(--fill);display:flex;align-items:center;gap:12px">
        ${tile(e, 52)}
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span class="mini-title">${esc(e.title.replace(' (Daf Yomi)', ''))}</span>
          <span class="row-meta">${fmtMin(e.dur - pos(e))} left</span><div class="bar"><i style="width:${Math.round(progress(e) * 100)}%"></i></div></div>
        <button class="icon-btn" style="width:40px;height:40px;background:var(--accent);color:#fff" data-act="play" data-arg="${e.id}" aria-label="Resume ${esc(e.title)}">${I.play(16)}</button>
      </div>`).join('')}</div>` : ''}
      <div class="sec-head"><h2 class="h2">Playlists</h2><button class="link" data-act="tab" data-arg="series">See all${PL ? ' ' + PL.playlists.length : ''}</button></div>
      ${PL ? `<div class="hscroll">${PL.playlists.slice().sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || '')).slice(0, 8).map((p) => plCard(p, 132)).join('')}</div>` : ''}
      <div class="hscroll" style="${PL ? 'display:none' : ''}">${SERIES_ORDER.slice(0, 5).map((k) => { const s = SERIES[k]; return `<button style="width:132px;display:flex;flex-direction:column;gap:6px;text-align:left" data-act="${k === 'daf' ? 'tab' : 'go'}" data-arg="${k === 'daf' ? 'daf' : 'playlist:' + k}">
        <div style="width:132px;height:132px;border-radius:16px;background:${s.tint};color:#fff;padding:12px;display:flex;flex-direction:column;justify-content:space-between">
          <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:11px;letter-spacing:.08em;opacity:.85">${s.badge}</b>${k === 'daf' && S.follow ? '<span style="height:20px;padding:0 7px;border-radius:10px;background:#fff;color:#111827;font-size:11px;font-weight:800;display:flex;align-items:center">1 new</span>' : ''}</div>
          <span style="font-size:17px;line-height:20px;font-weight:800">${esc(s.short)}</span></div>
        <span class="mini-title">${esc(s.name)}</span><span class="row-meta" style="margin-top:-5px">${k === 'daf' && S.follow ? 'Following · ' : ''}${s.total}</span></button>`; }).join('')}</div>
      <div class="sec-head"><h2 class="h2">Latest shiurim</h2><span class="row-meta">Last 30 days</span></div>
      ${recentShiurim().map(epRow).join('')}
      <div class="pad" style="margin-top:24px"><div style="border-radius:20px;background:var(--fill);padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center">
        <div style="width:48px;height:48px;border-radius:24px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center">${TABS[2][2].replace(/26/g, '24')}</div>
        <h2 style="font-size:18px;font-weight:700;margin-top:4px">You’re all caught up</h2>
        <p class="muted" style="font-size:14px;line-height:20px">That’s everything from the last 30 days. ${PL ? 'Browse ' + PL.playlists.length + ' playlists with ' + PL.playlists.reduce((n, p) => n + p.trackCount, 0).toLocaleString() + ' shiurim' : 'Browse every playlist'}, back to 2020.</p>
        <button class="pill solid" style="margin-top:6px" data-act="tab" data-arg="series">Browse all series</button>
      </div></div>
    ${searchBtn()}</div></div>`;
  };

const dafTabs = (on) => `<div role="tablist" aria-label="Daf" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:4px;border-radius:12px;background:var(--fill);margin:14px 16px 0">
    ${[['today', 'Today'], ['map', 'Daf map']].map(([k, l]) => `<button role="tab" aria-selected="${on === k}" data-act="dafTab" data-arg="${k}" style="height:36px;border-radius:9px;font-size:14px;font-weight:600;${on === k ? 'background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.15)' : 'color:var(--text2)'}">${l}</button>`).join('')}</div>`;
  screens.daf = () => S.dafTab !== 'map' ? dafToday() : S.mapOpen ? screens.masechta(S.mas, true) : mapList();
  const masStats = (m) => { const ov = S.overrides[m.key] || {}; let n = 0, started = 0;
    for (let d = 2; d <= m.last; d++) { const p = (d in ov) ? ov[d] : (m.progress[d] || 0); if (p >= 1) n++; else if (p > 0) started++; } return { n, started, total: m.last - 1 }; };
  const mapList = () => `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="maplist">
      <div class="pad" style="padding-right:64px"><h1 class="title">Daf Yomi</h1><p class="sub">Rabbi Avi Zakutinsky</p></div>
      ${dafTabs('map')}
      <p class="pad row-meta" style="font-size:13px;margin:16px 0 6px">${Object.keys(MASECHTOS).length} masechtos · tap one to see your progress on every daf</p>
      ${Object.values(MASECHTOS).map((m) => { const st = masStats(m), active = m.key === 'current', done = st.n === st.total, pct = Math.round(st.n / st.total * 100);
        const [label, color] = active ? ['Learning now', 'var(--accent-text)'] : done ? ['Siyum', 'var(--on)'] : st.n || st.started ? ['In progress', 'var(--accent-text)'] : [st.total + ' dafim', 'var(--text2)'];
        return `<button data-act="openMap" data-arg="${m.key}" aria-label="${esc(m.name)}, ${st.n || st.started ? label + ', ' + st.n + ' of ' + st.total + ' dafim learned' : st.total + ' dafim'}" style="width:100%;display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--sep);text-align:left">
          <div class="tile" style="width:44px;height:44px;border-radius:12px;background:${active ? 'var(--accent)' : done ? 'var(--on)' : 'var(--fill)'};color:${active || done ? '#fff' : 'var(--text2)'};font-size:14px">${done ? I.check(18) : m.num}</div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span style="font-size:16px;font-weight:600">${esc(m.name)}</span>${st.started ? `<span style="font-size:12px;font-weight:600;color:var(--text2)">${st.started} started</span>` : ''}</div>
            ${st.n || st.started ? `<div class="bar"><i style="width:${pct}%;${done ? 'background:var(--on)' : ''}"></i></div>` : ''}
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:12px"><span style="font-weight:${st.n || st.started || active ? 700 : 500};color:${color}">${label}</span><span class="muted">${st.n || st.started ? st.n + ' of ' + st.total + ' dafim' : ''}</span></div>
          </div>${I.chev}</button>`; }).join('')}
    ${searchBtn()}</div></div>`;
  const dafToday = () => {
    const todayPlaying = todayDaf && S.current === todayDaf.id && S.playing;
    const week = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dow = new Date().getDay();
    const stats = (m) => { let n = 0; const ov = S.overrides[m.key] || {}; for (let d = 2; d <= m.last; d++) if (((d in ov) ? ov[d] : (m.progress[d] || 0)) >= 1) n++; return n; };
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="daf">
      <div class="pad" style="padding-right:64px"><h1 class="title">Daf Yomi</h1><p class="sub">Rabbi Avi Zakutinsky</p></div>
      ${dafTabs('today')}
      ${todayDaf ? `<div class="pad" style="margin-top:16px"><div class="card-accent" style="border-radius:22px;padding:20px;gap:14px">
        <div style="display:flex;justify-content:space-between;font-size:12px;opacity:.85"><b style="letter-spacing:.08em;text-transform:uppercase">Today · ${fmtDate(todayDaf.date)}</b><span>${fmtMin(todayDaf.dur)}</span></div>
        <div><div style="font-size:15px;font-weight:600;opacity:.85">Maseches ${esc(today.mas)}</div><div style="font-size:34px;line-height:40px;font-weight:800;letter-spacing:-.02em">Daf ${today.daf}</div></div>
        <div style="display:flex;flex-direction:column;gap:6px"><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.25)"><div style="height:6px;width:${Math.round(today.daf / cur.last * 100)}%;border-radius:3px;background:#fff"></div></div>
          <span style="font-size:12px;opacity:.85">Daf ${today.daf} of ${cur.last} · ${stats(cur)} learned</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="pill white" data-act="play" data-arg="${todayDaf.id}">${todayPlaying ? I.pause(16) + 'Playing' : I.play(16) + 'Play today’s daf'}</button>
          <button class="pill ghost" data-act="dafMap" data-arg="current">Daf map</button></div>
      </div></div>` : ''}
      <div class="sec-head"><h2 class="h2">Latest dafim</h2><button class="link" data-act="dafMap" data-arg="current">Daf map</button></div>
      ${dafEps.slice(0, 6).map(epRow).join('')}
      ${PL ? (() => { const daf = PL.playlists.filter((p) => p.category === 'daf'); return `<div class="sec-head" style="margin-top:26px"><h2 class="h2">Daf Yomi series <span class="muted" style="font-size:15px;font-weight:500">${daf.length}</span></h2><button class="link" data-act="go" data-arg="section:daf">See all</button></div>
        <p class="pad row-meta" style="font-size:13px;margin:-6px 0 12px">Every masechta in the cycle, newest first</p>
        <div class="hscroll" style="align-items:flex-start">${daf.map((p) => plCard(p, 132)).join('')}</div>`; })() : ''}
      <h2 class="h2" style="margin:24px 16px 4px">Your masechtos</h2><p class="pad row-meta" style="font-size:13px;margin-bottom:12px">Progress counts every daf you learned, in any order</p>
      <div class="pad" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">${Object.values(MASECHTOS).filter((m) => m.key === 'current' || stats(m) > 0).map((m) => { const n = stats(m), total = m.last - 1, active = m.key === 'current';
        const status = active ? 'Learning now' : n === total ? 'Siyum' : 'In progress';
        return `<button data-act="dafMap" data-arg="${m.key}" style="border-radius:18px;padding:14px;background:var(--fill);display:flex;flex-direction:column;gap:10px;text-align:left">
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%"><div style="width:36px;height:36px;border-radius:10px;background:${active ? 'var(--accent)' : 'var(--bg)'};color:${active ? '#fff' : 'var(--text2)'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">${active ? '' : m.num}${active ? I.play(14) : ''}</div>
            <span style="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${active || n === total ? 'var(--accent-text)' : 'var(--text2)'}">${status}</span></div>
          <div><div style="font-size:17px;font-weight:700">${esc(m.name)}</div><div class="row-meta">${n} of ${total} learned</div></div>
          <div class="bar" style="width:100%"><i style="width:${Math.round(n / total * 100)}%"></i></div></button>`; }).join('')}</div>
      <div class="pad" style="margin-top:20px"><a href="https://www.hashevaynu.org/donate" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:20px;background:var(--save-bg);color:var(--save);display:flex;align-items:center;justify-content:center">${I.heart}</div>
        <div style="flex:1"><div style="font-size:15px;font-weight:700">Sponsor the Daf</div><div class="row-meta">$36/week or $100/month</div></div>${I.chev}</a></div>
      <div class="pad" style="margin-top:12px"><a href="https://chat.whatsapp.com/GQ7aFSgUHTTI7say5d1Tyc" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:18px;background:#15803D;color:#fff">
        <div style="width:46px;height:46px;flex:none;border-radius:23px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center">${I.whatsapp(26)}</div>
        <div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:700">Join the Daf Yomi WhatsApp group</div><div style="font-size:13px;opacity:.9;margin-top:1px">Daily daf updates, schedule changes and sponsorships</div></div>
        <span style="height:34px;padding:0 14px;border-radius:17px;background:#fff;color:#15803D;font-size:14px;font-weight:700;display:flex;align-items:center">Join</span></a></div>
    ${searchBtn()}</div></div>`;
  };

  screens.masechta = (key, embedded) => {
    if (key && key !== S.masShown) { S.mas = key; S.masShown = key; S.sel = null; }
    const base = MASECHTOS[S.mas] || cur;
    const ov = S.overrides[base.key] || {};
    const prog = (d) => (d in ov ? ov[d] : (base.progress[d] || 0));
    const total = base.last - 1;
    let learned = 0, started = 0, firstPartial = null;
    for (let d = 2; d <= base.last; d++) { const p = prog(d); if (p >= 1) learned++; else if (p > 0) { started++; firstPartial = firstPartial || d; } }
    const C = 2 * Math.PI * 38, ratio = learned / total;
    const cells = [];
    for (let d = 2; d <= base.last; d++) {
      const p = prog(d), avail = d <= base.released, rev = p >= 1 ? (base.reviews[d] || 1) : 0;
      const cls = ['daf', !avail ? 'soon' : p >= 1 ? 'done' : p > 0 ? 'part' : '', base.today === d ? 'today' : '', S.sel === d ? 'sel' : ''].join(' ');
      const style = avail && p > 0 && p < 1 ? ` style="background:conic-gradient(var(--accent-text) ${Math.round(p * 100)}%, var(--track) 0)"` : '';
      const state = !avail ? 'not out yet' : p >= 1 ? 'learned' + (rev > 1 ? ' ' + rev + ' times' : '') : p > 0 ? Math.round(p * 100) + '% listened' : 'not started';
      cells.push(`<button class="${cls}" data-act="sel" data-arg="${d}" aria-label="Daf ${d}, ${state}"><span${style}><b>${d}</b></span>${rev > 1 ? `<i>${rev}×</i>` : ''}</button>`);
    }
    let card = '';
    if (S.sel) {
      const d = S.sel, p = prog(d), avail = d <= base.released, rev = base.reviews[d] || 1;
      const status = !avail ? 'Coming soon in the Daf Yomi cycle' : p >= 1 ? 'Learned' + (rev > 1 ? ' · reviewed ' + rev + ' times' : '') : p > 0 ? Math.round(p * 100) + '% listened · pick up where you left off' : 'Not started yet';
      const norm = (x) => x.toLowerCase().replace(/[^a-z]/g, '');
      const pl = PL && PL.playlists.find((x) => x.category === 'daf' && norm(x.short) === norm(base.name));
      const pool = pl ? pl.eps : base.key === 'current' ? dafEps : [];
      const ep = pool.find((e) => (parseDaf(e.title) || {}).daf === d);
      card = `<div class="float-card${enter('sel', base.key + ':' + S.sel)}"><div style="display:flex;justify-content:space-between;gap:8px"><div><div style="font-size:17px;font-weight:700">${esc(base.name)} ${d}a–${d}b</div><div class="row-meta" style="font-size:13px">${status}</div></div>
        <button class="icon-btn" style="width:32px;height:32px;color:var(--text2)" data-act="sel" data-arg="0" aria-label="Close">${I.x}</button></div>
        ${avail ? `<div style="display:flex;gap:8px"><button class="pill solid" style="flex:1" data-act="${ep ? 'play' : 'toast'}" data-arg="${ep ? ep.id : 'In the app, this plays ' + esc(base.name) + ' ' + d + ' from SoundCloud'}">${I.play(16)}${p >= 1 ? 'Review' : p > 0 ? 'Resume' : 'Play'}</button>
          <button class="pill fill" style="flex:1" data-act="learned">${I.check(16)}${p >= 1 ? 'Mark not learned' : 'Mark learned'}</button></div>` : ''}</div>`;
    }
    const colors = ['var(--accent)', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#0EA5E9'];
    return `<div class="screen"><div class="scroll" data-key="masechta" style="padding-top:calc(var(--top) - 4px);padding-bottom:${S.sel ? 170 : 24}px">
      ${embedded ? `<div class="pad"><button class="back" data-act="mapList">${I.back}All masechtos</button></div>` : `<div class="pad">${backBtn('Daf Yomi')}</div>`}
      <div class="pad" style="margin-top:14px;display:flex;align-items:center;gap:16px">
        <div style="position:relative;width:92px;height:92px;flex:none"><svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true"><circle cx="46" cy="46" r="38" fill="none" stroke="var(--track)" stroke-width="9"/>
          <circle cx="46" cy="46" r="38" fill="none" stroke="var(--accent-text)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * ratio).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 46 46)" style="transition:stroke-dasharray 500ms cubic-bezier(.22,1,.36,1)"/></svg>
          <b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800">${Math.round(ratio * 100)}%</b></div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><h1 style="font-size:28px;line-height:34px;font-weight:800;letter-spacing:-.02em">${esc(base.name)}</h1>
          <span style="font-size:15px;font-weight:600">${learned} of ${total} dafim learned</span>
          <span class="row-meta" style="font-size:13px">${base.released < base.last ? 'Learning now · daf ' + base.released + ' is today’s daf' : started ? started + ' started · resume daf ' + firstPartial : 'Masechta ' + base.num + ' in the cycle'}</span></div>
      </div>
      ${learned === total ? `<div class="pad" style="margin-top:16px"><div style="padding:14px 16px;border-radius:16px;background:var(--accent);color:#fff;display:flex;align-items:center;gap:12px">${I.trophy(28)}
        <div style="flex:1"><div style="font-size:16px;font-weight:700">Siyum on ${esc(base.name)}</div><div style="font-size:13px;opacity:.88">You learned every daf. Mazal tov!</div></div>
        <button class="pill white" style="height:36px;padding:0 12px;font-size:13px" data-act="siyum" data-arg="1">Celebrate</button></div></div>` : ''}
      <div class="pad row-meta" style="margin:18px 0 10px;display:flex;flex-wrap:wrap;gap:12px">
        <span style="display:flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:6px;background:var(--accent)"></i>Learned</span>
        <span style="display:flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:6px;background:conic-gradient(var(--accent-text) 60%,var(--track) 0)"></i>Started</span>
        <span style="display:flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:6px;background:var(--fill)"></i>Not yet</span>
        <span style="display:flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:6px;border:1px dashed var(--chevron)"></i>Coming</span>
        <span style="display:flex;align-items:center;gap:5px"><b style="font-size:10px;color:var(--accent-text)">2×</b>Reviewed</span></div>
      <div class="dafgrid">${cells.join('')}</div>
      <p class="pad row-meta" style="margin-top:14px;line-height:18px">Tap any daf to play it or mark it learned. Learn in any order: the map fills in wherever you listen.</p>
    ${searchBtn()}</div>${card}
    ${S.siyum ? `<div class="overlay"><div class="dialog" role="dialog" aria-label="Siyum">
      ${Array.from({ length: 16 }, (_, i) => `<span class="confetti" aria-hidden="true" style="left:${(i * 37) % 92 + 3}%;top:${(i * 53) % 30 + 4}%;width:${6 + (i % 3) * 2}px;height:${6 + (i % 3) * 2}px;background:${colors[i % 6]};transform:rotate(${i * 47}deg);animation-delay:${i * 40}ms"></span>`).join('')}
      <div style="width:76px;height:76px;border-radius:38px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center">${I.trophy(38)}</div>
      <span class="label" style="color:var(--accent-text)">Hadran alach</span><h2 style="font-size:26px;line-height:32px;font-weight:800">Siyum on Maseches ${esc(base.name)}</h2>
      <p class="muted" style="font-size:15px;line-height:22px">You learned all ${total} dafim. Mazal tov!</p>
      <div style="margin-top:8px;width:100%;display:flex;gap:8px"><button class="pill solid" style="flex:1" data-act="shareText" data-arg="I just finished Maseches ${esc(base.name)} with Hashevaynu Daf Yomi!">Share the simcha</button>
        <button class="pill fill" style="flex:1" data-act="siyum" data-arg="0">Close</button></div></div></div>` : ''}
    </div>`;
  };

  screens.series = () => PL ? seriesSections() : seriesFallback();
  /** The 5 most recently published playlists, not counting Daf Yomi masechtos. */
  const featured = () => PL.playlists.filter((p) => p.category !== 'daf').slice().sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 5);
  const seriesSections = () => `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="series">
    <div class="pad"><h1 class="title">Series</h1><p class="sub">${PL.playlists.length} playlists · ${PL.playlists.reduce((n, p) => n + p.trackCount, 0).toLocaleString()} shiurim</p></div>
    <div class="sec-head" style="margin-top:26px"><h2 class="h2">Featured</h2><span class="row-meta">Newest playlists</span></div>
    <div class="hscroll" style="align-items:flex-start">${featured().map((p) => plCard(p, 220)).join('')}</div>
    ${PL.categories.filter((c) => c.id !== 'daf').map((c) => { const items = PL.playlists.filter((p) => p.category === c.id); if (!items.length) return '';
      return `<div class="sec-head" style="margin-top:26px"><h2 class="h2">${esc(c.title)} <span class="muted" style="font-size:15px;font-weight:500">${items.length}</span></h2>${items.length > 3 ? `<button class="link" data-act="go" data-arg="section:${c.id}">See all</button>` : ''}</div>
        <div class="hscroll" style="align-items:flex-start">${items.map((p) => plCard(p, 140)).join('')}</div>`; }).join('')}
    <h2 class="h2 pad" style="margin-top:28px;margin-bottom:6px">By speaker</h2>
    <div class="pad">${SPEAKERS.map((p) => `<button data-act="go" data-arg="speaker:${p.id}" style="width:100%;display:flex;align-items:center;gap:12px;height:68px;border-bottom:1px solid var(--sep);text-align:left">
      ${p.photo ? `<img src="${p.photo}" alt="" loading="lazy" style="width:48px;height:48px;border-radius:24px;object-fit:cover;flex:none;background:var(--avatar-bg)">` : `<div style="width:48px;height:48px;border-radius:24px;background:var(--avatar-bg);color:var(--icon);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${p.initials}</div>`}
      <div style="flex:1"><div style="font-size:16px;font-weight:600">${esc(p.name)}</div><div class="row-meta">${esc(p.topics)}</div></div>${I.chev}</button>`).join('')}</div>
  </div>${searchBtn()}</div></div>`;
  screens.section = (id) => { const c = PL && PL.categories.find((x) => x.id === id); if (!c) return seriesFallback();
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="section-${id}" style="padding-top:calc(var(--top) - 4px)">
      <div class="pad">${backBtn('Series')}<h1 class="title" style="margin:4px 0 16px">${esc(c.title)}</h1>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px">${PL.playlists.filter((p) => p.category === id).map((p) => plCard(p, 0)).join('')}</div></div>
    ${searchBtn()}</div></div>`; };
  screens.pl = (id) => { const p = plById[id]; if (!p) return seriesFallback();
    const eps = S.plOldest ? p.eps.slice().reverse() : p.eps;
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="pl-${id}" style="padding-top:calc(var(--top) - 4px)">
      <div class="pad">${backBtn('Series')}
        <div style="display:flex;gap:16px;align-items:flex-end;margin-top:8px">${plTile(p, 120)}
          <div style="flex:1;min-width:0"><span class="label" style="font-size:11px">${esc((PL.categories.find((c) => c.id === p.category) || {}).title || '')}</span>
            <h1 style="font-size:24px;line-height:29px;font-weight:800;letter-spacing:-.01em;margin-top:2px">${esc(plName(p))}</h1>
            <p class="row-meta" style="font-size:13px;margin-top:4px">${p.trackCount} shiurim${p.lastModified ? ' · updated ' + fmtDate(p.lastModified) : ''}</p></div></div>
        <div style="display:flex;gap:8px;margin-top:16px">${eps[0] ? `<button class="pill solid" style="flex:1" data-act="play" data-arg="${(S.plOldest ? eps[0] : p.eps[0]).id}">${I.play(16)}${S.plOldest ? 'Play from the start' : 'Play latest'}</button>` : ''}
          <button class="pill fill" data-act="plOrder">${I.sort}${S.plOldest ? 'Oldest first' : 'Newest first'}</button>
          ${p.link ? `<a class="pill fill" style="padding:0 14px" href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Open on SoundCloud">${I.share}</a>` : ''}</div>
      </div>
      <div style="margin-top:10px">${eps.slice(0, S.plShow || 60).map(epRow).join('')}</div>
      ${eps.length > (S.plShow || 60) ? `<div class="pad" style="margin-top:12px"><button class="pill fill" style="width:100%" data-act="plMore">Show more (${eps.length - (S.plShow || 60)} left)</button></div>` : ''}
    ${searchBtn()}</div></div>`; };
  screens.speaker = (id) => {
    const sp = SPEAKERS.find((x) => x.id === id) || SPEAKERS[0];
    const lists = PL ? PL.playlists.filter((p) => sp.match(p.title)) : [];
    const daf = lists.filter((p) => p.category === 'daf'), other = lists.filter((p) => p.category !== 'daf');
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="speaker-${id}" style="padding-top:calc(var(--top) - 4px)">
      <div class="pad">${backBtn('Series')}
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;margin-top:6px">
          <img src="${sp.photo}" alt="" style="width:120px;height:120px;border-radius:60px;object-fit:cover;background:var(--avatar-bg);box-shadow:0 8px 24px rgba(0,0,0,.15)">
          <h1 style="font-size:26px;line-height:32px;font-weight:800;letter-spacing:-.01em;margin-top:6px">${esc(sp.name)}</h1>
          <p class="row-meta" style="font-size:14px">${lists.length ? lists.length + ' playlists · ' + lists.reduce((n, p) => n + p.trackCount, 0).toLocaleString() + ' shiurim' : esc(sp.topics)}</p>
        </div>
        <p style="font-size:15px;line-height:23px;margin-top:16px">${esc(sp.bio)}</p>
        ${sp.links.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">${sp.links.map(([l, u]) => `<a class="chip" style="display:inline-flex;align-items:center" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join('')}</div>` : ''}
      </div>
      ${other.length ? `<div class="sec-head" style="margin-top:28px"><h2 class="h2">Playlists <span class="muted" style="font-size:15px;font-weight:500">${other.length}</span></h2></div>
        <div class="hscroll" style="align-items:flex-start">${other.map((p) => plCard(p, 140)).join('')}</div>` : ''}
      ${daf.length ? `<div class="sec-head" style="margin-top:26px"><h2 class="h2">Daf Yomi <span class="muted" style="font-size:15px;font-weight:500">${daf.length}</span></h2><button class="link" data-act="dafMap">Daf map</button></div>
        <div class="hscroll" style="align-items:flex-start">${daf.map((p) => plCard(p, 120)).join('')}</div>` : ''}
      ${sp.books.length ? `<h2 class="h2 pad" style="margin-top:28px;margin-bottom:12px">Sefarim</h2>
        <div class="pad" style="display:flex;flex-direction:column;gap:14px">${sp.books.map((b) => `<div style="border-radius:18px;background:var(--fill);padding:14px;display:flex;gap:14px">
          <img src="${b.cover}" alt="${esc(b.title)} cover" loading="lazy" style="width:92px;height:130px;border-radius:8px;object-fit:cover;flex:none;background:var(--surface);box-shadow:0 4px 12px rgba(0,0,0,.15)">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
            <div style="font-size:17px;font-weight:700">${esc(b.title)}${b.he ? ` <span style="font-weight:600;color:var(--text2)" lang="he">${b.he}</span>` : ''}</div>
            <div class="row-meta">${esc(b.sub)}</div>
            <p style="font-size:13px;line-height:19px;margin-top:2px">${esc(b.about)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${b.actions.map(([l, u], k) => `<a href="${esc(u)}" target="_blank" rel="noopener" style="height:32px;padding:0 12px;border-radius:16px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;${k === 0 ? 'background:var(--accent);color:#fff' : 'background:var(--surface);color:var(--text)'}">${esc(l)}</a>`).join('')}</div>
          </div></div>`).join('')}</div>` : ''}
    ${searchBtn()}</div></div>`;
  };
  const seriesFallback = () => `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="series">
    <div class="pad"><h1 class="title">Series</h1><p class="sub" style="margin-bottom:18px">Browse shiurim by playlist</p>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">${SERIES_ORDER.map((k) => { const s = SERIES[k]; return `<button data-act="${k === 'daf' ? 'tab' : 'go'}" data-arg="${k === 'daf' ? 'daf' : 'playlist:' + k}" style="height:168px;border-radius:18px;padding:14px;background:${s.tint};color:#fff;display:flex;flex-direction:column;justify-content:space-between;text-align:left">
      <div style="width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">${s.badge}</div>
      <div><div style="font-size:17px;line-height:21px;font-weight:700">${esc(s.name)}</div><div style="font-size:12px;opacity:.85;margin-top:3px">${esc(s.total)}</div></div></button>`; }).join('')}</div>
    <h2 class="h2" style="margin:26px 0 6px">By speaker</h2>
    ${SPEAKERS.map((p) => `<button data-act="go" data-arg="speaker:${p.id}" style="width:100%;display:flex;align-items:center;gap:12px;height:68px;border-bottom:1px solid var(--sep);text-align:left">
      ${p.photo ? `<img src="${p.photo}" alt="" loading="lazy" style="width:48px;height:48px;border-radius:24px;object-fit:cover;flex:none;background:var(--avatar-bg)">` : `<div style="width:48px;height:48px;border-radius:24px;background:var(--avatar-bg);color:var(--icon);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${p.initials}</div>`}
      <div style="flex:1"><div style="font-size:16px;font-weight:600">${esc(p.name)}</div><div class="row-meta">${esc(p.topics)}</div></div>${I.chev}</button>`).join('')}
    </div>${searchBtn()}</div></div>`;

  screens.playlist = (k) => {
    const s = SERIES[k] || SERIES.other;
    const eps = EP.filter((e) => e.series === k);
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="playlist-${k}" style="padding-top:0">
      <div style="background:${s.tint};color:#fff;padding:calc(var(--top) - 4px) 16px 22px;display:flex;flex-direction:column;gap:14px">
        <button class="back" style="color:#fff" data-act="back">${I.back}Series</button>
        <div><h1 class="title">${esc(s.name)}</h1><p style="font-size:14px;opacity:.88;margin-top:4px">${esc(s.sub)} · ${esc(s.total)}</p></div>
        <div style="display:flex;gap:10px">${eps[0] ? `<button class="pill white" style="color:${s.tint}" data-act="play" data-arg="${eps[0].id}">${I.play(16)}Play latest</button>` : ''}
          <button class="pill ghost" data-act="toast" data-arg="You’ll get a roundup when new shiurim are added">${I.bell.replace('22', '18').replace('22', '18')}Follow</button></div>
      </div>
      <p class="label" style="margin:16px 16px 4px">${eps.length} recent shiurim</p>
      ${eps.map(epRow).join('') || '<p class="pad muted" style="margin-top:12px">No recent shiurim in this playlist.</p>'}
    ${searchBtn(true)}</div></div>`;
  };

  screens.saved = () => {
    const items = S.saved.map((id) => byId[id]).filter(Boolean);
    return `<div class="screen"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="saved">
      <div class="pad" style="padding-bottom:10px"><h1 class="title">Saved</h1><p class="sub">${items.length === 1 ? '1 shiur' : items.length + ' shiurim'} saved for later</p></div>
      ${items.length ? items.map(epRow).join('') : `<div style="margin-top:110px;padding:0 40px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
        <div style="width:72px;height:72px;border-radius:36px;background:var(--save-bg);color:var(--save);display:flex;align-items:center;justify-content:center">${I.bookmark(false, 32)}</div>
        <h2 style="font-size:20px;font-weight:700;margin-top:6px">Nothing saved yet</h2><p class="muted" style="font-size:15px;line-height:22px">Tap the bookmark on any shiur to save it for later.</p></div>`}
    ${searchBtn()}</div></div>`;
  };

  const MORE = () => [
    ['Settings', [
      ['New shiur alerts', S.alerts ? 'On · once a day, when new shiurim are up' : 'Off', 'N', '#DC2626', 'switch', 'alerts'],
      ['Appearance', { system: 'Match phone (light or dark)', light: 'Light', dark: 'Dark' }[S.theme], 'A', '#334155', 'theme', '']]],
    ['Announcements', [
      ['Announcements & Schedule', 'Join the Hashevaynu WhatsApp group', 'A', '#15803D', 'url', 'https://chat.whatsapp.com/L8jzrAuS89X3wQ9pT5zcR9'],
      ['Daf Yomi WhatsApp', '', 'DY', '#15803D', 'url', 'https://chat.whatsapp.com/GQ7aFSgUHTTI7say5d1Tyc'],
      ['Mishnah Berurah Yomi WhatsApp', '', 'MB', '#15803D', 'url', 'https://chat.whatsapp.com/KDwNUA3REVJI8Jo5Nk3KkG']]],
    ['Donate', [
      ['Make a Donation', 'Opens hashevaynu.org', '$', '#C2410C', 'url', 'https://www.hashevaynu.org/donate'],
      ['Donate with Zelle', 'Tap to copy hashevaynu4u@gmail.com', 'Z', '#6D28D9', 'copy', 'hashevaynu4u@gmail.com'],
      ['Dedication Opportunities', '', 'D', '#B45309', 'url', 'https://www.hashevaynu.org/dedications']]],
    ['Contact', [
      ['Call', '646-591-7025', 'C', 'var(--accent)', 'url', 'tel:6465917025'],
      ['Email', 'hashevaynu4u@gmail.com', '@', 'var(--accent)', 'url', 'mailto:hashevaynu4u@gmail.com'],
      ['Ask the Rabbi', '', '?', 'var(--accent)', 'url', 'https://www.hashevaynu.org/ask'],
      ['Simcha Hall Rentals', '917-415-3536', 'S', 'var(--accent)', 'url', 'tel:9174153536']]],
    ['Follow', [
      ['YouTube', '', 'YT', '#B91C1C', 'url', 'https://www.youtube.com/@Hashevaynu'],
      ['Instagram', '', 'IG', '#BE185D', 'url', 'https://www.instagram.com/hashevaynu4u'],
      ['Spotify', '', 'SP', '#15803D', 'url', 'https://open.spotify.com/show/27smcGB1c2EglhPtJs7N6X'],
      ['Apple Podcasts', '', 'AP', '#7E22CE', 'url', 'https://podcasts.apple.com/us/podcast/hashevaynu-daf-yomi-shiurims/id1515644306']]]
  ];
  screens.more = () => `<div class="screen grouped"><div class="scroll ${S.current ? 'with-mini' : ''}" data-key="more"><div class="pad">
    <h1 class="title" style="margin-bottom:14px">More</h1>
    <a href="https://www.hashevaynu.org/donate" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;background:var(--accent);color:#fff">
      <div style="width:44px;height:44px;border-radius:22px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center">${I.heart}</div>
      <div style="flex:1"><div style="font-size:17px;font-weight:700">Support Hashevaynu</div><div style="font-size:13px;opacity:.88">Sponsor the Daf · $36/week or $100/month</div></div></a>
    ${MORE().map(([title, rows]) => `<h2 class="label" style="margin:22px 4px 8px">${title}</h2><div class="group">${rows.map(([t, d, g, bg, act, arg]) => {
      const inner = `<div class="glyph" style="background:${bg}">${g}</div><div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:500">${esc(t)}</div>${d ? `<div class="row-meta">${esc(d)}</div>` : ''}</div>${I.chev}`;
      if (act === 'switch') return `<div class="group-row">${inner.replace(I.chev, '')}<button class="switch" role="switch" aria-checked="${!!S[arg]}" aria-label="${esc(t)}" data-act="alertSwitch"></button></div>`;
      return act === 'url' ? `<a class="group-row" href="${esc(arg)}" target="_blank" rel="noopener">${inner}</a>` : `<button class="group-row" data-act="${act}" data-arg="${esc(arg)}">${inner}</button>`; }).join('')}</div>`).join('')}
    <p class="row-meta" style="margin:22px 4px 0;line-height:18px">Hashevaynu is a 501(c)(3) non-profit. Tax ID 11-3295965. 144-49 72nd Dr, Flushing, NY 11367.</p>
    <p class="row-meta" style="margin:10px 4px 0;line-height:18px">This is a design preview of the Hashevaynu app. Shiurim play from the Hashevaynu SoundCloud feed.</p>
  </div>${searchBtn()}</div></div>`;

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos'];
  const TIMES = [['Morning', '8:00 AM'], ['Afternoon', '1:00 PM'], ['Evening', '8:00 PM']];
  const notifSummary = () => { const n = S.notif; const d = n.days.filter((x) => x !== 6).map((x) => DAYS[x].slice(0, 3));
    return (d.length === 7 || d.length === 6 ? 'Daily' : d.length + (d.length === 1 ? ' time' : ' times') + ' a week · ' + d.join(', ')) + ' at ' + TIMES[n.time][1]; };
  screens.notifications = () => {
    const n = S.notif;
    return `<div class="screen grouped"><div class="scroll" data-key="notifications" style="padding-top:calc(var(--top) - 4px)"><div class="pad">
      ${backBtn('More')}
      <h1 class="title" style="margin-top:4px">Notifications</h1><p class="sub" style="margin-bottom:12px">Choose how often Hashevaynu reaches out</p>
      <div style="margin-bottom:16px;padding:10px 12px;border-radius:12px;background:var(--unplayed);color:var(--accent-text);font-size:13px;font-weight:600">Day 2 preview. For now the app sends one alert a day when new shiurim are up.</div>
      <div style="padding:12px;border-radius:22px;background:var(--fill);display:flex;flex-direction:column;gap:6px"><span class="label" style="font-size:11px;padding:0 4px">Preview</span>
        <div style="padding:12px;border-radius:18px;background:var(--surface);box-shadow:0 4px 14px rgba(0,0,0,.12);display:flex;gap:10px">
          <div class="tile" style="width:38px;height:38px;border-radius:9px;background:var(--accent);font-size:17px">H</div>
          <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><b style="font-size:14px">Hashevaynu</b><span class="row-meta">${n.freq === 'off' ? 'Off' : (n.days[0] != null ? DAYS[n.days[0]].slice(0, 3) : '') + ' ' + TIMES[n.time][1]}</span></div>
            <div style="font-size:14px;font-weight:600;margin-top:2px">This week at Hashevaynu</div><div class="row-meta" style="font-size:13px;line-height:18px">4 new dafim in ${esc(today.mas)} and a new moonLight of Emuna shiur. Tap to listen.</div></div></div>
        <button class="pill fill" style="height:36px;align-self:flex-start;background:var(--surface)" data-act="testNotif">Send me a test notification</button></div>
      <h2 class="label" style="margin:22px 4px 8px">Weekly updates</h2>
      <div class="group" style="padding:14px;display:flex;flex-direction:column;gap:16px">
        <div><div style="font-size:15px;font-weight:600;margin-bottom:8px">How often</div>
          <div role="radiogroup" aria-label="How often" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:4px;border-radius:12px;background:var(--fill)">
            ${[['off', 'Off'], ['1', '1× week'], ['3', '3× week'], ['daily', 'Daily']].map(([k, l]) => `<button role="radio" aria-checked="${n.freq === k}" data-act="freq" data-arg="${k}" style="height:36px;border-radius:9px;font-size:13px;font-weight:600;${n.freq === k ? 'background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.15)' : 'color:var(--text2)'}">${l}</button>`).join('')}</div></div>
        ${n.freq === 'off' ? '' : `<div><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span style="font-size:15px;font-weight:600">Which days</span><span class="row-meta">${n.days.length} chosen</span></div>
          <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">${DAYS.map((d, i) => { const on = n.days.includes(i), off = i === 6;
            return `<button data-act="day" data-arg="${i}" aria-pressed="${on}" aria-label="${off ? 'Shabbos, no notifications' : d}" ${off ? 'disabled' : ''} style="height:44px;border-radius:22px;font-size:14px;font-weight:700;background:${off ? 'transparent' : on ? 'var(--accent)' : 'var(--fill)'};color:${off ? 'var(--chevron)' : on ? '#fff' : 'var(--text)'}">${off ? 'Sh' : d[0]}</button>`; }).join('')}</div></div>
        <div><div style="font-size:15px;font-weight:600;margin-bottom:8px">What time</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
          ${TIMES.map(([l, t], i) => `<button data-act="ntime" data-arg="${i}" aria-pressed="${n.time === i}" style="height:54px;border-radius:12px;border:1.5px solid ${n.time === i ? 'var(--accent-text)' : 'var(--border)'};background:${n.time === i ? 'var(--unplayed)' : 'transparent'}"><div style="font-size:13px;font-weight:700;color:${n.time === i ? 'var(--accent-text)' : 'var(--text)'}">${l}</div><div class="row-meta" style="font-size:11px">${t}</div></button>`).join('')}</div></div>`}
      </div>
      <h2 class="label" style="margin:22px 4px 8px">What to include</h2>
      <div class="group">${[['news', 'New shiurim', 'One roundup of everything new. Busy days are bundled into a single notification.'], ['events', 'Announcements & events', 'Schedules, special shiurim and community news'],
        ['daf', 'Today’s daf reminder', 'Sent when the daf is uploaded, never before 7:00 AM. Skipped if you already listened.'], ['sponsor', 'Sponsorship opportunities', 'Sponsor the Daf and dedication opportunities']].map(([k, t, d]) =>
        `<div class="group-row" style="min-height:62px"><div style="flex:1"><div style="font-size:15px;font-weight:600">${t}</div><div class="row-meta" style="line-height:16px">${d}</div></div><button class="switch" role="switch" aria-checked="${n[k]}" aria-label="${t}" data-act="nflag" data-arg="${k}"></button></div>`).join('')}</div>
      <h2 class="label" style="margin:22px 4px 8px">Smart schedule</h2>
      <div class="group" style="padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:20px">
        ${['At most 2 notifications a day, and only on the days you picked', 'Several uploads in one day arrive as one roundup', 'On quiet days you may get a gentle nudge to finish a shiur or keep your streak', 'Nothing between 10 PM and 7 AM, or on Shabbos and Yom Tov. A catch-up arrives Motzei Shabbos'].map((t) =>
          `<div style="display:flex;gap:10px"><span style="color:var(--on);margin-top:2px">${I.check(16)}</span><span>${t}</span></div>`).join('')}</div>
    </div>${searchBtn()}</div></div>`;
  };

  screens.search = () => `<div class="screen"><div style="position:absolute;left:0;right:0;top:0;padding:var(--top) 16px 10px;background:var(--bg);z-index:2;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:10px"><label style="flex:1;display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:12px;background:var(--fill);color:var(--text2)">${I.search}
        <input id="q" type="search" value="${esc(S.query)}" placeholder="Shiurim, dafim, playlists" aria-label="Search shiurim, dafim and playlists" autocomplete="off" style="flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:16px;color:var(--text);outline:none"></label>
        <button class="link" style="font-size:16px;font-weight:500" data-act="back">Cancel</button></div>
      <div class="hscroll" style="padding:0;gap:8px">${[['all', 'All'], ['shiurim', 'Shiurim'], ['playlists', 'Playlists']].map(([k, l]) => `<button class="chip" aria-pressed="${S.scope === k}" data-act="scope" data-arg="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="scroll" id="results" style="padding-top:calc(var(--top) + 112px);bottom:0">${searchResults()}</div></div>`;

  const searchResults = () => {
    const q = S.query.trim().toLowerCase();
    if (!q) {
      return `<p class="label" style="margin:8px 16px 10px">Recent searches</p><div class="pad" style="display:flex;flex-wrap:wrap;gap:8px">
        ${[today.mas, 'Basar B’Chalav', 'moonLight', 'Chanukah'].map((r) => `<button class="chip" style="background:none;border:1px solid var(--border);font-weight:500" data-act="searchFor" data-arg="${esc(r)}">${esc(r)}</button>`).join('')}</div>
        <p class="label" style="margin:26px 16px 4px">Jump to</p>
        ${[['Today’s Daf', 'DY', 'var(--accent)', 'tab', 'daf'], ['Mishnah Berurah Yomi', 'MB', '#1F5F8B', 'go', 'playlist:mb'], ['Saved shiurim', 'SV', '#C2410C', 'tab', 'saved']].map(([l, b, c, a, g]) =>
          `<button data-act="${a}" data-arg="${g}" style="width:100%;display:flex;align-items:center;gap:12px;height:58px;padding:0 16px;border-bottom:1px solid var(--sep);text-align:left"><div class="tile" style="width:36px;height:36px;border-radius:10px;background:${c};font-size:12px">${b}</div><span style="flex:1;font-size:16px;font-weight:600">${l}</span>${I.chev}</button>`).join('')}`;
    }
    const has = (...xs) => xs.some((x) => String(x).toLowerCase().includes(q));
    const want = (k) => S.scope === 'all' || S.scope === k;
    if (S.scope === 'speakers') S.scope = 'all';
    const pls = PL ? [] : Object.entries(SERIES).filter(([k, s]) => k !== 'other' && has(s.name, s.sub));
    const realPls = PL ? PL.playlists.filter((p) => has(p.title)) : [];
    const mas = Object.values(MASECHTOS).filter((m) => has(m.name, 'daf yomi'));
    const eps = (PL ? Object.values(byId) : EP).filter((e) => has(e.title, e.speaker)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let out = '';
    if (want('playlists') && realPls.length) {
      out += `<p class="label" style="margin:8px 16px 4px">Playlists</p>` + realPls.slice(0, 12).map((p) => `<button data-act="go" data-arg="pl:${p.id}" class="row" style="width:100%;text-align:left">${plTile(p, 48)}<div class="row-text"><span class="row-title">${esc(plName(p))}</span><span class="row-meta">${esc((PL.categories.find((c) => c.id === p.category) || {}).title)} · ${p.trackCount} shiurim</span></div>${I.chev}</button>`).join('');
    }
    if (want('playlists') && !PL && (pls.length || mas.length)) {
      out += `<p class="label" style="margin:8px 16px 4px">Playlists</p>` + pls.map(([k, s]) => `<button data-act="${k === 'daf' ? 'tab' : 'go'}" data-arg="${k === 'daf' ? 'daf' : 'playlist:' + k}" class="row" style="width:100%;text-align:left">${'<div class="tile" style="width:48px;height:48px;background:' + s.tint + '">' + s.badge + '</div>'}<div class="row-text"><span class="row-title">${esc(s.name)}</span><span class="row-meta">Playlist · ${esc(s.total)}</span></div>${I.chev}</button>`).join('')
        + mas.map((m) => `<button data-act="dafMap" data-arg="${m.key}" class="row" style="width:100%;text-align:left"><div class="tile" style="width:48px;height:48px;background:var(--accent)">${m.key === 'current' ? 'DY' : m.num}</div><div class="row-text"><span class="row-title">${esc(m.name)}</span><span class="row-meta">Daf Yomi masechta · ${m.last - 1} dafim</span></div>${I.chev}</button>`).join('');
    }
    if (want('shiurim') && eps.length) out += `<p class="label" style="margin:18px 16px 4px">Shiurim</p>` + eps.slice(0, 30).map(epRow).join('');
    return out || `<div style="margin-top:80px;padding:0 40px;text-align:center"><h2 style="font-size:20px;font-weight:700">No results for “${esc(S.query)}”</h2><p class="muted" style="margin-top:8px;font-size:15px;line-height:22px">Try a masechta, a daf like “${esc(today.mas)} ${today.daf}”, a topic or a speaker’s name.</p></div>`;
  };

  const player = () => {
    const e = byId[S.current]; if (!e) return '';
    const s = ser(e), t = audio.currentTime || pos(e), d = audio.duration || e.dur, saved = isSaved(e);
    const dl = S.dl[e.id] || 0;
    return `<div class="sheet${enter('sheet', true)}" id="sheet" role="dialog" aria-label="Now playing"><span class="grabber" aria-hidden="true"></span>
      <div style="width:100%;display:flex;align-items:center;justify-content:space-between">
        <button class="icon-btn" style="background:none;margin-left:-10px" data-act="closePlayer" aria-label="Close player">${I.down}</button>
        <span class="label">${esc(s.name)}</span><span style="width:44px"></span></div>
      ${e.cover ? `<img class="art ${S.playing ? '' : 'paused'}" src="${esc(e.cover)}" alt="Artwork for ${esc(e.title)}" style="margin-top:12px;padding:0;object-fit:cover;background:var(--fill)">`
        : `<div class="art ${S.playing ? '' : 'paused'}" style="margin-top:12px;background:${e.tint || s.tint}">
        <b style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;opacity:.85">Hashevaynu · ${esc(s.short)}</b>
        <div><div style="font-size:30px;line-height:34px;font-weight:800;letter-spacing:-.02em">${esc(e.title.replace(' (Daf Yomi)', '').replace(/^(Mishnah Berurah Yomi|Semicha Shiurim): /, ''))}</div><div style="font-size:15px;opacity:.85;margin-top:6px">${esc(e.speaker)}</div></div></div>`}
      <div style="margin-top:24px;width:100%;text-align:center"><h1 style="font-size:20px;line-height:26px;font-weight:700">${esc(e.title)}</h1><p class="muted" style="font-size:15px;margin-top:4px">${esc(e.speaker)} · ${fmtDate(e.date)}</p></div>
      <div style="margin-top:18px;width:100%">
        <input id="scrub" class="scrub" type="range" min="0" max="${Math.round(d)}" value="${Math.round(t)}" style="--p:${d ? t / d * 100 : 0}%" aria-label="Playback position">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);font-variant-numeric:tabular-nums;margin-top:4px"><span id="t-cur">${clock(t)}</span><span id="t-left">−${clock(d - t)}</span></div></div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:40px">
        <button class="icon-btn" style="width:52px;height:52px;background:none;color:var(--text)" data-act="skip" data-arg="-15" aria-label="Back 15 seconds">${I.skip(-1, 15, 34)}</button>
        <button class="icon-btn" style="width:80px;height:80px;border-radius:40px;background:var(--accent);color:#fff;box-shadow:0 10px 24px rgba(0,0,0,.2)" data-act="toggle" aria-label="${S.playing ? 'Pause' : 'Play'}">${S.playing ? I.pause(32) : I.play(32)}</button>
        <button class="icon-btn" style="width:52px;height:52px;background:none;color:var(--text)" data-act="skip" data-arg="30" aria-label="Forward 30 seconds">${I.skip(1, 30, 34)}</button></div>
      <div style="margin-top:auto;padding-top:22px;width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">
        <button class="icon-row-btn" style="color:${saved ? 'var(--save)' : 'var(--text)'}" data-act="save" data-arg="${e.id}" aria-label="${saved ? 'Remove from Saved' : 'Save for later'}" aria-pressed="${saved}">${I.bookmark(saved, 24)}</button>
        <button class="icon-row-btn" data-act="share" data-arg="${e.id}" aria-label="Share">${I.share.replace(/20/g, '24')}</button>
        <button class="icon-row-btn" style="font-size:16px;font-weight:800" data-act="rate" aria-label="Playback speed ${S.rate}×">${S.rate}×</button>
        <button class="icon-row-btn" style="color:${dl === 2 ? 'var(--accent-text)' : 'var(--text)'}" data-act="download" aria-label="${['Download', 'Downloading', 'Downloaded, tap to remove'][dl]}">${dl === 1 ? '<span class="mini-spin" aria-hidden="true"></span>' : dl === 2 ? I.check(24) : I.dl.replace(/20/g, '24')}</button>
      </div>
    </div>`;
  };

  // ---------- Rendering ----------
  const app = document.getElementById('app');
  const scrolls = {};
  let toastTimer = null, toastMsg = '';
  const route = () => { const top = S.stack[S.stack.length - 1]; if (!top) return [S.tab, null]; const [n, a] = top.split(':'); return [n, a || null]; };
  // Animations play only when something first appears, not on every redraw.
  const shown = { sheet: false, mini: null, sel: null, toast: '' };
  const enter = (key, now) => { const fresh = now && shown[key] !== now; shown[key] = now; return fresh ? ' anim' : ''; };
  function render() {
    app.querySelectorAll('.scroll[data-key]').forEach((el) => { scrolls[el.dataset.key] = el.scrollTop; });
    const [name, arg] = route();
    const hasTabs = name !== 'search';
    app.innerHTML = screens[name](arg) + (hasTabs && !((name === 'masechta' || (name === 'daf' && S.dafTab === 'map')) && S.sel) ? mini() : '') + (hasTabs ? tabbar() : '')
      + (S.playerOpen ? player() : '') + (toastMsg ? `<div class="toast${enter('toast', toastMsg)}" role="status">${esc(toastMsg)}</div>` : '');
    if (!S.playerOpen) shown.sheet = false;
    if (!S.sel) shown.sel = null;
    if (!toastMsg) shown.toast = '';
    app.querySelectorAll('.scroll[data-key]').forEach((el) => { if (scrolls[el.dataset.key]) el.scrollTop = scrolls[el.dataset.key]; });
    const q = document.getElementById('q');
    if (q) { q.addEventListener('input', () => { S.query = q.value; document.getElementById('results').innerHTML = searchResults(); }); if (!q.value) q.focus({ preventScroll: true }); }
    const sc = document.getElementById('scrub');
    if (sc) sc.addEventListener('input', () => { audio.currentTime = +sc.value; tick(); });
  }
  // Drag the player down to minimize it, like an iOS bottom sheet.
  let drag = null;
  app.addEventListener('touchstart', (ev) => {
    const sh = ev.target.closest('#sheet');
    if (!sh || ev.target.closest('input[type=range]') || sh.scrollTop > 0) return;
    drag = { sh, y: ev.touches[0].clientY, t: Date.now(), dy: 0 };
  }, { passive: true });
  app.addEventListener('touchmove', (ev) => {
    if (!drag) return;
    drag.dy = Math.max(0, ev.touches[0].clientY - drag.y);
    drag.sh.style.transition = 'none';
    drag.sh.style.transform = `translateY(${drag.dy}px)`;
    drag.sh.style.borderRadius = drag.dy ? '28px 28px 0 0' : '';
  }, { passive: true });
  app.addEventListener('touchend', () => {
    if (!drag) return;
    const { sh, dy, t } = drag; drag = null;
    const fast = dy / Math.max(1, Date.now() - t) > 0.6;
    if (dy > 140 || (fast && dy > 40)) {
      sh.style.transition = 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)';
      sh.style.transform = 'translateY(100%)';
      setTimeout(() => { S.playerOpen = false; render(); }, 230);
    } else {
      sh.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
      sh.style.transform = ''; sh.style.borderRadius = '';
    }
  });

  // Pull down at the top of a tab to check for new shiurim and playlists.
  let pull = null;
  app.addEventListener('touchstart', (ev) => {
    const sc = ev.target.closest('.scroll[data-key]');
    if (sc && sc.scrollTop <= 0 && !S.playerOpen) pull = { sc, y: ev.touches[0].clientY, dy: 0 };
  }, { passive: true });
  app.addEventListener('touchmove', (ev) => {
    if (!pull) return;
    pull.dy = Math.max(0, ev.touches[0].clientY - pull.y);
    const d = Math.min(pull.dy * 0.5, 80);
    pull.sc.style.transform = `translateY(${d}px)`;
    let ind = document.getElementById('ptr');
    if (!ind) { ind = document.createElement('div'); ind.id = 'ptr'; ind.className = 'ptr'; app.appendChild(ind); }
    ind.style.opacity = Math.min(1, d / 60); ind.style.transform = `translateX(-50%) rotate(${d * 4}deg)`;
  }, { passive: true });
  app.addEventListener('touchend', () => {
    if (!pull) return;
    const { sc, dy } = pull; pull = null;
    sc.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'; sc.style.transform = '';
    setTimeout(() => { sc.style.transition = ''; }, 320);
    const ind = document.getElementById('ptr');
    if (dy * 0.5 < 60) { if (ind) ind.remove(); return; }
    if (ind) ind.classList.add('spin');
    const before = PL ? PL.playlists.reduce((n, p) => n + p.trackCount, 0) : 0;
    Promise.all([loadPlaylists(), new Promise((r) => setTimeout(r, 600))]).then(() => {
      const after = PL ? PL.playlists.reduce((n, p) => n + p.trackCount, 0) : 0;
      const el = document.getElementById('ptr'); if (el) el.remove();
      toast(after > before && before ? (after - before) + ' new shiurim' : 'You’re up to date');
    });
  });

  const toast = (m) => { toastMsg = m; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMsg = ''; render(); }, 2200); };

  // ---------- Audio ----------
  const audio = new Audio();
  audio.preload = 'metadata';
  let lastSave = 0, sleepTimer = null;
  function tick() {
    const e = byId[S.current]; if (!e) return;
    const t = audio.currentTime, d = audio.duration || e.dur;
    const mp = document.getElementById('mini-progress'); if (mp) mp.style.width = (d ? t / d * 100 : 0) + '%';
    const sc = document.getElementById('scrub'); if (sc && document.activeElement !== sc) { sc.max = Math.round(d); sc.value = Math.round(t); }
    if (sc) sc.style.setProperty('--p', (d ? t / d * 100 : 0) + '%');
    const a = document.getElementById('t-cur'), b = document.getElementById('t-left');
    if (a) a.textContent = clock(t); if (b) b.textContent = '−' + clock(d - t);
    if (Math.abs(t - lastSave) > 5) { S.positions[e.id] = Math.floor(t); lastSave = t; persist(); }
  }
  audio.addEventListener('timeupdate', tick);
  audio.addEventListener('play', () => { S.playing = true; render(); });
  audio.addEventListener('pause', () => { S.playing = false; const e = byId[S.current]; if (e) { S.positions[e.id] = Math.floor(audio.currentTime); persist(); } render(); });
  audio.addEventListener('ended', () => { const e = byId[S.current]; if (e && !S.finished.includes(e.id)) S.finished.push(e.id); if (e) delete S.positions[e.id]; S.playing = false; if (S.sleep === 3) S.sleep = 0; persist(); render(); });
  audio.addEventListener('error', () => { if (S.current) toast('Couldn’t load this shiur. Check your connection.'); });

  function playEpisode(id) {
    const e = byId[id]; if (!e) return;
    if (S.current === id && audio.src) { audio.paused ? audio.play().catch(() => {}) : audio.pause(); return; }
    S.current = id; audio.src = e.audio; audio.playbackRate = S.rate;
    if (S.finished.includes(id)) S.finished = S.finished.filter((x) => x !== id);
    const start = pos(e) > 5 ? pos(e) - 3 : 0;
    audio.addEventListener('loadedmetadata', function once() { audio.currentTime = start; audio.removeEventListener('loadedmetadata', once); });
    audio.play().catch(() => {});
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: e.title, artist: e.speaker, album: 'Hashevaynu · ' + ser(e).name });
      navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
      navigator.mediaSession.setActionHandler('seekforward', () => skip(30));
    }
    persist(); render();
  }
  const skip = (n) => { audio.currentTime = Math.max(0, Math.min((audio.duration || 1e9) - 1, audio.currentTime + n)); tick(); };

  // ---------- Actions ----------
  const go = (where) => { S.stack.push(where); if (where.startsWith('masechta')) S.masShown = null; render(); };
  const A = {
    tab: (k) => { if (k === 'daf' && S.tab === 'daf' && !S.stack.length) S.dafTab = 'today'; S.tab = k; S.stack = []; S.sel = null; render(); const el = app.querySelector('.scroll'); if (el) el.scrollTop = 0; },
    go: (w) => { S.plShow = 60; S.plOldest = false; go(w); },
    back: () => { S.stack.pop(); S.sel = null; render(); },
    play: (id) => playEpisode(id),
    toggle: () => { if (!audio.src && S.current) return playEpisode(S.current); audio.paused ? audio.play().catch(() => {}) : audio.pause(); },
    skip: (n) => skip(+n),
    openPlayer: () => { S.playerOpen = true; render(); },
    closePlayer: () => { const el = document.getElementById('sheet'); if (el) el.classList.add('closing'); setTimeout(() => { S.playerOpen = false; render(); }, 230); },
    save: (id) => { const on = S.saved.includes(id); S.saved = on ? S.saved.filter((x) => x !== id) : [id, ...S.saved]; persist(); toast(on ? 'Removed from Saved' : 'Saved for later'); },
    rate: () => { const r = [1, 1.25, 1.5, 2, 0.75]; S.rate = r[(r.indexOf(S.rate) + 1) % r.length]; audio.playbackRate = S.rate; persist(); render(); },
    sleep: () => { S.sleep = (S.sleep + 1) % 4; clearTimeout(sleepTimer); if (S.sleep === 1 || S.sleep === 2) sleepTimer = setTimeout(() => { audio.pause(); S.sleep = 0; render(); }, (S.sleep === 1 ? 15 : 30) * 60000); render(); },
    download: () => { const id = S.current, st = S.dl[id] || 0; if (st === 2) { delete S.dl[id]; persist(); return toast('Download removed'); } S.dl[id] = 1; render(); setTimeout(() => { S.dl[id] = 2; persist(); render(); }, 1500); },
    flag: (k) => { S[k] = !S[k]; persist(); render(); },
    share: async (id) => { const e = byId[id]; try { if (navigator.share) await navigator.share({ title: e.title, text: e.title + ' · Hashevaynu', url: e.link }); else { await navigator.clipboard.writeText(e.link); toast('SoundCloud link copied'); } } catch (err) { /* share cancelled */ } },
    shareText: async (txt) => { try { if (navigator.share) await navigator.share({ text: txt, url: 'https://www.hashevaynu.org' }); else { await navigator.clipboard.writeText(txt); toast('Copied'); } } catch (err) { /* cancelled */ } },
    copy: async (txt) => { try { await navigator.clipboard.writeText(txt); toast('Zelle email copied'); } catch (err) { toast(txt); } },
    toast: (m) => toast(m),
    theme: () => { S.theme = { system: 'light', light: 'dark', dark: 'system' }[S.theme]; applyTheme(); persist(); render(); },
    searchFor: (q) => { S.query = q; if (route()[0] === 'search') { render(); } else go('search'); },
    scope: (k) => { S.scope = k; render(); },
    dafTab: (k) => { S.dafTab = k; S.mapOpen = false; S.sel = null; render(); const el = app.querySelector('.scroll'); if (el) el.scrollTop = 0; },
    openMap: (k) => { S.mapOpen = true; S.mas = k; S.masShown = k; S.sel = null; render(); const el = app.querySelector('.scroll'); if (el) el.scrollTop = 0; },
    mapList: () => { S.mapOpen = false; S.sel = null; render(); },
    dafMap: (k) => { S.tab = 'daf'; S.stack = []; S.dafTab = 'map'; S.mapOpen = true; S.mas = k || 'current'; S.masShown = S.mas; S.sel = null; render(); const el = app.querySelector('.scroll'); if (el) el.scrollTop = 0; },
    plOrder: () => { S.plOldest = !S.plOldest; S.plShow = 60; render(); },
    plMore: () => { S.plShow = (S.plShow || 60) + 100; render(); },
    mas: (k) => { S.mas = k; S.masShown = k; S.sel = null; if (S.stack.length) S.stack[S.stack.length - 1] = 'masechta:' + k; const st = app.querySelector('.scroll'); if (st) st.scrollTop = 0; render(); },
    sel: (d) => { S.sel = +d || null; render(); },
    learned: () => { const base = MASECHTOS[S.mas]; const ov = Object.assign({}, S.overrides[base.key]); const p = (S.sel in ov) ? ov[S.sel] : (base.progress[S.sel] || 0);
      ov[S.sel] = p >= 1 ? 0 : 1; S.overrides[base.key] = ov; let n = 0; for (let d = 2; d <= base.last; d++) if (((d in ov) ? ov[d] : (base.progress[d] || 0)) >= 1) n++;
      if (n === base.last - 1) S.siyum = true; persist(); render(); },
    siyum: (v) => { S.siyum = v === '1'; render(); },
    freq: (k) => { S.notif.freq = k; S.notif.days = { off: [], '1': [0], '3': [0, 2, 4], daily: [0, 1, 2, 3, 4, 5] }[k]; persist(); render(); },
    day: (i) => { i = +i; const d = S.notif.days; S.notif.days = d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort(); const n = S.notif.days.length;
      S.notif.freq = n === 0 ? 'off' : n === 1 ? '1' : n === 3 ? '3' : n >= 6 ? 'daily' : 'custom'; persist(); render(); },
    ntime: (i) => { S.notif.time = +i; persist(); render(); },
    nflag: (k) => { S.notif[k] = !S.notif[k]; persist(); render(); },
    alertSwitch: async () => {
      S.alerts = !S.alerts; persist(); render();
      if (S.alerts && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
      toast(S.alerts ? 'You’ll get one notification a day when new shiurim are up' : 'New shiur alerts off');
    },
    testNotif: async () => {
      if (!('Notification' in window)) return toast('This browser can’t show notifications');
      const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      if (perm !== 'granted') return toast('Notifications are blocked for this site');
      new Notification('This week at Hashevaynu', { body: '4 new dafim in ' + today.mas + ' and a new moonLight of Emuna shiur. Tap to listen.', icon: 'icon-192.png' });
    }
  };
  app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
    const fn = A[el.dataset.act]; if (fn) { ev.preventDefault(); fn(el.dataset.arg); }
  });
  render();
  loadPlaylists();
})();
