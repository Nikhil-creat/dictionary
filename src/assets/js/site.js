// Shared behaviour for every page: mobile navigation. Kept tiny on purpose.
const btn = document.querySelector('.burger');
const nav = document.getElementById('site-nav');
if (btn && nav) {
  const set = (open) => {
    nav.dataset.open = String(open);
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', () => set(nav.dataset.open !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}
