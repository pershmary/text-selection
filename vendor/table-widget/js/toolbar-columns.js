/* ---------- Тулбар столбцов: виден, пока выделен столбец или несколько столбцов ----------
   Состав — по правилам тулбаров выделений (Toolbar.selectionCommands). Стоит по левому краю рамки выделения, на 8px выше неё. */
(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  const colsToolbar = Toolbar.fromCommands(Toolbar.SELECTION_COMMANDS, { container: wrap, label: 'Столбцы' });   // состав — по правилам

  let raf = 0;
  function update() {
    raf = 0;
    const busy = document.documentElement.classList.contains('tw-cell-selecting') ||
      document.documentElement.classList.contains('tw-dragging');
    if (TableAPI.isColSelection() && !busy) { Toolbar.applySelectionCommands(colsToolbar); TableAPI.placeToolbar(colsToolbar); }
    else colsToolbar.hide();
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
