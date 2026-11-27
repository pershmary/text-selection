'use strict';

function createSelectionMenu({ editor, toolbar, selectionRange, restore, execute, remember }) {
  const menu = document.createElement('div');
  const panel = document.createElement('div');
  const trigger = toolbar.button('more');
  let range;
  let current;
  for (const box of [menu, panel]) {
    box.className = 'selection-menu';
    box.hidden = true;
    box.setAttribute('role', 'group');
    box.addEventListener('mousedown', event => {
      if (event.target.closest('button')) event.preventDefault();
    });
    document.body.append(box);
  }
  menu.tabIndex = -1;
  menu.setAttribute('aria-label', 'Команды выделения');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');

  let discardPreview;
  function showFormattingSelection(selection) {
    editor.dispatchEvent(new CustomEvent("formatting-selection", {detail: selection}));
  }
  function cancelPreview() {
    discardPreview?.();
    discardPreview = null;
    showFormattingSelection(null);
  }
  function close() {
    cancelPreview();
    menu.hidden = panel.hidden = true;
    closer.style.visibility = "";
    current = null;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function position(box, x, y) {
    box.hidden = false;
    box.style.left = Math.max(6, Math.min(x, innerWidth - box.offsetWidth - 16)) + 'px';
    const verticalInset = box === menu ? 0 : 6;
    box.style.top = Math.max(verticalInset, Math.min(y, innerHeight - box.offsetHeight - verticalInset)) + 'px';
  }

  function open(source, x, y, button) {
    range = source.cloneRange();
    remember(range);
    close();
    if (button) {
      menu.hidden = false;
      const icon = menu.querySelector("i").getBoundingClientRect();
      const offset = icon.left + icon.width / 2 - menu.getBoundingClientRect().left;
      const anchor = button.getBoundingClientRect();
      x = anchor.left + anchor.width / 2 - offset;
      y = toolbar.el.getBoundingClientRect().bottom + 4;
    }
    position(menu, x, y);
    trigger.setAttribute('aria-expanded', 'true');
    menu.focus({preventScroll: true});
  }

  function blocks() {
    let parent = range.commonAncestorContainer;
    if (parent.nodeType === Node.TEXT_NODE) parent = parent.parentElement;
    const group = parent.closest('ol, ul, .doc-column, .doc-callout > div, .doc') || editor;
    return [...group.children].filter(el => el.getClientRects().length && range.intersectsNode(el));
  }

  function blank() {
    const p = document.createElement('p');
    p.append(document.createElement('br'));
    return p;
  }

  function insertAt(side) {
    const items = blocks();
    if (!items.length) return;
    const empty = blank();
    if (side === 'Сверху') items[0].before(empty);
    else if (side === 'Снизу') items.at(-1).after(empty);
    else {
      const columns = document.createElement('div');
      columns.className = 'doc-columns';
      const content = document.createElement('section');
      content.className = 'doc-column';
      const extra = content.cloneNode();
      extra.append(empty);
      items[0].before(columns);
      columns.append(...(side === 'Слева' ? [extra, content] : [content, extra]));
      content.append(...items);
    }
    window.getSelection().collapse(empty, 0);
  }

  function duplicate() {
    const items = blocks();
    const copies = items.map(item => {
      const copy = item.cloneNode(true);
      copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      copy.removeAttribute('id');
      return copy;
    });
    items.at(-1)?.after(...copies);
  }

  async function paste() {
    const insertion = range.cloneRange();
    try {
      const text = await navigator.clipboard.readText();
      if (!editor.contains(insertion.endContainer)) return;
      insertion.collapse(false);
      editor.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(insertion);
      DocumentHistory.change(() => document.execCommand('insertText', false, text));
    } catch {
      insertion.collapse(false);
      remember(insertion);
      restore();
      window.alert('Для вставки нажмите Ctrl+V или ⌘V.');
    }
  }

  function run(action) {
    close();
    if (restore()) DocumentHistory.change(action);
  }

  function option(label, action, glyph) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (glyph) {
      const icon = document.createElement('i');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = String.fromCodePoint(glyph);
      button.prepend(icon);
    }
    if (action) button.onclick = () => run(action);
    panel.append(button);
    return button;
  }

  function selectedParagraphs() {
    return [...editor.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li')].filter(el => range.intersectsNode(el));
  }

  function textStyle(el) {
    return el.dataset.textStyle || (el.matches('li') ? 'p' : el.localName);
  }

  function styles() {
    panel.classList.add('style-options');
    const paragraphs = selectedParagraphs();
    const keys = new Set(paragraphs.map(textStyle));
    const choices = ['h1','h2','h3','h4','h5','p','large','additional','custom'];
    const names = ['Основной текст','Крупный текст','Дополнительный текст','Свой стиль'];
    choices.forEach((key, i) => {
      const button = option(i < 5 ? 'Заголовок ' + (i+1) : names[i-5], () => {
        const selection = getSelection();
        let {anchorNode, anchorOffset, focusNode, focusOffset} = selection;
        const tag = i < 5 ? key : 'p';
        for (const widget of paragraphs) {
          if (widget.closest('.table-widget')) continue;
          const {color, fontFamily} = getComputedStyle(widget);
          let block = widget;
          if (widget.localName === 'li') {
            if (widget.querySelector(':scope > :is(p,h1,h2,h3,h4,h5,h6)')) continue;
            if (tag !== 'p' || i >= 6) {
              block = document.createElement(tag);
              const nestedList = widget.querySelector(':scope > :is(ul,ol)');
              while (widget.firstChild && widget.firstChild !== nestedList) block.append(widget.firstChild);
              widget.prepend(block);
              if (anchorNode === widget) { anchorNode = block; anchorOffset = Math.min(anchorOffset, block.childNodes.length); }
              if (focusNode === widget) { focusNode = block; focusOffset = Math.min(focusOffset, block.childNodes.length); }
            }
          } else if (widget.localName !== tag) {
            block = document.createElement(tag);
            for (const {name, value} of widget.attributes) block.setAttribute(name, value);
            block.append(...widget.childNodes);
            widget.replaceWith(block);
            if (anchorNode === widget) anchorNode = block;
            if (focusNode === widget) focusNode = block;
          }
          if (i >= 6) block.dataset.textStyle = key;
          else delete block.dataset.textStyle;
          block.style.color = color;
          block.style.fontFamily = fontFamily;
        }
        selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
      });
      button.dataset.textStyle = key;
      button.setAttribute('aria-pressed', String(keys.size === 1 && keys.has(key)));
    });
  }

  function alignment() {
    panel.classList.add('align-options');
    const commands = ['justifyLeft','justifyCenter','justifyRight','justifyFull'];
    ['По левому краю','По центру','По правому краю','По ширине'].forEach((name,i) => {
      const button = option(name, () => execute(commands[i]), [0xe6c0,0xe6bf,0xe6c1,0xe6c2][i]);
      const values = selectedParagraphs().map(el => getComputedStyle(el).textAlign.replace('start','left'));
      button.setAttribute('aria-pressed',String(values.length > 0 && values.every(v => v === ['left','center','right','justify'][i])));
    });
  }

  function insertion() {
    panel.classList.add('insert-options');
    ['Слева','Сверху','Справа','Снизу'].forEach((side,i) =>
      option(side, () => insertAt(side), [0xeb19,0xeb17,0xeb1a,0xeb18][i]));
  }

  function formatting() {
    panel.className = 'selection-settings twin twin--style';
    panel.tabIndex = -1;
    const main = TableWindows.textStyle(toolbar).querySelector('.twin-style-main').cloneNode(true);
    panel.append(main);
    const body = main.querySelector('.twin-body');
    function asset(name) {
      const image = document.createElement('img');
      image.src = 'assets/format-' + name + '.svg';
      image.alt = '';
      return image;
    }
    main.querySelector('.twin-back').replaceChildren(asset('back'));
    main.querySelector('.twin-close').replaceChildren(asset('close'));
    const commands = ['bold','italic','underline','strikeThrough'];
    const styles = new Set(selectedParagraphs().map(textStyle));
    const style = styles.values().next().value;
    const styleNames = { p: 'Основной текст', large: 'Крупный текст', additional: 'Дополнительный текст', custom: 'Свой стиль' };
    main.querySelector('.twin-title').textContent = styles.size === 1
      ? (styleNames[style] || 'Заголовок ' + style.slice(1))
      : 'Не выбрано';
    showFormattingSelection(range);
    const saved = [range.startContainer, range.startOffset, range.endContainer, range.endOffset];
    const runs = [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.length || !range.intersectsNode(node) || !node.parentElement.getClientRects().length) continue;
      const start = node === saved[0] ? saved[1] : 0;
      const end = node === saved[2] ? saved[3] : node.length;
      if (end > start) runs.push(node.parentElement);
    }
    const css = runs.map(el => getComputedStyle(el));
    const common = (values, fallback) => values.length && values.every(v => v === values[0]) ? values[0] : fallback;
    const family = common(css.map(s => s.fontFamily.split(',')[0].replace(/["']/g,'').trim()), 'Не выбрано');
    const pointSize = common(css.map(s => parseFloat(s.fontSize)), '');
    const changes = new Map();
    let rollback;
    function rewind() {
      rollback?.();
      rollback = null;
      range.setStart(saved[0], saved[1]);
      range.setEnd(saved[2], saved[3]);
      remember(range);
    }
    discardPreview = rewind;
    function setBold(value) {
      const selection = getSelection();
      const selected = selection.getRangeAt(0);
      const live = selected.cloneRange();
      const walker = document.createNodeIterator(selected.commonAncestorContainer, NodeFilter.SHOW_TEXT);
      const fragments = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.parentElement.isContentEditable || !selected.intersectsNode(node)) continue;
        const start = node === selected.startContainer ? selected.startOffset : 0;
        const end = node === selected.endContainer ? selected.endOffset : node.length;
        if (end > start) fragments.push({node,start,end});
      }
      for (const {node,start,end} of fragments) {
        const isBold = Number(getComputedStyle(node.parentElement).fontWeight) >= 600;
        if (isBold === value) continue;
        const fragment = document.createRange();
        fragment.setStart(node,start);
        fragment.setEnd(node,end);
        const span = document.createElement('span');
        span.style.fontWeight = value ? 'bold' : 'normal';
        const startsSelection = live.startContainer === node;
        const endsSelection = live.endContainer === node;
        fragment.surroundContents(span);
        if (startsSelection) live.setStart(span.firstChild,0);
        if (endsSelection) live.setEnd(span.firstChild,span.firstChild.length);
      }
      selection.removeAllRanges();
      selection.addRange(live);
    }
    function apply() {
      restore();
      for (const [command,value] of changes) {
        if (command === 'bold') setBold(value);
        else if (command === 'size') {
          document.execCommand('fontSize', false, '7');
          editor.querySelectorAll('font[size="7"]').forEach(font => {
            if (getSelection().getRangeAt(0).intersectsNode(font)) {
              font.removeAttribute('size');
              font.style.fontSize = value + 'px';
            }
          });
        } else document.execCommand(command,false,value);
      }
    }
    const reset = main.querySelector('.twin-reset');
    function preview(command,value,initial) {
      rewind();
      if (value === initial) changes.delete(command);
      else changes.set(command,value);
      if (changes.size) rollback = DocumentHistory.preview(apply);
      showFormattingSelection(changes.size ? getSelection().getRangeAt(0) : range);
      reset.disabled = !changes.size;
    }
    function decorated(el, name) {
      for (; el && el !== editor; el = el.parentElement) {
        if (getComputedStyle(el).textDecorationLine.includes(name)) return true;
      }
      return false;
    }
    const active = [css.every(s => Number(s.fontWeight) >= 600),css.every(s => s.fontStyle === 'italic'),
      runs.every(el => decorated(el,'underline')),runs.every(el => decorated(el,'line-through'))];
    const initialBold = common(css.map(s => Number(s.fontWeight) >= 600), null);
    main.querySelectorAll('.twin-fmt button').forEach((button,i) => {
      button.setAttribute('aria-pressed',active[i]);
      button.onclick = () => {
        const pressed = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed',pressed);
        preview(commands[i],pressed,commands[i] === "bold" ? initialBold : active[i]);
      };
    });
    const fontField = main.querySelector('.twin-font');
    fontField.firstChild.nodeValue = family;
    const fonts = document.createElement('div');
    fonts.className = 'font-options';
    fonts.hidden = true;
    main.append(fonts);
    for (const name of ['Inter','Oswald','Roboto','Montserrat','Open Sans','PT Sans','EB Garamond','Courier New']) {
      const button = document.createElement('button');
      button.textContent = name;
      button.style.fontFamily = '"' + name + '"';
      fonts.append(button);
      button.onclick = () => {
        fontField.firstChild.nodeValue = name;
        fonts.hidden = true;
        preview('fontName',name,family);
      };
    }
    fontField.tabIndex = 0;
    fontField.setAttribute('role','button');
    fontField.onclick = () => {
      fonts.hidden = !fonts.hidden;
      for (const button of fonts.children) button.setAttribute('aria-pressed',button.textContent === fontField.firstChild.nodeValue);
    };
    fontField.onkeydown = e => { if (['Enter',' '].includes(e.key)) { e.preventDefault(); fontField.click(); } };
    const size = document.createElement('input');
    size.type = 'number';
    size.className = 'twin-field twin-size';
    size.setAttribute('aria-label','Размер шрифта');
    size.value = pointSize;
    main.querySelector('.twin-size').replaceWith(size);
    size.onchange = () => { if (size.valueAsNumber > 0) preview('size',size.valueAsNumber,pointSize); };    const align = document.createElement('button');
    align.className = 'twin-btn twin-sq twin-ico24';
    const firstAlign = css[0]?.textAlign;
    align.textContent = String.fromCodePoint(({center:0xe6bf,right:0xe6c1,justify:0xe6c2})[firstAlign] || 0xe6c0);
    if (!firstAlign || ['left','start'].includes(firstAlign)) align.replaceChildren(asset('align'));
    align.setAttribute('aria-label','Выравнивание');
    main.querySelector('.twin-colors').before(align, main.querySelector('.twin-vdiv').cloneNode());
    for (const [i, button] of [...main.querySelectorAll('.twin-colors button')].entries()) {
      if (i) button.replaceChildren(toolbar.button('background').querySelector('svg').cloneNode(true));
      button.disabled = true;
      const rgb = common(runs.map(el => {
        if (!i) return getComputedStyle(el).color;
        for (;el && el !== editor;el = el.parentElement) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)') return bg;
        }
        return 'none';
      }), i ? 'none' : 'rgb(255, 255, 255)');
      if (i) button.querySelector('rect').setAttribute('fill', rgb);
      else button.firstElementChild.style.backgroundColor = rgb;
    }
    body.insertAdjacentHTML('beforeend', `
      <section class="twin-panel metrics">
        <div><label>Высота строки</label><span class="metric-field"><b></b><small>em</small></span></div>
        <div><label>Интервал</label><span class="metric-field"><b></b><small>px</small></span></div>
        <div><label>Отступы</label><span class="metric-field offset-x"><i aria-hidden="true"></i><b></b></span>
          <span class="metric-field offset-y"><i aria-hidden="true"></i><b></b></span><i class="offset-mode" aria-hidden="true">&#xebce;</i></div>
      </section>
      <section class="twin-panel border-setting">Границы <span></span></section>`);
    const paragraphs = selectedParagraphs();
    const blockStyles = paragraphs.map(el => getComputedStyle(el));
    const metric = (key, fallback = '') => common(blockStyles.map(s => s[key]), fallback);
    const fields = main.querySelectorAll('.metric-field b');
    const widgetTypes = new Set(paragraphs.map(el => el.dataset.textStyle || el.localName));
    const hasOtherWidgets = blocks().some(el => el.matches('figure, .table-widget, .doc-callout, .doc-columns'));
    const mixedWidgets = widgetTypes.size > 1 || (widgetTypes.size > 0 && hasOtherWidgets);
    fields[0].textContent = !mixedWidgets && metric('lineHeight') ? 'auto' : '';
    fields[1].textContent = metric('marginBottom').replace('px','');
    fields[2].textContent = metric('paddingLeft').replace('px','');
    fields[3].textContent = metric('paddingTop').replace('px','');
    const border = metric('borderTop');
    const borderSample = main.querySelector('.border-setting span');
    if (border && !border.includes('none')) borderSample.style.border = border;
    else borderSample.append(asset('no-border'));    reset.onclick = () => {
      rewind();
      panel.replaceChildren();
      formatting();
    };
    main.querySelector('.twin-done').onclick = () => {
      rewind();
      discardPreview = null;
      if (changes.size) DocumentHistory.change(apply);
      close();
    };
    main.querySelector('.twin-close').onclick = () => { cancelPreview(); panel.hidden = true; current = null; updateCloser(); };
  }  const entries = [
    ['Сменить стиль текста','EAC9',styles], ['Настроить оформление','E764',formatting],
    ['Код','EA88'], ['Скрытый текст','E651'], ['Выравнивание','E6C0',alignment],
    ['SabyAI',null], ['Спойлер','EA47'],
    ['Добавить виджет','E6D3',insertion],
    ['Вырезать','E969',null,() => execute('cut')], ['Скопировать','E6FD',null,() => execute('copy')],
    ['Вставить','E9A1',null,paste], ['Дублировать','E669',null,duplicate],
    ['Удалить','EB72',null,() => blocks().forEach(el => el.remove())]
  ];
  for (const [label, glyph, submenu, action] of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    const icon = document.createElement(glyph ? 'i' : 'img');
    if (glyph) icon.textContent = String.fromCodePoint(parseInt(glyph, 16));
    else { icon.src = 'assets/menu-ai.svg'; icon.alt = ''; }
    icon.setAttribute('aria-hidden','true');
    b.append(icon, label);
    menu.append(b);
    if (submenu && submenu !== formatting) b.classList.add('has-submenu');
    if (!submenu && !action) b.setAttribute('aria-disabled','true');
    function reveal() {
      if (current === b && !panel.hidden) return;
      cancelPreview();
      current = b;
      panel.replaceChildren();
      panel.style.maxHeight = '';
      panel.className = 'selection-menu';
      submenu();
      panel.setAttribute('aria-label', label);
      const rect = menu.getBoundingClientRect();
      panel.hidden = false;
      const width = panel.offsetWidth;
      const x = rect.right - 1 + width <= innerWidth - 6 || rect.left < width && innerWidth - rect.right >= rect.left
        ? rect.right - 1 : rect.left - width + 1;
      let y = b.getBoundingClientRect().top;
      if (submenu === styles) y = rect.top;
      else if (submenu !== formatting) y -= panel.firstElementChild.getBoundingClientRect().top - panel.getBoundingClientRect().top;
      if (submenu !== formatting) panel.style.maxHeight = Math.max(32, innerHeight - y - 6) + "px";
      position(panel, x, y);
      updateCloser();
    }
    b.onpointerenter = () => {
      if (!panel.hidden && panel.classList.contains("selection-settings")) return;
      if (submenu && submenu !== formatting) reveal();
      else if (current !== b) { cancelPreview(); panel.hidden = true; current = null; updateCloser(); }
    };
    b.onclick = () => {
      if (submenu) {
        reveal();
        const focusTarget = submenu === formatting ? panel : panel.querySelector('button');
        focusTarget?.focus({preventScroll:true});
      }
      else if (action) run(action);
    };
  }
  const closer = document.createElement('button');
  closer.className = 'menu-close';

  closer.setAttribute('aria-label','Закрыть');
  closer.onclick = () => { close(); restore(); };
  menu.append(closer);

  function updateCloser() {
    const a = closer.getBoundingClientRect();
    const b = panel.getBoundingClientRect();
    const overlaps = !panel.hidden && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    closer.style.visibility = overlaps ? "hidden" : "";
  }

  function hit(event, selection) {
    return selection && [...selection.getClientRects()].some(r => event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom);
  }
  editor.addEventListener('mousedown', event => {
    if (event.button === 2 && hit(event, selectionRange())) event.preventDefault();
  }, true);
  editor.addEventListener('contextmenu', event => {
    const selection = selectionRange();
    if (!hit(event, selection)) return;
    event.preventDefault();
    event.stopPropagation();
    toolbar.hide();
    open(selection, event.clientX, event.clientY);
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!menu.contains(event.target) && !panel.contains(event.target) && !trigger.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) {
      event.stopImmediatePropagation();
      close();
      restore();
    }
  });
  window.addEventListener('resize', close);
  return { isOpen: () => !menu.hidden, toggle(button) {
    if (!menu.hidden) { close(); restore(); return; }
    const selection = selectionRange();
    if (!selection) return;
    open(selection, 0, 0, button);
  }};
}
