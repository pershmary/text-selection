// Создание пустой таблицы 2×3: быстрая кнопка «Таблица» в пустой строке и иконка «Таблица» в верхнем тулбаре
// (только часть с иконкой; стрелка таблицу не создаёт).
(function () {
  function create() {
    if (window.TableWindow && TableWindow.isOpen()) TableWindow.close(true);
    TableAPI.run('newTable');
  }
  document.querySelector('.doc-quick .doc-qbtn[title="Таблица"]').addEventListener('click', create);
  // «Заполнить таблицу»: видна, пока таблица только что создана (--tw-new в стиле таблицы) и не удалена.
  const fd = document.querySelector('.tw-filldemo'), fdBtn = fd.querySelector('.tw-filldemo-btn');
  const tbl = document.querySelector('.tw'), tw = document.querySelector('.table-widget');
  function syncFill() {
    const on = !tw.hidden && tbl.style.getPropertyValue('--tw-new').trim() === '1';
    fd.classList.toggle('is-on', on);
    if (!on) return;
    const r = fd.getBoundingClientRect();
    fdBtn.style.left = (document.documentElement.clientWidth / 2 - r.left - fdBtn.offsetWidth / 2) + 'px';
  }
  new MutationObserver(syncFill).observe(tbl, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(syncFill).observe(tw, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', syncFill);
  fdBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
  fdBtn.addEventListener('click', function () {
    if (window.TableWindow && TableWindow.isOpen()) TableWindow.close(true);
    TableAPI.run('fillDemoTable');
  });
  syncFill();
  // Окно создания таблицы: стрелка у кнопки «Таблица» в верхнем тулбаре. Наведение на ячейку сетки выделяет ячейки от левой верхней
  // до неё, подпись — «столбцы×строки»; нажатие создаёт пустую таблицу этого размера (как кнопка «Таблица» — только когда прежняя удалена)
  // и закрывает окно. Закрывается повторным нажатием стрелки, кликом мимо окна и Esc.
  const arr = document.querySelector('.app-tsplit .app-tarr');
  const cw = document.createElement('div');
  cw.className = 'tw-create';
  cw.setAttribute('role', 'dialog');
  cw.setAttribute('aria-label', 'Создание таблицы');
  cw.hidden = true;
  let cells = '';
  // Сетка растёт: наведение на последний столбец / строку добавляет ещё один (до 12×12); при уходе назад — снова сжимается (не меньше 6×6).
  const MIN = 6, MAX = 12;
  for (let r = 1; r <= MAX; r++) for (let c = 1; c <= MAX; c++) cells += '<button type="button" class="tw-create-cell" data-c="' + c + '" data-r="' + r + '" aria-label="' + c + '×' + r + '"></button>';
  cw.innerHTML = '<div class="tw-create-grid">' + cells + '</div><div class="tw-create-size">1×1</div>';
  document.body.appendChild(cw);
  const size = cw.querySelector('.tw-create-size');
  function mark(c, r) {
    const nc = Math.min(MAX, Math.max(MIN, c + 1)), nr = Math.min(MAX, Math.max(MIN, r + 1));
    cw.querySelector('.tw-create-grid').style.setProperty('--cols', nc);
    cw.querySelectorAll('.tw-create-cell').forEach(function (x) {
      x.hidden = +x.dataset.c > nc || +x.dataset.r > nr;
      x.classList.toggle('is-on', +x.dataset.c <= c && +x.dataset.r <= r);
    });
    size.textContent = c + '×' + r;
  }
  function closeCreate() { cw.hidden = true; arr.setAttribute('aria-expanded', 'false'); }
  let paletteEl = null;   // палитра виджетов: клики по ней не закрывают окно создания
  // pos — { left, top }: окно у пункта «Таблица» палитры виджетов; без pos — у кнопки «Таблица» верхнего тулбара.
  function openCreate(pos) {
    mark(1, 1);
    cw.hidden = false;
    if (pos) { cw.style.left = pos.left + 'px'; cw.style.top = pos.top + 'px'; return; }
    // Позиция ставится при открытии (по центру кнопки); при росте сетки окно расширяется вправо и вниз, сетка под курсором не сдвигается.
    arr.setAttribute('aria-expanded', 'true');
    const sp = document.querySelector('.app-tsplit').getBoundingClientRect(), tb = document.querySelector('.app-toolbar').getBoundingClientRect();
    cw.style.left = (sp.left + sp.width / 2 - cw.offsetWidth / 2) + 'px';   // по центру кнопки «Таблица» (иконка + стрелка)
    cw.style.top = tb.bottom + 'px';   // вплотную к верхнему тулбару
  }
  arr.setAttribute('aria-expanded', 'false');
  arr.addEventListener('click', function () { if (cw.hidden) openCreate(); else closeCreate(); });
  cw.addEventListener('mousedown', function (e) { e.preventDefault(); });
  cw.addEventListener('mouseover', function (e) { const x = e.target.closest('.tw-create-cell'); if (x) mark(+x.dataset.c, +x.dataset.r); });
  cw.addEventListener('click', function (e) {
    const x = e.target.closest('.tw-create-cell');
    if (!x) return;
    closeCreate();
    if (!tw.hidden) return;
    if (window.TableWindow && TableWindow.isOpen()) TableWindow.close(true);
    TableAPI.newTable(+x.dataset.c, +x.dataset.r);
  });
  document.addEventListener('mousedown', function (e) { if (!cw.hidden && !cw.contains(e.target) && !arr.contains(e.target) && !(paletteEl && paletteEl.contains(e.target))) closeCreate(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cw.hidden) closeCreate(); });
  window.addEventListener('resize', closeCreate);

  // Палитра виджетов (Figma 1154:71273): «/» в пустой строке. Левый край — по началу строки, верх — сразу под строкой текста.
  // Активный пункт — оранжевая метка слева (3×16, #cc3d00); активный пункт меняют только стрелки ↑/↓, Enter выбирает его,
  // Esc / удаление «/» / клик мимо закрывают. «Таблица» — пустая таблица 2×3; стрелка у пункта (наведение) — окно создания таблицы справа.
  const line = document.querySelector('.doc-empty-line');
  const WIDGETS = [['\ue6c7', 'Маркированный список'], ['\ue6c8', 'Нумерованный список'], ['\ue76f', 'Чек-лист'], ['\ue6a7', 'Ссылка'],
    ['\ue9a3', 'Изображение'], ['\ue958', 'Таблица', 'sub'], ['\ueaee', '2 колонки'], ['\ue9a7', 'Эмоджи'], ['\uea88', 'Блок кода'],
    ['\ue64b', 'Инфоблок'], ['\uea47', 'Спойлер'], ['\uebd9', 'Цитата'], ['\uebda', 'Медиаконтент'], ['\ue9fe', 'Иконка'],
    ['\ueb7e', 'Кнопка'], ['\uebdb', 'Вкладки']];
  const pal = document.createElement('div');
  pal.className = 'doc-palette';
  pal.setAttribute('role', 'listbox');
  pal.setAttribute('aria-label', 'Виджеты');
  pal.hidden = true;
  pal.innerHTML = WIDGETS.map(function (w, i) {
    return '<div class="doc-pal-item" role="option" data-i="' + i + '" data-name="' + w[1] + '"><span class="doc-pal-ico" aria-hidden="true">' + w[0] + '</span>' +
      '<span class="doc-pal-text">' + w[1] + '</span>' + (w[2] ? '<span class="doc-pal-sub" aria-hidden="true">\ue9ab</span>' : '') + '</div>';
  }).join('');
  document.querySelector('.doc-empty').appendChild(pal);
  paletteEl = pal;
  const items = Array.from(pal.querySelectorAll('.doc-pal-item'));
  let active = 0;
  function setActive(i) { active = i; items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); }); }
  function openPal() { setActive(0); pal.hidden = false; }
  function closePal() { pal.hidden = true; if (!cw.hidden && !arr.matches('[aria-expanded="true"]')) closeCreate(); }
  function choose(i) {
    const name = WIDGETS[i][1];
    if (name !== 'Таблица') return;   // остальные виджеты пока без действия
    closePal();
    line.textContent = '';
    if (tw.hidden) TableAPI.run('newTable');
  }
  function openSubGrid(it) {
    const pr = pal.getBoundingClientRect(), ir = it.getBoundingClientRect();
    openCreate({ left: pr.right - 1, top: ir.top });   // верх окна = верх пункта «Таблица»
  }
  line.addEventListener('input', function () {
    if (line.textContent === '/') openPal(); else if (!pal.hidden) closePal();
  });
  line.addEventListener('keydown', function (e) {
    if (pal.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length);
      items[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); closePal(); }
  });
  line.addEventListener('blur', function () { setTimeout(function () { if (!pal.contains(document.activeElement)) closePal(); }, 0); });
  pal.addEventListener('mousedown', function (e) { e.preventDefault(); });   // курсор остаётся в строке
  items.forEach(function (it, i) {
    // Наведение мыши метку не двигает (её передвигают только стрелки ↑/↓) — у пункта под курсором ховер-фон.
    it.addEventListener('mouseenter', function () {
      if (WIDGETS[i][2]) openSubGrid(it); else if (!cw.hidden && !arr.matches('[aria-expanded="true"]')) closeCreate();
    });
    it.addEventListener('click', function () { choose(i); });
  });
  // Окно создания из палитры: таблица выбранного размера, «/» убирается.
  cw.addEventListener('click', function (e) { if (e.target.closest('.tw-create-cell') && !pal.hidden) { pal.hidden = true; line.textContent = ''; } }, true);
  document.addEventListener('mousedown', function (e) { if (!pal.hidden && !pal.contains(e.target) && !cw.contains(e.target) && e.target !== line) closePal(); }, true);
  // Окно «Разделение ячейки» (вариант «На несколько ячеек» команды «Разделить ячейку»): по центру экрана.
  // Поля «Столбцы» / «Строки» (от 1 до 20, − / + меняют на 1); галка (и Enter) делит ячейку, крестик (и Esc) закрывает без изменений.
  (function () {
    const MAXN = 20;
    const sd = document.createElement('div');
    sd.className = 'tw-split';
    sd.setAttribute('role', 'dialog');
    sd.setAttribute('aria-label', 'Разделение ячейки');
    sd.hidden = true;
    const row = function (label, key) {
      return '<div class="tw-split-row"><div class="tw-split-label">' + label + '</div>' +
        '<input class="tw-split-input" data-k="' + key + '" inputmode="numeric" value="1" aria-label="' + label + '">' +
        '<div class="tw-split-btns"><button type="button" data-k="' + key + '" data-d="-1" title="Меньше" aria-label="Меньше">\ueae5</button>' +
        '<button type="button" data-k="' + key + '" data-d="1" title="Больше" aria-label="Больше">\ueadd</button></div></div>';
    };
    sd.innerHTML = '<div class="tw-split-head"><div class="tw-split-title">Разделение ячейки</div><div class="tw-split-cmds">' +
      '<button type="button" class="tw-split-done" title="Применить" aria-label="Применить">\ue75e</button>' +
      '<button type="button" class="tw-split-close" title="Закрыть" aria-label="Закрыть"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>' +
      '</div></div><div class="tw-split-body"><div class="tw-split-panel">' + row('Столбцы', 'c') + row('Строки', 'r') + '</div></div>';
    const dim = document.createElement('div');
    dim.className = 'tw-split-dim';
    dim.hidden = true;
    document.body.appendChild(dim);
    document.body.appendChild(sd);
    let target = null;
    const inp = { c: sd.querySelector('input[data-k="c"]'), r: sd.querySelector('input[data-k="r"]') };
    function val(k) { const v = parseInt(inp[k].value, 10); return isNaN(v) ? 1 : Math.max(1, Math.min(MAXN, v)); }
    function close() { sd.hidden = true; dim.hidden = true; target = null; }
    function apply() {
      const cell = target, c = val('c'), r = val('r');
      close();
      TableAPI.splitCellInto(cell, c, r);
    }
    function open() {
      target = TableAPI.splitTarget();
      if (!target) return;
      inp.c.value = '1'; inp.r.value = '1';
      dim.hidden = false;
      sd.hidden = false;
      sd.style.left = Math.round((document.documentElement.clientWidth - sd.offsetWidth) / 2) + 'px';
      sd.style.top = Math.round((window.innerHeight - sd.offsetHeight) / 2) + 'px';
    }
    sd.querySelectorAll('.tw-split-btns button').forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { const k = b.dataset.k; inp[k].value = String(Math.max(1, Math.min(MAXN, val(k) + +b.dataset.d))); });
    });
    Object.keys(inp).forEach(function (k) {
      inp[k].addEventListener('input', function () { inp[k].value = inp[k].value.replace(/\D/g, '').slice(0, 2); });
      inp[k].addEventListener('blur', function () { if (inp[k].value !== '') inp[k].value = String(val(k)); });
    });
    sd.querySelector('.tw-split-done').addEventListener('click', apply);
    sd.querySelector('.tw-split-close').addEventListener('click', close);
    sd.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); apply(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    });
    window.SplitDialog = { open: open, close: close };
  })();
  // Кнопка в верхнем тулбаре создаёт таблицу, только когда прежняя удалена (в демо одна таблица).
  document.querySelector('.app-tsplit .app-tbtn[title="Таблица"]').addEventListener('click', function () {
    if (!document.querySelector('.table-widget').hidden) return;
    create();
  });
})();
