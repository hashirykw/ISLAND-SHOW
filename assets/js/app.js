/* Island Shop Central Coast · shared site script (all pages)
 * Pages set <body data-page="home|wardrobe|flags|seafood|little-ones|order|visit">.
 * three.js is imported only on pages that draw 3D (home, wardrobe, flags). */
const d = document, root = d.documentElement;
const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
const PAGE = d.body.dataset.page;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOB = () => innerWidth <= 760;
const PHONE = '+61403506822';
const smsHref = body => 'sms:' + PHONE + '?&body=' + encodeURIComponent(body);
const IMG = n => 'assets/img/' + n;
const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { } } };
$$('.yr').forEach(e => e.textContent = new Date().getFullYear());

/* ================= data (only what the shop has posted) ================= */
const NOTE = {
  tonga: 'Some Tonga tees left in various sizes, babies to adults 6XL.',
  samoa: 'A few Samoa tees left. Mostly 5XL–6XL, some smaller.',
  nz: 'Limited NZ tees available.'
};
const COL = { tonga: 'Tonga', samoa: 'Samoa', nz: 'NZ & Māori' };
const ITEMS = [
  ['ofa-atu', 'Ofa Atu', 'tonga', 'Black tee'],
  ['tonga-laurel', 'Tonga laurel', 'tonga', 'Navy tee'],
  ['tonga-tank', 'Tonga block', 'tonga', 'White singlet'],
  ['tonga-flag-tank', 'Tonga flag', 'tonga', 'Black singlet'],
  ['tonga-676', '676 · Tongan roots', 'tonga', 'Black tee'],
  ['mate-maa-crest', "Mate Ma'a crest", 'tonga', 'Black tee'],
  ['tonga-black', 'Tonga', 'tonga', 'Black tee'],
  ['mate-maa-tonga', "Mate Ma'a Tonga", 'tonga', 'Black tee'],
  ['tonga-navy', 'Tonga', 'tonga', 'Navy tee'],
  ['toa-samoa-black', 'Toa Samoa', 'samoa', 'Black tee'],
  ['toa-samoa-white', 'Toa Samoa', 'samoa', 'White tee'],
  ['samoa-flag-tee', 'Samoa flag', 'samoa', 'Black tee'],
  ['samoa-white', 'Samoa', 'samoa', 'White tee'],
  ['faamalosi-uso', 'Faamalosi Uso', 'samoa', 'Black tee'],
  ['kiwi-as-pink', 'Kiwi As', 'nz', 'Pink tee'],
  ['kiwi-as-black', 'Kiwi As', 'nz', 'Black tee'],
  ['nz-navy', 'New Zealand', 'nz', 'Navy tee'],
  ['kia-ora-white', 'Kia Ora fern', 'nz', 'Cream tee'],
  ['kia-ora-black', 'Kia Ora fern', 'nz', 'Black tee'],
  ['maori-white', 'Māori', 'nz', 'White tee']
].map(([id, name, col, kind], i) => ({ id, name, col, kind, i, img: IMG(id + '.webp') }));
const byId = id => ITEMS.find(x => x.id === id);
const SIZES = ['Baby', 'Kids', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', 'Not sure'];

/* ================= order store (shared across pages) ================= */
const Store = {
  items: [], extras: [], fns: [],
  load() { try { const s = JSON.parse(localStorage.getItem('isc-order') || 'null'); if (s) { this.items = (s.items || []).filter(o => byId(o.id)); this.extras = s.extras || []; } } catch (e) { } },
  save() { try { localStorage.setItem('isc-order', JSON.stringify({ items: this.items, extras: this.extras })); } catch (e) { } this.fns.forEach(f => f()); },
  has(id) { return this.items.some(o => o.id === id); },
  get(id) { return this.items.find(o => o.id === id); },
  add(id, size) { const o = this.get(id); if (o) { if (size) o.size = size; } else this.items.push({ id, size: size || '' }); this.save(); },
  remove(id) { this.items = this.items.filter(o => o.id !== id); this.save(); },
  setSize(id, size) { const o = this.get(id); if (o) { o.size = size; this.save(); } },
  toggleExtra(x, on) { const has = this.extras.includes(x); if (on === undefined) on = !has; if (on && !has) this.extras.push(x); if (!on && has) this.extras = this.extras.filter(e => e !== x); this.save(); },
  count() { return this.items.length + this.extras.length; },
  on(f) { this.fns.push(f); }
};
Store.load();
addEventListener('storage', e => { if (e.key === 'isc-order') { Store.load(); Store.fns.forEach(f => f()); } });
function syncCounts() {
  const n = Store.count();
  $$('[data-count]').forEach(el => { el.textContent = n; el.closest('.icon-btn,.dock a,a')?.classList.toggle('has-items', n > 0); });
  $$('[data-count-label]').forEach(el => el.textContent = n + (n === 1 ? ' item' : ' items'));
  $$('[data-bag]').forEach(el => el.setAttribute('aria-label', `Your order list, ${n} item${n === 1 ? '' : 's'}`));
}
Store.on(syncCounts); syncCounts();

/* ================= themed dropdown (listbox) ================= */
let selN = 0;
function makeSelect({ value = '', placeholder = 'Size', label = 'Size', onChange }) {
  const id = 'sel' + (++selN);
  const w = d.createElement('div'); w.className = 'sel';
  w.innerHTML = `<button type="button" class="sel__btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}" aria-label="${label}"><span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg></button><ul class="sel__list" role="listbox" id="${id}" tabindex="-1" aria-label="${label}"></ul>`;
  const btn = $('.sel__btn', w), list = $('ul', w), txt = $('span', btn);
  let val = value, act = -1;
  SIZES.forEach((s, k) => { const li = d.createElement('li'); li.role = 'option'; li.id = id + '-' + k; li.textContent = s; li.dataset.v = s; list.appendChild(li); });
  const opts = $$('li', list);
  const paint = () => { txt.textContent = val || placeholder; btn.dataset.empty = !val; opts.forEach(o => o.setAttribute('aria-selected', o.dataset.v === val)); };
  const setAct = k => { act = Math.max(0, Math.min(opts.length - 1, k)); opts.forEach((o, i) => o.classList.toggle('is-active', i === act)); list.setAttribute('aria-activedescendant', opts[act].id); opts[act].scrollIntoView({ block: 'nearest' }); };
  const open = () => {
    $$('.sel.is-open').forEach(s => s !== w && s.__close && s.__close());
    const b = btn.getBoundingClientRect(); w.classList.toggle('is-up', innerHeight - b.bottom < 260 && b.top > 260);
    w.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); setAct(Math.max(0, SIZES.indexOf(val))); list.focus({ preventScroll: true });
  };
  const close = (refocus) => { w.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); };
  w.__close = close;
  const choose = v => { val = v; paint(); close(true); onChange && onChange(v); };
  btn.addEventListener('click', () => w.classList.contains('is-open') ? close() : open());
  btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
  list.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
    else if (e.key === 'Home') { e.preventDefault(); setAct(0); }
    else if (e.key === 'End') { e.preventDefault(); setAct(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(opts[act].dataset.v); }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.stopPropagation(); close(e.key === 'Escape'); }
  });
  list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(li.dataset.v); });
  paint();
  w.setValue = v => { val = v; paint(); };
  w.getValue = () => val;
  return w;
}
d.addEventListener('pointerdown', e => { $$('.sel.is-open').forEach(s => { if (!s.contains(e.target)) s.__close(); }); });

/* ================= common UI ================= */
const burger = $('.nav .burger'), dockMenu = $('#dockMenu'), dockChat = $('#dockChat');
function setMenu(open) {
  if (open) setBot(false);
  root.classList.toggle('menu-open', open);
  [burger, dockMenu].forEach(b => b && b.setAttribute('aria-expanded', open));
  burger && burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
burger && burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
dockMenu && dockMenu.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
d.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); setBot(false); } });
d.addEventListener('pointerdown', e => { if (root.classList.contains('menu-open') && !e.target.closest('#menu,.burger,#dockMenu')) setMenu(false); });

/* chatbot (scripted, facts from the shop's posts only) */
const KB = [
  { k: /(seafood|fish|paua|pāua|kina|mussel|oyster|kahawai|smoked)/, a: 'NZ seafood comes in drops: SUNZ pāua, mussels, Pacific oysters and southern kina, plus smoked kahawai and 1kg pāua when available. Orders are pre-paid, then you pick up when it lands. Stock is limited.', btn: ['Ask about the next drop', smsHref('Hi Island Shop! What NZ seafood have you got in the next drop?')] },
  { k: /(baby|bub|infant|toddler|preorder|pre-order)/, a: 'Baby designs for Tonga, Māori and Samoa are made to order. Text us the design and your bub\'s size to preorder.', btn: ['See the baby designs', 'little-ones.html'] },
  { k: /(flag)/, a: 'Samoa, Māori and NZ flags are available. Tonga flags are sold out for now. Text us to be told when they\'re back.', btn: ['See the flags', 'flags.html'] },
  { k: /(price|cost|how much|\$|dollar|cheap)/, a: 'The tees in our posts are $10 each.', btn: ['Open the wardrobe', 'wardrobe.html'] },
  { k: /(size|6xl|5xl|xl|small|big|plus|kid|child)/, a: 'We stock various sizes, from babies to adults 6XL. Not every design comes in every size, so text us the design and size and we\'ll check.' },
  { k: /(samoa|toa|uso|faamalosi)/, a: 'We have a few Samoa tees left, mostly 5XL–6XL with some smaller. Samoa flags are available, and Samoa baby designs are on preorder.' },
  { k: /(tonga|mate ma|676|ofa)/, a: 'We still have some Tonga tees in various sizes. Tonga flags are sold out for now. Tonga baby designs are on preorder.' },
  { k: /(nz|new zealand|kiwi|maori|māori|aotearoa)/, a: 'We have limited NZ tees (Kiwi As, Kia Ora fern, New Zealand and Māori designs). Māori and NZ flags are available, and Māori baby designs are on preorder.' },
  { k: /(where|location|address|pick ?up|toukley|collect|find)/, a: 'We\'re in Toukley on the Central Coast, NSW. Pickups are arranged by message.', btn: ['Visit page', 'visit.html'] },
  { k: /(hour|open|time|when)/, a: 'We haven\'t posted set hours here. Text 0403 506 822 and we\'ll let you know when you can pick up.' },
  { k: /(ship|post|deliver|send)/, a: 'Delivery isn\'t listed on the site. Text us and ask, we\'ll tell you what\'s possible.' },
  { k: /(order|buy|text|phone|call|contact|number|dm|instagram)/, a: 'Easiest way: build your list on the Order page and send it as a text to 0403 506 822, or DM @island_shop_central_coast on Instagram.', btn: ['Go to my order', 'order.html'] },
  { k: /(pay|payment|card|cash|transfer)/, a: 'Seafood orders are pre-paid. Text us and we\'ll tell you how to pay.' },
  { k: /\b(hi|hello|hey)\b|kia ora|talofa|malo|mālō/, a: 'Kia ora, talofa lava, mālō e lelei! Ask me about tees, sizes, flags, seafood or baby preorders.' }
];
const bot = $('#bot'), fab = $('#botFab'), log = $('#botLog'), inp = $('#botIn'), err = $('#botErr');
let greeted = false;
function say(t, who = 'bot', btn) {
  const m = d.createElement('div'); m.className = 'msg msg--' + who; m.textContent = t;
  if (btn) { const a = d.createElement('a'); a.className = 'msg__btn'; a.href = btn[1]; a.textContent = btn[0]; m.appendChild(d.createElement('br')); m.appendChild(a); }
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function answer(q) {
  const t = q.toLowerCase(), hit = KB.find(e => e.k.test(t));
  const ty = d.createElement('div'); ty.className = 'msg msg--bot msg--typing'; ty.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(ty); log.scrollTop = log.scrollHeight;
  setTimeout(() => { ty.remove(); hit ? say(hit.a, 'bot', hit.btn) : say('Not sure on that one. The team can answer it by text.', 'bot', ['Text 0403 506 822', smsHref(q)]); }, RM ? 0 : 600);
}
['How much are tees?', 'Sizes', 'Flags', 'NZ seafood', 'Baby preorders', 'Where are you?', 'How do I order?'].forEach(c => { const b = d.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => { say(c, 'me'); answer(c); }); $('#botChips').appendChild(b); });
function setBot(open) {
  if (!bot) return;
  if (open) setMenu(false);
  root.classList.toggle('bot-open', open);
  [fab, dockChat].forEach(b => b && b.setAttribute('aria-expanded', open));
  if (open) { if (!greeted) { greeted = true; say('Kia ora! I\'m the Island Shop helper. Ask about $10 tees, sizes, flags, NZ seafood or baby preorders.'); } if (!MOB()) setTimeout(() => inp.focus({ preventScroll: true }), 250); }
}
fab && fab.addEventListener('click', () => setBot(!root.classList.contains('bot-open')));
dockChat && dockChat.addEventListener('click', () => setBot(!root.classList.contains('bot-open')));
$('#botClose').addEventListener('click', () => { setBot(false); (MOB() ? dockChat : fab)?.focus(); });
inp.addEventListener('input', () => { err.textContent = ''; });
$('#botForm').addEventListener('submit', e => { e.preventDefault(); const q = inp.value.trim(); if (!q) { err.textContent = 'Type a question first, like "Do you have 5XL?"'; inp.focus(); return; } inp.value = ''; say(q, 'me'); answer(q); });

/* cursor */
const cur = $('.cursor');
if (cur && matchMedia('(pointer:fine)').matches) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() { cx += (tx - cx) * .25; cy += (ty - cy) * .25; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
}
const cursorBig = (on, label) => { if (!cur) return; cur.classList.toggle('is-big', on); if (label) $('span', cur).textContent = label; };

/* button ripple */
d.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn'); if (!b || RM) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, sp = d.createElement('span');
  sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 650);
});

/* tilt cards */
if (matchMedia('(hover:hover)').matches && !RM) $$('[data-tilt]').forEach(el => {
  el.addEventListener('pointermove', e => { const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`; });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* "add extra" buttons (flags / seafood / baby) */
$$('[data-extra]').forEach(b => {
  const x = b.dataset.extra, label = b.innerHTML;
  const paint = () => { const on = Store.extras.includes(x); b.classList.toggle('is-done', on); b.innerHTML = on ? 'On your order list ✓' : label; b.setAttribute('aria-pressed', on); };
  b.addEventListener('click', () => Store.toggleExtra(x));
  Store.on(paint); paint();
});

/* page transition curtain */
const curtain = $('.curtain');
function leaveTo(href) {
  if (!curtain || RM || !window.gsap) { location.href = href; return; }
  curtain.classList.remove('is-off');
  gsap.fromTo(curtain, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .5, ease: 'expo.inOut', onComplete: () => { location.href = href; } });
}
d.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (!/^[a-z0-9-]+\.html(#.*)?$/i.test(href)) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  if (href.split('#')[0] === here) return;
  e.preventDefault(); setMenu(false); setBot(false); leaveTo(href);
});
addEventListener('pageshow', e => { if (e.persisted && curtain) { curtain.classList.add('is-off'); curtain.style.transform = ''; } });

/* ================= 3D scenes ================= */
let GL = false;
try { const c = d.createElement('canvas'); GL = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { }
root.classList.add(GL ? 'gl-ok' : 'no-gl');
const DPR = Math.min(devicePixelRatio || 1, MOB() ? 1.5 : 1.75);
const renders = [];
const vis = new Map();
const io = new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), { rootMargin: '120px' });
const T0 = performance.now();
function frame() { const t = (performance.now() - T0) / 1000; renders.forEach(r => { if (vis.get(r.el) !== false) r.fn(t); }); }

function makeHero(THREE, canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: !MOB(), powerPreference: 'high-performance' });
  r.setPixelRatio(DPR); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(42, 1, .1, 500);
  const U = { uTime: { value: 0 } };
  const SUN = new THREE.Vector3(10, 19, -150);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(260, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: U,
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vP;uniform float uTime;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){float y=vP.y;
        vec3 hor=vec3(1.,.58,.28),low=vec3(.96,.27,.42),mid=vec3(.38,.08,.30),top=vec3(.05,.02,.10);
        vec3 c=mix(hor,low,smoothstep(-.01,.07,y));c=mix(c,mid,smoothstep(.05,.24,y));c=mix(c,top,smoothstep(.2,.62,y));
        float a=atan(vP.z,vP.x);vec2 g=floor(vec2(a*260.,y*260.));float r=h(g);
        float s=step(.9965,r)*smoothstep(.22,.55,y)*(.55+.45*sin(uTime*1.7+r*60.));
        c+=vec3(1.,.95,.85)*s;
        c+=vec3(1.,.55,.3)*exp(-pow((y-.035)*22.,2.))*.25;
        gl_FragColor=vec4(c,1.);}`
  })));
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float uTime;
      void main(){vec2 p=vUv-.5;float r=length(p);
        float disc=smoothstep(.205,.2,r);
        float below=clamp((.02-p.y)/.22,0.,1.);
        float st=fract(below*7.-uTime*.08);
        float gap=(1.-step(below,0.))*smoothstep(.0,.02,mix(.06,.55,below)-st)*step(st,mix(.06,.55,below));
        disc*=1.-gap;
        vec3 col=mix(vec3(1.,.16,.45),vec3(1.,.86,.25),smoothstep(-.18,.2,p.y));
        float glow=exp(-r*6.)*.75;
        gl_FragColor=vec4(mix(vec3(1.,.42,.4),col,disc),max(disc,glow*.55));}`
  }));
  sun.position.copy(SUN); scene.add(sun);
  const seg = MOB() ? [120, 100] : [200, 160];
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(520, 420, seg[0], seg[1]), new THREE.ShaderMaterial({
    uniforms: { ...U, uSun: { value: SUN } },
    vertexShader: `uniform float uTime;varying vec3 vW;
      void main(){vec4 w=modelMatrix*vec4(position,1.);
        float h=sin(w.x*.32+uTime*.85)*.26+sin(w.z*.46+uTime*1.25)*.22+sin((w.x+w.z)*.95+uTime*1.8)*.07+sin((w.x*1.7-w.z)*.6+uTime*1.1)*.06;
        w.y+=h;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform vec3 uSun;varying vec3 vW;
      void main(){vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(n.y<0.)n=-n;
        vec3 v=normalize(cameraPosition-vW);float fres=pow(1.-max(dot(n,v),0.),3.5);
        vec3 c=mix(vec3(.035,.012,.06),vec3(.95,.34,.44),fres*.85);
        vec3 rf=reflect(-v,n);vec3 sd=normalize(uSun-vW);
        c+=vec3(1.,.66,.36)*pow(max(dot(rf,sd),0.),45.)*2.4;
        c=mix(c,vec3(.78,.26,.36),smoothstep(55.,170.,length(vW.xz-cameraPosition.xz)));
        gl_FragColor=vec4(c,1.);}`
  }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.z = -120; scene.add(ocean);
  scene.add(new THREE.HemisphereLight(0xff7aa0, 0x12050f, .55));
  const key = new THREE.DirectionalLight(0xffa060, 2.2); key.position.copy(SUN).normalize().multiplyScalar(40); scene.add(key);
  const sil = new THREE.MeshStandardMaterial({ color: 0x1a0915, roughness: 1, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1d0a17, roughness: 1, side: THREE.DoubleSide, flatShading: true });
  const island = new THREE.Group(); scene.add(island);
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), sil);
  { const p = rock.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y < 0 ? y * .2 : y * (.8 + Math.sin(i * 12.9) * .15)); p.setX(i, p.getX(i) * (1 + Math.sin(i * 4.1) * .08)); } rock.geometry.computeVertexNormals(); }
  rock.scale.set(9, 2.2, 5); island.add(rock);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.4, .35, 40), new THREE.MeshStandardMaterial({ color: 0x3a1526, roughness: 1 })); sand.scale.z = .55; island.add(sand);
  const fronds = [];
  function palm(x, z, h, lean, s) {
    const g = new THREE.Group(); g.position.set(x, .3, z); g.scale.setScalar(s);
    const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * lean, t * h, Math.sin(t * 2) * .3)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .2, 7), sil));
    for (let i = 0; i < 12; i++) { const tr = new THREE.Mesh(new THREE.TorusGeometry(.22, .05, 4, 8), sil); tr.position.copy(curve.getPoint(i / 12)); tr.rotation.x = Math.PI / 2; g.add(tr); }
    const crown = new THREE.Group(); crown.position.copy(curve.getPoint(1)); g.add(crown);
    const n = 9;
    for (let i = 0; i < n; i++) {
      const geo = new THREE.PlaneGeometry(4.2, 1, 18, 2); const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) { const lx = p.getX(k) + 2.1; let ly = p.getY(k); const t = lx / 4.2; ly *= Math.sin(Math.PI * Math.min(t * 1.1, 1)) * (1 - t * .55) * .9; p.setXYZ(k, lx, -t * t * 1.9 + (k % 2 ? 1 : -1) * .06 * t, ly); }
      geo.computeVertexNormals();
      const leaf = new THREE.Mesh(geo, leafMat), holder = new THREE.Group();
      holder.rotation.y = (i / n) * Math.PI * 2 + Math.sin(i) * .2; leaf.rotation.z = .35 + (i % 3) * .12; holder.add(leaf); crown.add(holder);
      fronds.push({ m: leaf, base: leaf.rotation.z, ph: i * .7 });
    }
    const nuts = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 0), sil); nuts.position.y = -.25; crown.add(nuts);
    island.add(g);
  }
  palm(-1.5, .4, 7.4, 1.6, 1); palm(1.6, -.6, 5.6, -1.1, .9); palm(4.6, .6, 4.2, .9, .8);
  for (const [x, z, sx, sy] of [[-60, -125, 22, 5], [-34, -140, 14, 3.2], [58, -135, 26, 4.2]]) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x55163d }));
    m.scale.set(sx, sy, 6); m.position.set(x, -.6, z); scene.add(m);
  }
  const N = MOB() ? 140 : 260, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3), ps = new Float32Array(N);
  for (let i = 0; i < N; i++) { pp[i * 3] = (Math.random() - .5) * 60; pp[i * 3 + 1] = Math.random() * 14; pp[i * 3 + 2] = -Math.random() * 60 + 4; ps[i] = Math.random(); }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(ps, 1));
  scene.add(new THREE.Points(pg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uPR: { value: DPR } },
    vertexShader: `attribute float seed;uniform float uTime;uniform float uPR;varying float vA;
      void main(){vec3 p=position;p.y=mod(p.y+uTime*(.25+seed*.5),14.);p.x+=sin(uTime*.6+seed*20.)*.6;
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(2.+seed*4.)*uPR*(30./-mv.z);
        vA=(.35+.65*sin(uTime*2.+seed*30.))*smoothstep(0.,2.,p.y)*smoothstep(14.,10.,p.y);}`,
    fragmentShader: 'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.82,.45,smoothstep(.5,0.,d)*vA);}'
  })));
  let w = 1, h = 1, mx = 0, my = 0, tmx = 0, tmy = 0, scrollP = 0, intro = 1;
  const look = new THREE.Vector3();
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight; r.setSize(w, h, false); cam.aspect = w / h;
    const mob = w / h < .85; cam.fov = mob ? 56 : 42; cam.updateProjectionMatrix();
    island.position.set(mob ? 4.5 : 13, 0, mob ? -30 : -34); island.scale.setScalar(mob ? .8 : 1);
    sun.position.set(mob ? 6 : SUN.x, mob ? 24 : SUN.y, SUN.z);
  }
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });
  function render(t) {
    U.uTime.value = t; mx += (tmx - mx) * .04; my += (tmy - my) * .04;
    const lift = (1 - intro) * 6;
    cam.position.set(mx * 2.2, 3.2 + lift - my * .9 - scrollP * 2.4, 18 + (1 - intro) * 10 - scrollP * 6);
    look.set(mx * 3, 4.2 + lift * .6 - scrollP * 3.2, -40); cam.lookAt(look);
    for (const f of fronds) f.m.rotation.z = f.base + Math.sin(t * 1.3 + f.ph) * .05;
    r.render(scene, cam);
  }
  return { resize, render, set scroll(v) { scrollP = v; }, set intro(v) { intro = v; } };
}

function makeBackTexture(THREE, img) {
  const c = d.createElement('canvas'), W = Math.min(512, img.width), H = Math.round(W * img.height / img.width);
  c.width = W; c.height = H; const x = c.getContext('2d');
  x.drawImage(img, 0, 0, W, H);
  const px = x.getImageData(Math.round(W * .5), Math.round(H * .9), 1, 1).data;
  x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${px[0] * .82 | 0},${px[1] * .82 | 0},${px[2] * .82 | 0})`; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeRack(THREE, canvas, onPick, onHover) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(DPR); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  r.shadowMap.enabled = !MOB(); r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x150a13); scene.fog = new THREE.Fog(0x150a13, 9, 26);
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 80);
  const SP = 2.25, RAIL_Y = 2.15, T = { value: 0 };
  scene.add(new THREE.AmbientLight(0xffe8f0, .6));
  const keyL = new THREE.DirectionalLight(0xfff1e0, 2.1); keyL.position.set(2, 6, 7); keyL.castShadow = true; keyL.shadow.mapSize.set(1024, 1024);
  Object.assign(keyL.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4, near: 1, far: 30 }); scene.add(keyL, keyL.target);
  const pinkL = new THREE.PointLight(0xff2d7a, 22, 16, 1.6); pinkL.position.set(-4, 3, 2); scene.add(pinkL);
  const mangoL = new THREE.PointLight(0xff9a3c, 20, 16, 1.6); mangoL.position.set(4, 1, 2.5); scene.add(mangoL);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), new THREE.MeshStandardMaterial({ color: 0x1d0d19, roughness: .38, metalness: .2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.4; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 14), new THREE.ShaderMaterial({
    uniforms: { uTime: T },
    vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `varying vec3 vW;
      void main(){vec3 c=vec3(.07,.035,.065);
        float sx=mod(vW.x+1.125,4.5)-2.25;c+=vec3(1.,.42,.55)*exp(-sx*sx*.35)*smoothstep(-3.,3.5,vW.y)*.22;
        float tri=step(.5,fract((vW.x*1.2)+abs(fract(vW.y*1.2)-.5)));c+=vec3(1.,.55,.25)*tri*smoothstep(.12,0.,abs(vW.y+1.55))*.18;
        gl_FragColor=vec4(c,1.);}`
  })); wall.position.set(0, 2, -2.2); scene.add(wall);
  const brass = new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: .9, roughness: .28, emissive: 0x2a1200 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 16), brass); rail.rotation.z = Math.PI / 2; rail.position.y = RAIL_Y; scene.add(rail);
  const capL = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), brass), capR = capL.clone(); scene.add(capL, capR);
  const postGeo = new THREE.CylinderGeometry(.035, .035, 4.6, 12), postL = new THREE.Mesh(postGeo, brass), postR = postL.clone(); scene.add(postL, postR);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: .55 });
  const hookGeo = new THREE.TorusGeometry(.085, .012, 8, 24, Math.PI * 1.35), neckGeo = new THREE.CylinderGeometry(.012, .012, .16, 8);
  const barGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.8, -.36, 0), new THREE.Vector3(-.42, -.19, 0), new THREE.Vector3(0, -.06, 0), new THREE.Vector3(.42, -.19, 0), new THREE.Vector3(.8, -.36, 0)]), 32, .034, 8);
  const ballGeo = new THREE.SphereGeometry(.04, 10, 8);
  const items = [], hitList = [];
  const sway = (mat, ph, hgt) => {
    mat.onBeforeCompile = s => {
      s.uniforms.uTime = T; s.uniforms.uPh = { value: ph }; s.uniforms.uH = { value: hgt }; s.uniforms.uAmp = mat.userData.amp;
      s.vertexShader = 'uniform float uTime;uniform float uPh;uniform float uH;uniform float uAmp;\n' + s.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         float k=clamp(-position.y/uH,0.,1.);float kk=k*k;
         transformed.z+=(sin(uTime*1.25+uPh+position.x*1.7)*.07+sin(uTime*2.1+uPh*1.7+position.y*3.1)*.035)*kk*uAmp+kk*.05*sin(position.x*2.6+uTime*.8+uPh);
         transformed.x+=sin(uTime*.85+uPh)*.05*kk*uAmp;`);
    };
  };
  function addItem(it, tex, back) {
    const g = new THREE.Group();
    const hook = new THREE.Mesh(hookGeo, brass); hook.rotation.z = Math.PI * .82; g.add(hook);
    const neck = new THREE.Mesh(neckGeo, brass); neck.position.y = -.14; g.add(neck);
    const bar = new THREE.Mesh(barGeo, wood); bar.position.y = -.17; bar.castShadow = true; g.add(bar);
    const b1 = new THREE.Mesh(ballGeo, wood), b2 = b1.clone(); b1.position.set(-.8, -.53, 0); b2.position.set(.8, -.53, 0); g.add(b1, b2);
    const aspect = tex.image.width / tex.image.height, wdt = aspect > .95 ? 1.95 : 1.95 * Math.min(aspect, 1) / .82, hgt = wdt / aspect;
    const geo = new THREE.PlaneGeometry(wdt, hgt, 20, 24); geo.translate(0, -hgt / 2, 0);
    const amp = { value: 1 };
    const mF = new THREE.MeshStandardMaterial({ map: tex, alphaTest: .45, roughness: .85 }); mF.userData.amp = amp; sway(mF, it.i * 1.3, hgt);
    const mB = new THREE.MeshStandardMaterial({ map: back, alphaTest: .45, roughness: .9, side: THREE.BackSide }); mB.userData.amp = amp; sway(mB, it.i * 1.3, hgt);
    const front = new THREE.Mesh(geo, mF), rear = new THREE.Mesh(geo, mB);
    front.castShadow = rear.castShadow = true;
    front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: .45 });
    const cloth = new THREE.Group(); cloth.position.y = -.24; cloth.add(front, rear); g.add(cloth);
    front.userData.g = g; hitList.push(front);
    g.userData = { it, amp, x: it.i * SP, tx: it.i * SP, y: RAIL_Y + 6, ty: RAIL_Y, s: 0, ts: 1, rot: (it.i % 2 ? 1 : -1) * .16, hov: 0, vis: true };
    g.position.set(it.i * SP, RAIL_Y + 6, 0); g.scale.setScalar(.001);
    scene.add(g); items.push(g);
  }
  let visible = [], camX = 0, camY = .9, camTX = 0, w = 1, h = 1, hovered = null, active = null;
  function relayout(filter) {
    visible = items.filter(g => filter === 'all' || g.userData.it.col === filter);
    let k = 0;
    for (const g of items) { const u = g.userData, on = visible.includes(g); u.vis = on; if (on) { u.tx = k * SP; u.ty = RAIL_Y; u.ts = 1; k++; } else { u.ty = RAIL_Y - 7; u.ts = .6; } }
    const len = Math.max(0, (visible.length - 1) * SP);
    rail.scale.y = len + 2.4; rail.position.x = len / 2;
    capL.position.set(-1.2, RAIL_Y, 0); capR.position.set(len + 1.2, RAIL_Y, 0);
    postL.position.set(-1.15, RAIL_Y - 2.3, 0); postR.position.set(len + 1.15, RAIL_Y - 2.3, 0);
    return visible.length;
  }
  const span = () => Math.max(0, (visible.length - 1) * SP);
  function resize() { w = canvas.clientWidth; h = canvas.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < .8 ? 44 : 34; cam.updateProjectionMatrix(); }
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(9, 9);
  canvas.addEventListener('pointermove', e => { const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); });
  canvas.addEventListener('pointerleave', () => ptr.set(9, 9));
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); });
  canvas.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 8) return;
    ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObjects(hitList.filter(m => m.userData.g.userData.vis), false)[0];
    if (hit) onPick(hit.object.userData.g.userData.it);
  });
  function render(t, p) {
    T.value = t;
    const mob = w / h < .8, land = h < 500 && w > h;
    camTX = p * span() + (active && !mob ? (land ? 1.6 : 1.35) : 0);
    camX += (camTX - camX) * .08;
    const cy = mob ? (active ? .05 : .55) : .95; camY += (cy - camY) * .08;
    cam.position.set(camX, camY + .5, mob ? 8.6 : land ? 7.6 : 7.1); cam.lookAt(camX, camY, 0);
    keyL.position.set(camX + 2, 6, 7); keyL.target.position.set(camX, 0, 0);
    pinkL.position.x = camX - 4 + Math.sin(t * .5) * .6; mangoL.position.x = camX + 4;
    ray.setFromCamera(ptr, cam);
    const hit = matchMedia('(hover:hover)').matches ? ray.intersectObjects(hitList.filter(m => m.userData.g.userData.vis), false)[0] : null;
    const nh = hit ? hit.object.userData.g : null;
    if (nh !== hovered) { hovered = nh; onHover(!!hovered); }
    for (const g of items) {
      const u = g.userData;
      u.x += (u.tx - u.x) * .09; u.y += (u.ty - u.y) * .07; u.s += (u.ts - u.s) * .08;
      const want = (g === hovered || (active && u.it.id === active)) ? 1 : 0; u.hov += (want - u.hov) * .12;
      g.position.set(u.x, u.y + u.hov * .08, u.hov * .55);
      g.scale.setScalar(Math.max(u.s, .001) * (1 + u.hov * .06));
      g.rotation.y = u.rot * (1 - u.hov) + Math.sin(t * .6 + u.it.i) * .05 * (1 - u.hov);
      g.rotation.z = Math.sin(t * .9 + u.it.i * 1.7) * .012;
      u.amp.value = 1 - u.hov * .6 + Math.min(Math.abs(camTX - camX) * .6, 1.4);
    }
    r.render(scene, cam);
  }
  return { addItem, relayout, resize, render, span, setActive: id => { active = id; }, get count() { return visible.length; }, indexOf: id => visible.findIndex(g => g.userData.it.id === id) };
}

function drawFlag(kind) {
  const c = d.createElement('canvas'), W = 1024, H = 512; c.width = W; c.height = H; const x = c.getContext('2d');
  const star5 = (cx, cy, R, fill, stroke) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .4 : R; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); if (stroke) { x.lineWidth = R * .22; x.strokeStyle = stroke; x.lineJoin = 'round'; x.stroke(); } x.fillStyle = fill; x.fill(); };
  if (kind === 'samoa') {
    x.fillStyle = '#ce1126'; x.fillRect(0, 0, W, H); x.fillStyle = '#002b7f'; x.fillRect(0, 0, W / 2, H / 2);
    const cw = W / 2, ch = H / 2; star5(cw * .5, ch * .2, 26, '#fff'); star5(cw * .3, ch * .5, 26, '#fff'); star5(cw * .7, ch * .43, 26, '#fff'); star5(cw * .5, ch * .82, 30, '#fff'); star5(cw * .6, ch * .6, 14, '#fff');
  } else if (kind === 'tonga') {
    x.fillStyle = '#c10000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.fillRect(0, 0, W * .41, H / 2);
    x.fillStyle = '#c10000'; const cx = W * .205, cy = H / 4, a = 38, b = 100; x.fillRect(cx - a / 2, cy - b / 2, a, b); x.fillRect(cx - b / 2, cy - a / 2, b, a);
  } else if (kind === 'nz') {
    x.fillStyle = '#012169'; x.fillRect(0, 0, W, H);
    x.save(); x.beginPath(); x.rect(0, 0, W / 2, H / 2); x.clip();
    const cw = W / 2, ch = H / 2;
    x.strokeStyle = '#fff'; x.lineWidth = ch / 5; x.beginPath(); x.moveTo(0, 0); x.lineTo(cw, ch); x.moveTo(cw, 0); x.lineTo(0, ch); x.stroke();
    x.strokeStyle = '#c8102e'; x.lineWidth = ch / 15; x.beginPath(); x.moveTo(0, -4); x.lineTo(cw, ch - 4); x.moveTo(cw + 4, 0); x.lineTo(4, ch); x.stroke();
    x.fillStyle = '#fff'; x.fillRect(cw / 2 - ch / 6, 0, ch / 3, ch); x.fillRect(0, ch / 2 - ch / 6, cw, ch / 3);
    x.fillStyle = '#c8102e'; x.fillRect(cw / 2 - ch / 10, 0, ch / 5, ch); x.fillRect(0, ch / 2 - ch / 10, cw, ch / 5);
    x.restore();
    star5(W * .75, H * .2, 26, '#c8102e', '#fff'); star5(W * .665, H * .5, 28, '#c8102e', '#fff'); star5(W * .835, H * .45, 23, '#c8102e', '#fff'); star5(W * .75, H * .82, 30, '#c8102e', '#fff');
  } else {
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H / 2); x.fillStyle = '#d4102a'; x.fillRect(0, H / 2, W, H / 2);
    x.fillStyle = '#fff'; x.fillRect(W * .26, H / 2 - 26, W, 52);
    x.beginPath(); x.arc(W * .26, H / 2, 120, -Math.PI / 2, Math.PI / 2, true); x.arc(W * .26, H / 2 + 74, 46, Math.PI / 2, -Math.PI / 2, true); x.arc(W * .26, H / 2, 26, Math.PI / 2, -Math.PI / 2, false); x.closePath(); x.fill();
    x.fillStyle = '#d4102a'; x.beginPath(); x.arc(W * .26, H / 2 + 74, 22, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#000'; x.beginPath(); x.arc(W * .26, H / 2 - 52, 44, 0, Math.PI * 2); x.fill();
  }
  return c;
}
function makeFlag(THREE, canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(DPR); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 50);
  const U = { uTime: { value: 0 }, uA: { value: null }, uB: { value: null }, uMix: { value: 0 } };
  const geo = new THREE.PlaneGeometry(3.2, 1.6, 80, 40); geo.translate(1.6, 0, 0);
  const flag = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime;varying vec2 vUv;varying float vS;
      float wv(vec2 uv){float x=uv.x;return (sin(x*8.5-uTime*3.4+uv.y*1.3)*.16+sin(x*4.3-uTime*2.2)*.1+sin(x*15.-uTime*5.+uv.y*3.)*.025)*pow(x,1.15);}
      void main(){vUv=uv;vec3 p=position;float z=wv(uv);p.z+=z;p.y+=sin(uv.x*6.-uTime*2.6)*.04*uv.x-uv.x*uv.x*.08;p.x-=abs(z)*.18*uv.x;
        vS=clamp((wv(uv+vec2(.01,0.))-z)*28.,-1.,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform sampler2D uA;uniform sampler2D uB;uniform float uMix;varying vec2 vUv;varying float vS;
      void main(){vec3 c=mix(texture2D(uA,vUv).rgb,texture2D(uB,vUv).rgb,uMix);
        c*=(.86+vS*.3)*(.97+.03*sin(vUv.x*900.)*sin(vUv.y*450.));c+=max(vS,0.)*.08;gl_FragColor=vec4(c,1.);}`
  }));
  flag.position.set(-1.4, .6, 0); scene.add(flag);
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8d2cc, metalness: .85, roughness: .3 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 5.4, 16), metal); pole.position.set(-1.44, -1.2, 0); scene.add(pole);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: .9, roughness: .25 })); ball.position.set(-1.44, 1.56, 0); scene.add(ball);
  scene.add(new THREE.AmbientLight(0xffffff, .7)); const dl = new THREE.DirectionalLight(0xffd0b0, 2); dl.position.set(2, 3, 4); scene.add(dl);
  const texOf = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  let tween = null;
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); cam.position.set(.6, .3, w / h < 1.1 ? 7.6 : 6.2); cam.lookAt(.2, .1, 0); }
  function set(cv, instant) {
    const t = texOf(cv);
    if (!U.uA.value || instant || !window.gsap) { U.uA.value = t; U.uB.value = t; U.uMix.value = 0; return; }
    U.uB.value = t; U.uMix.value = 0; if (tween) tween.kill();
    tween = gsap.to(U.uMix, { value: 1, duration: RM ? .15 : .9, ease: 'power2.inOut', onComplete: () => { U.uA.value = t; U.uMix.value = 0; } });
  }
  return { resize, set, render: t => { U.uTime.value = t; r.render(scene, cam); } };
}

/* ================= page: wardrobe ================= */
let lenis = null, rackST = null, rackP = 0, rack = null;
function initWardrobe(THREE) {
  const thumbs = $('#thumbs'), card = $('#teeCard');
  let filter = 'all', current = null;
  const counts = { all: ITEMS.length }; ITEMS.forEach(x => counts[x.col] = (counts[x.col] || 0) + 1);
  $$('#tabs .tab').forEach(t => { const em = $('em', t); if (em) em.textContent = counts[t.dataset.f]; });
  ITEMS.forEach(it => {
    const b = d.createElement('button'); b.type = 'button'; b.dataset.id = it.id; b.dataset.col = it.col;
    b.setAttribute('aria-label', `${it.name}, ${it.kind}, ${COL[it.col]}, $10`);
    b.innerHTML = `<img src="${it.img}" alt="" loading="lazy">`;
    b.addEventListener('click', () => { focusItem(it.id); openCard(it); });
    thumbs.appendChild(b);
  });
  const sel = makeSelect({ placeholder: 'Pick size', label: 'Size for this tee', onChange: v => { if (current && Store.has(current.id)) Store.setSize(current.id, v); } });
  $('#teeSel').appendChild(sel);
  function syncAdd() { if (!current) return; const has = Store.has(current.id), b = $('#teeAdd'); b.textContent = has ? 'On your list ✓' : 'Add to order'; b.classList.toggle('is-done', has); }
  Store.on(syncAdd);
  function openCard(it) {
    current = it; rack && rack.setActive(it.id);
    $('#teeImg').src = it.img; $('#teeImg').alt = `${it.name} ${it.kind.toLowerCase()}`;
    $('#teeCol').textContent = COL[it.col] + ' · ' + it.kind; $('#teeName').textContent = it.name; $('#teeNote').textContent = NOTE[it.col];
    $('#teeSms').href = smsHref(`Hi Island Shop! Do you have the ${it.name} (${it.kind.toLowerCase()}) in size ${sel.getValue() || '?'}?`);
    sel.setValue(Store.get(it.id)?.size || '');
    syncAdd(); card.classList.add('is-open');
    $$('#thumbs button').forEach(b => b.classList.toggle('is-on', b.dataset.id === it.id));
    const tb = $(`#thumbs button[data-id="${it.id}"]`); tb && tb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
  }
  function closeCard() { card.classList.remove('is-open'); current = null; rack && rack.setActive(null); $$('#thumbs button').forEach(b => b.classList.remove('is-on')); }
  $('#teeX').addEventListener('click', closeCard);
  d.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
  $('#teeAdd').addEventListener('click', () => { if (!current) return; Store.has(current.id) ? Store.remove(current.id) : Store.add(current.id, sel.getValue()); });
  function focusItem(id) {
    if (!rack || !rackST) return;
    const i = rack.indexOf(id); if (i < 0) return;
    const y = rackST.start + (rackST.end - rackST.start) * (rack.count > 1 ? i / (rack.count - 1) : 0);
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }
  function applyFilter(f) {
    filter = f;
    $$('#tabs .tab').forEach(t => t.setAttribute('aria-pressed', t.dataset.f === f));
    $$('#thumbs button').forEach(b => { b.hidden = !(f === 'all' || b.dataset.col === f); });
    const inPin = rackST && scrollY >= rackST.start - 2 && scrollY <= rackST.end + 2;
    const n = rack ? rack.relayout(f) : counts[f];
    $('#rackN').textContent = n;
    if (current && f !== 'all' && current.col !== f) closeCard();
    if (rackST) { ScrollTrigger.refresh(); if (inPin) lenis ? lenis.scrollTo(rackST.start + 2, { immediate: true }) : scrollTo(0, rackST.start + 2); }
  }
  $$('#tabs .tab').forEach(t => t.addEventListener('click', () => applyFilter(t.dataset.f)));
  const fromHash = () => { const h = location.hash.slice(1); if (['tonga', 'samoa', 'nz'].includes(h)) applyFilter(h); };
  if (window.gsap) {
    rackST = ScrollTrigger.create({
      trigger: '#rack', start: 'top top', pin: GL, anticipatePin: 1,
      end: () => '+=' + Math.max(innerHeight * .8, (rack && rack.count ? rack.count : ITEMS.length) * innerHeight * (MOB() ? .34 : .24)),
      onUpdate: s => { rackP = s.progress; }
    });
    if (!GL) rackST.disable();
  }
  if (!GL || !THREE) { fromHash(); return Promise.resolve(); }
  rack = makeRack(THREE, $('#rackGL'), it => openCard(it), on => cursorBig(on, 'View'));
  rack.resize(); io.observe($('#rackGL'));
  renders.push({ el: $('#rackGL'), fn: t => rack.render(t, rackP) });
  addEventListener('resize', () => rack.resize());
  const loader = new THREE.TextureLoader();
  return Promise.all(ITEMS.map(it => new Promise(res => loader.load(it.img, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(null)))))
    .then(texs => { texs.forEach((t, k) => t && rack.addItem(ITEMS[k], t, makeBackTexture(THREE, t.image))); rack.relayout(filter); fromHash(); window.ScrollTrigger && ScrollTrigger.refresh(); });
}

/* ================= page: flags ================= */
const FLAGS = [
  { k: 'samoa', name: 'Samoa', sub: 'Flags available', st: 'In stock' },
  { k: 'maori', name: 'Māori', sub: 'Tino Rangatiratanga', st: 'In stock' },
  { k: 'nz', name: 'New Zealand', sub: 'Flags available', st: 'In stock' },
  { k: 'tonga', name: 'Tonga', sub: 'Sold out for now', st: 'Sold out', out: true }
];
function initFlags(THREE) {
  let flag = null; const cvs = {};
  if (GL && THREE) { try { flag = makeFlag(THREE, $('#flagGL')); flag.resize(); io.observe($('#flagGL')); renders.push({ el: $('#flagGL'), fn: t => flag.render(t) }); addEventListener('resize', () => flag.resize()); } catch (e) { root.classList.replace('gl-ok', 'no-gl'); } }
  FLAGS.forEach((f, i) => {
    const cv = drawFlag(f.k); cvs[f.k] = cv;
    const b = d.createElement('button'); b.className = 'flag-btn glass'; b.type = 'button'; b.setAttribute('aria-pressed', i === 0);
    b.innerHTML = `<img alt="" src="${cv.toDataURL('image/png')}"><span><strong>${f.name}</strong><small>${f.sub}</small></span><span class="st${f.out ? ' st--out' : ''}">${f.st}</span>`;
    b.addEventListener('click', () => pick(i));
    $('#flagList').appendChild(b);
  });
  function pick(i, instant) {
    const f = FLAGS[i];
    $$('#flagList .flag-btn').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('#flagTagT').textContent = f.name + (f.out ? ' · sold out' : ' · available');
    $('#flagTag').classList.toggle('is-out', !!f.out);
    $('#flagImg').src = cvs[f.k].toDataURL('image/png'); $('#flagImg').alt = f.name + ' flag';
    const add = $('#flagAdd');
    add.dataset.extraFlag = f.name + ' flag';
    paintAdd();
    $('#flagSms').href = smsHref(f.out ? `Hi Island Shop! Can you let me know when Tonga flags are back?` : `Hi Island Shop! I'd like a ${f.name} flag please.`);
    $('#flagSms').textContent = f.out ? 'Tell me when it\'s back' : 'Text to order';
    add.hidden = !!f.out;
    if (flag) flag.set(cvs[f.k], instant);
  }
  const add = $('#flagAdd'), lbl = add.innerHTML;
  function paintAdd() { const x = add.dataset.extraFlag, on = Store.extras.includes(x); add.classList.toggle('is-done', on); add.innerHTML = on ? 'On your order list ✓' : lbl; }
  add.addEventListener('click', () => Store.toggleExtra(add.dataset.extraFlag));
  Store.on(paintAdd);
  pick(0, true);
}

/* ================= page: order ================= */
function initOrder() {
  let greeting = 'Kia ora';
  const ol = $('#olist'), nm = $('#oName'), note = $('#oNote');
  function render() {
    ol.innerHTML = '';
    if (!Store.items.length) { const li = d.createElement('li'); li.className = 'empty'; li.innerHTML = 'No tees on your list yet. Open the <a href="wardrobe.html">wardrobe</a>, tap a tee and hit "Add to order".'; ol.appendChild(li); }
    Store.items.forEach(o => {
      const it = byId(o.id), li = d.createElement('li');
      li.innerHTML = `<img src="${it.img}" alt=""><div><strong></strong><small>$10 · ${it.kind}</small></div><span class="slot"></span><button class="icon-btn rm" aria-label="Remove ${it.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
      $('strong', li).textContent = it.name;
      $('.slot', li).replaceWith(makeSelect({ value: o.size, placeholder: 'Size', label: 'Size for ' + it.name, onChange: v => Store.setSize(o.id, v) }));
      $('.rm', li).addEventListener('click', () => Store.remove(o.id));
      ol.appendChild(li);
    });
    $$('#extras .pick').forEach(b => b.setAttribute('aria-pressed', Store.extras.includes(b.dataset.x)));
    msg();
  }
  let lastSig = '';
  Store.on(() => { const sig = JSON.stringify(Store.items.map(o => o.id)) + Store.extras.join(); if (sig !== lastSig) { lastSig = sig; render(); } else msg(); });
  $$('#greet .pick').forEach(b => b.addEventListener('click', () => { greeting = b.dataset.g; $$('#greet .pick').forEach(x => x.setAttribute('aria-pressed', x === b)); msg(); }));
  $$('#extras .pick').forEach(b => b.addEventListener('click', () => Store.toggleExtra(b.dataset.x)));
  nm.addEventListener('input', () => { const ok = /^[\p{L} .'’-]*$/u.test(nm.value); nm.setAttribute('aria-invalid', !ok); $('#oNameErr').textContent = ok ? '' : 'Letters only, like "Sione".'; msg(); });
  note.addEventListener('input', msg);
  function text() {
    const name = nm.getAttribute('aria-invalid') === 'true' ? '' : nm.value.trim();
    let t = `${greeting} Island Shop!${name ? ' This is ' + name + '.' : ''}\n`;
    if (Store.items.length) t += `I'd like to order:\n` + Store.items.map(o => { const it = byId(o.id); return `• ${it.name} – ${it.kind.toLowerCase()} ($10), size ${o.size || '?'}`; }).join('\n') + '\n';
    if (Store.extras.length) t += (Store.items.length ? 'Also: ' : "I'm after: ") + Store.extras.join(', ') + '\n';
    if (!Store.items.length && !Store.extras.length) t += "I'd like to place an order.\n";
    if (note.value.trim()) t += note.value.trim() + '\n';
    return t.trim();
  }
  function msg() {
    const t = text(), bub = $('#bubble'); bub.textContent = t; const s = d.createElement('small');
    s.textContent = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney' }).format(new Date()); bub.appendChild(s);
    $('#oSms').href = smsHref(t);
  }
  $('#oCopy').addEventListener('click', async () => {
    const toast = $('#toast');
    try { await navigator.clipboard.writeText(text()); toast.textContent = 'Copied. Now paste it into a DM to '; const l = d.createElement('a'); l.href = 'https://www.instagram.com/island_shop_central_coast/'; l.target = '_blank'; l.rel = 'noopener'; l.textContent = '@island_shop_central_coast'; toast.appendChild(l); }
    catch (e) { toast.textContent = 'Couldn\'t copy automatically. Select the green message and copy it.'; }
    setTimeout(() => { toast.textContent = ''; }, 9000);
  });
  $('#oClear').addEventListener('click', () => { Store.items = []; Store.extras = []; Store.save(); });
  lastSig = JSON.stringify(Store.items.map(o => o.id)) + Store.extras.join(); render();
}

/* ================= boot ================= */
async function loadThree() { if (!GL) return null; try { return await import('three'); } catch (e) { console.warn('three', e); root.classList.replace('gl-ok', 'no-gl'); GL = false; return null; } }
const needs3D = ['home', 'wardrobe', 'flags'].includes(PAGE);
const threeP = needs3D ? loadThree() : Promise.resolve(null);
if (PAGE === 'order') initOrder();
if (PAGE === 'seafood') { const s = $('#seaSms'); if (s) s.href = smsHref('Hi Island Shop! What NZ seafood have you got in the next drop?'); }

function revealAll() { root.classList.remove('js'); $$('.loader,.ld-meta').forEach(m => m.remove()); curtain && curtain.classList.add('is-off'); }

if (!window.gsap) {
  revealAll();
  threeP.then(THREE => {
    if (PAGE === 'home' && THREE) { const h = makeHero(THREE, $('#heroGL')); h.resize(); renders.push({ el: $('#heroGL'), fn: t => h.render(t) }); addEventListener('resize', () => h.resize()); }
    if (PAGE === 'wardrobe') initWardrobe(THREE);
    if (PAGE === 'flags') initFlags(THREE);
    (function l() { frame(); requestAnimationFrame(l); })();
  });
} else {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.ticker.add(frame); gsap.ticker.lagSmoothing(400, 33);
  if (window.Lenis && !RM) { lenis = new Lenis({ lerp: .09, smoothWheel: true }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = $(id); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -10, duration: 1.2 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }));
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
  let lastY = 0; const nav = $('#nav');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { const y = s.scroll(); nav.classList.toggle('is-hidden', y > 260 && y > lastY && !root.classList.contains('menu-open') && !MOB()); lastY = y; } });
  // split headings into rising characters
  $$('.sec__title .line>span, .phead h1 .line>span').forEach(el => { el.innerHTML = [...el.textContent].map(c => c === ' ' ? ' ' : `<span class="ch">${c}</span>`).join(''); });
  const riseHeads = (delay = 0) => $$('.sec__title, .phead h1').forEach(h => gsap.from($$('.ch', h), { yPercent: 110, rotate: 4, duration: 1.05, ease: 'expo.out', stagger: .02, delay, scrollTrigger: { trigger: h, start: 'top 90%' } }));
  $$('[data-rise]').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
  if ($('.ladder')) gsap.from('.ladder svg', { scaleY: 0, transformOrigin: '50% 100%', duration: .9, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.ladder', start: 'top 90%' } });
  if ($('.foot__big')) gsap.from('.foot__big', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 92%' } });
  if ($('.sea__photo img')) gsap.from('.sea__photo img', { scale: 1.2, ease: 'none', scrollTrigger: { trigger: '.sea__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
  if ($('.doors')) gsap.from('.door', { y: 40, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.doors', start: 'top 85%' } });

  const curtainOut = () => { if (!curtain) return; if (RM) { curtain.classList.add('is-off'); return; } gsap.to(curtain, { scaleY: 0, transformOrigin: '50% 0%', duration: .7, ease: 'expo.inOut', delay: .05, onComplete: () => curtain.classList.add('is-off') }); };

  if (PAGE !== 'home') {
    curtainOut(); riseHeads(.35);
    threeP.then(THREE => {
      const p = PAGE === 'wardrobe' ? initWardrobe(THREE) : PAGE === 'flags' ? (initFlags(THREE), null) : null;
      Promise.resolve(p).then(() => ScrollTrigger.refresh());
    });
  } else {
    riseHeads();
    const loader = $('.loader'), firstVisit = !ss.get('isc-seen') && !RM;
    ss.set('isc-seen', '1');
    const chars = (() => { $$('.hs').forEach(el => { el.innerHTML = [...el.textContent].map(c => `<span class="ch">${c}</span>`).join(''); }); return $$('.hero__title .ch'); })();
    let hero = null;
    const heroReady = threeP.then(THREE => {
      if (!THREE) return;
      try { hero = makeHero(THREE, $('#heroGL')); hero.resize(); io.observe($('#heroGL')); renders.push({ el: $('#heroGL'), fn: t => hero.render(t) }); addEventListener('resize', () => hero.resize()); } catch (e) { console.warn(e); root.classList.replace('gl-ok', 'no-gl'); }
    });
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => { if (hero) hero.scroll = s.progress; } });
    gsap.to('.hero__inner', { yPercent: -12, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (RM) { revealAll(); }
    else {
      gsap.set(chars, { yPercent: 115, rotate: 6 }); gsap.set('[data-hero]', { opacity: 0, y: 24 });
      if (!firstVisit) {
        $$('.loader,.ld-meta').forEach(m => m.remove());
        curtainOut();
        heroReady.then(() => {
          const s = { v: .4 }; if (hero) hero.intro = .4;
          gsap.timeline({ delay: .25 })
            .to(s, { v: 1, duration: 1.8, ease: 'expo.out', onUpdate: () => { if (hero) hero.intro = s.v; } }, 0)
            .to(chars, { yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: .04 }, .1)
            .to('[data-hero]', { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .06 }, .35);
        });
      } else {
        curtain && curtain.classList.add('is-off');
        gsap.set(['.nav', '.bot-fab', '.ticker', '.dock'], { autoAlpha: 0 });
        const kw = $('.knock'), ks = $('.knock__s');
        kw.innerHTML = [...kw.textContent].map((c, i) => `<span${i === 0 ? ' class="i"' : ''}>${c}</span>`).join('');
        const kL = $$('span', kw); gsap.set(kL, { yPercent: 115 }); gsap.set(ks, { opacity: 0, y: 10 });
        if (lenis) lenis.stop();
        const cnt = { v: 0 }, lc = $('#lc'), metas = $$('.ld-meta'), hs = { v: 0 };
        const fontsReady = Promise.race([(d.fonts && d.fonts.load) ? d.fonts.load('900 100px "Anybody"') : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
        Promise.all([fontsReady, Promise.race([heroReady, new Promise(r => setTimeout(r, 2500))])]).then(() => {
          if (hero) hero.intro = 0;
          gsap.timeline()
            .to(cnt, { v: 100, duration: 2.6, ease: 'power1.inOut', onUpdate: () => { lc.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0)
            .to('#lbar', { scaleX: 1, duration: 2.6, ease: 'power1.inOut' }, 0)
            .to(kL, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .07 }, .1)
            .to(ks, { opacity: 1, y: 0, duration: .7, ease: 'expo.out' }, .7)
            .to(hs, { v: .35, duration: 2.4, ease: 'power1.inOut', onUpdate: () => { if (hero) hero.intro = hs.v; } }, 0)
            .add(() => { const I = $('.i', kw).getBoundingClientRect(); gsap.set(loader, { transformOrigin: (I.left + I.width / 2) + 'px ' + (I.top + I.height * .55) + 'px' }); }, 2.35)
            .to([ks, metas], { opacity: 0, duration: .3, ease: 'power2.in' }, 2.4)
            .to(loader, { scale: 70, duration: 1.4, ease: 'expo.in' }, 2.4)
            .to(hs, { v: 1, duration: 2.2, ease: 'expo.out', onUpdate: () => { if (hero) hero.intro = hs.v; } }, 3.1)
            .set(loader, { autoAlpha: 0 }, 3.8)
            .to(['.nav', '.bot-fab', '.ticker', '.dock'], { autoAlpha: 1, duration: .8, ease: 'power2.out' }, 3.6)
            .to(chars, { yPercent: 0, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: .04 }, 3.6)
            .to('[data-hero]', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .07 }, 3.9)
            .add(() => { loader.remove(); metas.forEach(m => m.remove()); if (lenis) lenis.start(); ScrollTrigger.refresh(); }, 4.2);
        });
      }
    }
  }
}
