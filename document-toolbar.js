'use strict';

(() => {
  const editor = document.querySelector('.doc');
  let savedRange = null;
  let blocks = [];
  let dragging = false;
  let frame = 0;
  let popup = null;
  let dismissed = false;
  const labels = { p: 'Основной текст', h1: 'Заголовок 1', h2: 'Заголовок 2', h3: 'Заголовок 3', h4: 'Заголовок 4', h5: 'Заголовок 5', title: 'Заголовок документа', image: 'Изображение', callout: 'Инфоблок', list: 'Список', columns: 'Колонки', table: 'Таблица' };
  const icon = label => document.querySelector(`.app-toolbar [aria-label="${label}"] svg`)?.outerHTML || '';
  function restore() {
    if (!savedRange?.startContainer.isConnected) return false;
    editor.focus({ preventScroll: true });
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  }
  function closePopup() { popup?.remove(); popup = null; }
  function command(name, value) {
    if (!restore()) return;
    document.execCommand(name, false, value);
    const selection = getSelection();
    if (selection.rangeCount) savedRange = selection.getRangeAt(0).cloneRange();
    closePopup();
    schedule();
  }
  function openPopup(label, build) {
    if (popup?.getAttribute('aria-label') === label) { closePopup(); return; }
    closePopup();
    popup = document.createElement('div');
    popup.className = 'document-format-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', label);
    popup.addEventListener('mousedown', e => { if (!e.target.closest('input, select')) e.preventDefault(); });
    build(popup);
    document.body.append(popup);
    const rect = toolbar.el.getBoundingClientRect();
    popup.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - popup.offsetWidth - 8))}px`;
    popup.style.top = `${Math.max(8, Math.min(rect.bottom + 4, innerHeight - popup.offsetHeight - 8))}px`;
  }
  function styles() {
    openPopup('Стиль текста', host => {
      for (const tag of ['p', 'h1', 'h2', 'h3', 'h4', 'h5']) {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = labels[tag];
        button.onclick = () => command('formatBlock', tag);
        host.append(button);
      }
    });
  }
  function color(title, name) {
    openPopup(title, host => {
      const label = document.createElement('label'); label.textContent = title + ' ';
      const input = document.createElement('input'); input.type = 'color'; input.setAttribute('aria-label', title);
      input.onchange = () => command(name, input.value);
      label.append(input); host.append(label);
    });
  }
  function link() {
    openPopup('Ссылка', host => {
      const input = document.createElement('input'); input.type = 'url'; input.placeholder = 'https://'; input.setAttribute('aria-label', 'Адрес ссылки');
      const apply = document.createElement('button'); apply.type = 'button'; apply.textContent = 'Применить';
      apply.onclick = () => { if (/^(https?:\/\/|mailto:|tel:)/i.test(input.value.trim())) command('createLink', input.value.trim()); };
      input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); apply.click(); } };
      host.append(input, apply);
    });
  }
  function canMerge() {
    return blocks.length > 1 && blocks.every(block => block.classList.contains('is-fully-selected') && block.matches('p, h1, h2, h3, h4, h5'));
  }
  function merge() {
    if (!canMerge()) return;
    // Merge complete text widgets through the browser editing history.
    const text = blocks.map(block => block.innerText.trim()).join(' ');
    const first = document.createTreeWalker(blocks[0], NodeFilter.SHOW_TEXT).nextNode();
    const walker = document.createTreeWalker(blocks.at(-1), NodeFilter.SHOW_TEXT);
    let last;
    while (walker.nextNode()) last = walker.currentNode;
    if (!first || !last) return;
    const range = document.createRange(); range.setStart(first, 0); range.setEnd(last, last.length); savedRange = range;
    // Text boundaries protect the next, unselected block. Keep the first block's style.
    command('insertText', text);
  }
  const format = (id, glyph, label, name) => ({ id, icon: glyph, title: label, toggle: true, isPressed: () => document.queryCommandState(name), onClick: () => command(name) });
  const toolbar = Toolbar.create({ container: document.body, label: 'Форматирование', items: [
    { id: 'style', text: 'Основной текст', title: 'Стиль текста', arrow: true, onClick: styles },
    { sep: true },
    { id: 'format', icon: '\uE764', title: 'Настроить текст', onClick: styles },
    { sep: true },
    format('bold', '\uE6C3', 'Жирный', 'bold'), format('italic', '\uE6C6', 'Курсив', 'italic'),
    format('underline', '\uE6CE', 'Подчёркнутый', 'underline'), format('strike', '\uE6CB', 'Зачёркнутый', 'strikeThrough'),
    { sep: true },
    { id: 'color', svg: icon('Цвет текста'), title: 'Цвет текста', onClick: () => color('Цвет текста', 'foreColor') },
    { id: 'background', svg: icon('Цвет выделения'), title: 'Фон текста', onClick: () => color('Фон текста', 'hiliteColor') },
    { sep: true },
    { id: 'link', icon: '\uE6A7', title: 'Ссылка', onClick: link },
    { id: 'voice', svg: icon('Голосовой ввод'), title: 'Голосовой ввод', onClick: () => document.querySelector('.app-toolbar [aria-label="Голосовой ввод"]').click() },
    { id: 'assistant', svg: icon('Помощник'), title: 'SabyAI', onClick: () => document.querySelector('.app-toolbar [aria-label="Помощник"]')?.click() },
    { id: 'more', icon: '\uEAB4', title: 'Ещё', onClick: () => openPopup('Ещё', host => {
      for (const [title, name] of [['Сбросить форматирование', 'removeFormat'], ['Удалить ссылку', 'unlink']]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = title; button.onclick = () => command(name); host.append(button);
      }
    }) },
    { id: 'merge', text: 'Объединить', title: 'Объединить', onClick: merge }
  ] });
  toolbar.el.classList.add('tb--text', 'document-selection-toolbar');
  function kind(block) {
    if (block.matches('.doc-title')) return 'title';
    if (block.matches('.doc-image-placeholder')) return 'image';
    if (block.matches('.doc-callout')) return 'callout';
    if (block.matches('ol, ul')) return 'list';
    if (block.matches('.doc-columns')) return 'columns';
    if (block.matches('.table-widget')) return 'table';
    return block.tagName.toLowerCase();
  }
  function update() {
    frame = 0;
    if (popup?.contains(document.activeElement)) return;
    const selection = getSelection();
    const range = selection.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    if (dismissed || dragging || !range || !editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
      toolbar.hide(); closePopup(); return;
    }
    const startElement = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const endElement = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
    // The table component owns both its formatting toolbar and cell-range toolbar.
    if (startElement.closest('.table-widget') || endElement.closest('.table-widget')) { toolbar.hide(); closePopup(); return; }
    blocks = [...editor.children].filter(block => !block.hidden && block.matches('p, h1, h2, h3, h4, h5, ol, ul, .doc-callout, .doc-image-placeholder, .doc-columns, .table-widget') && range.intersectsNode(block));
    if (!blocks.length || (blocks.length === 1 && kind(blocks[0]) === 'image')) { toolbar.hide(); return; }
    savedRange = range.cloneRange();
    const kinds = new Set(blocks.map(kind));
    // Multiple list items or columns also represent a group of containers.
    const containers = blocks.length === 1 ? [...blocks[0].querySelectorAll(':scope > li, :scope > .doc-column')].filter(el => range.intersectsNode(el)).length : 0;
    const extended = kinds.size > 1 || (blocks.length > 1 && [...kinds].some(k => ['list', 'callout', 'image', 'columns', 'table'].includes(k))) || containers > 1;
    toolbar.el.setAttribute('aria-label', extended ? 'Форматирование + объединение' : 'Форматирование');
    toolbar.button('style').querySelector('.tb-text').textContent = kinds.size > 1 ? 'Смешанный' : labels[[...kinds][0]] || 'Основной текст';
    toolbar.button('merge').hidden = !extended;
    toolbar.button('merge').disabled = !canMerge();
    toolbar.button('merge').title = canMerge() ? 'Объединить выбранные текстовые блоки' : 'Для объединения выделите текстовые блоки целиком';
    toolbar.refresh();
    const rects = [...range.getClientRects()].filter(r => r.width && r.height);
    const backward = selection.anchorNode === range.endContainer && selection.anchorOffset === range.endOffset;
    const anchor = backward ? rects.at(-1) : rects[0];
    const ceiling = document.querySelector('.app-toolbar').getBoundingClientRect().bottom;
    if (!anchor || anchor.bottom <= ceiling || anchor.top >= innerHeight) { toolbar.hide(); return; }
    toolbar.el.hidden = false;
    const width = toolbar.el.offsetWidth, height = toolbar.el.offsetHeight;
    const x = backward ? anchor.right : anchor.left;
    toolbar.showAt(Math.max(8, Math.min(x - width / 2, document.documentElement.clientWidth - width - 8)), Math.max(ceiling + 4, anchor.top - height - 8));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  document.addEventListener('selectionchange', () => { dismissed = false; schedule(); });
  editor.addEventListener('pointerdown', () => { dragging = true; dismissed = false; toolbar.hide(); closePopup(); });
  document.addEventListener('pointerup', () => { dragging = false; schedule(); });
  document.addEventListener('pointercancel', () => { dragging = false; schedule(); });
  document.addEventListener('pointerdown', e => { if (!editor.contains(e.target) && !toolbar.el.contains(e.target) && !popup?.contains(e.target)) { dismissed = true; toolbar.hide(); closePopup(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dismissed = true; toolbar.hide(); closePopup(); } });
  editor.addEventListener('input', schedule);
  window.addEventListener('scroll', () => { closePopup(); schedule(); }, true);
  window.addEventListener('resize', () => { closePopup(); schedule(); });
})();
