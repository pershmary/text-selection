/* ---------- Тулбар строк: виден, пока выделена строка или несколько строк (любым способом) ----------
   Состав — по правилам тулбаров выделений (Toolbar.selectionCommands). Стоит по левому краю рамки выделения, на 8px выше неё. */
(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  const rowsToolbar = Toolbar.fromCommands(Toolbar.SELECTION_COMMANDS, { container: wrap, label: 'Строки' });   // состав — по правилам

  let raf = 0;
  function update() {
    raf = 0;
    const selecting = document.documentElement.classList.contains('tw-cell-selecting') ||
      document.documentElement.classList.contains('tw-dragging');
    if (TableAPI.isRowSelection() && !selecting) { Toolbar.applySelectionCommands(rowsToolbar); TableAPI.placeToolbar(rowsToolbar); }
    else rowsToolbar.hide();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }

  table.addEventListener('tw:selection', schedule);
  document.addEventListener('pointerup', schedule);          // закончили протягивать выделение
  table.addEventListener('input', schedule);
  new ResizeObserver(schedule).observe(table);
  new MutationObserver(schedule).observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['colspan', 'rowspan', 'style'] });
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);   // тулбар прилипает к верхнему тулбару редактора при скролле страницы
})();
