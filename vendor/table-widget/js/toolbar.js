/* Общее правило для полей ввода: по клику в поле встаёт курсор, текст не выделяется (выделение при фокусе убрано). */
/* ---------- Компонент тулбара ----------
   Toolbar.create({ container, label, items }) → { el, button(id), setPressed(id, on), refresh(), showAt(x, y), hide() }
   items: [{ id, icon: '' | svg: '<svg…>', title, text?, arrow?, toggle?, pressed?, danger?, centered?,
             passive?: boolean, isPressed?: () => bool, onClick?: function (btn, pressed) {} }]
   Тулбар кладётся в контейнер (container), координаты showAt — внутри этого контейнера. */
const Toolbar = (function () {
  const WINDOW_GAP = 4;   // расстояние между тулбаром и окном, которое открывает его кнопка
  const OBJECT_WINDOW_GAP = 8;   // окно настройки объекта — на 8px правее объекта
  // Координаты внутри iframe совпадают с границами сцены, а не всей страницы demo-frame.
  function fitWindowToScene(win) {
    if (!win || win.hidden || !win.getClientRects().length) return;
    const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
    const r = win.getBoundingClientRect();
    const dx = Math.max(0, Math.min(r.left, width - r.width)) - r.left;
    const dy = Math.max(0, Math.min(r.top, height - r.height)) - r.top;
    if (Math.abs(dx) > .01) win.style.left = ((parseFloat(win.style.left) || 0) + dx) + 'px';
    if (Math.abs(dy) > .01) win.style.top = ((parseFloat(win.style.top) || 0) + dy) + 'px';
  }
  window.fitWindowToScene = fitWindowToScene;
  let fitRaf = 0;
  function fitOpenWindows() {
    if (fitRaf) return;
    fitRaf = requestAnimationFrame(function () {
      fitRaf = 0;
      document.querySelectorAll('.twin, .tw-split').forEach(fitWindowToScene);
    });
  }
  new MutationObserver(fitOpenWindows).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style', 'class']
  });
  window.addEventListener('resize', fitOpenWindows);
  window.addEventListener('scroll', fitOpenWindows, true);
  // Меню: иконки пунктов и иконка вызывающей кнопки — на одной вертикальной оси (по центру иконок).
  // Только для меню (у окон команд — свои правила): иконки берутся из пунктов самого меню, не из вложенных списков.
  function alignMenuIcons(win, btn) {
    if (!win.classList.contains('twin--menu')) return;
    const mi = win.querySelector(':scope > .twin-mn-list .twin-mn-ico');
    const bi = btn.querySelector('.tb-icon, .tw-win-ico, svg') || btn;
    if (!mi) return;
    const m = mi.getBoundingClientRect(), b = bi.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (m.left + m.width / 2);
    win.style.left = (parseFloat(win.style.left) + dx) + 'px';
  }
  window.alignMenuIcons = alignMenuIcons;
  function create(opts) {
    const el = document.createElement('div');
    el.className = 'tb';
    el.setAttribute('role', 'toolbar');
    if (opts.label) el.setAttribute('aria-label', opts.label);
    el.hidden = true;
    const buttons = {};

    opts.items.forEach(function (item) {
      // Разделитель групп кнопок (1×20, rgba(0,0,0,.08), поля 2px) — как в тулбаре окна расширенного режима.
      if (item.sep) { const sp = document.createElement('span'); sp.className = 'tb-sep'; sp.setAttribute('aria-hidden', 'true'); el.appendChild(sp); return; }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tb-btn' + (item.danger ? ' tb-btn--danger' : '');
      b.tabIndex = -1;
      if (item.title) { b.title = item.title; b.setAttribute('aria-label', item.title); }
      if (!item.passive && (item.toggle || item.arrow)) b.setAttribute('aria-pressed', item.pressed ? 'true' : 'false');
      let html = '<span class="tb-btn-inner">';
      if (item.svg) html += item.svg;
      else if (item.icon) html += '<span class="tw-icon tw-icon--24 tb-icon' + (item.centered ? ' tb-icon--centered' : '') +
        '" aria-hidden="true">' + item.icon + '</span>';
      if (item.text) html += '<span class="tb-text">' + item.text + '</span>';
      if (item.label) { html += '<span class="tb-label">' + item.label + '</span>'; b.classList.add('tb-btn--label'); }   // подпись как у кнопок тулбара окна расширенного режима
      html += '</span>';
      if (item.arrow) html += '<span class="tb-arrow" aria-hidden="true"><span class="tw-icon"></span></span>';
      b.innerHTML = html;
      // Нажатие на кнопку тулбара не сбивает курсор в ячейке.
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      if (!item.passive) b.addEventListener('click', function () {
        let pressed = b.getAttribute('aria-pressed') === 'true';
        if ((item.toggle || item.arrow) && !item.isPressed) {
          pressed = !pressed;
          b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        }
        if (item.onClick) item.onClick(b, pressed);
        api.refresh();
      });
      buttons[item.id] = b;
      el.appendChild(b);
    });

    (opts.container || document.body).appendChild(el);

    const api = {
      el: el,
      button: function (id) { return buttons[id]; },
      setPressed: function (id, on) { buttons[id].setAttribute('aria-pressed', on ? 'true' : 'false'); },
      // Состояние кнопок, зависящее от таблицы (например, «Объединить» нажата на объединённой ячейке).
      refresh: function () {
        opts.items.forEach(function (item) {
          if (item.sep) return;
          if (item.isPressed) buttons[item.id].setAttribute('aria-pressed', item.isPressed() ? 'true' : 'false');
        });
      },
      showAt: function (x, y) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        api.refresh();
        el.hidden = false;
        if (api.openWin) api.placeWindow(api.openWin.win, api.openWin.id);   // окно едет за тулбаром
      },
      hide: function () { el.hidden = true; api.closeWindow(); }
    };
    windowHost(api, { button: function (id) { return buttons[id]; }, container: function () { return el.parentElement; } });
    return api;
  }
  // Хост окон: открывает окна команд под тулбаром (или у настраиваемого объекта) и закрывает их.
  // tb — объект тулбара ({ el }); методы окон добавляются прямо в него. opts.button(id) — кнопка команды, opts.container() — где лежат окна.
  // Им пользуются тулбары в таблице и тулбар окна расширенного режима — окна открываются одинаково.
  function windowHost(tb, opts) {
    const host = Object.assign(tb, {
      openWin: null,
      button: opts.button,
      // Открыть окно по кнопке id (кнопка нажата, пока окно открыто). Повторный вызов — закрыть.
      // at — { dx }: окно встаёт левее/правее кнопки на dx (окно из пункта меню — на месте меню).
      toggleWindow: function (win, id, at) {
        if (host.openWin && host.openWin.win === win) { host.closeWindow(); return; }
        host.closeWindow();
        host.openWin = { win: win, id: id, dx: at && typeof at.dx === 'number' ? at.dx : null };
        const b = opts.button(id);
        if (b) b.setAttribute('aria-pressed', 'true');
        host.placeWindow(win, id);
        // Правило для всех окон: галка применяет изменения (окно закрывается), крестик (и Esc) закрывает окно
        // и сбрасывает изменения, сделанные в таблице за время, пока окно открыто.
        win._openMark = window.TableAPI ? TableAPI.historyMark() : 0;
        win._host = host;
        if (!win._okCancel && !win.classList.contains('twin--menu')) {
          win._okCancel = true;
          win.addEventListener('click', function (e) {
            const x = e.target.closest('.twin-close');
            if (x && x.closest('.twin') === win && window.TableAPI) TableAPI.revertTo(win._openMark);
          }, true);
          win.addEventListener('click', function (e) {
            const ok = e.target.closest('.twin-done');
            if (ok && ok.closest('.twin') === win && win._host && win._host.openWin && win._host.openWin.win === win) win._host.closeWindow();
          });
        }
        win.dispatchEvent(new CustomEvent('tw:open'));
      },
      closeWindow: function () {
        if (!host.openWin) return;
        const o = host.openWin;
        host.openWin = null;
        o.win.hidden = true;
        const b = opts.button(o.id);
        if (b) b.setAttribute('aria-pressed', 'false');
        o.win.dispatchEvent(new CustomEvent('tw:close'));
      },
      // Окно, которое открывает кнопка тулбара: левый край окна = левый край кнопки,
      // между окном и тулбаром 4px (окно под тулбаром). Окно кладётся в контейнер тулбара.
      placeWindow: function (win, id) {
        const container = opts.container();
        if (win.parentElement !== container) container.appendChild(win);
        win.style.position = 'absolute';
        const c = container.getBoundingClientRect();
        // Окна настройки объекта (команда «Настроить»): верх окна = верх объекта, окно на 8px правее объекта.
        if (typeof win._anchor === 'function') {
          const a = win._anchor();
          if (a) {
            win.style.top = (a.top - c.top) + 'px';
            win.hidden = false;
            // Не помещается справа — сдвигаем внутрь экрана (8px от края окна браузера).
            const vw = document.documentElement.clientWidth;
            let x = a.right + OBJECT_WINDOW_GAP;
            x = Math.max(0, Math.min(x, vw - win.offsetWidth));
            win.style.left = (x - c.left) + 'px';
            fitWindowToScene(win);
            return;
          }
        }
        const btn = opts.button(id);
        const b = btn.getBoundingClientRect();
        const t = tb.el.getBoundingClientRect();
        win.style.top = (t.bottom - c.top + WINDOW_GAP) + 'px';
        const o = host.openWin && host.openWin.win === win ? host.openWin : null;
        if (o && o.dx !== null) {   // на месте меню, из которого вызвано окно
          win.style.left = (b.left + o.dx - c.left) + 'px';
          win.hidden = false;
          fitWindowToScene(win);
          return;
        }
        win.style.left = (b.left - c.left) + 'px';
        win.hidden = false;
        alignMenuIcons(win, btn);
        fitWindowToScene(win);
      }
    });
    return host;
  }
  return { create: create, windowHost: windowHost };
})();
