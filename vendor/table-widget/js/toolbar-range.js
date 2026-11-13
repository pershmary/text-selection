/* ---------- Тулбар диапазона: виден, пока выделен диапазон, не содержащий целиком ни строку, ни столбец ----------
   Состав — по правилам тулбаров выделений (Toolbar.selectionCommands). Стоит по левому краю рамки выделения, на 8px выше неё. */
(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  const rangeToolbar = Toolbar.fromCommands(Toolbar.SELECTION_COMMANDS, { container: wrap, label: 'Диапазон' });   // состав — по правилам

  let raf = 0;
  function update() {
    raf = 0;
    const busy = document.documentElement.classList.contains('tw-cell-selecting') ||
      document.documentElement.classList.contains('tw-dragging');
    if (TableAPI.isRangeSelection() && !busy) { Toolbar.applySelectionCommands(rangeToolbar); TableAPI.placeToolbar(rangeToolbar); }
    else rangeToolbar.hide();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }

  table.addEventListener('tw:selection', schedule);
  document.addEventListener('pointerup', schedule);
  table.addEventListener('input', schedule);
  new ResizeObserver(schedule).observe(table);
  new MutationObserver(schedule).observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['colspan', 'rowspan', 'style'] });
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);   // тулбар прилипает к верхнему тулбару редактора при скролле страницы
})();
