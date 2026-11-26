'use strict';

(() => {
  const editor = document.querySelector('.doc');
  const selectionTolerance = 10;
  document.querySelector('.doc-title').addEventListener('contextmenu', event => event.preventDefault());
  let pointer = null;
  let dragging = false;
  let dragOrigin = null;
  let dragAnchor = null;
  let finishingDrag = false;
  let frame = 0;
  let formattingRange;
  let formattingBackward;

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

  function textRange(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let first, last;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const atomic = node.parentElement.closest('[contenteditable="false"]');
      if (!node.textContent.trim() || (atomic && block.contains(atomic))) continue;
      first ??= node;
      last = node;
    }
    if (!first) return null;
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(last, last.length);
    return range;
  }

  function pointerPassedTextEdge(rects, backward) {
    if (!pointer || !rects.length) return false;
    const edge = backward ? rects[0] : rects.at(-1);
    if (backward) {
      return pointer.y <= edge.top - selectionTolerance ||
        (pointer.y <= edge.bottom && pointer.x <= edge.left - selectionTolerance);
    }
    return pointer.y >= edge.bottom + selectionTolerance ||
      (pointer.y >= edge.top && pointer.x >= edge.right + selectionTolerance);
  }

  function expandColumnSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return;
    const focus = selection.focusNode;
    const target = (focus.nodeType === Node.ELEMENT_NODE ? focus : focus.parentElement)?.closest('.doc-column');
    if (!target) return;

    const forward = selection.anchorNode === range.startContainer && selection.anchorOffset === range.startOffset;
    const origin = forward ? target.previousElementSibling : target.nextElementSibling;
    if (!origin?.matches('.doc-column')) return;
    const text = textRange(origin);
    if (!text) return;
    const edge = forward ? Range.START_TO_START : Range.END_TO_END;
    const difference = range.compareBoundaryPoints(edge, text);
    if (forward ? difference > 0 : difference < 0) return;

    const group = document.createRange();
    group.selectNode(origin.parentElement);
    const { startContainer, startOffset, endOffset } = group;
    const anchorInGroup = origin.parentElement.contains(selection.anchorNode);
    selection.setBaseAndExtent(
      anchorInGroup ? startContainer : selection.anchorNode,
      anchorInGroup ? (forward ? startOffset : endOffset) : selection.anchorOffset,
      startContainer,
      forward ? endOffset : startOffset
    );
  }

  function update() {
    frame = 0;
    expandTableSelection();
    expandColumnSelection();
    if (finishingDrag) {
      finishingDrag = false;
      dragOrigin = null;
      dragAnchor = null;
      document.documentElement.classList.remove('doc-selecting');
    }
    editor.querySelectorAll('.is-fully-selected').forEach(block => {
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
    const backward = formattingRange ? formattingBackward :
      selection.anchorNode === range.endContainer && selection.anchorOffset === range.endOffset;
    const blocks = editor.querySelectorAll(':scope > *, p, h1, h2, h3, h4, h5, h6, ol, ul, li, .doc-column, th, td, th div, td div');
    for (const block of blocks) {
      // Общая подложка выбранного контейнера заменяет подложки его детей.
      if (block.parentElement.closest('.is-fully-selected')) continue;
      if (block.matches('.doc-callout, .doc-columns, .doc-column')) {
        const calloutText = block.matches('.doc-callout') ? textRange(block) : null;
        let container = calloutText;
        if (!container) {
          container = document.createRange();
          container.selectNode(block);
        }
        if (range.compareBoundaryPoints(Range.START_TO_START, container) > 0 || range.compareBoundaryPoints(Range.END_TO_END, container) < 0) continue;
        if (pointer && calloutText) {
          const rects = [...calloutText.getClientRects()].filter(rect => rect.width && rect.height);
          if (!pointerPassedTextEdge(rects, backward)) continue;
        }
        highlight(block, 0, block.clientHeight);
        continue;
      }
      // Non-text blocks are selected atomically when the range crosses them.
      if (block.matches('[contenteditable="false"]')) {
        // The table component manages text and cell ranges within its own area.
        if (block.matches('.table-widget') && block.contains(range.startContainer) && block.contains(range.endContainer)) continue;
        if (range.intersectsNode(block)) {
          const table = block.matches('.table-widget') && block.querySelector('.tw');
          if (table) {
            const bounds = table.getBoundingClientRect();
            highlight(block, bounds.top - block.getBoundingClientRect().top, bounds.height);
          } else highlight(block, 0, block.clientHeight);
        }
        continue;
      }
      // Ячейка без блочной разметки содержит один текстовый виджет. Если
      // блоки есть, каждый из них обрабатывается отдельно, как в колонках.
      if (block.matches('th, td, th div, td div') && block.querySelector('p, h1, h2, h3, h4, h5, h6, ol, ul, div')) continue;
      // Use actual text boundaries, not element boundaries, so dragging to the
      // final character can transition to a full block without crossing a node.
      const content = textRange(block);
      if (!content) continue;
      const start = range.compareBoundaryPoints(Range.START_TO_START, content);
      const end = range.compareBoundaryPoints(Range.END_TO_END, content);
      if (start > 0 || end < 0) continue;

      const rects = [...content.getClientRects()].filter(rect => rect.width && rect.height);
      if (!rects.length) continue;
      if (block.parentElement === editor && start === 0 && end === 0 && !pointerPassedTextEdge(rects, backward)) continue;

      const bounds = content.getBoundingClientRect();
      const box = block.getBoundingClientRect();
      const isText = block.matches('p, h1, h2, h3, h4, h5, h6, th, td, th div, td div');
      highlight(block, isText ? bounds.top - box.top : 0, isText ? bounds.height : block.clientHeight);
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
    if (!formattingRange && event.detail) {
      const selection = getSelection();
      formattingBackward = selection.anchorNode === event.detail.endContainer &&
        selection.anchorOffset === event.detail.endOffset;
    }
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
  document.addEventListener('keydown', () => {
    if (!formattingRange) pointer = null;
    schedule();
  });
  editor.addEventListener('input', schedule);
  window.addEventListener('resize', schedule);
})();
