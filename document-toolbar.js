'use strict';

// Плавающий тулбар документа, Figma 2243:184539. Не использует команды таблицы.
(() => {
  const editor = document.querySelector('.doc');
  const appBar = document.querySelector('.app-toolbar');
  let savedRange = null, backward = false, dragging = false, frame = 0;
  let dismissed = false;
  const documentIcon = label => document.querySelector('.app-toolbar [aria-label="' + label + '"] svg').outerHTML;

  function selectionRange() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
    // Редактирование ячеек и их тулбары остаются внутри компонента таблицы.
    const element = node => node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element(range.startContainer).closest('.table-widget') || element(range.endContainer).closest('.table-widget')) return null;
    return range.cloneRange();
  }

  function selectedWidgets(range) {
    const widgets = [];
    const candidates = [...editor.children].flatMap(widget => {
      if (!widget.matches('ol, ul')) return [widget];
      const walker = document.createTreeWalker(widget, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) if (walker.currentNode.textContent.trim()) texts.push(walker.currentNode);
      if (!texts.length) return [widget];
      const content = document.createRange();
      content.setStart(texts[0], 0);
      content.setEnd(texts.at(-1), texts.at(-1).length);
      const wholeList = range.compareBoundaryPoints(Range.START_TO_START, content) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, content) >= 0;
      return wholeList ? [widget] : [...widget.children].filter(child => child.matches('li'));
    });
    // Отдельные пункты — самостоятельные виджеты; целиком выбранный список
    // остаётся одним блоком. Вложенные начертания не меняют число виджетов.
    for (const widget of candidates) {
      if (!range.intersectsNode(widget)) continue;
      const content = document.createRange();
      const atomic = widget.matches('[contenteditable="false"]');
      if (atomic) content.selectNode(widget);
      else content.selectNodeContents(widget);
      // Учитываем фактическое пересечение, даже если крайний виджет выделен
      // частично. Граница в начале следующего блока не считается выделением.
      if (range.compareBoundaryPoints(Range.START_TO_START, content) > 0) content.setStart(range.startContainer, range.startOffset);
      if (range.compareBoundaryPoints(Range.END_TO_END, content) < 0) content.setEnd(range.endContainer, range.endOffset);
      if (!content.collapsed && (atomic || content.toString().trim())) widgets.push(widget);
    }
    return widgets;
  }

  function widgetKind(widget) {
    if (widget.matches('.doc-title')) return 'title';
    if (widget.matches('.doc-image-placeholder')) return 'image';
    if (widget.matches('.doc-callout')) return 'callout';
    if (widget.matches('ol, ul, li')) return 'list';
    if (widget.matches('.doc-columns')) return 'columns';
    if (widget.matches('.table-widget')) return 'table';
    return widget.tagName.toLowerCase();
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
    document.execCommand(command, false, value);
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
    { id: 'assistant', svg: documentIcon('Помощник'), title: 'SabyAI', passive: true },
    { sep: true },
    // Только визуальная команда: поведение объединения блоков пока не задано.
    { id: 'merge', icon: '\uEBD1', title: 'Объединить', passive: true },
    { id: 'delete', icon: '\uEB72', title: 'Удалить', danger: true, passive: true },
    { id: 'more', icon: '\uEAB4', title: 'Ещё', passive: true }
  ] });
  toolbar.el.classList.add('doc-toolbar');
  toolbar.el.querySelectorAll('button').forEach(button => { button.tabIndex = 0; });
  const actionsSeparator = toolbar.button('merge').previousElementSibling;

  function update() {
    frame = 0;
    const range = selectionRange();
    const inControls = toolbar.el.contains(document.activeElement);
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
    const widgets = selectedWidgets(savedRange);
    const kinds = new Set(widgets.map(widgetKind));
    if (!widgets.length || (widgets.length === 1 && kinds.has('image'))) { toolbar.hide(); return; }
    const labels = { p: 'Основной текст', h1: 'Заголовок 1', h2: 'Заголовок 2', h3: 'Заголовок 3', h4: 'Заголовок 4', h5: 'Заголовок 5', title: 'Заголовок документа', image: 'Изображение', callout: 'Инфоблок', list: 'Список', columns: 'Колонки', table: 'Таблица' };
    toolbar.button('style').querySelector('.tb-text').textContent = kinds.size > 1 ? 'Смешанный' : labels[[...kinds][0]] || 'Основной текст';
    const multipleWidgets = widgets.length > 1;
    toolbar.el.setAttribute('aria-label', multipleWidgets ? 'Форматирование + объединение' : 'Форматирование');
    toolbar.button('assistant').hidden = multipleWidgets;
    toolbar.button('merge').hidden = !multipleWidgets;
    toolbar.button('delete').hidden = !multipleWidgets;
    actionsSeparator.hidden = !multipleWidgets;
    const rects = [...savedRange.getClientRects()].filter(rect => rect.width && rect.height);
    const edge = backward ? rects.at(-1) : rects[0];
    const ceiling = Math.max(8, appBar.getBoundingClientRect().bottom + 8);
    if (!edge || edge.bottom <= ceiling || edge.top >= window.innerHeight) { toolbar.hide(); return; }
    toolbar.el.hidden = false;
    const w = toolbar.el.offsetWidth, h = toolbar.el.offsetHeight;
    const x = backward ? edge.right : edge.left;
    toolbar.showAt(Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8)), Math.max(ceiling, edge.top - h - 8));
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
