'use strict';

// Плавающий тулбар документа, Figma 2243:184539. Не использует команды таблицы.
(() => {
  const editor = document.querySelector('.doc');
  const appBar = document.querySelector('.app-toolbar');
  let savedRange = null, backward = false, dragging = false, frame = 0;
  let popup = null, popupId = null, dismissed = false;
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
    // Виджет — непосредственный блок документа, как и при полной подсветке
    // в selection.js. Вложенное форматирование не создаёт новые виджеты.
    for (const widget of editor.children) {
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
    if (widget.matches('ol, ul')) return 'list';
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

  function closePopup() {
    if (!popup) return;
    popup.remove();
    const button = toolbar.button(popupId);
    if (button) button.setAttribute('aria-pressed', 'false');
    popup = null;
    popupId = null;
  }

  function execute(command, value) {
    if (!restore()) return;
    document.execCommand(command, false, value);
    savedRange = selectionRange();
    closePopup();
    schedule();
  }

  function placePopup() {
    if (!popup) return;
    const button = toolbar.button(popupId).getBoundingClientRect();
    const bar = toolbar.el.getBoundingClientRect();
    popup.style.left = Math.max(8, Math.min(button.left, window.innerWidth - popup.offsetWidth - 8)) + 'px';
    popup.style.top = Math.max(8, Math.min(bar.bottom + 4, window.innerHeight - popup.offsetHeight - 8)) + 'px';
  }

  function openPopup(id, title, build) {
    const same = popupId === id;
    closePopup();
    if (same) return;
    popupId = id;
    popup = document.createElement('div');
    popup.className = 'twin twin--text doc-toolbar-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', title);
    popup.addEventListener('mousedown', e => { if (!e.target.closest('input, select')) e.preventDefault(); });
    build(popup);
    document.body.appendChild(popup);
    toolbar.button(id).setAttribute('aria-pressed', 'true');
    placePopup();
    const input = popup.querySelector('input');
    if (input) input.focus({ preventScroll: true });
  }

  function menuItem(win, title, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'twin-menu-item';
    button.textContent = title;
    button.addEventListener('click', action);
    win.appendChild(button);
  }

  function styles(id) {
    openPopup(id, 'Стиль текста', win => {
      [['Основной текст', 'p'], ['Заголовок 1', 'h1'], ['Заголовок 2', 'h2'], ['Заголовок 3', 'h3'], ['Заголовок 4', 'h4'], ['Заголовок 5', 'h5']].forEach(([title, tag]) => {
        menuItem(win, title, () => execute('formatBlock', tag));
      });
    });
  }

  function color(id, title, command, initial) {
    openPopup(id, title, win => {
      const label = document.createElement('label');
      label.textContent = title + ' ';
      const input = document.createElement('input');
      input.type = 'color';
      input.value = initial;
      input.setAttribute('aria-label', title);
      input.addEventListener('change', () => execute(command, input.value));
      label.appendChild(input);
      win.appendChild(label);
    });
  }

  function link() {
    openPopup('link', 'Ссылка', win => {
      const form = document.createElement('form');
      const label = document.createElement('label');
      label.textContent = 'Ссылка ';
      const input = document.createElement('input');
      input.type = 'url';
      input.required = true;
      input.placeholder = 'https://';
      input.setAttribute('aria-label', 'Адрес ссылки');
      label.appendChild(input);
      const apply = document.createElement('button');
      apply.type = 'submit';
      apply.className = 'twin-btn';
      apply.textContent = 'Применить';
      form.append(label, apply);
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (/^(https?:\/\/|mailto:|tel:)/i.test(input.value.trim())) execute('createLink', input.value.trim());
      });
      win.appendChild(form);
    });
  }

  function voice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      openPopup('voice', 'Голосовой ввод', win => { win.textContent = 'Голосовой ввод недоступен в этом браузере.'; });
      return;
    }
    const recognition = new Recognition();
    recognition.lang = document.documentElement.lang || 'ru';
    recognition.addEventListener('result', e => execute('insertText', e.results[0][0].transcript));
    recognition.addEventListener('error', () => {
      openPopup('voice', 'Голосовой ввод', win => { win.textContent = 'Не удалось начать голосовой ввод. Проверьте доступ к микрофону.'; });
    });
    recognition.start();
  }

  function formatButton(id, icon, title, command) {
    return { id, icon, title, toggle: true, isPressed: () => document.queryCommandState(command), onClick: () => execute(command) };
  }

  const toolbar = Toolbar.create({ container: document.body, label: 'Форматирование', items: [
    { id: 'style', text: 'Основной текст', title: 'Стиль текста', arrow: true, onClick: () => styles('style') },
    { sep: true },
    { id: 'format', icon: '\uE764', title: 'Настроить текст', onClick: () => styles('format') },
    { sep: true },
    formatButton('bold', '\uE6C3', 'Жирный', 'bold'),
    formatButton('italic', '\uE6C6', 'Курсив', 'italic'),
    formatButton('underline', '\uE6CE', 'Подчёркнутый', 'underline'),
    formatButton('strike', '\uE6CB', 'Зачёркнутый', 'strikeThrough'),
    { sep: true },
    { id: 'color', svg: documentIcon('Цвет текста'), title: 'Цвет текста', onClick: () => color('color', 'Цвет текста', 'foreColor', '#000000') },
    { id: 'background', svg: documentIcon('Цвет выделения'), title: 'Фон текста', onClick: () => color('background', 'Фон текста', 'hiliteColor', '#ffffff') },
    { sep: true },
    { id: 'link', icon: '\uE6A7', title: 'Ссылка', onClick: link },
    { id: 'voice', svg: documentIcon('Голосовой ввод'), title: 'Голосовой ввод', onClick: voice },
    { id: 'assistant', svg: documentIcon('Помощник'), title: 'SabyAI', onClick: () => document.querySelector('.app-toolbar [aria-label="Помощник"]').click() },
    { sep: true },
    // Только визуальная команда: поведение объединения блоков пока не задано.
    { id: 'merge', icon: '\uEBD1', title: 'Объединить' },
    { id: 'delete', icon: '\uEB72', title: 'Удалить', danger: true, onClick: () => execute('delete') },
    { id: 'more', icon: '\uEAB4', title: 'Ещё', onClick: () => openPopup('more', 'Ещё', win => {
      menuItem(win, 'Сбросить форматирование', () => execute('removeFormat'));
      menuItem(win, 'Удалить ссылку', () => execute('unlink'));
    }) }
  ] });
  toolbar.el.classList.add('doc-toolbar');
  toolbar.el.querySelectorAll('button').forEach(button => { button.tabIndex = 0; });
  const actionsSeparator = toolbar.button('merge').previousElementSibling;

  function update() {
    frame = 0;
    const range = selectionRange();
    const inControls = toolbar.el.contains(document.activeElement) || (popup && popup.contains(document.activeElement));
    if (dragging || dismissed || (!range && !inControls)) {
      toolbar.hide();
      if (!dragging) closePopup();
      return;
    }
    if (range) {
      savedRange = range;
      const sel = window.getSelection();
      backward = sel.anchorNode === range.endContainer && sel.anchorOffset === range.endOffset;
    }
    if (!savedRange || !savedRange.startContainer.isConnected || !savedRange.endContainer.isConnected) { toolbar.hide(); closePopup(); return; }
    const widgets = selectedWidgets(savedRange);
    const kinds = new Set(widgets.map(widgetKind));
    if (!widgets.length || (widgets.length === 1 && kinds.has('image'))) { toolbar.hide(); closePopup(); return; }
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
    if (!edge || edge.bottom <= ceiling || edge.top >= window.innerHeight) { toolbar.hide(); closePopup(); return; }
    toolbar.el.hidden = false;
    const w = toolbar.el.offsetWidth, h = toolbar.el.offsetHeight;
    const x = backward ? edge.right : edge.left;
    toolbar.showAt(Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8)), Math.max(ceiling, edge.top - h - 8));
    placePopup();
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  document.addEventListener('selectionchange', () => {
    const range = selectionRange();
    // Восстановление того же диапазона после Escape не открывает тулбар снова.
    if (!range || !savedRange || range.compareBoundaryPoints(Range.START_TO_START, savedRange) !== 0 || range.compareBoundaryPoints(Range.END_TO_END, savedRange) !== 0) dismissed = false;
    schedule();
  });
  editor.addEventListener('pointerdown', e => { if (e.button === 0) { dragging = true; dismissed = false; closePopup(); schedule(); } });
  document.addEventListener('pointerup', () => { dragging = false; schedule(); });
  document.addEventListener('pointercancel', () => { dragging = false; schedule(); });
  document.addEventListener('pointerdown', e => {
    if (!editor.contains(e.target) && !toolbar.el.contains(e.target) && !(popup && popup.contains(e.target))) {
      dismissed = true;
      closePopup();
      schedule();
    }
  });
  document.addEventListener('focusin', schedule);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (!toolbar.el.hidden || popup)) {
      const hadPopup = !!popup;
      closePopup();
      restore();
      dismissed = !hadPopup;
      schedule();
    }
  });
  editor.addEventListener('input', schedule);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
})();
