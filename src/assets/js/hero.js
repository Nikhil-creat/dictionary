// Home hero: a three-step 3D globe (speck -> language hub -> dive into the lookup page).
// Every moving value is derived each frame from one state float `st` (0..2). three.js is loaded lazily from a
// pinned CDN build so the first paint never waits on it; if WebGL or the CDN is unavailable the hero degrades
// to a static layout with working links.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, k) => a + (b - a) * k;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const out = (k) => 1 - Math.pow(1 - k, 3);
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

const hero = $('#hero');
const LANGS = [
  { name: 'Hindi', native: 'हिन्दी', code: 'hi', u: 0.72, v: 0.36, word: 'नाम', hello: 'नमस्ते', ipa: '/nɑːm/' },
  { name: 'Telugu', native: 'తెలుగు', code: 'te', u: 0.718, v: 0.41, word: 'పేరు', hello: 'నమస్కారం', ipa: '/peːru/' },
  { name: 'Tamil', native: 'தமிழ்', code: 'ta', u: 0.712, v: 0.46, word: 'பெயர்', hello: 'வணக்கம்', ipa: '/pejaɾ/' },
  { name: 'Arabic', native: 'العربية', code: 'ar', u: 0.625, v: 0.37, word: 'اسم', hello: 'مرحبا', ipa: '/ism/' },
  { name: 'Mandarin', native: '中文', code: 'zh', u: 0.79, v: 0.31, word: '名字', hello: '你好', ipa: '/mǐŋ.tsɨ/' },
  { name: 'Japanese', native: '日本語', code: 'ja', u: 0.883, v: 0.31, word: '名前', hello: 'こんにちは', ipa: '/namae/' },
  { name: 'Russian', native: 'Русский', code: 'ru', u: 0.6, v: 0.2, word: 'имя', hello: 'Привет', ipa: '/ˈimʲə/' },
  { name: 'Spanish', native: 'Español', code: 'es', u: 0.49, v: 0.28, word: 'nombre', hello: 'Hola', ipa: '/ˈnom.bɾe/' },
];
const HUB = { u: 0.72, v: 0.4 };
const el = {
  w0: $('#word0'), eb: $('#eyebrow'), fl: $('#flare'), pin: $('#pin'), w1: $('#word1'), sites: $('#sites'), card: $('#card'),
  reg: $('#region'), fog: $('#fog'), hq: $('#hq'), hint: $('#hint'), tech: $('#tech'), cue: $('#cue'),
  rail: [...document.querySelectorAll('#rail button')], canvas: $('#gl'), dust: $('#dust'),
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- language list + card (works without WebGL) ---- */
let cur = 1;
LANGS.forEach((L, i) => {
  const li = document.createElement('li');
  li.dataset.i = i;
  const a = document.createElement('a');
  a.href = `/lookup?lang=${L.code}`;
  a.textContent = L.name;
  a.lang = 'en';
  li.appendChild(a);
  el.sites.appendChild(li);
});
function pick(i) {
  cur = i;
  const L = LANGS[i];
  [...el.sites.children].forEach((li, j) => li.classList.toggle('on', j === i));
  $('#cg').textContent = L.word; $('#cg').lang = L.code;
  $('#cl').textContent = `${L.name} · ${L.native}`;
  $('#cs').textContent = `“name” · ${L.ipa} — ${L.hello}`;
  $('#explore').href = `/lookup?lang=${L.code}`;
  const li = el.sites.children[i].getBoundingClientRect(), hr = hero.getBoundingClientRect();
  el.card.style.top = li.top - hr.top + li.height / 2 - el.card.offsetHeight / 2 + 'px';
  el.reg.replaceChildren(L.name, Object.assign(document.createElement('small'), { textContent: L.native }));
}
function staticMode() {
  hero.classList.add('static');
  pick(cur);
}

/* ---- boot: load three.js lazily ---- */
(async function start() {
  let THREE;
  try { THREE = await import(THREE_URL); } catch { return staticMode(); }
  try { init(THREE); } catch (e) { console.warn('3D hero unavailable, using static layout:', e.message); staticMode(); }
})();

function init(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas: el.canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -2e5, 2e5);
  const planet = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group();
  scene.add(planet); planet.add(tilt); tilt.add(spin);

  const dirFor = (u, v) => { const ph = 2 * Math.PI * u, th = Math.PI * v; return new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)); };

  function makeTexture() {
    const W = 2048, Hh = 1024, c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    const rnd = seeded(11), G = 64, grid = Array.from({ length: G * G }, () => rnd());
    const sm = (t) => t * t * (3 - 2 * t);
    const vn = (x, y, p) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const h = (i, j) => grid[((j % G) + G) % G * G + (((i % p) + p) % p)]; return mix(mix(h(xi, yi), h(xi + 1, yi), sm(xf)), mix(h(xi, yi + 1), h(xi + 1, yi + 1), sm(xf)), sm(yf)); };
    const fbm = (x, y) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { v += a * vn(x * f, y * f, 5 * f); f *= 2; a *= 0.5; } return v; };
    const st = 14;
    for (let y = st / 2; y < Hh; y += st) {
      const sinT = Math.sin((Math.PI * y) / Hh);
      for (let x = st / 2; x < W; x += st) {
        const n = fbm((x / W) * 5, (y / Hh) * 3.2), land = n > 0.5 && sinT > 0.12;
        if (land) { g.fillStyle = `rgba(${(100 + n * 120) | 0},${(220 - (n - 0.5) * 180) | 0},255,${(0.45 + n * 0.7) * (0.35 + 0.65 * sinT)})`; g.beginPath(); g.arc(x, y, st * 0.3 * (0.5 + 0.5 * sinT), 0, 7); g.fill(); }
        else { g.fillStyle = `rgba(80,110,255,${0.1 * sinT})`; g.fillRect(x - 1, y - 1, 2, 2); }
      }
    }
    g.strokeStyle = 'rgba(120,160,255,.12)'; g.lineWidth = 1;
    for (let i = 0; i <= 24; i++) { g.beginPath(); g.moveTo((i * W) / 24, 0); g.lineTo((i * W) / 24, Hh); g.stroke(); }
    for (let j = 1; j < 12; j++) { g.beginPath(); g.moveTo(0, (j * Hh) / 12); g.lineTo(W, (j * Hh) / 12); g.stroke(); }
    for (const L of LANGS) { const x = L.u * W, y = L.v * Hh, r = g.createRadialGradient(x, y, 0, x, y, 34); r.addColorStop(0, 'rgba(255,210,140,1)'); r.addColorStop(0.25, 'rgba(255,170,90,.6)'); r.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = r; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  const sunV = new THREE.Vector3(0.62, 0.5, 0.6).normalize();
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: makeTexture() }, sun: { value: sunV }, hiDir: { value: dirFor(HUB.u, HUB.v) }, hi: { value: 0 }, hiR: { value: 0.62 }, ready: { value: 0 }, time: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vObj;varying vec3 vN;void main(){vUv=uv;vObj=normalize(position);vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D map;uniform vec3 sun,hiDir;uniform float hi,hiR,ready,time;varying vec2 vUv;varying vec3 vObj;varying vec3 vN;
    void main(){vec3 tx=texture2D(map,vUv).rgb;vec3 n=normalize(vN);float diff=max(dot(n,sun),0.);
     vec3 base=vec3(.015,.03,.09)+vec3(.02,.05,.13)*diff;vec3 lit=base+tx*(.6+1.2*pow(diff,.8));
     float d=acos(clamp(dot(normalize(vObj),hiDir),-1.,1.))+(tx.g-.4)*.05;
     float m=smoothstep(hiR,hiR-.05,d),edge=smoothstep(.035,.0,abs(d-hiR+.015));
     vec3 acc=vec3(.55,.35,1.);lit=mix(lit,lit*.4+acc*(.22+tx.g*1.3),m*hi*.85)+vec3(.6,.9,1.)*edge*hi*.55;
     float fres=pow(1.-max(n.z,0.),3.);lit+=vec3(.25,.55,1.)*fres*(.3+diff*.8);
     lit*=.96+.04*sin(vObj.y*140.+time*2.);lit=lit/(lit*.25+1.)*1.25;
     gl_FragColor=vec4(lit,1.)*ready;}`,
  });
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mat));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), new THREE.ShaderMaterial({
    uniforms: { sun: { value: sunV }, ready: { value: 0 } }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN;void main(){vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 sun;uniform float ready;varying vec3 vN;void main(){float z=clamp(-vN.z,0.,1.),a=smoothstep(.0,.55,z);float s=.55+.6*max(dot(-vN*vec3(1.,1.,0.),normalize(sun*vec3(1.,1.,0.))),0.);a=pow(a,2.6)*s*.8;gl_FragColor=vec4(vec3(.42,.62,1.),a*ready);}',
  }));
  planet.add(atmo);

  /* ---- layout ---- */
  let W = 1, H = 1, portrait = false, R0 = 200, wh = 100;
  const dust = el.dust, dctx = dust.getContext('2d');
  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    portrait = H > W * 1.05; R0 = portrait ? W * 0.36 : Math.min(H * 0.3, W * 0.19);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
    const dp = Math.min(devicePixelRatio || 1, 1.5); dust.width = W * dp; dust.height = H * dp; dctx.setTransform(dp, 0, 0, dp, 0, 0);
    wh = el.w0.offsetHeight; pick(cur);
  }
  new ResizeObserver(resize).observe(hero);
  document.fonts?.ready.then(() => { wh = el.w0.offsetHeight; });
  resize();

  /* ---- state machine ---- */
  let st = 0, from = 0, to = 0, t0 = 0, dur = 1, locked = false, navigating = false;
  function go(n) {
    if (n === to) return;
    from = st; to = n; t0 = performance.now();
    const lo = Math.min(from, to), hi = Math.max(from, to);
    const s01 = Math.max(0, Math.min(hi, 1) - Math.max(lo, 0)), s12 = Math.max(0, Math.min(hi, 2) - Math.max(lo, 1));
    dur = reduced ? 1 : Math.max(1, s01 * 1300 + s12 * 2500);
  }
  function dive() { go(2); }
  function navigate() {
    if (navigating) return; navigating = true;
    try { sessionStorage.setItem('dict:dive', '1'); } catch { /* storage unavailable */ }
    location.assign(`/lookup?lang=${LANGS[cur].code}`);
  }
  addEventListener('pageshow', (e) => { if (e.persisted) { st = from = to = 0; navigating = false; } });

  el.sites.addEventListener('mouseover', (e) => { const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
  el.sites.addEventListener('focusin', (e) => { const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
  el.sites.addEventListener('click', (e) => { const li = e.target.closest('li'); if (!li) return; e.preventDefault(); pick(+li.dataset.i); dive(); });
  $('#explore').addEventListener('click', (e) => { e.preventDefault(); dive(); });
  el.rail.forEach((b, i) => b.addEventListener('click', () => { if (i === 2) dive(); else go(i); }));
  hero.addEventListener('wheel', (e) => {
    if (locked || window.scrollY > 2 || Math.abs(e.deltaY) <= 8) return;
    if (e.deltaY > 0 && to === 0) { e.preventDefault(); locked = true; setTimeout(() => (locked = false), 1400); go(1); }
    else if (e.deltaY < 0 && to === 1) { e.preventDefault(); locked = true; setTimeout(() => (locked = false), 1400); go(0); }
  }, { passive: false });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && to > 0 && !navigating) go(to - 1); });
  const mouse = { x: 0, y: 0 }; let mx = 0, my = 0;
  hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / W - 0.5; mouse.y = (e.clientY - r.top) / H - 0.5; });

  /* ---- drag / click planet ---- */
  let yaw = Math.atan2(-dirFor(0.4, 0.5).x, dirFor(0.4, 0.5).z), pitch = 0.16, vy = 0, drag = false, lastDrag = -1e9, down = null, pcx = 0, pcy = 0, pR = 100;
  el.canvas.addEventListener('pointerdown', (e) => { drag = true; down = { x: e.clientX, y: e.clientY }; el.canvas.classList.add('drag'); try { el.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ } lastDrag = performance.now(); });
  el.canvas.addEventListener('pointermove', (e) => { if (!drag) return; const k = 1.1 / R0; yaw += e.movementX * k; vy = e.movementX * k; pitch = clamp(pitch + e.movementY * k, -1, 1); lastDrag = performance.now(); });
  const endDrag = () => { drag = false; el.canvas.classList.remove('drag'); lastDrag = performance.now(); };
  el.canvas.addEventListener('pointercancel', endDrag);
  el.canvas.addEventListener('pointerup', (e) => {
    endDrag();
    const r = hero.getBoundingClientRect(), d = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (d < 6 && Math.hypot(e.clientX - r.left - pcx, e.clientY - r.top - pcy) <= pR && to < 2) { if (to === 0) go(1); else dive(); }
  });

  /* ---- dust + drifting script glyphs ---- */
  const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(170,220,255,.95)'); r.addColorStop(0.4, 'rgba(120,130,255,.42)'); r.addColorStop(1, 'rgba(120,130,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c; })();
  const rr = seeded(5);
  const motes = Array.from({ length: 34 }, () => ({ x: rr(), y: rr(), r: 3 + rr() * rr() * 34, s: 0.004 + rr() * 0.012, p: rr() * 6.28 }));
  const GL = 'अकखगतनमరకతపళ்தமஅعلمنكتب字語学あアЖЯФλΩñçßøæ한글ऋक्ष'.split('');
  const glyphs = Array.from({ length: 44 }, () => ({ x: rr(), y: rr(), sz: 16 + rr() * 30, s: 0.006 + rr() * 0.016, p: rr() * 6.28, g: GL[(rr() * GL.length) | 0], a: 0.1 + rr() * 0.3 }));
  function drawDust(t, b) {
    dctx.clearRect(0, 0, W, H);
    for (const m of motes) { const x = ((m.x + t * m.s + 2) % 1.1 - 0.05) * W, y = (m.y + Math.sin(t * 0.3 + m.p) * 0.02) * H; dctx.globalAlpha = 0.3 + 0.35 * Math.pow(Math.sin(t * 0.7 + m.p), 2); dctx.drawImage(sprite, x - m.r, y - m.r, m.r * 2, m.r * 2); }
    const gk = seg(b, 0.1, 0.5);
    if (gk > 0.01) { dctx.fillStyle = '#9fd8ff'; dctx.textAlign = 'left'; for (const g of glyphs) { const x = (g.x + Math.sin(t * 0.1 + g.p) * 0.02) * W, y = ((((g.y - t * g.s) % 1) + 1) % 1) * H; dctx.globalAlpha = g.a * gk * (0.6 + 0.4 * Math.sin(t + g.p)); dctx.font = `${g.sz}px "Noto Sans Devanagari","Noto Sans Telugu","Noto Sans Tamil","Noto Sans Arabic","Noto Sans JP","Noto Sans SC",Montserrat,sans-serif`; dctx.fillText(g.g, x, y); } }
    dctx.globalAlpha = 1;
  }

  /* ---- per-frame render ---- */
  const tLoad = performance.now(); let lastT = tLoad, visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(hero);
  pick(cur);
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { lastT = now; return; }
    const t = now / 1000, dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
    st = mix(from, to, io(seg(now, t0, t0 + dur)));
    const a = clamp(st), b = clamp(st - 1), age = (now - tLoad) / 1000;
    const grow = reduced ? 1 : out(seg(age, 0, 1.5)), iw = reduced ? 1 : out(seg(age, 0.75, 1.7));
    mx += (mouse.x - mx) * 0.08; my += (mouse.y - my) * 0.08;
    const f = (r) => 1 - Math.exp(-dt * r), bz = io(seg(b, 0, 0.62));
    const px = portrait ? 0.5 * W : mix(0.5 * W, 0.36 * W, a), py = portrait ? mix(0.4 * H, 0.33 * H, a) : 0.5 * H;
    const R = R0 * mix(0.03, 1, grow) * (1 + a * 0.04) * Math.exp(bz * 2.5);
    const cx = mix(px, 0.5 * W, bz), cy = mix(py, 0.5 * H, bz);
    pcx = cx; pcy = cy; pR = R;
    const L = LANGS[cur], tgt = b > 0 ? dirFor(L.u, L.v) : dirFor(HUB.u, HUB.v);
    if (st > 0.02) {
      const ty = Math.atan2(-tgt.x, tgt.z), d = ((((ty - yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
      yaw += d * f(3.6); pitch += (Math.asin(tgt.y) - pitch) * f(3.6); vy = 0;
    } else if (!drag) {
      yaw += vy; vy *= Math.exp(-dt * 4);
      if (now - lastDrag > 1500) yaw += dt * (0.08 + (1 - grow) * 2.4); else pitch += (0.16 - pitch) * f(1.2);
    }
    tilt.rotation.x = pitch; spin.rotation.y = yaw; planet.position.set(cx - W / 2, H / 2 - cy, 0); planet.scale.setScalar(R);
    const u = mat.uniforms; u.ready.value = grow; atmo.material.uniforms.ready.value = grow; u.time.value = t;
    u.hiDir.value.copy(tgt); u.hiR.value = b > 0.02 ? mix(0.62, 0.34, seg(b, 0, 0.1)) : 0.62; u.hi.value = clamp(seg(a, 0.15, 0.6) + (b > 0 ? 1 : 0));
    renderer.render(scene, cam);
    el.canvas.style.opacity = 1 - seg(b, 0.55, 0.8);

    const ox = portrait ? 0 : -a * 0.08 * W; let oy = my * -6; if (portrait) oy = H * -0.1 + R * 1.08 + wh * 0.5;
    const wW = el.w0.offsetWidth, I = (1 - iw) * 50;
    el.w0.style.transform = `translate(calc(-50% + ${ox}px),calc(-50% + ${oy}px))`; el.w0.style.clipPath = `inset(-10% ${I}% -10% ${I}%)`; el.w0.style.opacity = 1 - seg(a, 0.1, 0.5);
    el.eb.style.opacity = iw * (1 - seg(a, 0.05, 0.35));
    if (portrait) { el.eb.style.left = '50%'; el.eb.style.transform = 'translateX(-50%)'; el.eb.style.top = 0.5 * H + oy + wh / 2 + 18 + 'px'; }
    else { el.eb.style.left = 0.5 * W - wW / 2 + ox + wW * 0.02 + 'px'; el.eb.style.transform = 'none'; el.eb.style.top = 0.5 * H + oy - wh / 2 - 34 + 'px'; }
    el.fl.style.left = cx + R * 0.74 + 'px'; el.fl.style.top = cy - R * 0.62 + 'px'; el.fl.style.opacity = grow * (0.88 + 0.12 * Math.sin(t * 1.3)) * (1 - seg(bz, 0, 0.35));
    const fade0 = iw * (1 - seg(a, 0, 0.25)); el.hint.style.opacity = fade0 * 0.8; el.tech.style.opacity = fade0 * 0.9;
    el.hq.style.opacity = 1 - seg(b, 0.05, 0.3);
    {
      const d = dirFor(HUB.u, HUB.v), c1 = Math.cos(yaw), s1 = Math.sin(yaw), x1 = d.x * c1 + d.z * s1, z1 = -d.x * s1 + d.z * c1, cp = Math.cos(pitch), sp = Math.sin(pitch), y2 = d.y * cp - z1 * sp, z2 = d.y * sp + z1 * cp;
      el.pin.style.transform = `translate(${cx + x1 * R - 6}px,${cy - y2 * R - 8}px)`; el.pin.style.opacity = seg(z2, 0.22, 0.42) * seg(age, 1.6, 2.1) * (1 - seg(a, 0, 0.3));
    }
    const ka = seg(a, 0.45, 1);
    el.w1.style.opacity = ka * (1 - seg(b, 0.02, 0.16)); el.w1.style.transform = `translateX(calc(-50% + ${portrait ? 0 : 0.02 * W + (1 - out(ka)) * 40}px))`; el.w1.style.top = (portrait ? 0.46 * H : 0.56 * H) + 'px';
    const so = seg(a, 0.55, 1) * (1 - seg(b, 0, 0.14)), vis = so < 0.01 ? 'hidden' : 'visible';
    el.sites.style.opacity = so; el.card.style.opacity = so; el.sites.style.visibility = vis; el.card.style.visibility = vis;
    el.card.style.transform = `translateX(${(1 - out(seg(a, 0.6, 1))) * 26}px)`;
    el.reg.style.opacity = seg(b, 0.14, 0.26) * (1 - seg(b, 0.42, 0.52));
    el.fog.style.opacity = seg(b, 0.36, 0.54) * (1 - 0) ;
    el.rail.forEach((d, i) => d.classList.toggle('on', i === Math.round(st)));
    drawDust(t, b);
    if (st >= 1.985 && to === 2) navigate();
  }
  requestAnimationFrame(frame);
}
