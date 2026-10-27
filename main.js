(() => {
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add('fallback'); document.querySelectorAll('[data-count]').forEach(e => { e.textContent = e.dataset.count; }); return; }
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    closeMenu();
    lenis ? lenis.scrollTo(t, { offset: 0, duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) }) : t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- menu + nav ---------- */
  const burger = $('#burger'), menu = $('#menu'), nav = $('#nav');
  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
  }
  burger.addEventListener('click', () => {
    if (burger.getAttribute('aria-expanded') === 'true') return closeMenu();
    burger.setAttribute('aria-expanded', 'true'); menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
  });
  let lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => {
    const y = s.scroll();
    nav.classList.toggle('solid', y > 60);
    nav.classList.toggle('hide', y > lastY && y > 500);
    lastY = y;
  } });

  /* ---------- wordmark: fit to width, letters ---------- */
  const mark = $('#mark'), markText = $('#markText');
  const word = markText.textContent.trim();
  markText.textContent = '';
  const chars = [...word].map(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; markText.appendChild(s); return s; });
  const cv = document.createElement('canvas').getContext('2d');
  function fitMark() {
    cv.font = '700 100px Oswald, "Arial Narrow", Impact, sans-serif';
    const w = cv.measureText(word).width + word.length * 0.5; // + letter-spacing .005em
    const fs = 100 * mark.clientWidth / w * 0.995;
    markText.style.fontSize = fs + 'px';
    mark.style.height = fs * 0.92 + 'px';
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitMark);
  addEventListener('resize', fitMark);
  fitMark();

  /* ---------- split text ---------- */
  function splitNode(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = p; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitNode(n);
    });
  }
  $$('[data-split]').forEach(el => {
    el.classList.add('split'); splitNode(el);
    gsap.to($$('.w > span', el), { y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- reveals ---------- */
  ScrollTrigger.batch('[data-r]', {
    start: 'top 92%',
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, overwrite: true })
  });
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () =>
      gsap.to(o, { v: end, duration: 2.4, delay: 1.6, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) }) });
  });

  /* ---------- parallax ---------- */
  gsap.to('#heroImg', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#mark', { yPercent: -35, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });


  /* ---------- photos: wall, objects, feed, lightbox ---------- */
  const ALB = window.ALBUMS || [];
  const byId = Object.fromEntries(ALB.map(a => [a.id, a]));
  const T = id => `img/t/${id}.jpg`, Pf = id => `img/p/${id}.jpg`;
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let lbList = [], lbI = 0;
  function lbShow(i) {
    lbI = (i + lbList.length) % lbList.length;
    const it = lbList[lbI];
    lbImg.style.opacity = 0;
    const im = new Image(); im.onload = () => { lbImg.src = im.src; lbImg.style.opacity = 1; }; im.src = Pf(it.id);
    lbCap.textContent = `${it.cap}  ·  ${lbI + 1} / ${lbList.length}`;
  }
  function lbOpen(list, i) {
    lbList = list; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); lbShow(i);
  }
  function lbClose() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  $('#lbX').onclick = lbClose; $('#lbP').onclick = () => lbShow(lbI - 1); $('#lbN').onclick = () => lbShow(lbI + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1);
  });
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) lbShow(lbI + (d < 0 ? 1 : -1)); });
  const capOf = a => `${a.title} · ${a.loc}`;
  const albumList = a => a.photos.map(p => ({ id: p.id, cap: capOf(a) }));

  const all = ALB.flatMap(a => a.photos.map(p => ({ id: p.id, cap: capOf(a), w: p.w, h: p.h, cat: a.cat })));
  const wallPhotos = all.filter(p => p.cat !== 'repair' && p.w / p.h > 1.2);
  const half = Math.ceil(wallPhotos.length / 2);
  const mkWall = (list, el) => {
    const html = list.map(p => `<img src="${T(p.id)}" alt="${p.cap}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}" data-id="${p.id}">`).join('');
    el.innerHTML = html + html;
    el.addEventListener('click', e => {
      const t = e.target.closest('img'); if (!t) return;
      lbOpen(list, Math.max(0, list.findIndex(p => p.id === t.dataset.id)));
    });
  };
  mkWall(wallPhotos.slice(0, half), $('#wallA')); mkWall(wallPhotos.slice(half), $('#wallB'));

  const grid = $('#objgrid');
  function renderObjs(f) {
    const list = ALB.filter(a => f === 'all' || a.cat === f);
    grid.innerHTML = list.map((a, i) => {
      const big = i === 0 && f === 'all';
      return `<article class="ocard${big ? ' is-big' : ''}" data-id="${a.id}" tabindex="0">
      <img src="${big ? Pf(a.cover) : T(a.cover)}" alt="${capOf(a)}" loading="lazy">
      <span class="ocard__cnt">${a.photos.length} фото</span>
      <div class="ocard__txt"><small>${a.status}</small><b>${a.title}</b><span>${a.loc}</span></div>
      <i class="arr"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h12M9 3l5 5-5 5"/></svg></i></article>`;
    }).join('');
    const cards = $$('.ocard', grid);
    cards.forEach((c, i) => setTimeout(() => c.classList.add('in'), 60 + i * 70));
    cards.forEach(c => {
      const open = () => lbOpen(albumList(byId[c.dataset.id]), 0);
      c.onclick = open; c.onkeydown = e => { if (e.key === 'Enter') open(); };
    });
    clearTimeout(renderObjs.t); renderObjs.t = setTimeout(() => ScrollTrigger.refresh(), 400);
  }
  $$('#chips .chip-btn').forEach(b => b.addEventListener('click', () => {
    $$('#chips .chip-btn').forEach(x => x.classList.toggle('is-on', x === b)); renderObjs(b.dataset.f);
  }));
  ScrollTrigger.create({ trigger: grid, start: 'top 90%', once: true, onEnter: () => setTimeout(() => renderObjs('all'), 0) });

  const feed = all.filter(p => p.cat !== 'repair').filter((p, i) => i % 3 === 0).slice(0, 27);
  const mas = $('#masonry');
  mas.innerHTML = feed.map(p => `<figure data-id="${p.id}"><img src="${T(p.id)}" alt="${p.cap}" loading="lazy" width="${p.w}" height="${p.h}"><figcaption>${p.cap}</figcaption></figure>`).join('');
  $$('figure', mas).forEach(f => {
    ScrollTrigger.create({ trigger: f, start: 'top 94%', once: true, onEnter: () => f.classList.add('in') });
    f.onclick = () => lbOpen(feed, feed.findIndex(p => p.id === f.dataset.id));
  });

  /* ---------- magnetic + cursor ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(b => {
      const xt = gsap.quickTo(b, 'x', { duration: 0.8, ease: 'elastic.out(1,.6)' });
      const yt = gsap.quickTo(b, 'y', { duration: 0.8, ease: 'elastic.out(1,.6)' });
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        xt((e.clientX - r.left - r.width / 2) * 0.22); yt((e.clientY - r.top - r.height / 2) * 0.3);
      });
      b.addEventListener('pointerleave', () => { xt(0); yt(0); });
    });
    const c = $('#cursor');
    const cx = gsap.quickTo(c, 'x', { duration: 0.5, ease: 'power3' }), cy = gsap.quickTo(c, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('pointermove', e => { c.classList.add('on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerover', e => c.classList.toggle('big', !!e.target.closest('a,button,.scard,.ocard,.stage,figure,.wall__row img')));
  }

  /* ---------- form ---------- */
  const form = $('#form'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name, phone = form.phone; let ok = true;
    [name, phone].forEach(f => f.classList.remove('err'));
    if (name.value.trim().length < 2) { name.classList.add('err'); ok = false; }
    if (phone.value.replace(/\D/g, '').length < 10) { phone.classList.add('err'); ok = false; }
    if (!ok) { note.textContent = 'Пожалуйста, укажите имя и телефон.'; return; }
    const body = encodeURIComponent(`Имя: ${name.value}\nТелефон: ${phone.value}\n${form.msg.value}`);
    note.textContent = 'Спасибо! Открываем почту для отправки заявки — или позвоните: +7 951 153-13-43';
    location.href = `mailto:dom-31.1@yandex.ru?subject=${encodeURIComponent('Заявка с сайта ЦентрСтрой')}&body=${body}`;
  });

  /* ---------- intro ---------- */
  const num = $('#loaderNum'), bar = $('#loaderBar'), L = { v: 0 };
  gsap.set('.reveal-h', { opacity: 0, y: 30 });
  gsap.set(chars, { yPercent: 105 });
  const done = () => {
    if (done.ran) return; done.ran = true;
    document.body.classList.remove('is-loading');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#loader', { yPercent: -100, duration: 1.3, ease: 'expo.inOut' })
      .add(() => { lenis && lenis.start(); ScrollTrigger.refresh(); }, 0.4)
      .fromTo('.hero__bg img', { scale: 1.12 }, { scale: 1, duration: 2.6, ease: 'power3.out' }, 0.3)
      .to(chars, { yPercent: 0, duration: 1.5, stagger: 0.06 }, 0.8)
      .to('.hero__title .line > span', { y: 0, duration: 1.4, stagger: 0.12 }, 1.2)
      .to('.reveal-h', { opacity: 1, y: 0, duration: 1.3, stagger: 0.1 }, 1.5);
  };
  gsap.to(L, { v: 100, duration: reduce ? 0.1 : 1.6, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = Math.round(L.v); bar.style.transform = `scaleX(${L.v / 100})`; },
    onComplete: () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(done) });
  setTimeout(done, 8000);
})();
