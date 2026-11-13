/* ---------- Тулбар ячейки: виден, пока в таблице стоит курсор ----------
   Команды: вставить столбец справа, вставить строку снизу, фон, расширенный режим, настройки, удалить таблицу, три точки.
   Стоит по левому краю ячейки с курсором, на 8px выше неё. При выделении строки/столбца/диапазона скрыт. */
(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  const cellToolbar = Toolbar.fromCommands(['insertColRight', 'insertRowBelow', 'cellFill', 'advancedMode', 'settings', 'deleteTable', 'more'],   // без разделителей; «Расширенный режим» — без подписи
    { container: wrap, label: 'Ячейка' });

  function caretCell() {
    const a = document.activeElement;
    return a && table.contains(a) && a.closest('th, td') ? a.closest('th, td') : null;
  }

  let raf = 0;
  function update() {
    raf = 0;
    if (TableAPI.selectedTextRange()) { cellToolbar.hide(); return; }
    // Фокус в поле ввода открытого окна тулбара (например, «Отступы») — тулбар и окно остаются на месте.
    if (cellToolbar.openWin && cellToolbar.openWin.win.contains(document.activeElement)) return;
    const ctx = TableAPI.context();
    if (caretCell() && ctx && ctx.kind === 'cell' && !document.documentElement.classList.contains('tw-cell-selecting')) {
      TableAPI.placeToolbar(cellToolbar);
    } else {
      cellToolbar.hide();
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }

  table.addEventListener('focusin', schedule);
  table.addEventListener('focusout', schedule);
  document.addEventListener('focusout', function (e) { if (cellToolbar.openWin && cellToolbar.openWin.win.contains(e.target)) schedule(); });   // ушли из поля окна
  table.addEventListener('tw:selection', schedule);
  document.addEventListener('selectionchange', schedule);
  table.addEventListener('input', schedule);                  // строка выросла — тулбар следом
  new ResizeObserver(schedule).observe(table);
  new MutationObserver(schedule).observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['colspan', 'rowspan', 'style'] });
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);   // тулбар прилипает к верхнему тулбару редактора при скролле страницы
})();
