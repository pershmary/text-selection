/* ---------- Команды тулбаров таблицы ----------
   Полный набор — тулбар «Тулбар диапазона» в Figma (node 2864:271452), команды слева направо.
   Тулбар собирается списком id: Toolbar.fromCommands(['insertColRight', 'insertRowBelow', …], { container }).
   У команд без описания поведения (окна стиля, фона, границ, настроек, меню) действие пока пустое. */
// Иконка «Расширенный режим» (Figma 3386:195902) — вектор, цвет — currentColor.
const ADV_MODE_SVG = '<svg class="tb-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" stroke="currentColor"/><path d="M10 13.5C10.2761 13.5 10.5 13.7239 10.5 14V20.5H5C4.17157 20.5 3.5 19.8284 3.5 19V13.5H10Z" stroke="currentColor"/><path d="M16.5 7C16.7761 7 17 7.22386 17 7.5V11.5C17 11.7761 16.7761 12 16.5 12C16.2239 12 16 11.7761 16 11.5V8.70703L12.8535 11.8535C12.6583 12.0488 12.3417 12.0488 12.1465 11.8535C11.9512 11.6583 11.9512 11.3417 12.1465 11.1465L15.293 8H12.5C12.2239 8 12 7.77614 12 7.5C12 7.22386 12.2239 7 12.5 7H16.5Z" fill="currentColor"/></svg>';
const TABLE_COMMANDS = {
  // 1. Вставить столбец справа от активного элемента
  insertColRight: { icon: '', title: 'Добавить столбец', run: function () { TableAPI.run('insertColRight'); } },
  // 2. Вставить строку снизу от активного элемента
  insertRowBelow: { icon: '', title: 'Добавить строку', run: function () { TableAPI.run('insertRowBelow'); } },
  // Расширить таблицу до краёв экрана (не шире 1400px); у расширенной таблицы команда называется «Уменьшить» и возвращает ширину текста.
  expandTable: { title: 'Расширить', run: function () { TableAPI.run('expandTable'); } },
  // Выровнять столбцы столбцов: выделенных, а без выделения — всех.
  alignWidth: { title: 'Выровнять столбцы', run: function () { TableAPI.run('alignWidth'); } },
  // Кнопки «Разделить ячейку» и «Положение в тексте» (тулбар окна расширенного режима) открывают меню с пунктами подменю.
  splitCellMenu:  { title: 'Разделить ячейку', window: 'splitMenu' },
  tableAlignMenu: { title: 'Положение в тексте', window: 'alignMenu' },
  // Окна настройки из подменю «Настроить»: таблицы и ячейки (выделенных ячеек или ячейки с курсором).
  tableSettingsWin: { title: 'Таблицу', window: 'tableSettings' },
  // «Вставить» (тулбар окна расширенного режима) — меню с пунктами подменю «Добавить столбец/строку».
  insertMenu: { title: 'Вставить', window: 'insertMenu' },
  cellSettingsWin:  { title: 'Ячейку', window: 'cellsSettings' },
  // Разделить ячейку — из подменю «Разделить ячейку». «На несколько ячеек» (окно настройки деления) — позже.
  splitCellH: { title: 'По горизонтали', run: function () { TableAPI.run('splitCellH'); } },
  splitCellV: { title: 'По вертикали', run: function () { TableAPI.run('splitCellV'); } },
  // «На несколько ячеек» — окно «Разделение ячейки» по центру экрана.
  splitCellDialog: { title: 'На несколько ячеек', run: function () { if (window.SplitDialog) SplitDialog.open(); } },
  // Положение таблицы в тексте — из подменю «Положение в тексте».
  tableAlignLeft:   { title: 'По левому краю', run: function () { TableAPI.run('tableAlignLeft'); } },
  tableAlignCenter: { title: 'По центру', run: function () { TableAPI.run('tableAlignCenter'); } },
  tableAlignRight:  { title: 'По правому краю', run: function () { TableAPI.run('tableAlignRight'); } },
  // Сдвиг на одну позицию — из подменю «Сдвинуть столбец/строку», «Сдвинуть столбец», «Сдвинуть строку».
  moveColRight:   { title: 'Вправо', run: function () { TableAPI.run('moveColRight'); } },
  moveColLeft:    { title: 'Влево', run: function () { TableAPI.run('moveColLeft'); } },
  moveRowDown:    { title: 'Вниз', run: function () { TableAPI.run('moveRowDown'); } },
  moveRowUp:      { title: 'Вверх', run: function () { TableAPI.run('moveRowUp'); } },
  // Вставка слева / сверху — только из подменю «Добавить столбец/строку» (своих кнопок в тулбарах нет).
  insertColLeft:  { title: 'Слева', run: function () { TableAPI.run('insertColLeft'); } },
  insertRowAbove: { title: 'Сверху', run: function () { TableAPI.run('insertRowAbove'); } },
  // 3. Стиль текста — окно настройки стиля (поведение будет дополнено)
  textStyle:      { icon: '', title: 'Стиль текста', window: 'textStyle' },
  // 4. Фон ячеек — окно выбора фона (поведение будет дополнено)
  cellFill:       { icon: '', title: 'Фон', window: 'fill' },
  // 5. Границы — окно настройки границ (поведение будет дополнено)
  borders:        { icon: '', title: 'Границы', window: 'borders' },
  // 6. Объединить: объединяет выделенные; на объединённой ячейке кнопка нажата, повторное нажатие разделяет
  mergeCells:     { svg: '<svg class="tb-svg" width="24" height="24" viewBox="4 4 24 24" fill="none" aria-hidden="true"><path fill="currentColor" d="M22.9844 7.51562C23.5469 7.51562 24.0156 7.71875 24.3906 8.125C24.7969 8.5 25 8.96875 25 9.53125V23.5C25 24.0625 24.7969 24.5469 24.3906 24.9531C24.0156 25.3281 23.5469 25.5156 22.9844 25.5156H9.01562C8.45312 25.5156 7.96875 25.3281 7.5625 24.9531C7.1875 24.5469 7 24.0625 7 23.5V9.53125C7 8.96875 7.1875 8.5 7.5625 8.125C7.96875 7.71875 8.45312 7.51562 9.01562 7.51562H22.9844ZM16.5156 8.5V12.5312H24.0156V9.53125C24.0156 9.25 23.9062 9.01562 23.6875 8.82812C23.5 8.60938 23.2656 8.5 22.9844 8.5H16.5156ZM7.98438 13.5156V19.5156H24.0156V13.5156H7.98438ZM15.4844 12.5312V8.5H9.01562C8.73438 8.5 8.48438 8.60938 8.26562 8.82812C8.07812 9.01562 7.98438 9.25 7.98438 9.53125V12.5312H15.4844ZM7.98438 23.5C7.98438 23.7812 8.07812 24.0312 8.26562 24.25C8.48438 24.4375 8.73438 24.5312 9.01562 24.5312H15.4844V20.5H7.98438V23.5ZM22.9844 24.5312C23.2656 24.5312 23.5 24.4375 23.6875 24.25C23.9062 24.0312 24.0156 23.7812 24.0156 23.5V20.5H16.5156V24.5312H22.9844Z"/></svg>', title: 'Объединить', toggle: true,
                    isPressed: function () { return TableAPI.isMergedActive(); },
                    run: function () { TableAPI.run('mergeCells'); } },
  // Расширенный режим — открывает окно расширенного режима (иконка — Figma 3386:195902, в тулбаре таблицы — с подписью). Стоит перед «Настроить».
  advancedMode:   { icon: '\ue63c',   // иконка — cbuc-icons24 U+E63C (Figma 3658:328521)
                  title: 'Расширенный режим', run: function () { if (window.TableWindow && !TableWindow.isOpen()) TableWindow.open(); } },
  // 7. Настройки — окно настроек (поведение будет дополнено)
  settings:       { icon: '', title: 'Настроить', window: 'settings' },
  // «Настроить ячейки» — в плавающих тулбарах диапазонов вместо «Настроить»: окно настройки выделенных ячеек (иконка — из окна расширенного режима).
  cellsSettingsSel: { icon: '\ue75d', title: 'Настроить ячейки', window: 'cellsSettings' },
  // 8. Удалить строку: выделенную или ту, где курсор
  deleteRow:      { icon: '', title: 'Удалить строку', danger: true, run: function () { TableAPI.run('deleteRow'); } },
  // 9. Удалить столбец: выделенный или тот, где курсор
  deleteCol:      { icon: '', title: 'Удалить столбец', danger: true, run: function () { TableAPI.run('deleteCol'); } },
  // 10. Удалить таблицу целиком
  deleteTable:    { icon: '', title: 'Удалить таблицу', danger: true, centered: true, run: function () { TableAPI.run('deleteTable'); } },
  // «Удалить» (тулбар окна расширенного режима при выделении): удаляет выделенные объекты —
  // целые строки, целые столбцы, а если выделена вся таблица — таблицу.
  deleteSelection: { icon: '', title: 'Удалить', danger: true, centered: true, run: function () {
    const ctx = TableAPI.context(); if (!ctx || ctx.kind !== 'range') return;
    const R = ctx.range, n = TableAPI.columnCount(), last = document.querySelector('#tw-wrap .tw').rows.length - 1;
    const fullRows = R.c1 === 0 && R.c2 === n - 1, fullCols = R.r1 === 0 && R.r2 === last;
    if (fullRows && fullCols) { if (window.TableWindow && TableWindow.isOpen()) TableWindow.close(true); TableAPI.run('deleteTable'); }
    else if (fullRows) TableAPI.run('deleteRow');
    else if (fullCols) TableAPI.run('deleteCol');
  } },
  // 11. Три точки — меню с командами (поведение будет дополнено)
  more:           { icon: '', title: 'Ещё', window: 'more' }
};

// Номера команд слева направо — чтобы тулбары можно было задавать и номерами.
const TABLE_COMMAND_ORDER = ['insertColRight', 'insertRowBelow', 'textStyle', 'cellFill', 'borders',
  'mergeCells', 'settings', 'deleteRow', 'deleteCol', 'deleteTable', 'more'];

Toolbar.fromCommands = function (ids, opts) {
  const items = ids.map(function (id) {
    if (id === '|') return { sep: true };   // разделитель
    if (typeof id === 'number') id = TABLE_COMMAND_ORDER[id - 1];
    const c = TABLE_COMMANDS[id];
    return {
      id: id, icon: c.icon, svg: c.svg, label: c.label, title: c.title, danger: c.danger, centered: c.centered,
      toggle: c.toggle, isPressed: c.isPressed,
      onClick: function () { runCommand(id, tb); }
    };
  });
  const tb = Toolbar.create(Object.assign({}, opts, { items: items }));
  return tb;
};

/* ---------- Одни и те же команды везде ----------
   Кнопки тулбаров, пункты меню «Ещё» и кнопки окна расширенного режима запускают одну и ту же команду
   из TABLE_COMMANDS и работают одинаково. Сопоставление названий пунктов меню / кнопок окна с командами: */
const COMMAND_BY_NAME = {
  'Добавить столбец': 'insertColRight', 'Добавить строку': 'insertRowBelow',
  'Стиль текста': 'textStyle', 'Фон': 'cellFill', 'Границы': 'borders',
  'Объединить': 'mergeCells', 'Расширенный режим': 'advancedMode', 'Настроить': 'settings', 'Настроить ячейки': 'cellSettingsWin', 'Настроить таблицу': 'tableSettingsWin',
  'Удалить строку': 'deleteRow', 'Удалить столбец': 'deleteCol', 'Удалить таблицу': 'deleteTable', 'Удалить': 'deleteSelection',
  'Разделить ячейку': 'splitCellMenu', 'Положение в тексте': 'tableAlignMenu', 'Расширить': 'expandTable', 'Уменьшить': 'expandTable',
  // Тулбар окна расширенного режима (Figma 1720:237491): «Вставить» — меню вставки, «Настроить ячейку» — окно ячейки,
  'Вставить': 'insertMenu', 'Настроить ячейку': 'cellSettingsWin', 'Выровнять столбцы': 'alignWidth',
  'Ещё': 'more'
};
// Запустить команду id из тулбара host (тулбар в таблице или тулбар окна расширенного режима).
// Команда с окном открывает его под своей кнопкой; если такой кнопки в тулбаре нет (команда вызвана из меню) —
// под кнопкой «Ещё», на месте меню. Команда без окна выполняется сразу, открытое меню закрывается.
// menu — меню, из пункта которого вызвана команда. Окно, вызванное из пункта меню, встаёт на то же место, где было меню
// (кнопка, открывшая меню, остаётся нажатой). Окна настройки таблицы/ячеек (с _anchor) — по своим правилам, у объекта.
function runCommand(id, host, menu) {
  const c = TABLE_COMMANDS[id];
  if (!c) return;
  if (c.window) {
    const win = TableWindows[c.window](host);
    if (menu && !win._anchor && host.openWin && host.openWin.win === menu) {
      const mid = host.openWin.id;
      const dx = menu.getBoundingClientRect().left - host.button(mid).getBoundingClientRect().left;
      host.toggleWindow(win, mid, { dx: dx });
      return;
    }
    host.toggleWindow(win, host.button(id) ? id : 'more');
    return;
  }
  // Команда из меню «Ещё» — меню закрывается (открытые окна других команд не трогаем, как и раньше).
  if (host.openWin && host.openWin.win.classList.contains('twin--menu')) host.closeWindow();
  if (id === 'deleteTable' && window.TableWindow && TableWindow.isOpen()) TableWindow.close(true);   // таблицы нет — окна тоже
  if (c.run) c.run();
  if (host.refresh) host.refresh();
}
Toolbar.runCommand = runCommand;

/* ---------- Тулбары вставки столбцов (Figma 2036:183376) и строк (Figma 3680:278132) — во всех тулбарах ----------
   Строки: ховер на «Добавить строку» — тулбар «Добавить строку сверху» (U+E955, отражённая по вертикали) / «снизу» (U+E955).
   Ховер на кнопку «Добавить столбец» (плавающие тулбары и тулбар окна расширенного режима) 0,5 с — по центру под кнопкой,
   на 8px ниже неё, тулбар «Добавить столбец слева» / «Добавить столбец справа». Держится, пока мышь на кнопке или на нём;
   уход мыши — скрыть. Нажатие кнопки тулбара — вставка и скрытие; нажатие самой «Добавить столбец» — как раньше (справа). */
[{ name: 'Добавить столбец', label: 'Вставка столбцов', items: [
    ['insertColLeft', 'Добавить столбец слева', '\ue952', 'is-mirror'], ['insertColRight', 'Добавить столбец справа', '\ue952', ''] ] },
 { name: 'Добавить строку', label: 'Вставка строк', items: [
    ['insertRowAbove', 'Добавить строку сверху', '\ue955', 'is-flip'], ['insertRowBelow', 'Добавить строку снизу', '\ue955', ''] ] }
].forEach(function (cfg) {
  const SEL = '.tb-btn[title="' + cfg.name + '"], .tw-win-btn[title="' + cfg.name + '"]';
  const pop = document.createElement('div');
  pop.className = 'tw-win-pop';
  pop.setAttribute('role', 'toolbar');
  pop.setAttribute('aria-label', cfg.label);
  pop.hidden = true;
  pop.innerHTML = cfg.items.map(function (it) {
    return '<button type="button" data-cmd="' + it[0] + '" title="' + it[1] + '" aria-label="' + it[1] + '"><span class="tw-win-ico ' + it[3] + '" aria-hidden="true">' + it[2] + '</span></button>';
  }).join('');
  document.body.appendChild(pop);
  pop.addEventListener('mousedown', function (e) { e.preventDefault(); });   // курсор остаётся в ячейке
  let showT = 0, hideT = 0, cur = null;
  function hide() { clearTimeout(showT); clearTimeout(hideT); pop.hidden = true; cur = null; }
  function show(b) {
    if (!b.isConnected || !b.offsetParent || b.disabled) return;
    cur = b;
    pop.hidden = false;
    const r = b.getBoundingClientRect();
    pop.style.left = (r.left + r.width / 2 - pop.offsetWidth / 2) + 'px';
    pop.style.top = (r.bottom + 8) + 'px';
  }
  function laterHide() { clearTimeout(hideT); hideT = setTimeout(hide, 150); }
  document.addEventListener('mouseover', function (e) {
    const b = e.target.closest && e.target.closest(SEL);
    if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    clearTimeout(hideT);
    if (!pop.hidden && cur === b) return;
    clearTimeout(showT);
    showT = setTimeout(function () { show(b); }, 500);
  });
  document.addEventListener('mouseout', function (e) {
    const b = e.target.closest && e.target.closest(SEL);
    if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    clearTimeout(showT);
    if (!pop.hidden) laterHide();
  });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest(SEL)) hide(); }, true);
  document.addEventListener('mousedown', function (e) { if (!pop.contains(e.target)) hide(); }, true);
  window.addEventListener('scroll', hide, true);
  pop.addEventListener('mouseenter', function () { clearTimeout(hideT); });
  pop.addEventListener('mouseleave', laterHide);
  pop.querySelectorAll('button').forEach(function (pb) {
    pb.addEventListener('click', function () {
      const win = cur && cur.closest('.tw-window');
      hide();
      if (win && win._host) runCommand(pb.dataset.cmd, win._host);
      else TABLE_COMMANDS[pb.dataset.cmd].run();
    });
  });
});

/* ---------- Плавающие тулбары выделений (строки, столбцы, диапазон) собираются по правилам ----------
   1) всегда: Добавить столбец, Добавить строку, Фон, Стиль текста, Границы, Объединить, Настроить ячейки;
   2) полностью выделены строки, столбцы или вся таблица — одна кнопка «Удалить» (удаляет выделенное);
   4) диапазон без полных строк и столбцов — оба удаления; 5) в конце всегда «Ещё».
   Тулбар создаётся с полным набором SELECTION_COMMANDS, лишние кнопки скрываются перед показом. */
const SELECTION_COMMANDS = ['insertColRight', 'insertRowBelow', 'cellFill', 'textStyle', 'borders', 'mergeCells', 'cellsSettingsSel', 'deleteSelection', 'deleteRow', 'deleteCol', 'more'];
Toolbar.SELECTION_COMMANDS = SELECTION_COMMANDS;
Toolbar.selectionCommands = function () {
  const ctx = TableAPI.context();
  if (!ctx || ctx.kind !== 'range') return null;
  const R = ctx.range, n = TableAPI.columnCount(), last = document.querySelector('#tw-wrap .tw').rows.length - 1;
  const fullRows = R.c1 === 0 && R.c2 === n - 1, fullCols = R.r1 === 0 && R.r2 === last;
  const ids = ['insertColRight', 'insertRowBelow', 'cellFill', 'textStyle', 'borders', 'mergeCells', 'cellsSettingsSel'];   // «Объединить» — перед «Настроить ячейки»
  // Выделены целые строки — «Удалить строку» (иконка удаления строки), целые столбцы — «Удалить столбец»;
  // вся таблица (такой же диапазон) и неполный диапазон — обе кнопки удаления.
  if (fullRows && !fullCols) ids.push('deleteRow');
  else if (fullCols && !fullRows) ids.push('deleteCol');
  else ids.push('deleteRow', 'deleteCol');
  ids.push('more');
  return ids;
};
// Показать в тулбаре только кнопки по правилам (остальные скрыты).
Toolbar.applySelectionCommands = function (tb) {
  const ids = Toolbar.selectionCommands();
  if (!ids) return;
  SELECTION_COMMANDS.forEach(function (id) { const b = tb.button(id); if (b) b.hidden = ids.indexOf(id) < 0; });
  if (tb.openWin && tb.button(tb.openWin.id) && tb.button(tb.openWin.id).hidden) tb.closeWindow();
};
Toolbar.commandByName = function (name) { return COMMAND_BY_NAME[name] || null; };

// Переключатели «Заглавная строка» / «Заглавный столбец»: одно состояние на кнопку окна, пункты всех меню и окно «Таблица».
// Изменение — событие tw:toggles на document.
// Состояние берётся из таблицы (TableAPI.isHeader / setHeader): включение — фон #f8f8f8 и полужирный текст, выключение — по умолчанию.
const TableToggles = (function () {
  const KIND = { 'Заглавная строка': 'row', 'Заглавный столбец': 'col' };
  return {
    has: function (name) { return name in KIND; },
    get: function (name) { return TableAPI.isHeader(KIND[name]); },
    toggle: function (name) {
      TableAPI.setHeader(KIND[name], !TableAPI.isHeader(KIND[name]));
      document.dispatchEvent(new CustomEvent('tw:toggles', { detail: { name: name, on: TableAPI.isHeader(KIND[name]) } }));
    }
  };
})();
window.TableToggles = TableToggles;
