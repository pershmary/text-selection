'use strict';

// Плавающий тулбар документа, Figma 2243:184539. Не использует команды таблицы.
(() => {
  const editor = document.querySelector('.doc');
  const title = document.querySelector('.doc-title');
  const appBar = document.querySelector('.app-toolbar');
  let savedRange = null, backward = false, dragging = false, frame = 0;
  let dismissed = false;
  const documentIcon = label => document.querySelector('.app-toolbar [aria-label="' + label + '"] svg').outerHTML;

  function selectionRange() {
    if (title.contains(document.activeElement)) return null;
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
    // Редактирование ячеек и их тулбары остаются внутри компонента таблицы.
    const element = node => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element(range.startContainer).closest('.table-widget') || element(range.endContainer).closest('.table-widget')) return null;
    return range.cloneRange();
  }

  function selectedTextStyles(range) {
    const styles = new Set();
    const texts = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    for (let node = texts.nextNode(); node; node = texts.nextNode()) {
      if (!range.intersectsNode(node)) continue;
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.length;
      if (!node.data.slice(start, end).trim()) continue;

      const element = node.parentElement;
      const cell = element.closest('.table-widget .tw :is(td, th)');
      // При выделении таблицы целиком учитываем текст ячеек и пропускаем служебные элементы.
      if (!cell && !element.isContentEditable) continue;
      const block = element.closest('p, h1, h2, h3, h4, h5, h6, td, th');
      styles.add(block && !block.matches('td, th') ? block.localName : 'p');
    }
    return styles;
  }

  function restore() {
    if (!savedRange || !savedRange.startContainer.isConnected || !savedRange.endContainer.isConnected) return false;
    editor.focus({ preventScroll: true });
    const sel = window.getSelection();
    if (backward) sel.setBaseAndExtent(savedRange.endContainer, savedRange.endOffset, savedRange.startContainer, savedRange.startOffset);
    else { sel.removeAllRanges(); sel.addRange(savedRange); }
    return true;
  }

  function execute(command, value) {
    if (!restore()) return;
    DocumentHistory.change(() => document.execCommand(command, false, value));
    savedRange = selectionRange();
    schedule();
  }

  function formatButton(id, icon, title, command) {
    return { id, icon, title, toggle: true, isPressed: () => document.queryCommandState(command), onClick: () => execute(command) };
  }

  const toolbar = Toolbar.create({ container: document.body, label: 'Форматирование', items: [
    { id: 'style', text: 'Основной текст', title: 'Стиль текста', arrow: true, passive: true },
    { sep: true },
    { id: 'format', icon: '\uE764', title: 'Настроить текст', passive: true },
    { sep: true },
    formatButton('bold', '\uE6C3', 'Жирный', 'bold'),
    formatButton('italic', '\uE6C6', 'Курсив', 'italic'),
    formatButton('underline', '\uE6CE', 'Подчёркнутый', 'underline'),
    formatButton('strike', '\uE6CB', 'Зачёркнутый', 'strikeThrough'),
    { sep: true },
    { id: 'color', svg: documentIcon('Цвет текста'), title: 'Цвет текста', passive: true },
    { id: 'background', svg: documentIcon('Цвет выделения'), title: 'Фон текста', passive: true },
    { sep: true },
    { id: 'link', icon: '\uE6A7', title: 'Ссылка', passive: true },
    { id: 'voice', svg: documentIcon('Голосовой ввод'), title: 'Голосовой ввод', passive: true },
    { id: 'assistant', svg: '<img src="assets/menu-ai.svg" width="24" height="24" alt="">', title: 'SabyAI', passive: true },
    { id: 'more', icon: '\uEAB4', title: 'Ещё', onClick: button => menu.toggle(button) }
  ] });
  toolbar.el.classList.add('doc-toolbar');
  toolbar.el.querySelectorAll('button').forEach(button => { button.tabIndex = 0; });

  const menu = createSelectionMenu({ editor, toolbar, selectionRange, restore, execute, remember(range) { savedRange = range; } });

  function update() {
    frame = 0;
    const range = selectionRange();
    const inControls = toolbar.el.contains(document.activeElement);
    if (menu.isOpen()) return;
    if (dragging || dismissed || (!range && !inControls)) {
      toolbar.hide();
      return;
    }
    if (range) {
      savedRange = range;
      const sel = window.getSelection();
      backward = sel.anchorNode === range.endContainer && sel.anchorOffset === range.endOffset;
    }
    if (!savedRange || !savedRange.startContainer.isConnected || !savedRange.endContainer.isConnected) { toolbar.hide(); return; }
    const styles = selectedTextStyles(savedRange);
    if (!styles.size) { toolbar.hide(); return; }
    const labels = { p: 'Основной текст', h1: 'Заголовок 1', h2: 'Заголовок 2', h3: 'Заголовок 3', h4: 'Заголовок 4', h5: 'Заголовок 5', h6: 'Заголовок 6' };
    toolbar.button('style').querySelector('.tb-text').textContent = styles.size > 1 ? 'Не выбрано' : labels[[...styles][0]];
    const rects = [...savedRange.getClientRects()].filter(rect => rect.width && rect.height);
    const edge = backward ? rects.at(-1) : rects[0];
    const ceiling = Math.max(8, appBar.getBoundingClientRect().bottom + 8);
    if (!edge) { toolbar.hide(); return; }
    toolbar.el.hidden = false;
    const w = toolbar.el.offsetWidth, h = toolbar.el.offsetHeight;
    const x = backward ? edge.right : edge.left;
    const viewportBottom = window.innerHeight - h - 8;
    let y = Math.min(edge.top - h - 8, viewportBottom);
    if (backward) {
      const selectionBottom = Math.max(...rects.map(rect => rect.bottom));
      const belowViewport = rects.every(rect => rect.top >= window.innerHeight);
      y = belowViewport ? viewportBottom : selectionBottom + 8;
    }
    toolbar.showAt(Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8)), Math.max(ceiling, y));
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  document.addEventListener('selectionchange', () => {
    const range = selectionRange();
    // Восстановление того же диапазона после Escape не открывает тулбар снова.
    if (!range || !savedRange || range.compareBoundaryPoints(Range.START_TO_START, savedRange) !== 0 || range.compareBoundaryPoints(Range.END_TO_END, savedRange) !== 0) dismissed = false;
    schedule();
  });
  editor.addEventListener('pointerdown', e => { if (e.button === 0) { dragging = true; dismissed = false; schedule(); } });
  document.addEventListener('pointerup', () => { dragging = false; schedule(); });
  document.addEventListener('pointercancel', () => { dragging = false; schedule(); });
  document.addEventListener('pointerdown', e => {
    if (!editor.contains(e.target) && !toolbar.el.contains(e.target)) {
      dismissed = true;
      schedule();
    }
  });
  document.addEventListener('focusin', schedule);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !toolbar.el.hidden) {
      restore();
      dismissed = true;
      schedule();
    }
  });
  editor.addEventListener('input', schedule);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
})();
