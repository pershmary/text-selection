/* Текстовый тулбар (Figma 3813:297664). Выделение текста и диапазон ячеек — разные режимы. */
(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  // Те же SVG уже используются в тулбаре документа: цвет текста, маркер и голосовой ввод.
  function documentIcon(label) {
    return document.querySelector('.app-toolbar button[aria-label="' + label + '"] svg').outerHTML;
  }
  let toolbar, savedRange = null, savedBackward = false, raf = 0;
  function restoreSelectionDirection(sel) {
    if (!savedRange) return;
    // Начальная точка остаётся на месте и при выделении справа налево.
    const r = savedRange;
    if (savedBackward) sel.setBaseAndExtent(r.endContainer, r.endOffset, r.startContainer, r.startOffset);
    else { sel.removeAllRanges(); sel.addRange(r); }
  }
  function format(command, value) {
    if (!savedRange || !savedRange.startContainer.isConnected) return;
    const node = savedRange.startContainer;
    const cell = (node.nodeType === 1 ? node : node.parentElement).closest('th, td');
    cell.focus({ preventScroll: true });
    const sel = window.getSelection();
    restoreSelectionDirection(sel);
    TableAPI.formatSelectedText(command, value);
    savedRange = TableAPI.selectedTextRange();
    restoreSelectionDirection(sel);
    schedule();
  }
  function styleMenu(menu) {
    const win = TableWindows.textStyle(toolbar);
    win.classList.add('twin--text-toolbar');
    toolbar.toggleWindow(win, menu ? 'style' : 'format');
    if (menu && !win.hidden) win.querySelector('.twin-back').click();
  }
  function formatButton(id, icon, title, command) {
    return { id: id, icon: icon, title: title, toggle: true,
      isPressed: function () { const fmt = TableAPI.activeTextFormat(); return !!(fmt && fmt[id]); },
      onClick: function () { format(command); } };
  }
  const popups = {};
  function popup(id, label, content) {
    if (!popups[id]) {
      const win = document.createElement('div');
      win.className = 'twin twin--text twin--text-toolbar';
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', label);
      win.hidden = true;
      win.innerHTML = content;
      win.addEventListener('mousedown', function (e) { if (!e.target.closest('input')) e.preventDefault(); });
      popups[id] = win;
    }
    toolbar.toggleWindow(popups[id], id);
    return popups[id];
  }
  function color(id, title, command, initial) {
    const win = popup(id, title, '<label>' + title + ' <input type="color" aria-label="' + title + '" value="' + initial + '"></label>');
    if (!win._bound) {
      win._bound = true;
      win.querySelector('input').addEventListener('change', function (e) { format(command, e.target.value); toolbar.closeWindow(); });
    }
  }
  function link() {
    const win = popup('link', 'Ссылка', '<label>Ссылка <input type="url" aria-label="Адрес ссылки" placeholder="https://"></label><button type="button" class="twin-btn" aria-label="Применить ссылку"><span class="tw-icon">\uE75E</span></button>');
    if (!win._bound) {
      win._bound = true;
      function apply() {
        const value = win.querySelector('input').value.trim();
        if (!/^(https?:\/\/|mailto:|tel:)/i.test(value)) return;
        format('createLink', value);
        toolbar.closeWindow();
      }
      win.querySelector('button').addEventListener('click', apply);
      win.querySelector('input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    }
  }
  toolbar = Toolbar.create({ container: wrap, label: 'Форматирование текста', items: [
    { id: 'style', text: 'Основной текст', title: 'Стиль текста', arrow: true, onClick: function () { styleMenu(true); } },
    { sep: true },
    { id: 'format', icon: '\uE764', title: 'Настроить текст', onClick: function () { styleMenu(false); } },
    { sep: true },
    formatButton('bold', '\uE6C3', 'Жирный', 'bold'),
    formatButton('italic', '\uE6C6', 'Курсив', 'italic'),
    formatButton('underline', '\uE6CE', 'Подчёркнутый', 'underline'),
    formatButton('strike', '\uE6CB', 'Зачёркнутый', 'strikeThrough'),
    { sep: true },
    { id: 'color', svg: documentIcon('Цвет текста'), title: 'Цвет текста', onClick: function () { color('color', 'Цвет текста', 'foreColor', '#000000'); } },
    { id: 'background', svg: documentIcon('Цвет выделения'), title: 'Фон текста', onClick: function () { color('background', 'Фон текста', 'hiliteColor', '#ffffff'); } },
    { sep: true },
    { id: 'link', icon: '\uE6A7', title: 'Ссылка', onClick: link },
    { id: 'voice', svg: documentIcon('Голосовой ввод'), title: 'Голосовой ввод', onClick: function () { document.querySelector('.app-toolbar [aria-label="Голосовой ввод"]').click(); } },
    { id: 'more', icon: '\uEAB4', title: 'Ещё', onClick: function () {
      const win = popup('more', 'Ещё', '<button type="button" class="twin-menu-item" data-command="removeFormat">Сбросить форматирование</button><button type="button" class="twin-menu-item" data-command="unlink">Удалить ссылку</button>');
      if (!win._bound) {
        win._bound = true;
        win.addEventListener('click', function (e) { const b = e.target.closest('[data-command]'); if (b) { format(b.dataset.command); toolbar.closeWindow(); } });
      }
    } }
  ] });
  toolbar.el.classList.add('tb--text');
  function update() {
    raf = 0;
    const range = TableAPI.selectedTextRange();
    const inPopup = toolbar.openWin && toolbar.openWin.win.contains(document.activeElement);
    const busy = document.documentElement.matches('.tw-cell-selecting, .tw-dragging, .tw-resizing');
    if (busy || wrap.closest('.table-widget').hidden || (!inPopup && (!range || !table.contains(document.activeElement)))) {
      toolbar.hide();
      savedRange = null;
      return;
    }
    if (range) {
      savedRange = range;
      const sel = window.getSelection();
      savedBackward = sel.anchorNode === range.endContainer && sel.anchorOffset === range.endOffset;
    }
    if (!savedRange || !savedRange.startContainer.isConnected) { toolbar.hide(); return; }
    const rects = Array.from(savedRange.getClientRects()).filter(function (r) { return r.width && r.height; });
    const scroll = table.closest('.table-scroll').getBoundingClientRect();
    const appBar = document.querySelector('.tw-in-window .tw-win-head') || document.querySelector('.app-toolbar');
    const ceiling = appBar ? Math.max(0, appBar.getBoundingClientRect().bottom) : 0;
    // Range всегда упорядочен по документу; направление Selection определяет реальную точку начала.
    const anchor = savedRange.cloneRange();
    anchor.collapse(!savedBackward);
    let box = Array.from(anchor.getClientRects()).find(function (r) { return r.height; });
    // При выделении узла целиком граница Range может лежать на элементе без собственного caret-rect.
    if (!box && rects.length) {
      const edge = savedBackward ? rects[rects.length - 1] : rects[0];
      box = { left: savedBackward ? edge.right : edge.left, top: edge.top, bottom: edge.bottom };
    }
    if (!box || box.left < scroll.left || box.left > scroll.right || box.bottom <= ceiling || box.top >= window.innerHeight) { toolbar.hide(); return; }
    toolbar.el.hidden = false;
    const w = toolbar.el.offsetWidth, h = toolbar.el.offsetHeight;
    const wr = wrap.getBoundingClientRect();
    const left = Math.max(0, Math.min(box.left - w / 2, document.documentElement.clientWidth - w));
    toolbar.showAt(left - wr.left, Math.max(ceiling, box.top - h - 8) - wr.top);
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }
  document.addEventListener('selectionchange', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.addEventListener('pointerup', schedule);
  document.addEventListener('pointercancel', schedule);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toolbar.openWin) { toolbar.closeWindow(); schedule(); }
  });
  table.addEventListener('input', schedule);
  table.addEventListener('tw:selection', schedule);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(table);
  new MutationObserver(schedule).observe(table, { childList: true, subtree: true, characterData: true });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
