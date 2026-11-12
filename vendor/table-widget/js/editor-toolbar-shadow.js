// Тень под верхним тулбаром редактора — пока страница прокручена.
(function () {
  const bar = document.querySelector('.app-toolbar');
  const sh = document.createElement('div');
  sh.className = 'app-tshadow';
  sh.setAttribute('aria-hidden', 'true');
  bar.after(sh);
  function sync() { document.documentElement.classList.toggle('app-scrolled', window.scrollY > 0); }
  window.addEventListener('scroll', sync, { passive: true });
  sync();
})();
