'use strict';

(() => {
  const editor = document.querySelector('.doc');
  let pointer = null;
  let dragging = false;
  let frame = 0;

  function highlight(block, top, height) {
    block.style.setProperty('--selection-top', `${top}px`);
    block.style.setProperty('--selection-height', `${height}px`);
    block.classList.add('is-fully-selected');
  }

  function update() {
    frame = 0;
    editor.querySelectorAll('.is-fully-selected').forEach(block => {
      block.classList.remove('is-fully-selected');
      block.style.removeProperty('--selection-top');
      block.style.removeProperty('--selection-height');
    });
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return;

    for (const block of editor.children) {
      // Non-text blocks are selected atomically when the range crosses them.
      if (block.matches('[contenteditable="false"]')) {
        // The table component manages text and cell ranges within its own area.
        if (block.matches('.table-widget') && (block.contains(range.startContainer) || block.contains(range.endContainer))) continue;
        if (range.intersectsNode(block)) highlight(block, 0, block.clientHeight);
        continue;
      }
      if (!block.textContent.trim()) continue;
      const content = document.createRange();
      // Use actual text boundaries, not element boundaries, so dragging to the
      // final character can transition to a full block without crossing a node.
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim() && !node.parentElement.closest('[contenteditable="false"]')) texts.push(node);
      }
      if (!texts.length) continue;
      content.setStart(texts[0], 0);
      content.setEnd(texts.at(-1), texts.at(-1).length);
      const start = range.compareBoundaryPoints(Range.START_TO_START, content);
      const end = range.compareBoundaryPoints(Range.END_TO_END, content);
      if (start > 0 || end < 0) continue;

      const rects = [...content.getClientRects()].filter(rect => rect.width && rect.height);
      if (!rects.length) continue;
      const first = rects[0];
      const last = rects.at(-1);
      const backward = selection.anchorNode === range.endContainer && selection.anchorOffset === range.endOffset;
      const pastEnd = pointer && !backward && (pointer.y > last.bottom || (pointer.y >= last.top && pointer.x > last.right));
      const pastStart = pointer && backward && (pointer.y < first.top || (pointer.y <= first.bottom && pointer.x < first.left));
      if (start === 0 && end === 0 && !pastEnd && !pastStart) continue;

      const bounds = content.getBoundingClientRect();
      const box = block.getBoundingClientRect();
      const isText = block.matches('p, h1, h2, h3, h4, h5, h6');
      highlight(block, isText ? bounds.top - box.top : 0, isText ? bounds.height : block.clientHeight);
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  document.addEventListener('selectionchange', schedule);
  editor.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointer = null;
    dragging = true;
    schedule();
  });
  document.addEventListener('pointermove', event => {
    if (!dragging) return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  });
  document.addEventListener('pointerup', () => { dragging = false; schedule(); });
  document.addEventListener('pointercancel', () => { dragging = false; pointer = null; schedule(); });
  document.addEventListener('keydown', () => { pointer = null; schedule(); });
  editor.addEventListener('input', schedule);
  window.addEventListener('resize', schedule);
})();
