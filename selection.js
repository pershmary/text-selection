'use strict';

(() => {
  const editor = document.querySelector('.doc');
  document.querySelector('.doc-title').addEventListener('contextmenu', event => event.preventDefault());
  let pointer = null;
  let dragging = false;
  let dragOrigin = null;
  let dragAnchor = null;
  let finishingDrag = false;
  let frame = 0;
  let formattingRange;

  function expandTableSelection() {
    if ((!dragging && !finishingDrag) || !dragOrigin || dragOrigin.matches('.table-widget')) return;
    const selection = window.getSelection();
    if (!dragAnchor && selection.anchorNode && editor.contains(selection.anchorNode)) {
      const element = selection.anchorNode.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode.parentElement;
      if (!element.closest('.table-widget')) dragAnchor = { node: selection.anchorNode, offset: selection.anchorOffset };
    }
    if (!pointer || !dragAnchor || !dragAnchor.node.isConnected) return;
    const under = document.elementFromPoint(pointer.x, pointer.y);
    const table = under && under.closest('.doc > .table-widget');
    if (!table) return;
    const anchor = document.createRange();
    anchor.setStart(dragAnchor.node, dragAnchor.offset);
    anchor.collapse(true);
    const block = document.createRange();
    block.selectNode(table);
    const forward = anchor.compareBoundaryPoints(Range.START_TO_START, block) < 0;
    const offset = Array.prototype.indexOf.call(editor.childNodes, table) + (forward ? 1 : 0);
    // Фокус ставим за границей всего виджета, сохраняя исходную точку
    // выделения. Курсор внутри таблицы не превращает его в выделение ячеек.
    if (selection.anchorNode !== dragAnchor.node || selection.anchorOffset !== dragAnchor.offset || selection.focusNode !== editor || selection.focusOffset !== offset) {
      selection.setBaseAndExtent(dragAnchor.node, dragAnchor.offset, editor, offset);
    }
  }

  function highlight(block, top, height) {
    block.style.setProperty('--selection-top', `${top}px`);
    block.style.setProperty('--selection-height', `${height}px`);
    block.classList.add('is-fully-selected');
  }

  function update() {
    frame = 0;
    expandTableSelection();
    if (finishingDrag) {
      finishingDrag = false;
      dragOrigin = null;
      dragAnchor = null;
      document.documentElement.classList.remove('doc-selecting');
    }
    editor.querySelectorAll('.table-widget.is-fully-selected').forEach(block => {
      block.classList.remove('is-fully-selected');
      block.style.removeProperty('--selection-top');
      block.style.removeProperty('--selection-height');
    });
    const selection = window.getSelection();
    const range = formattingRange || (selection.rangeCount && selection.getRangeAt(0));
    CSS.highlights?.delete('formatting-selection');
    editor.classList.remove('has-formatting-highlight');
    if (!range || range.collapsed || !editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return;

    const nativeRange = selection.rangeCount ? selection.getRangeAt(0) : null;
    const nativeMatches = nativeRange && !nativeRange.collapsed &&
      range.compareBoundaryPoints(Range.START_TO_START, nativeRange) === 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, nativeRange) === 0;
    const useFormattingHighlight = formattingRange && CSS.highlights &&
      (!nativeMatches || document.activeElement.matches('input, textarea'));
    for (const table of editor.querySelectorAll(':scope > .table-widget')) {
      // Selections that stay inside the table are handled by the table itself.
      if (table.contains(range.startContainer) && table.contains(range.endContainer)) continue;
      if (!range.intersectsNode(table)) continue;
      const bounds = table.querySelector('.tw')?.getBoundingClientRect();
      highlight(table, bounds ? bounds.top - table.getBoundingClientRect().top : 0,
        bounds ? bounds.height : table.clientHeight);
    }
    if (useFormattingHighlight) {
      const fragments = new Highlight();
      const texts = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
      for (let node = texts.nextNode(); node; node = texts.nextNode()) {
        if (node.parentElement.closest('.is-fully-selected') || !range.intersectsNode(node)) continue;
        const start = node === range.startContainer ? range.startOffset : 0;
        const end = node === range.endContainer ? range.endOffset : node.length;
        if (start >= end) continue;
        const fragment = document.createRange();
        fragment.setStart(node, start);
        fragment.setEnd(node, end);
        fragments.add(fragment);
      }
      CSS.highlights.set('formatting-selection', fragments);
      editor.classList.add('has-formatting-highlight');
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  editor.addEventListener('formatting-selection', event => {
    formattingRange = event.detail?.cloneRange();
    if (!formattingRange) CSS.highlights?.delete("formatting-selection");
    schedule();
  });
  document.addEventListener('focusin', schedule);
  editor.addEventListener('paste', event => {
    if (event.defaultPrevented || event.target.closest('.table-widget') || !event.clipboardData?.types.includes('text/plain')) return;
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const widget = element.closest('p,h1,h2,h3,h4,h5,h6,li');
    if (!widget) return;
    event.preventDefault();
    DocumentHistory.change(() => document.execCommand('insertText', false, event.clipboardData.getData('text/plain')));
  });
  document.addEventListener('selectionchange', schedule);
  editor.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = null;
    dragging = true;
    finishingDrag = false;
    dragAnchor = null;
    dragOrigin = event.target;
    while (dragOrigin && dragOrigin !== editor && dragOrigin.parentElement !== editor) dragOrigin = dragOrigin.parentElement;
    if (dragOrigin === editor) dragOrigin = null;
    document.documentElement.classList.toggle('doc-selecting', !!dragOrigin && !dragOrigin.matches('.table-widget'));
    schedule();
  });
  document.addEventListener('pointermove', event => {
    if (!dragging) return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  });
  document.addEventListener('pointerup', () => { finishingDrag = dragging; dragging = false; schedule(); });
  document.addEventListener('pointercancel', () => {
    dragging = false;
    finishingDrag = false;
    dragOrigin = null;
    dragAnchor = null;
    document.documentElement.classList.remove('doc-selecting');
    pointer = null;
    schedule();
  });
  document.addEventListener('keydown', schedule);
  editor.addEventListener('input', schedule);
  window.addEventListener('resize', schedule);
})();
