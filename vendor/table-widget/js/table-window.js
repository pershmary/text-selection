/* ---------- Окно таблицы (окно расширенного режима): открывается по клику на квадратный маркер слева сверху ----------
   Окно «Окно настройки плитки» (Figma 1720:237491) содержит эту же таблицу (таблица переносится в окно и
   остаётся рабочей), шапку с тулбаром таблицы и командами. Команды тулбара и меню «Ещё» — те же, что в тулбарах таблицы. */
(function () {
  const widget = document.querySelector('.table-widget');
  const scroll = widget.querySelector('.table-scroll');
  const marker = scroll.querySelector('.tw-marker');
  let win = null;
  function ico(code, cls) { return '<span class="tw-win-ico' + (cls || '') + '" aria-hidden="true">' + code + '</span>'; }   // code — символ шрифта или <svg>
  function btn(code, title, mod, disabled, pressed) {
    return '<button type="button" class="tw-win-btn' + (mod ? ' ' + mod : '') + '" title="' + title + '" aria-label="' + title + '"' +
      (disabled ? ' disabled' : '') + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : '') + '>' + ico(code) + '</button>';
  }
  // Кнопка с подписью справа от иконки (Inter 12px) и разделитель групп (1×20, rgba(0,0,0,.08)).
  function lbtn(code, title, mod, disabled) {
    return '<button type="button" class="tw-win-btn has-label' + (mod ? ' ' + mod : '') + '" title="' + title + '" aria-label="' + title + '"' +
      (disabled ? ' disabled' : '') + '>' + ico(code) + '<span class="tw-win-label">' + title + '</span></button>';
  }
  const MENU_SVG_COLS = TableWindows.MENU_SVG.width;   // «Выровнять столбцы» — та же иконка, что в меню
  const ADV_SVG = {
    cell: TableWindows.MENU_SVG.cell,
    cols: MENU_SVG_COLS
  };
  function grp(caption, buttons) {
    return '<div class="tw-win-grp"><span class="tw-win-cap">' + caption + '</span><div class="tw-win-grow">' + buttons + '</div></div>';
  }
  function build() {
    const w = document.createElement('div');
    w.className = 'tw-window';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Расширенный режим');
    w.innerHTML =
      '<div class="tw-win-head">' +
        '<div class="tw-win-tools" role="toolbar" aria-label="Тулбар расширенного режима">' +
          // Тулбар таблицы (выделения нет) — Figma 3722:267986: группы с подписями «Столбцы и строки» | «Ячейка» | «Таблица».
          '<div class="tw-win-groups no-sel">' +
            grp('Столбцы и строки', btn('', 'Добавить столбец') + btn('', 'Добавить строку') +
              btn('', 'Удалить столбец', 'is-danger needs-caret') + btn('', 'Удалить строку', 'is-danger needs-caret') +
              btn('', 'Ещё', 'tw-win-more-rowcol')) +
            '<span class="tw-win-gsep" aria-hidden="true"></span>' +
            grp('Ячейка', btn('', 'Фон') + btn('', 'Стиль текста') + btn('', 'Границы') +
              btn('', 'Разделить ячейку', 'needs-caret') + btn('', 'Настроить ячейку', 'needs-caret') +
              btn('', 'Ещё', 'tw-win-more-cell')) +
            '<span class="tw-win-gsep" aria-hidden="true"></span>' +
            grp('Таблица', btn(ADV_SVG.cols, 'Выровнять столбцы') + btn('', 'Расширить') + btn('', 'Положение в тексте') +
              btn('', 'Настроить таблицу') + btn('', 'Удалить таблицу', 'is-danger') + btn('', 'Ещё', 'tw-win-more-table')) +
          '</div>' +
          // Выделен диапазон ячеек (строки, столбцы, неполный диапазон, вся таблица): «Столбцы и строки» — вставка, удаления по правилам и меню; «Таблица» нет;
          // в «Ячейки» — Стиль текста, Фон, Границы, Объединить, Выровнять столбцы (несколько столбцов), удаления по правилам.
          '<div class="tw-win-groups tw-win-groups--sel sel-only">' +
            grp('Столбцы и строки', btn('', 'Добавить столбец') + btn('', 'Добавить строку') +
              btn('', 'Удалить столбец', 'is-danger') + btn('', 'Удалить строку', 'is-danger') +
              btn('', 'Ещё', 'tw-win-more-selrc')) +
            '<span class="tw-win-gsep" aria-hidden="true"></span>' +
            grp('Ячейки', btn('', 'Фон') + btn('', 'Стиль текста') + btn('', 'Границы') +
              btn(TableWindows.MENU_SVG.merge, 'Объединить') + btn(ADV_SVG.cols, 'Выровнять столбцы') +
              btn('', 'Настроить ячейки') +
              btn('', 'Ещё', 'tw-win-more-sel')) +
          '</div>' +
        '</div>' +
        '<div class="tw-win-right">' +
          '<div class="tw-win-cmds">' +
            '<button type="button" class="tw-win-round" title="Отменить" aria-label="Отменить">' + ico('') + '</button>' +
            '<button type="button" class="tw-win-round" title="Повторить" aria-label="Повторить">' + ico('') + '</button>' +
          '</div>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true"></span></button>' +
          '<div class="tw-win-cmds"><button type="button" class="tw-win-close" title="Закрыть" aria-label="Закрыть"><span class="twin-close24" aria-hidden="true"></span></button></div>' +
        '</div>' +
      '</div>';
    // Кнопки шапки не забирают курсор из ячейки.
    w.querySelector('.tw-win-head').addEventListener('mousedown', function (e) { e.preventDefault(); });
    // Кнопки тулбара окна запускают те же команды, что и тулбары в таблице (Toolbar.runCommand),
    // окна команд открываются тем же хостом окон: под кнопкой, на 4px ниже тулбара; «Настроить» — у объекта.
    const tools = w.querySelector('.tw-win-tools');
    const btnById = {};
    tools.querySelectorAll('.tw-win-btn:not(.tw-win-more-stub):not(.tw-win-more-cell):not(.tw-win-more-rowcol):not(.tw-win-more-selrc):not(.tw-win-more-table):not(.tw-win-more-sel)').forEach(function (b) {
      const id = Toolbar.commandByName(b.getAttribute('title'));
      if (id) (btnById[id] = btnById[id] || []).push(b);
    });
    const moreBtn = (btnById.more || [])[0] || document.createElement('button');   // меню «Ещё» в тулбаре окна пока не открывается
    // Кнопка команды — та, что сейчас видна (одна и та же команда есть и в группах, и в тулбаре выделения).
    function visibleBtn(id) { const list = btnById[id] || []; return list.filter(function (b) { return b.offsetParent; })[0] || list[0]; }
    const host = Toolbar.windowHost({ el: tools }, { button: visibleBtn, container: function () { return w; } });
    w._host = host;
    // Шапка залипает при скролле страницы — открытое меню / окно команды едет за тулбаром окна.
    window.addEventListener('scroll', function () { if (w.isConnected && host.openWin && !host.openWin.win._anchor) host.placeWindow(host.openWin.win, host.openWin.id); }, true);
    // Шапка залипла (ушла со своего места наверху окна) — показываем тень под ней.
    const head = w.querySelector('.tw-win-head');
    function syncStuck() {
      if (!w.isConnected) return;
      head.classList.toggle('is-stuck', head.getBoundingClientRect().top > w.getBoundingClientRect().top + 0.5);
      TableAPI.syncVStick();
    }
    window.addEventListener('scroll', syncStuck, true);
    window.addEventListener('resize', syncStuck);
    tools.querySelectorAll('.tw-win-btn').forEach(function (b) {
      const title = b.getAttribute('title');
      const id = Toolbar.commandByName(title);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        if (TableToggles.has(title)) { TableToggles.toggle(title); return; }
        if (b.classList.contains('tw-win-more-stub')) return;   // «Ещё» в группах — меню пока нет
        if (id && id !== 'more') Toolbar.runCommand(id, host);
      });
    });
    // «Заглавная строка» / «Заглавный столбец» — переключатели с общим состоянием (кнопки окна, пункты меню и окно «Таблица»; включение — фон #f8f8f8 и полужирный текст).
    function syncToggles() {
      w.querySelectorAll('.tw-win-btn.is-toggle').forEach(function (b) { b.setAttribute('aria-pressed', String(TableToggles.get(b.getAttribute('title')))); });
    }
    syncToggles();
    document.addEventListener('tw:toggles', syncToggles);
    // «Ещё» — меню команд: левый край меню = левый край кнопки, на 4px ниже тулбара. Состав меню — по активному элементу.
    const onCommand = function (id, menu) { Toolbar.runCommand(id, host, menu); };
    const closeMenus = function () { host.closeWindow(); };
    const menuFull = TableWindows.moreMenu(closeMenus, TableWindows.TABLE_MENU, onCommand);   // курсор в ячейке — как меню тулбара таблицы
    const menuNoCaret = TableWindows.moreMenu(closeMenus, TableWindows.ADV_NO_CARET_MENU, onCommand); // курсора в таблице нет
    const menuRows = TableWindows.moreMenu(closeMenus, TableWindows.ROWS_MENU, onCommand);            // выделена строка — как меню тулбара строк
    const menuCols = TableWindows.moreMenu(closeMenus, TableWindows.COLS_MENU, onCommand);            // выделен столбец — как меню тулбара столбцов
    const menuRange = TableWindows.moreMenu(closeMenus, TableWindows.RANGE_MENU, onCommand);          // неполный диапазон — как меню тулбара диапазона
    // «Ещё» группы «Ячейки» (выделен диапазон): те же меню, но без вставки, сдвига и удаления столбцов/строк —
    // они в меню группы «Столбцы и строки».
    const RC_NAMES = ['Добавить столбец/строку', 'Сдвинуть столбец/строку', 'Сдвинуть строку', 'Сдвинуть столбец', 'Удалить строку', 'Удалить столбец'];
    function stripRC(m) { return Object.assign({}, m, { include: m.include.filter(function (n) { return RC_NAMES.indexOf(n) < 0; }) }); }
    const selCellMenus = {
      rows: TableWindows.moreMenu(closeMenus, stripRC(TableWindows.ROWS_MENU), onCommand),
      cols: TableWindows.moreMenu(closeMenus, stripRC(TableWindows.COLS_MENU), onCommand),
      range: TableWindows.moreMenu(closeMenus, stripRC(TableWindows.RANGE_MENU), onCommand)
    };
    // «Ещё» группы «Столбцы и строки» при выделении: вставка, сдвиг и удаление по видам выделения
    // (строки — сдвиг и удаление строк; столбцы — столбцов; неполный диапазон или вся таблица — оба).
    const RC_REN = { 'Добавить столбец/строку': 'Вставить столбец/строку' };
    const selRCMenus = {
      rows: TableWindows.moreMenu(closeMenus, { include: ['Добавить столбец/строку', 'Сдвинуть строку', 'Удалить строку'], rename: RC_REN, noFoot: true }, onCommand),
      cols: TableWindows.moreMenu(closeMenus, { include: ['Добавить столбец/строку', 'Сдвинуть столбец', 'Удалить столбец'], rename: RC_REN, noFoot: true }, onCommand),
      range: TableWindows.moreMenu(closeMenus, { include: ['Добавить столбец/строку', 'Сдвинуть столбец/строку', 'Удалить столбец', 'Удалить строку'], rename: RC_REN, noFoot: true }, onCommand)
    };
    [selCellMenus.rows, selCellMenus.cols, selCellMenus.range, selRCMenus.rows, selRCMenus.cols, selRCMenus.range].forEach(function (m) { m.style.zIndex = '9'; w.appendChild(m); });
    function selKind() {
      const ctx = TableAPI.context();
      const R = ctx.range, n = TableAPI.columnCount(), last = document.querySelector('#tw-wrap .tw').rows.length - 1;
      const fullRows = R.c1 === 0 && R.c2 === n - 1, fullCols = R.r1 === 0 && R.r2 === last;
      return fullRows && !fullCols ? 'rows' : fullCols && !fullRows ? 'cols' : 'range';
    }
    const menuCell = TableWindows.moreMenu(closeMenus, TableWindows.ADV_CELL_MENU, onCommand);       // «Ещё» группы «Ячейка» (Figma 3665:261927)
    [menuFull, menuNoCaret, menuRows, menuCols, menuRange, menuCell].forEach(function (m) { m.style.zIndex = '9'; w.appendChild(m); });
    // «Ещё» группы «Ячейка»: меню под кнопкой; повторное нажатие (или нажатие при открытом окне команды из меню) — закрыть.
    const cellMoreBtn = tools.querySelector('.tw-win-more-cell');
    function groupMenu(btnEl, menu, opts, key) {
      btnById[key] = [btnEl];
      btnEl.setAttribute('aria-pressed', 'false');
      btnEl.addEventListener('click', function () {
        if (host.openWin && host.openWin.id === key) { host.closeWindow(); return; }
        const a = document.activeElement;
        const caret = !!(a && a.closest && a.closest('.tw td, .tw th') && w.contains(a));
        menu.querySelectorAll(':scope > .twin-mn-list > .twin-mn-item').forEach(function (it) {
          it.classList.toggle('is-disabled', !caret && opts.needsCaret.indexOf(it.dataset.name) >= 0);
        });
        host.toggleWindow(menu, key);
      });
    }
    groupMenu(cellMoreBtn, menuCell, TableWindows.ADV_CELL_MENU, 'cellMore');
    // «Ещё» группы «Столбцы и строки»: вставка, сдвиг и удаление столбцов и строк.
    const menuRowCol = TableWindows.moreMenu(closeMenus, TableWindows.ADV_ROWCOL_MENU, onCommand);
    menuRowCol.style.zIndex = '9'; w.appendChild(menuRowCol);
    groupMenu(tools.querySelector('.tw-win-more-rowcol'), menuRowCol, TableWindows.ADV_ROWCOL_MENU, 'rowcolMore');
    // «Ещё» тулбара выделения (строки, столбцы, неполный диапазон) — то же меню, что у плавающих тулбаров диапазонов.
    const selMoreBtn = tools.querySelector('.tw-win-more-sel');
    btnById.selMore = [selMoreBtn];
    selMoreBtn.setAttribute('aria-pressed', 'false');
    selMoreBtn.addEventListener('click', function () {
      if (host.openWin && host.openWin.id === 'selMore') { host.closeWindow(); return; }
      const menu = TableAPI.isRowSelection() ? selCellMenus.rows : TableAPI.isColSelection() ? selCellMenus.cols : selCellMenus.range;
      if (menu !== selCellMenus.rows) {
        // «Выровнять столбцы» — только если выделение задевает несколько столбцов (как в плавающих тулбарах).
        const ctx = TableAPI.context();
        const multi = !!(ctx && ctx.kind === 'range' && ctx.range.c2 > ctx.range.c1);
        menu.querySelectorAll('.twin-mn-item').forEach(function (it) {
          if (TableWindows.COLS_MENU.onlyMultiCol.indexOf(it.dataset.name) >= 0) it.hidden = !multi;
        });
      }
      host.toggleWindow(menu, 'selMore');
    });
    // «Ещё» группы «Столбцы и строки» тулбара выделения.
    const selRCBtn = tools.querySelector('.tw-win-more-selrc');
    btnById.selRCMore = [selRCBtn];
    selRCBtn.setAttribute('aria-pressed', 'false');
    selRCBtn.addEventListener('click', function () {
      if (host.openWin && host.openWin.id === 'selRCMore') { host.closeWindow(); return; }
      host.toggleWindow(selRCMenus[selKind()], 'selRCMore');
    });
    // «Ещё» группы «Таблица» (Figma 3665:275812): меню под кнопкой; повторное нажатие — закрыть.
    const menuTable = TableWindows.moreMenu(closeMenus, TableWindows.ADV_TABLE_MENU, onCommand);
    menuTable.style.zIndex = '9'; w.appendChild(menuTable);
    const tableMoreBtn = tools.querySelector('.tw-win-more-table');
    btnById.tableMore = [tableMoreBtn];
    tableMoreBtn.setAttribute('aria-pressed', 'false');
    tableMoreBtn.addEventListener('click', function () {
      if (host.openWin && host.openWin.id === 'tableMore') { host.closeWindow(); return; }
      host.toggleWindow(menuTable, 'tableMore');
    });
    moreBtn.setAttribute('aria-pressed', 'false');
    moreBtn.addEventListener('click', function () {
      // Открыто меню или окно команды, вызванной из меню (оно стоит под «Ещё»), — закрываем.
      if (host.openWin && host.openWin.id === 'more') { host.closeWindow(); return; }
      const a = document.activeElement;
      const caret = !!(a && a.closest && a.closest('.tw td, .tw th') && w.contains(a));
      const menu = TableAPI.isRowSelection() ? menuRows : TableAPI.isColSelection() ? menuCols : TableAPI.isRangeSelection() ? menuRange : caret ? menuFull : menuNoCaret;
      if (menu === menuCols || menu === menuRange) {
        // «Выровнять столбцы» — только если выделение задевает несколько столбцов (как в тулбарах столбцов и диапазона).
        const ctx = TableAPI.context();
        const multi = !!(ctx && ctx.kind === 'range' && ctx.range.c2 > ctx.range.c1);
        menu.querySelectorAll('.twin-mn-item').forEach(function (it) {
          if (TableWindows.COLS_MENU.onlyMultiCol.indexOf(it.dataset.name) >= 0) it.hidden = !multi;
        });
      }
      host.toggleWindow(menu, 'more');
    });
    // Доступность команд тулбара расширенного режима:
    // • выделен диапазон ячеек (строки, столбцы или неполный диапазон) — тулбар перестраивается: Вставить |
    //   Стиль текста, Фон, Границы, Настроить ячейку | Объединить, Выровнять столбцы (если выделено несколько столбцов),
    //   «Удалить» (выделены целые строки, целые столбцы или вся таблица — удаляет выделенное), для диапазона без полных строк
    //   и столбцов — «Удалить строку» и «Удалить столбец», Ещё;
    // • курсор стоит в ячейке — активны все команды;
    // • курсора нет — неактивны «Настроить ячейку» и «Разделить ячейку».
    const CARET_OFF = [];   // курсор в ячейке — активны все команды
    function selectionOn() {
      const ctx = TableAPI.context();
      const R = ctx.range, n = TableAPI.columnCount(), last = document.querySelector('#tw-wrap .tw').rows.length - 1;
      const fullRows = R.c1 === 0 && R.c2 === n - 1;
      const fullCols = R.r1 === 0 && R.r2 === last;
      const on = ['Добавить столбец', 'Добавить строку', 'Стиль текста', 'Фон', 'Границы', 'Объединить', 'Настроить ячейки', 'Ещё'];
      if (R.c2 > R.c1) on.push('Выровнять столбцы');   // несколько ячеек в ряд
      // Только строки — «Удалить строку»; только столбцы — «Удалить столбец»; вся таблица или неполный диапазон — обе.
      if (fullRows && !fullCols) on.push('Удалить строку');
      else if (fullCols && !fullRows) on.push('Удалить столбец');
      else on.push('Удалить столбец', 'Удалить строку');
      return on;
    }
    const tbtns = Array.from(w.querySelectorAll('.tw-win-tools .tw-win-btn'));
    tbtns.forEach(function (b) { b.dataset.danger = (b.classList.contains('is-danger') || b.classList.contains('caret-danger')) ? '1' : ''; b.dataset.cmd = b.getAttribute('title'); });
    const cellCfgBtn = tools.querySelector('.tw-win-btn.has-label[title="Настроить ячейку"]');
    // «Объединить» нажата, когда активна объединённая ячейка (как кнопка в тулбарах таблицы).
    const mergeBtn = tools.querySelector('.tw-win-btn[title="Объединить"]');
    const expandBtn = tools.querySelector('.tw-win-btn[title="Расширить"]');
    new MutationObserver(function () { syncCaret(); }).observe(scroll.querySelector('.tw'), { attributes: true, attributeFilter: ['style'] });
    function syncCaret() {
      if (mergeBtn && window.TableAPI) mergeBtn.setAttribute('aria-pressed', String(TableAPI.isMergedActive()));
      if (expandBtn && window.TableAPI) {
        // Пока таблица расширена, кнопка «Расширить» становится «Уменьшить» (иконка U+EBC0) — возвращает ширину текста.
        const on = TableAPI.isExpanded();
        expandBtn.title = on ? 'Уменьшить' : 'Расширить';
        expandBtn.setAttribute('aria-label', expandBtn.title);
        expandBtn.querySelector('.tw-win-ico').textContent = on ? '\uebc0' : '\uea79';
      }
      const a = document.activeElement;
      const caret = !!(a && a.closest && a.closest('.tw td, .tw th') && w.contains(a));
      const rowSel = !!(window.TableAPI && TableAPI.isRowSelection());
      const colSel = !rowSel && !!(window.TableAPI && TableAPI.isColSelection());
      const rangeSel = !rowSel && !colSel && !!(window.TableAPI && TableAPI.isRangeSelection());
      const selOn = rowSel || colSel || rangeSel ? selectionOn() : null;
      // Выделен диапазон — тулбар перестраивается: Вставить | Стиль текста, Фон, Границы, Настроить ячейку |
      // Объединить, Выровнять столбцы (несколько столбцов), удаления по правилам, Ещё. Не подходящие кнопки скрыты.
      // «Настроить ячейку» → «Настроить ячейки», если выделено несколько ячеек.
      const ctxR = selOn && TableAPI.context().range;
      const many = !!(ctxR && (ctxR.r2 > ctxR.r1 || ctxR.c2 > ctxR.c1));
      const cfgName = many ? 'Настроить ячейки' : 'Настроить ячейку';
      if (cellCfgBtn && cellCfgBtn.title !== cfgName) {
        cellCfgBtn.title = cfgName; cellCfgBtn.setAttribute('aria-label', cfgName);
        cellCfgBtn.querySelector('.tw-win-label').textContent = cfgName;
      }
      tools.querySelectorAll('.no-sel').forEach(function (x) { x.hidden = !!selOn; });
      tools.querySelectorAll('.sel-only').forEach(function (x) { x.hidden = !selOn; });
      tbtns.forEach(function (b) {
        const title = b.dataset.cmd;
        // Без выделения группы «Вставка | Ячейка | Таблица» видны целиком; при выделении — группы выделения, кнопки по правилам.
        if (b.closest('.tw-win-groups--sel')) b.hidden = !selOn || selOn.indexOf(title) < 0;
        else b.hidden = false;
        if (b.hidden) return;
        const off = selOn ? false : caret ? CARET_OFF.indexOf(title) >= 0 : b.classList.contains('needs-caret');
        b.disabled = off;
        b.classList.toggle('is-readonly', off);
        b.classList.toggle('is-danger', !off && b.dataset.danger === '1');
      });
    }
    w.addEventListener('focusin', syncCaret);
    w.addEventListener('focusout', function () { setTimeout(syncCaret, 0); });
    scroll.querySelector('.tw').addEventListener('tw:selection', function () { setTimeout(syncCaret, 0); });
    w._syncCaret = syncCaret;
    w.querySelector('.tw-win-close').addEventListener('click', function () { cancel(); });   // крестик — изменения сбрасываются
    w.querySelector('.twin-done').addEventListener('click', function () { close(); });           // галка — изменения остаются
    return w;
  }
  // Окно по ширине таблицы: таблица + поля 10px слева и справа. Меняется ширина таблицы — меняется и окно.
  const table = scroll.querySelector('.tw');
  function fitWidth() {
    if (!win || !win.isConnected) return;
    // Таблица в скролле — окно по видимой части таблицы.
    win.style.width = Math.min(table.getBoundingClientRect().width, TableAPI.hscrollView()) + 'px';   // content-box: + поля 10px по бокам
  }
  new ResizeObserver(fitWidth).observe(table);
  // Курсор при открытии окна: остаётся в той же ячейке и на том же месте текста;
  // если курсора в таблице не было — встаёт в начало верхней левой ячейки.
  function caretCell() {
    const a = document.activeElement;
    return a && table.contains(a) && a.closest('th, td') ? a.closest('th, td') : null;
  }
  // pos — { node, offset }: место курсора (узел и смещение, а не Range — Range при переносе таблицы схлопывается).
  function restoreCaret(cell, pos) {
    if (!cell || !cell.isConnected) { cell = table.rows[0] && table.rows[0].cells[0]; pos = null; }
    if (!cell) return;
    cell.focus({ preventScroll: true });
    const sel = window.getSelection();
    const range = document.createRange();
    if (pos && cell.contains(pos.node)) range.setStart(pos.node, pos.offset);
    else range.setStart(cell, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function open() {
    if (win && win.isConnected) return;
    const cell = caretCell();
    const sel = window.getSelection();
    const r = cell && sel.rangeCount ? sel.getRangeAt(0) : null;
    const pos = r && cell.contains(r.startContainer) ? { node: r.startContainer, offset: r.startOffset } : null;
    // Плавающий тулбар, из которого переходим (если виден) — запоминаем его место для анимации.
    const srcTb = Array.from(document.querySelectorAll('#tw-wrap > .tb')).find(function (t) { return !t.hidden && t.offsetParent; });
    const ghost = srcTb ? srcTb.cloneNode(true) : null;
    const r0 = srcTb ? srcTb.getBoundingClientRect() : null;
    win = win || build();
    // Ширина колонки таблицы фиксируется, чтобы ширина окна не влияла на ширину таблицы (иначе они раздували бы друг друга).
    const cs = getComputedStyle(scroll);
    scroll.style.width = (scroll.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px';
    widget.insertBefore(win, scroll);
    win.appendChild(scroll);
    fitWidth();
    restoreCaret(cell, pos);   // перенос таблицы в окно сбрасывает фокус — возвращаем курсор
    if (win._syncCaret) win._syncCaret();
    document.documentElement.classList.add('tw-in-window');
    window.dispatchEvent(new Event('resize'));   // тулбары и хэндлеры пересчитывают положение
    openMark = TableAPI.historyMark();
    // Переход в расширенный режим — без анимации (по правке пользователя); animateOpen оставлена, но не вызывается.
    void ghost; void r0;
  }
  // Крестик / Esc: сбросить изменения, сделанные в окне расширенного режима, и закрыть его.
  let openMark = 0;
  function cancel() {
    if (!win || !win.isConnected || closing) return;
    if (win._host) win._host.closeWindow();
    TableAPI.revertTo(openMark);
    close();
  }
  // Плавный переход в расширенный режим (≈300 мс): плавающий тулбар перелетает на место тулбара окна и растягивается
  // до его ширины (копия старого тулбара гаснет, тулбар окна проявляется), рамка окна и кнопки справа проявляются.
  const OPEN_MS = 300, CLOSE_MS = 300, EASE = 'cubic-bezier(.2,.7,.2,1)';
  function animateOpen(ghost, r0) {
    if (!win.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tools = win.querySelector('.tw-win-tools');
    const bg = getComputedStyle(win).backgroundColor, sh = getComputedStyle(win).boxShadow;
    win.animate([{ backgroundColor: 'rgba(236,234,245,0)', boxShadow: 'none' }, { backgroundColor: bg, boxShadow: sh }], { duration: OPEN_MS, easing: 'ease-out' });
    win.querySelector('.tw-win-right').animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: 'ease-out' });
    if (!ghost || !r0) { tools.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: 'ease-out' }); return; }
    const r1 = tools.getBoundingClientRect();
    const dx = r0.left - r1.left, dy = r0.top - r1.top;
    const cut = Math.max(0, r1.width - r0.width);
    tools.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px)', clipPath: 'inset(0 ' + cut + 'px 0 0 round 14px)', opacity: 0 },
      { opacity: 1, offset: .6 },
      { transform: 'none', clipPath: 'inset(0 0 0 0 round 14px)', opacity: 1 }
    ], { duration: OPEN_MS, easing: EASE });
    // Копия плавающего тулбара — поверх всего, летит туда же и гаснет.
    ghost.hidden = false;
    ghost.removeAttribute('id');
    Object.assign(ghost.style, { position: 'fixed', left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px',
      margin: '0', zIndex: '50', pointerEvents: 'none', display: 'flex' });
    document.body.appendChild(ghost);
    const a = ghost.animate([
      { transform: 'none', opacity: 1 },
      { transform: 'translate(' + (-dx) + 'px,' + (-dy) + 'px)', opacity: 0 }
    ], { duration: OPEN_MS * .7, easing: EASE, fill: 'forwards' });
    a.onfinish = function () { ghost.remove(); };
  }
  // Закрытие с обратной анимацией (≈300 мс): окно убирается сразу, а его тулбар (копия) перетекает в плавающий тулбар —
  // едет на его место и сжимается до его ширины, гаснет, а настоящий плавающий тулбар проявляется оттуда же;
  // фон окна (копия под таблицей) и кнопки справа гаснут. instant — без анимации (например, когда таблицу удаляют).
  let closing = false;
  function close(instant) {
    if (!win || !win.isConnected || closing) return;
    if (win._host) win._host.closeWindow();
    const animate = false;   // выход из расширенного режима — без анимации (по правке пользователя)
    void instant;
    if (!animate) { teardown(); return; }
    closing = true;
    const tools = win.querySelector('.tw-win-tools'), right = win.querySelector('.tw-win-right');
    const r1 = tools.getBoundingClientRect(), rr = right.getBoundingClientRect(), rw = win.getBoundingClientRect();
    const cs = getComputedStyle(win);
    function fixedAt(el, r, z) {
      Object.assign(el.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
        margin: '0', boxSizing: 'border-box', zIndex: z, pointerEvents: 'none' });
      document.body.appendChild(el);
      return el;
    }
    const toolsGhost = fixedAt(tools.cloneNode(true), r1, '50');
    const rightGhost = fixedAt(right.cloneNode(true), rr, '50');
    const frame = document.createElement('div');
    Object.assign(frame.style, { background: cs.backgroundColor, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow });
    fixedAt(frame, rw, '8');   // поверх текста страницы, как окно; таблица на время анимации поднята над ним
    const tbl = scroll.querySelector('.tw');
    tbl.style.background = '#fff';   // пока гаснет фон окна, таблица остаётся белой
    scroll.style.position = 'relative'; scroll.style.zIndex = '9';
    document.documentElement.classList.add('tw-closing');
    teardown();
    // Плавающий тулбар встаёт на место после пересчёта положения — ждём два кадра.
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      document.documentElement.classList.remove('tw-closing');
      const tb = Array.from(document.querySelectorAll('#tw-wrap > .tb')).find(function (t) { return !t.hidden && t.offsetParent; });
      const r0 = tb ? tb.getBoundingClientRect() : { left: r1.left, top: r1.top, width: Math.min(r1.width, 380) };
      const dx = r0.left - r1.left, dy = r0.top - r1.top, cut = Math.max(0, r1.width - r0.width);
      const opts = { duration: CLOSE_MS, easing: EASE, fill: 'forwards' };
      const a = toolsGhost.animate([
        { transform: 'none', clipPath: 'inset(0 0 0 0 round 14px)', opacity: 1 },
        { opacity: 1, offset: .5 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px)', clipPath: 'inset(0 ' + cut + 'px 0 0 round 14px)', opacity: 0 }
      ], opts);
      if (tb) tb.animate([
        { transform: 'translate(' + (-dx) + 'px,' + (-dy) + 'px)', opacity: 0 },
        { opacity: 0, offset: .4 },
        { transform: 'none', opacity: 1 }
      ], { duration: CLOSE_MS, easing: EASE });
      rightGhost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS * .6, easing: 'ease-out', fill: 'forwards' });
      frame.animate([{ opacity: 1 }, { opacity: 0 }], opts);
      a.onfinish = function () {
        toolsGhost.remove(); rightGhost.remove(); frame.remove();
        tbl.style.background = '';
        scroll.style.position = ''; scroll.style.zIndex = '';
        closing = false;
      };
    }); });
  }
  function teardown() {
    // Курсор остаётся в той же ячейке и на том же месте текста (перенос таблицы из окна сбрасывает фокус).
    const cell = caretCell();
    const sel = window.getSelection();
    const r = cell && sel.rangeCount ? sel.getRangeAt(0) : null;
    const pos = r && cell.contains(r.startContainer) ? { node: r.startContainer, offset: r.startOffset } : null;
    widget.insertBefore(scroll, win);
    scroll.style.width = '';
    win.remove();
    if (cell && cell.isConnected) restoreCaret(cell, pos);
    document.documentElement.classList.remove('tw-in-window');
    window.dispatchEvent(new Event('resize'));
  }
  // Маркер больше не открывает окно расширенного режима — он выделяет всю таблицу (обработчик в скрипте таблицы).
  // Esc: сначала закрывает открытое меню «Ещё» или окно команды, следующим нажатием — окно расширенного режима.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !win || !win.isConnected) return;
    e.stopImmediatePropagation();
    const inner = win.querySelector('.twin--bdcolor:not([hidden])');   // вложенное окно цвета — закрывается первым
    if (inner && inner.offsetParent) { inner.hidden = true; return; }
    // Открытое окно команды закрывается как по крестику (изменения сбрасываются), затем — окно расширенного режима (тоже со сбросом).
    if (win._host && win._host.openWin) {
      const ow = win._host.openWin.win;
      const x = ow.querySelector(':scope > .twin-head .twin-close, :scope > .twin-close');
      if (x) x.click(); else win._host.closeWindow();
      return;
    }
    cancel();
  }, true);
  window.TableWindow = { open: open, close: close, isOpen: function () { return !!(win && win.isConnected); } };
})();
