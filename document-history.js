'use strict';

// Keep the original nodes so undoing structural edits also restores widget listeners.
const DocumentHistory = (() => {
  const editor = document.querySelector('.doc');
  let pending = [];
  const observer = new MutationObserver(records => pending.push(...records));
  const past = [], future = [];
  let recording = false;
  let caret, typing, groupTyping;

  function selection() {
    const s = getSelection();
    return [s.anchorNode, s.anchorOffset, s.focusNode, s.focusOffset];
  }
  function begin() {
    if (recording) return;
    recording = true;
    caret = selection();
    observer.observe(editor, { subtree: true, childList: true, characterDataOldValue: true, attributeOldValue: true });
  }
  function finish(preview = false) {
    if (!recording) return;
    const records = pending.concat(observer.takeRecords());
    pending = [];
    observer.disconnect();
    recording = false;
    const edits = records.map(r => {
      const node = r.target;
      if (r.type === 'childList') {
        const insert = (nodes) => nodes.forEach(n => node.insertBefore(n, r.nextSibling));
        const remove = (nodes) => nodes.forEach(n => node.removeChild(n));
        return {
          undo() { remove(r.addedNodes); insert(r.removedNodes); },
          redo() { remove(r.removedNodes); insert(r.addedNodes); }
        };
      }
      const attr = r.attributeName;
      const after = attr ? node.getAttribute(attr) : node.data;
      function set(value) {
        if (!attr) node.data = value;
        else if (value === null) node.removeAttribute(attr);
        else node.setAttribute(attr, value);
      }
      return { undo: () => set(r.oldValue), redo: () => set(after) };
    });
    if (preview) return () => { [...edits].reverse().forEach(edit => edit.undo()); };
    if (edits.length) {
      const end = selection();
      if (groupTyping && past.length) {
        past.at(-1).edits.push(...edits);
        past.at(-1).end = end;
      } else past.push({ edits, start: caret, end });
      if (past.length > 100) past.shift();
      future.length = 0;
    }
    groupTyping = false;
  }
  function change(fn) {
    if (recording) return fn();
    typing = null;
    begin();
    try { return fn(); } finally { finish(); }
  }
  function travel(redo) {
    typing = null;
    const from = redo ? future : past;
    const entry = from.pop();
    if (!entry) return;
    if (redo) entry.edits.forEach(e => e.redo());
    else [...entry.edits].reverse().forEach(e => e.undo());
    (redo ? past : future).push(entry);
    editor.focus({preventScroll:true});
    const pos = redo ? entry.end : entry.start;
    if (pos[0]?.isConnected && pos[2]?.isConnected) getSelection().setBaseAndExtent(...pos);
    editor.dispatchEvent(new Event('input', {bubbles:true}));
  }

  let nativeInput = false;
  editor.addEventListener('beforeinput', e => {
    if (recording || e.target.closest('.table-widget')) return;
    if (['historyUndo','historyRedo'].includes(e.inputType)) {
      e.preventDefault();
      travel(e.inputType === 'historyRedo');
      return;
    }
    begin();
    nativeInput = true;
    const previous = past.at(-1)?.end;
    groupTyping = e.inputType === 'insertText' && Date.now() - typing < 1000 && previous?.every((v,i) => v === caret[i]);
    typing = e.inputType === 'insertText' ? Date.now() : null;
    setTimeout(() => { if (nativeInput) { nativeInput = false; finish(); } });
  });
  editor.addEventListener('input', () => { if (nativeInput) { nativeInput = false; finish(); } });
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || !['KeyZ','KeyY'].includes(e.code)) return;
    if (e.target.closest('input,textarea,#tw-wrap,.tw-window,.twin:not(.selection-settings)')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    travel(e.shiftKey || e.code === 'KeyY');
  }, true);
  return { change, travel, preview(fn) {
    begin();
    try { fn(); } catch (error) { finish(true)(); throw error; }
    return finish(true);
  } };
})();
