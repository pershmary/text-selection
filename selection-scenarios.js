(() => {
  if (window.parent === window) return;

  const editor = document.querySelector('.doc');
  const toolbar = document.querySelector('.app-toolbar');
  const parentOrigin = location.protocol === 'file:' ? '*' : location.origin;
  const scenarios = new Map([
    ['paragraphs', [':scope > p:first-child', ':scope > p:nth-child(2)']],
    ['heading', [':scope > h1', ':scope > h1 + p']],
    ['callout', [':scope > ol + p', '.doc-callout p:first-child']],
    ['image', [':scope > p:has(+ figure)', ':scope > figure + p']],
    ['list-paragraph', [':scope > ol > li:last-child', ':scope > ol + p']],
    ['list-items', [':scope > ol > li:first-child', ':scope > ol > li:nth-child(2)']],
    ['table', [':scope > p:has(+ .table-widget)', ':scope > .table-widget']],
    ['column', [':scope > p:has(+ .doc-columns)', '.doc-column:first-child h3']],
    ['column-widgets', ['.doc-column:first-child > p:last-child', '.doc-column:last-child > h3']]
  ]);
  let activeScenario;

  function textBoundary(block) {
    if (!block) return null;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const middle = Math.floor(node.length / 2);
      if (!node.data.trim() || !middle) continue;
      const space = node.data.indexOf(' ', middle);
      return [node, space > 0 && space < node.length - 1 ? space : middle];
    }
    return null;
  }

  function reveal(range, firstWidget) {
    const bounds = range.getBoundingClientRect();
    const top = toolbar.getBoundingClientRect().bottom + 12;
    const bottom = window.innerHeight - 12;
    if (bounds.top >= top && bounds.bottom <= bottom) return;
    const previousWidget = firstWidget.previousElementSibling
      || (firstWidget.matches('li') && firstWidget.parentElement.previousElementSibling)
      || firstWidget;
    const delta = previousWidget.getBoundingClientRect().top - top;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: delta, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  function clearScenario() {
    if (!activeScenario) return;
    window.parent.postMessage({
      type: 'selection-scenario-cleared',
      scenario: activeScenario
    }, parentOrigin);
    activeScenario = undefined;
  }

  window.addEventListener('message', ({ source, origin, data }) => {
    if (source !== window.parent || (parentOrigin !== '*' && origin !== parentOrigin)) return;
    if (data?.type !== 'show-selection-scenario') return;
    const { scenario } = data;
    // Stop an earlier smooth scroll before measuring or clearing the new selection.
    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
    const selection = window.getSelection();
    if (scenario === 'demo') {
      activeScenario = undefined;
      selection.removeAllRanges();
      return;
    }
    const selectors = scenarios.get(scenario);
    if (!selectors) return;
    activeScenario = scenario;
    const [first, last] = selectors.map(selector => editor.querySelector(selector));
    const start = textBoundary(first);
    const end = scenario === 'table' ? null : textBoundary(last);
    if (!start || !last || (scenario !== 'table' && !end)) {
      clearScenario();
      return;
    }

    const range = document.createRange();
    range.setStart(...start);
    if (end) range.setEnd(...end);
    else range.setEndAfter(last);
    if (range.collapsed) {
      clearScenario();
      return;
    }

    editor.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(range);
    reveal(range, first);
  });

  document.addEventListener('selectionchange', () => {
    if (window.getSelection().isCollapsed) clearScenario();
  });
})();
