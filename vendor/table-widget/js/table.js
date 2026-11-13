(function () {
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  // После отмены разметка таблицы пересоздаётся, поэтому части таблицы ищем каждый раз заново.
  const widget = wrap.closest('.table-widget');   // весь блок таблицы (для «Удалить таблицу»)
  function documentSelectionActive() {
    return document.documentElement.classList.contains('doc-selecting') || widget.classList.contains('is-fully-selected');
  }
  function colgroup() { return table.querySelector('colgroup'); }
  function tbody() { return table.tBodies[0]; }
  const MIN_COL = 40;    // минимальная ширина столбца (как при перетаскивании границ); уже не сжать — таблица прокручивается

  /* ---------- Редактирование текста в ячейках ---------- */
  // Каждая ячейка — отдельное поле ввода: курсор остаётся внутри ячейки,
  // Tab / Shift+Tab переходят к следующей / предыдущей ячейке.
  const probe = document.createElement('div');
  probe.contentEditable = 'plaintext-only';
  const plainOnly = probe.contentEditable === 'plaintext-only';

  function makeEditable(cell) {
    cell.contentEditable = plainOnly ? 'plaintext-only' : 'true';
  }

  if (!plainOnly) {
    // Запасной вариант для старых браузеров: вставка только текста, Enter = новая строка.
    table.addEventListener('paste', function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
    table.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertText', false, '\n');
      }
    });
  }

  table.querySelectorAll('th, td').forEach(makeEditable);

  /* ---------- Сетка таблицы с учётом объединённых ячеек ----------
     Ячейка может занимать несколько столбцов (colspan) и несколько строк (rowspan).
     gridMap() раскладывает таблицу в сетку: для каждой ячейки — строка r, первый столбец start,
     ширина span и высота rspan в ячейках сетки. */
  function gridMap() {
    const rows = Array.from(table.rows);
    const busy = rows.map(function () { return []; });
    const all = [];
    const byRow = rows.map(function (row, r) {
      let c = 0;
      return Array.from(row.cells).map(function (cell) {
        while (busy[r][c]) c++;
        const it = { cell: cell, r: r, start: c, span: cell.colSpan || 1, rspan: Math.min(cell.rowSpan || 1, rows.length - r) };
        for (let rr = r; rr < r + it.rspan; rr++) for (let cc = c; cc < c + it.span; cc++) busy[rr][cc] = it;
        c += it.span;
        all.push(it);
        return it;
      });
    });
    return { rows: byRow, all: all, busy: busy };
  }
  // Ячейки, которые начинаются в этой строке (свои ячейки строки).
  function layout(row) {
    return gridMap().rows[row.rowIndex];
  }
  // Все ячейки, которые занимают строку r: свои и спущенные сверху через rowspan.
  function covering(g, r) {
    return g.all.filter(function (it) { return it.r <= r && r < it.r + it.rspan; });
  }
  function itemOf(cell, g) {
    return (g || gridMap()).all.find(function (it) { return it.cell === cell; });
  }
  function columnCount() {
    return gridMap().all.reduce(function (n, it) { return Math.max(n, it.start + it.span); }, 0);
  }
  function startOf(cell) {
    return itemOf(cell).start;
  }

  // Крайние ячейки получают классы вместо :last-child: при объединениях последний элемент строки
  // не обязательно стоит у правого края, а последняя строка — не единственная, что касается низа.
  function syncEdges() {
    const g = gridMap(), n = columnCount(), rows = table.rows.length;
    g.all.forEach(function (it) {
      it.cell.classList.toggle('edge-r', it.start + it.span === n);
      it.cell.classList.toggle('edge-b', it.r + it.rspan === rows);
      it.cell.classList.toggle('edge-l', it.start === 0);
      it.cell.classList.toggle('edge-t', it.r === 0);
    });
  }

  function updateMinWidth() {
    // Таблица, расширенная вручную, может быть шире колонки документа — тогда она прокручивается.
    const own = parseFloat(table.style.width) || 0;
    // --tw-minw — ширина таблицы, когда столбцы при вставке уже не помещаются (все минимальной ширины): таблица уходит в скролл.
    const minw = parseFloat(table.style.getPropertyValue('--tw-minw')) || 0;
    wrap.style.minWidth = Math.max(560, columnCount() * MIN_COL, own, expandedWidth(), minw) + 'px';
    if (typeof syncHScroll === 'function') syncHScroll();
  }
  /* ---------- «Расширить»: таблица на ширину экрана ----------
     Ширина — до краёв экрана с отступами 20px, но не больше 1400px; таблица стоит по центру экрана.
     Состояние хранится в стиле таблицы (--tw-expand), поэтому отменяется Ctrl+Z; повторное нажатие возвращает обычную ширину. */
  const EXPAND_MAX = 1400, EXPAND_GAP = 20;
  function isExpanded() { return table.style.getPropertyValue('--tw-expand').trim() === '1'; }
  // Область документа между сайдбарами (белая колонка); «края экрана» для расширенной таблицы — её края.
  function contentArea() {
    const c = document.querySelector('.app-center');
    if (!c) return { left: 0, width: document.documentElement.clientWidth };
    const r = c.getBoundingClientRect();
    return { left: r.left, width: r.width };
  }
  function expandedWidth() {
    if (!isExpanded()) return 0;
    return Math.min(EXPAND_MAX, contentArea().width - 2 * EXPAND_GAP);
  }

  // Доли ширины столбцов в %, если ширины уже меняли вручную; иначе null.
  function columnShares() {
    const cols = Array.from(colgroup().children);
    if (!cols.length || !cols.every(function (c) { return /%$/.test(c.style.width); })) return null;
    return cols.map(function (c) { return parseFloat(c.style.width); });
  }

  function newCell(tag) {
    const cell = document.createElement(tag);
    if (tag === 'th') cell.scope = 'col';
    makeEditable(cell);
    return cell;
  }
  function tagFor(row) { return row.parentElement.tagName === 'THEAD' ? 'th' : 'td'; }

  // Вставить ячейку в строку так, чтобы она встала в столбец col сетки.
  function placeCellAt(g, r, cell) {
    const row = table.rows[r];
    const col = cell.__col;
    const next = g.rows[r].find(function (it) { return it.start > col; });
    row.insertBefore(cell, next ? next.cell : null);
  }

  function focusCell(cell) {
    cell.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ---------- Вставка столбца: новый столбец встаёт на позицию index ---------- */
  /* Ширины столбцов при вставке:
     1) новый столбец шириной с исходный; все столбцы пропорционально ужимаются, чтобы поместиться в ширину таблицы;
     2) исходный — столбец слева от места вставки (для плюсов между столбцами), у самого левого края — первый столбец;
        команда «Слева» берёт за исходный столбец ячейки с курсором (src);
     3) столбцы, которые до вставки уже были минимальной ширины, не ужимаются; кто стал бы уже минимума — встаёт на минимум;
     4) если все столбцы минимальной ширины (или стали бы уже), таблица становится шире колонки и уходит в скролл. */
  function insertColumn(index, src) {
    const cg = colgroup();
    const e = colEdges();
    const w = e.slice(0, -1).map(function (x, i) { return e[i + 1] - x; });
    const W = w.reduce(function (a, b) { return a + b; }, 0);
    if (src === undefined) src = index > 0 ? index - 1 : 0;
    src = Math.max(0, Math.min(w.length - 1, src));
    const arr = w.slice();
    arr.splice(index, 0, w[src]);
    const atMin = arr.map(function (x) { return x <= MIN_COL + 0.5; });
    const res = arr.slice();
    // Сжимаем гибкие столбцы пропорционально; кто ушёл бы ниже минимума — фиксируем на минимуме и пересчитываем.
    let flex = arr.map(function (_, i) { return !atMin[i]; });
    for (let guard = 0; guard <= arr.length; guard++) {
      const fixedSum = res.reduce(function (a, x, i) { return a + (flex[i] ? 0 : x); }, 0);
      const flexSum = arr.reduce(function (a, x, i) { return a + (flex[i] ? x : 0); }, 0);
      if (!flexSum) break;
      const k = Math.max(0, (W - fixedSum) / flexSum);
      let clamped = false;
      arr.forEach(function (x, i) {
        if (!flex[i]) return;
        if (x * k < MIN_COL) { res[i] = MIN_COL; flex[i] = false; clamped = true; }
        else res[i] = x * k;
      });
      if (!clamped) break;
    }
    const total = res.reduce(function (a, b) { return a + b; }, 0);
    const col = document.createElement('col');
    cg.insertBefore(col, cg.children[index] || null);
    Array.from(cg.children).forEach(function (c, i) { c.style.width = (res[i] / total * 100) + '%'; });
    // Не поместились — таблица шире на нужную величину и прокручивается.
    if (total > W + 0.5) table.style.setProperty('--tw-minw', Math.ceil(total) + 'px');

    const g = gridMap();
    let first = null;
    Array.from(table.rows).forEach(function (row, r) {
      const cov = covering(g, r);
      const spanning = cov.find(function (it) { return it.start < index && index < it.start + it.span; });
      if (spanning) {
        // Линия вставки проходит внутри объединённой ячейки — ячейка становится шире (один раз).
        if (spanning.r === r) spanning.cell.colSpan = spanning.span + 1;
        return;
      }
      const cell = newCell(tagFor(row));
      const next = g.rows[r].find(function (it) { return it.start >= index; });
      row.insertBefore(cell, next ? next.cell : null);
      if (!first) first = cell;
    });

    updateMinWidth();
    return first;
  }

  /* ---------- Вставка строки: новая строка встаёт после строки afterIndex ---------- */
  function insertRow(afterIndex) {
    const g = gridMap();
    const n = columnCount();
    const row = document.createElement('tr');
    // Ячейки, объединённые по вертикали через эту границу, становятся на строку выше.
    const crossing = g.all.filter(function (it) { return it.r <= afterIndex && afterIndex + 1 < it.r + it.rspan; });
    const taken = [];
    crossing.forEach(function (it) {
      it.cell.rowSpan = it.rspan + 1;
      for (let c = it.start; c < it.start + it.span; c++) taken[c] = true;
    });
    for (let c = 0; c < n; c++) if (!taken[c]) row.appendChild(newCell('td'));
    const body = tbody();
    const next = table.rows[afterIndex + 1];
    if (next && next.parentElement === body) body.insertBefore(row, next);
    else if (afterIndex === 0) body.insertBefore(row, body.firstElementChild);
    else body.appendChild(row);
    return row;
  }

  /* ---------- Удаление строки ---------- */
  function deleteRow(r) {
    if (r <= 0 || r >= table.rows.length) return false;    // строку шапки не удаляем
    const g = gridMap();
    const row = table.rows[r];
    // Ячейки сверху, протянутые через эту строку, становятся на строку короче.
    g.all.forEach(function (it) {
      if (it.r < r && r < it.r + it.rspan) it.cell.rowSpan = it.rspan - 1;
    });
    // Свои ячейки строки, протянутые вниз, переезжают в следующую строку.
    const moving = g.rows[r].filter(function (it) { return it.rspan > 1; });
    row.remove();
    if (moving.length) {
      const g2 = gridMap();
      moving.forEach(function (it) {
        it.cell.rowSpan = it.rspan - 1;
        it.cell.__col = it.start;
        placeCellAt(g2, r, it.cell);
      });
    }
    return true;
  }

  /* ---------- Удаление столбца ---------- */
  function deleteColumn(c) {
    const n = columnCount();
    if (n <= 1 || c < 0 || c >= n) return false;           // последний столбец не удаляем
    const ew0 = colEdges(), cw0 = ew0[c + 1] - ew0[c];     // ширина удаляемого столбца, px
    const g = gridMap();
    g.all.forEach(function (it) {
      if (it.start <= c && c < it.start + it.span) {
        if (it.span > 1) it.cell.colSpan = it.span - 1;
        else it.cell.remove();
      }
    });
    const cg = colgroup();
    const shares = columnShares();
    // Таблица была шире колонки из-за вставок — уменьшаем её на ширину удалённого столбца (влезла — скролла больше нет).
    const minw = parseFloat(table.style.getPropertyValue('--tw-minw')) || 0;
    if (minw) {
      const left = minw - cw0;
      if (left <= widget.getBoundingClientRect().width) table.style.removeProperty('--tw-minw');
      else table.style.setProperty('--tw-minw', Math.ceil(left) + 'px');
    }
    cg.children[c].remove();
    if (shares) {
      const rest = shares.filter(function (_, i) { return i !== c; });
      const sum = rest.reduce(function (a, b) { return a + b; }, 0);
      Array.from(cg.children).forEach(function (col, i) { col.style.width = (rest[i] / sum * 100) + '%'; });
    }
    updateMinWidth();
    return true;
  }

  /* ---------- Объединение и разделение ячеек ---------- */
  // Можно ли объединить прямоугольник: больше одной ячейки и не через границу шапки.
  function canMerge(range) {
    if (!range) return false;
    if (range.r1 === 0 && range.r2 > 0) return false;      // шапка и тело таблицы не объединяются
    const g = gridMap();
    const inside = g.all.filter(function (it) {
      return it.r >= range.r1 && it.r <= range.r2 && it.start >= range.c1 && it.start <= range.c2;
    });
    return inside.length > 1;
  }
  function mergeRange(range) {
    const g = gridMap();
    const inside = g.all.filter(function (it) {
      return it.r >= range.r1 && it.r <= range.r2 && it.start >= range.c1 && it.start <= range.c2;
    });
    inside.sort(function (a, b) { return a.r - b.r || a.start - b.start; });
    const keep = inside[0];
    // Текст объединённых ячеек собирается в одну, по строке на ячейку.
    const texts = inside.map(function (it) { return it.cell.textContent; }).filter(function (t) { return t.trim() !== ''; });
    inside.slice(1).forEach(function (it) { it.cell.remove(); });
    keep.cell.textContent = texts.join('\n');
    keep.cell.colSpan = range.c2 - range.c1 + 1;
    keep.cell.rowSpan = range.r2 - range.r1 + 1;
    return keep.cell;
  }
  function isMerged(cell) { return (cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1; }
  function splitCell(cell) {
    const g = gridMap();
    const it = itemOf(cell, g);
    cell.colSpan = 1;
    cell.rowSpan = 1;
    const created = [];
    for (let r = it.r; r < it.r + it.rspan; r++) {
      for (let c = it.start; c < it.start + it.span; c++) {
        if (r === it.r && c === it.start) continue;
        const nc = newCell(tagFor(table.rows[r]));
        nc.__col = c;
        created.push({ r: r, cell: nc });
      }
    }
    // Новые ячейки ставим по одной, каждый раз пересчитывая сетку.
    created.forEach(function (x) { placeCellAt(gridMap(), x.r, x.cell); });
    return cell;
  }

  /* ---------- Разделить ячейку на две (подменю «Разделить ячейку») ----------
     По вертикали: объединённая по горизонтали ячейка делится по своим столбцам пополам; обычная — появляется новый
     столбец сетки: ширина столбца делится пополам, остальные ячейки этого столбца растягиваются на оба (colspan + 1).
     По горизонтали: объединённая по вертикали — делится по своим строкам; обычная — под строкой появляется новая строка,
     остальные ячейки строки растягиваются на обе (rowspan + 1). В шапке новая строка тоже становится строкой шапки. */
  function splitCellVertical(cell) {
    const g = gridMap();
    const it = itemOf(cell, g);
    const tag = cell.tagName.toLowerCase();
    const nc = newCell(tag);
    if (it.rspan > 1) nc.rowSpan = it.rspan;
    if (it.span > 1) {
      const a = Math.ceil(it.span / 2);
      cell.colSpan = a;
      if (it.span - a > 1) nc.colSpan = it.span - a;
      cell.after(nc);
      return nc;
    }
    const c = it.start;
    const e = colEdges(), n = e.length - 1;
    const widths = []; for (let i = 0; i < n; i++) widths.push(e[i + 1] - e[i]);
    const total = widths.reduce(function (x, y) { return x + y; }, 0);
    const shares = widths.map(function (w) { return w / total * 100; });
    shares.splice(c, 1, shares[c] / 2, shares[c] / 2);
    g.all.forEach(function (x) { if (x.cell !== cell && x.start <= c && c < x.start + x.span) x.cell.colSpan = x.span + 1; });
    cell.after(nc);
    const cg = colgroup();
    cg.insertBefore(document.createElement('col'), cg.children[c + 1] || null);
    Array.from(cg.children).forEach(function (col, i) { col.style.width = shares[i] + '%'; });
    updateMinWidth();
    return nc;
  }
  function splitCellHorizontal(cell) {
    const g = gridMap();
    const it = itemOf(cell, g);
    const tag = cell.tagName.toLowerCase();
    const nc = newCell(tag);
    if (it.span > 1) nc.colSpan = it.span;
    if (it.rspan > 1) {
      const a = Math.ceil(it.rspan / 2);
      cell.rowSpan = a;
      if (it.rspan - a > 1) nc.rowSpan = it.rspan - a;
      nc.__col = it.start;
      placeCellAt(gridMap(), it.r + a, nc);
      return nc;
    }
    const row = table.rows[it.r];
    covering(g, it.r).forEach(function (x) { if (x.cell !== cell) x.cell.rowSpan = x.rspan + 1; });
    const tr = document.createElement('tr');
    tr.appendChild(nc);
    row.after(tr);
    return nc;
  }

  /* ---------- Разделить ячейку на несколько (окно «Разделение ячейки») ----------
     Ячейка делится на cols столбцов × rows строк. Если столбцов (строк) сетки внутри ячейки не хватает, после её последнего
     столбца (строки) добавляются новые: ширина последнего столбца делится поровну, остальные ячейки этого столбца / строки
     растягиваются (colspan / rowspan). Затем столбцы и строки ячейки раздаются частям поровну (лишние — первым частям). */
  function splitInto(cell, cols, rows) {
    let g = gridMap(), it = itemOf(cell, g);
    const k = Math.max(0, cols - it.span);
    if (k) {
      const cLast = it.start + it.span - 1;
      const e = colEdges(), n = e.length - 1;
      const widths = []; for (let i = 0; i < n; i++) widths.push(e[i + 1] - e[i]);
      const total = widths.reduce(function (x, y) { return x + y; }, 0);
      const shares = widths.map(function (w) { return w / total * 100; });
      const part = shares[cLast] / (k + 1);
      shares.splice.apply(shares, [cLast, 1].concat(Array.apply(null, Array(k + 1)).map(function () { return part; })));
      g.all.forEach(function (x) { if (x.start <= cLast && cLast < x.start + x.span) x.cell.colSpan = x.span + k; });
      const cg = colgroup();
      for (let i = 0; i < k; i++) cg.insertBefore(document.createElement('col'), cg.children[cLast + 1] || null);
      Array.from(cg.children).forEach(function (col, i) { col.style.width = shares[i] + '%'; });
    }
    g = gridMap(); it = itemOf(cell, g);
    const m = Math.max(0, rows - it.rspan);
    if (m) {
      const rLast = it.r + it.rspan - 1;
      covering(g, rLast).forEach(function (x) { x.cell.rowSpan = x.rspan + m; });
      let after = table.rows[rLast];
      for (let i = 0; i < m; i++) { const tr = document.createElement('tr'); after.after(tr); after = tr; }
    }
    g = gridMap(); it = itemOf(cell, g);
    function parts(total, n) {
      const base = Math.floor(total / n), extra = total % n, out = [];
      let at = 0;
      for (let i = 0; i < n; i++) { const sz = base + (i < extra ? 1 : 0); out.push({ at: at, size: sz }); at += sz; }
      return out;
    }
    const cp = parts(it.span, cols), rp = parts(it.rspan, rows);
    const r0 = it.r, c0 = it.start;
    // Места вставки считаем по согласованной сетке (ячейка ещё целиком закрывает область):
    // в первой строке части встают сразу за ячейкой, в остальных — перед первой ячейкой правее области.
    const anchors = rp.map(function (rr) {
      if (!rr.at) return null;
      const next = g.rows[r0 + rr.at].find(function (x) { return x.start > c0; });
      return next ? next.cell : null;
    });
    cell.colSpan = cp[0].size; cell.rowSpan = rp[0].size;
    rp.forEach(function (rr, i) {
      const tr = table.rows[r0 + rr.at];
      let prev = i ? null : cell;
      cp.forEach(function (cc, j) {
        if (!i && !j) return;
        const nc = newCell(tagFor(tr));
        if (cc.size > 1) nc.colSpan = cc.size;
        if (rr.size > 1) nc.rowSpan = rr.size;
        if (prev) prev.after(nc); else tr.insertBefore(nc, anchors[i]);
        prev = nc;
      });
    });
    updateMinWidth();
    return cell;
  }

  /* ---------- История изменений: Ctrl+Z / Cmd+Z — отменить, Ctrl+Shift+Z / Ctrl+Y — вернуть ---------- */
  // Шаг истории — снимок таблицы и положения курсора до изменения.
  const undoStack = [];
  const redoStack = [];
  const HISTORY_LIMIT = 200;
  const TYPING_PAUSE = 1000;   // набор текста без пауз дольше секунды — один шаг отмены
  let typing = null;           // { cell, time } — текущая серия набора текста

  function caretOffset(cell, node, offset) {
    const r = document.createRange();
    r.selectNodeContents(cell);
    r.setEnd(node, offset);
    return r.toString().length;
  }

  function captureCaret() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const node = sel.anchorNode;
    const cell = node && (node.nodeType === 1 ? node : node.parentElement).closest('.tw th, .tw td');
    if (!cell) return null;
    return {
      row: cell.parentElement.rowIndex,
      col: cell.cellIndex,
      offset: caretOffset(cell, sel.anchorNode, sel.anchorOffset)
    };
  }

  // Изначальный вид таблицы демо — для кнопки «Заполнить таблицу».
  const INITIAL_TABLE = { html: table.innerHTML, style: table.getAttribute('style') };
  function snapshot() {
    return { html: table.innerHTML, style: table.getAttribute('style'), removed: widget.hidden, caret: captureCaret() };
  }

  function restoreCaret(caret) {
    if (!caret) { if (table.contains(document.activeElement)) document.activeElement.blur(); return; }
    const row = table.rows[caret.row];
    const cell = row && row.cells[caret.col];
    if (!cell) return;
    cell.focus();
    // Ищем текстовый узел, в который попадает сохранённое смещение.
    let left = caret.offset;
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    let node, target = null, at = 0;
    while ((node = walker.nextNode())) {
      if (left <= node.length) { target = node; at = left; break; }
      left -= node.length;
    }
    const r = document.createRange();
    if (target) r.setStart(target, at);
    else { r.selectNodeContents(cell); r.collapse(false); }
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function applyState(state) {
    if (typeof clearSelection === 'function') clearSelection();
    table.innerHTML = state.html;
    // Служебный span «формат после курсора» без набранного текста при отмене не нужен.
    table.querySelectorAll('span').forEach(function (e) {
      if (e.textContent.replace(/\u200B/g, '') === '' ) { const p = e.parentNode; e.remove(); p.normalize(); }
    });
    if (state.style) table.setAttribute('style', state.style); else table.removeAttribute('style');
    widget.hidden = !!state.removed;
    syncEdges();
    updateMinWidth();
    hideAll();
    restoreCaret(state.caret);
  }

  // Запомнить состояние перед изменением.
  function record() {
    undoStack.push(snapshot());
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    typing = null;
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    applyState(undoStack.pop());
  }

  function redo() {
    typing = null;
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    applyState(redoStack.pop());
  }

  // Текст: снимок делается в начале каждой серии набора.
  table.addEventListener('beforeinput', function (e) {
    if (e.inputType === 'historyUndo') { e.preventDefault(); undo(); return; }
    if (e.inputType === 'historyRedo') { e.preventDefault(); redo(); return; }
    const cell = e.target.closest && e.target.closest('th, td');
    const now = Date.now();
    const sameSeries = typing && typing.cell === cell && now - typing.time < TYPING_PAUSE &&
      e.inputType === 'insertText';
    if (!sameSeries) record();
    typing = { cell: cell, time: now };
  });
  table.addEventListener('focusout', function () { typing = null; });
  // Плейсхолдер «Введите текст»: в пустой ячейке, пока в ней стоит курсор.
  function syncPh() {
    const a = document.activeElement;
    const cell = a && table.contains(a) ? a.closest('th, td') : null;
    table.querySelectorAll('.is-ph').forEach(function (c) { if (c !== cell) c.classList.remove('is-ph'); });
    if (cell) cell.classList.toggle('is-ph', cell.textContent.replace(/[\u200B\n]/g, '') === '');
  }
  table.addEventListener('focusin', syncPh);
  table.addEventListener('focusout', function () { setTimeout(syncPh, 0); });
  table.addEventListener('input', syncPh);

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (!e.target.closest('#tw-wrap, .twin, .tw-window')) return;
    // e.code — физическая клавиша, поэтому работает и в русской раскладке.
    if (e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.code === 'KeyZ' && e.shiftKey) || e.code === 'KeyY') { e.preventDefault(); redo(); }
  });

  /* ---------- Кнопки «Плюс» на углах ячеек ---------- */
  // Кнопка в верхнем углу ячейки шапки → новый столбец справа от кнопки.
  // Кнопка в углу ячейки левого столбца → новая строка снизу от кнопки.
  const PLUS_ICON = '<span class="tw-icon" aria-hidden="true">\uE95D</span>';   // плюс из cbuc-icons

  let current = null;

  function makeButton(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tw-add';
    b.tabIndex = -1;            // не мешает переходу по ячейкам через Tab
    b.setAttribute('aria-label', label);
    b.innerHTML = PLUS_ICON;
    b.hidden = true;
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      if (!current) return;
      typing = null;
      record();
      const target = onClick(current);
      hideAll();
      if (target) focusCell(target);
    });
    wrap.appendChild(b);
    return b;
  }

  const btn = {
    // верхний левый угол ячейки шапки: столбец встаёт на место этой ячейки
    colLeft: makeButton('Добавить столбец', function (cell) {
      return insertColumn(startOf(cell));
    }),
    // верхний правый угол ячейки шапки: столбец встаёт сразу после ячейки
    colRight: makeButton('Добавить столбец', function (cell) {
      return insertColumn(startOf(cell) + (cell.colSpan || 1));
    }),
    // верхний левый угол ячейки левого столбца: строка встаёт перед этой строкой
    rowAbove: makeButton('Добавить строку', function (cell) {
      return insertRow(cell.parentElement.rowIndex - 1).cells[0];
    }),
    // нижний левый угол ячейки левого столбца: строка встаёт после этой строки
    rowBelow: makeButton('Добавить строку', function (cell) {
      return insertRow(cell.parentElement.rowIndex).cells[0];
    })
  };

  // Хэндлеры: строки — на левой границе ячейки левого столбца (вертикальный),
  // столбца — на верхней границе ячейки шапки (горизонтальный). Точки 2×2 с шагом 4px.
  // Крупные хэндлеры окна расширенного режима (Figma 3262:130306 — столбца, 3262:130307 — строки):
  // плашка #f8f7ff с рамкой rgba(123,98,248,.2) снаружи, иконки #7b62f8 с прозрачностью 30%.
  // Столбец: плюс (вставить слева) · точки · плюс (вставить справа); строка: плюс (вставить снизу) · точки.
  const BIG_PLUS = '<path d="M22 12H18V16H16V12H12V10H16V6H18V10H22V12Z"/>';
  const BIG_GRIP_COL = '<path d="M51 10C50.5833 10 50.2292 9.85417 49.9375 9.5625C49.6458 9.27083 49.5 8.91667 49.5 8.5C49.5 8.08333 49.6458 7.72917 49.9375 7.4375C50.2292 7.14583 50.5833 7 51 7C51.4167 7 51.7708 7.14583 52.0625 7.4375C52.3542 7.72917 52.5 8.08333 52.5 8.5C52.5 8.91667 52.3542 9.27083 52.0625 9.5625C51.7708 9.85417 51.4167 10 51 10ZM51 15C50.5833 15 50.2292 14.8542 49.9375 14.5625C49.6458 14.2708 49.5 13.9167 49.5 13.5C49.5 13.0833 49.6458 12.7292 49.9375 12.4375C50.2292 12.1458 50.5833 12 51 12C51.4167 12 51.7708 12.1458 52.0625 12.4375C52.3542 12.7292 52.5 13.0833 52.5 13.5C52.5 13.9167 52.3542 14.2708 52.0625 14.5625C51.7708 14.8542 51.4167 15 51 15ZM45 10C44.5833 10 44.2292 9.85417 43.9375 9.5625C43.6458 9.27083 43.5 8.91667 43.5 8.5C43.5 8.08333 43.6458 7.72917 43.9375 7.4375C44.2292 7.14583 44.5833 7 45 7C45.4167 7 45.7708 7.14583 46.0625 7.4375C46.3542 7.72917 46.5 8.08333 46.5 8.5C46.5 8.91667 46.3542 9.27083 46.0625 9.5625C45.7708 9.85417 45.4167 10 45 10ZM43.5 13.5C43.5 13.0833 43.6458 12.7292 43.9375 12.4375C44.2292 12.1458 44.5833 12 45 12C45.4167 12 45.7708 12.1458 46.0625 12.4375C46.3542 12.7292 46.5 13.0833 46.5 13.5C46.5 13.9167 46.3542 14.2708 46.0625 14.5625C45.7708 14.8542 45.4167 15 45 15C44.5833 15 44.2292 14.8542 43.9375 14.5625C43.6458 14.2708 43.5 13.9167 43.5 13.5ZM37.5 8.5C37.5 8.08333 37.6458 7.72917 37.9375 7.4375C38.2292 7.14583 38.5833 7 39 7C39.4167 7 39.7708 7.14583 40.0625 7.4375C40.3542 7.72917 40.5 8.08333 40.5 8.5C40.5 8.91667 40.3542 9.27083 40.0625 9.5625C39.7708 9.85417 39.4167 10 39 10C38.5833 10 38.2292 9.85417 37.9375 9.5625C37.6458 9.27083 37.5 8.91667 37.5 8.5ZM39 15C38.5833 15 38.2292 14.8542 37.9375 14.5625C37.6458 14.2708 37.5 13.9167 37.5 13.5C37.5 13.0833 37.6458 12.7292 37.9375 12.4375C38.2292 12.1458 38.5833 12 39 12C39.4167 12 39.7708 12.1458 40.0625 12.4375C40.3542 12.7292 40.5 13.0833 40.5 13.5C40.5 13.9167 40.3542 14.2708 40.0625 14.5625C39.7708 14.8542 39.4167 15 39 15Z"/>';
  const BIG_GRIP_ROW = '<path d="M40 14.5C40 14.9167 39.8542 15.2708 39.5625 15.5625C39.2708 15.8542 38.9167 16 38.5 16C38.0833 16 37.7292 15.8542 37.4375 15.5625C37.1458 15.2708 37 14.9167 37 14.5C37 14.0833 37.1458 13.7292 37.4375 13.4375C37.7292 13.1458 38.0833 13 38.5 13C38.9167 13 39.2708 13.1458 39.5625 13.4375C39.8542 13.7292 40 14.0833 40 14.5ZM45 14.5C45 14.9167 44.8542 15.2708 44.5625 15.5625C44.2708 15.8542 43.9167 16 43.5 16C43.0833 16 42.7292 15.8542 42.4375 15.5625C42.1458 15.2708 42 14.9167 42 14.5C42 14.0833 42.1458 13.7292 42.4375 13.4375C42.7292 13.1458 43.0833 13 43.5 13C43.9167 13 44.2708 13.1458 44.5625 13.4375C44.8542 13.7292 45 14.0833 45 14.5ZM40 20.5C40 20.9167 39.8542 21.2708 39.5625 21.5625C39.2708 21.8542 38.9167 22 38.5 22C38.0833 22 37.7292 21.8542 37.4375 21.5625C37.1458 21.2708 37 20.9167 37 20.5C37 20.0833 37.1458 19.7292 37.4375 19.4375C37.7292 19.1458 38.0833 19 38.5 19C38.9167 19 39.2708 19.1458 39.5625 19.4375C39.8542 19.7292 40 20.0833 40 20.5ZM43.5 22C43.0833 22 42.7292 21.8542 42.4375 21.5625C42.1458 21.2708 42 20.9167 42 20.5C42 20.0833 42.1458 19.7292 42.4375 19.4375C42.7292 19.1458 43.0833 19 43.5 19C43.9167 19 44.2708 19.1458 44.5625 19.4375C44.8542 19.7292 45 20.0833 45 20.5C45 20.9167 44.8542 21.2708 44.5625 21.5625C44.2708 21.8542 43.9167 22 43.5 22ZM38.5 28C38.0833 28 37.7292 27.8542 37.4375 27.5625C37.1458 27.2708 37 26.9167 37 26.5C37 26.0833 37.1458 25.7292 37.4375 25.4375C37.7292 25.1458 38.0833 25 38.5 25C38.9167 25 39.2708 25.1458 39.5625 25.4375C39.8542 25.7292 40 26.0833 40 26.5C40 26.9167 39.8542 27.2708 39.5625 27.5625C39.2708 27.8542 38.9167 28 38.5 28ZM45 26.5C45 26.9167 44.8542 27.2708 44.5625 27.5625C44.2708 27.8542 43.9167 28 43.5 28C43.0833 28 42.7292 27.8542 42.4375 27.5625C42.1458 27.2708 42 26.9167 42 26.5C42 26.0833 42.1458 25.7292 42.4375 25.4375C42.7292 25.1458 43.0833 25 43.5 25C43.9167 25 44.2708 25.1458 44.5625 25.4375C44.8542 25.7292 45 26.0833 45 26.5Z"/>';
  function bigIcon(vb, path, cls, label) {
    return '<span class="tw-hb-ico ' + cls + '"' + (label ? ' role="button" aria-label="' + label + '" title="' + label + '"' : '') + '>' +
      '<svg width="16" height="16" viewBox="' + vb + '" fill="currentColor" aria-hidden="true">' + path + '</svg></span>';
  }
  function bigHandleHtml(vertical) {
    return '<span class="tw-hbig" aria-hidden="false">' + (vertical
      ? bigIcon('9 12.5 16 16', BIG_PLUS.replace('M22 12H18V16H16V12H12V10H16V6H18V10H22V12Z', 'M22 21.5H18V25.5H16V21.5H12V19.5H16V15.5H18V19.5H22V21.5Z'), 'tw-hb-plus', 'Добавить строку снизу') +
        bigIcon('33 12.5 16 16', BIG_GRIP_ROW, 'tw-hb-grip')
      : bigIcon('9 3 16 16', BIG_PLUS, 'tw-hb-plus is-left', 'Добавить столбец слева') +
        bigIcon('37 3 16 16', BIG_GRIP_COL, 'tw-hb-grip') +
        bigIcon('9 3 16 16', BIG_PLUS, 'tw-hb-plus is-right', 'Добавить столбец справа')) + '</span>';
  }
  function makeHandle(kind) {
    const vertical = kind === 'row';
    const h = document.createElement('button');
    h.type = 'button';
    h.className = 'tw-handle' + (vertical ? '' : ' tw-handle--col');
    h.tabIndex = -1;
    h.setAttribute('aria-label', vertical ? 'Строка' : 'Столбец');
    let dots = '';
    // «Ухо»: три круглые точки 2×2 через 2px — в ряд у столбца, столбиком у строки.
    for (let i = 0; i < 3; i++) {
      dots += '<circle cx="' + (vertical ? 1 : i * 4 + 1) + '" cy="' + (vertical ? i * 4 + 1 : 1) + '" r="1"/>';
    }
    h.innerHTML = '<span class="tw-handle-body"><svg viewBox="0 0 ' + (vertical ? '2 10' : '10 2') +
      '" aria-hidden="true" fill="var(--handle-dots)">' + dots + '</svg></span>' + bigHandleHtml(vertical);
    h.hidden = true;
    h.addEventListener('mousedown', function (e) { e.preventDefault(); });
    wrap.appendChild(h);
    return h;
  }
  // Главный маркер не должен сбивать курсор в ячейке.
  wrap.querySelector('.tw-marker').addEventListener('mousedown', function (e) { e.preventDefault(); });

  const handle = makeHandle('row');
  const colHandle = makeHandle('col');

  // Квадратный маркер в верхнем левом углу выделяет всю таблицу как диапазон ячеек.
  wrap.querySelector('.tw-marker').addEventListener('click', function () {
    if (document.activeElement && table.contains(document.activeElement)) document.activeElement.blur();
    window.getSelection().removeAllRanges();
    hideAll();
    select('range', { r1: 0, c1: 0, r2: table.rows.length - 1, c2: columnCount() - 1 });
  });

  /* ---------- Перетаскивание строк и столбцов за хэндлеры ---------- */
  // Строку тянем за хэндлер строки, столбец — за хэндлер столбца.
  // Пока тянем, исходная строка/столбец подсвечены, линия показывает, куда они встанут.
  const dropLine = document.createElement('div');
  dropLine.className = 'tw-drop';
  dropLine.hidden = true;
  wrap.appendChild(dropLine);

  const DRAG_THRESHOLD = 4;   // смещение в px, после которого нажатие становится перетаскиванием
  let drag = null;            // { kind, source, target, startX, startY, started, el }

  function rel(r) {
    const w = wrap.getBoundingClientRect();
    return { left: r.left - w.left, top: r.top - w.top, right: r.right - w.left, bottom: r.bottom - w.top };
  }

  // Строки: границы между строками тела таблицы. Граница i — перед строкой table.rows[i].
  function rowTarget(y) {
    const rows = Array.from(table.rows);
    for (let i = 0; i < rows.length; i++) {
      const r = rel(rows[i].getBoundingClientRect());
      if (y < (r.top + r.bottom) / 2) return i;
    }
    return rows.length;
  }
  function rowLineY(i) {
    const rows = table.rows;
    if (i < rows.length) return rel(rows[i].getBoundingClientRect()).top - 0.5;
    return rel(rows[rows.length - 1].getBoundingClientRect()).bottom + 0.5;
  }

  // Столбцы: x-координаты вертикальных линий (центры) для границ 0..n. Каждая граница берётся
  // у любой ячейки, которая на ней начинается или кончается; если граница целиком спрятана
  // внутри объединённых ячеек — делится пропорционально ширинам столбцов.
  function colEdges() {
    const g = gridMap(), n = columnCount();
    const t = rel(table.getBoundingClientRect());
    const edges = new Array(n + 1);
    edges[0] = t.left + 0.5;
    edges[n] = t.right - 0.5;
    // Залипший заглавный столбец сдвинут прокруткой — для сетки берём его место без сдвига.
    const stickShift = widget.classList.contains('is-hscroll') && table.classList.contains('tw-hcol-on')
      ? (parseFloat(widget.style.getPropertyValue('--tw-scroll')) || 0) : 0;
    g.all.forEach(function (it) {
      let r = rel(it.cell.getBoundingClientRect());
      if (stickShift && it.start === 0 && !it.cell.parentElement.classList.contains('group')) r = { left: r.left - stickShift, right: r.right - stickShift };
      if (it.start > 0 && edges[it.start] === undefined) edges[it.start] = r.left - 0.5;
      const end = it.start + it.span;
      if (end < n && edges[end] === undefined) edges[end] = r.right - 0.5;
    });
    // Пропуски заполняем по долям ширин столбцов.
    const shares = columnShares() || Array.from({ length: n }, function () { return 1; });
    for (let i = 1; i < n; i++) {
      if (edges[i] !== undefined) continue;
      let a = i - 1; while (edges[a] === undefined) a--;
      let b = i + 1; while (edges[b] === undefined) b++;
      const part = shares.slice(a, b).reduce(function (x, y) { return x + y; }, 0);
      let acc = 0;
      for (let k = a; k < b - 1; k++) {
        acc += shares[k];
        if (edges[k + 1] === undefined) edges[k + 1] = edges[a] + (edges[b] - edges[a]) * acc / part;
      }
    }
    return edges;
  }
  // Прямоугольники столбцов в формате прежних colRects: left − 0.5 и right − 0.5 — центры линий.
  function colRects() {
    const e = colEdges();
    return e.slice(0, -1).map(function (x, i) { return { left: x + 0.5, right: e[i + 1] + 0.5 }; });
  }
  function colTarget(x) {
    const rects = colRects();
    for (let i = 0; i < rects.length; i++) {
      if (x < (rects[i].left + rects[i].right) / 2) return i;
    }
    return rects.length;
  }
  function colLineX(i) {
    const e = colEdges();
    return i < e.length - 1 ? e[i] : e[e.length - 1] + 1;
  }

  // Вертикально объединённые ячейки (rowspan) пересекают строки lo..hi?
  function rowspanTouches(g, lo, hi) {
    return g.all.some(function (it) { return it.rspan > 1 && it.r <= hi && it.r + it.rspan - 1 >= lo; });
  }
  // Ячейки, объединённые по вертикали, задевают столбцы lo..hi?
  function rowspanInCols(g, lo, hi) {
    return g.all.some(function (it) { return it.rspan > 1 && it.start <= hi && it.start + it.span - 1 >= lo; });
  }
  // Строку нельзя перетащить, если она или место вставки задевают вертикально объединённые ячейки.
  function canMoveRow(src, target) {
    const g = gridMap();
    if (rowspanTouches(g, src, src)) return false;
    return !g.all.some(function (it) { return it.rspan > 1 && it.r < target && target < it.r + it.rspan; });
  }

  // Можно ли перенести столбец src на границу target, не разрывая объединённые ячейки.
  function planColumnMove(src, target) {
    const g = gridMap();
    // Столбцы, через которые идёт перенос, не должны содержать вертикальных объединений.
    if (rowspanInCols(g, Math.min(src, target), Math.max(src, target - 1))) return null;
    const plan = [];
    for (let r = 0; r < table.rows.length; r++) {
      const row = table.rows[r];
      const cells = g.rows[r];
      const item = cells.find(function (c) { return c.start <= src && src < c.start + c.span; });
      if (!item) return null;
      if (item.span > 1) {
        // Объединённая ячейка перекрывает и откуда, и куда — строка не меняется.
        if (target >= item.start && target <= item.start + item.span) { plan.push(null); continue; }
        return null;
      }
      // Граница вставки не должна попадать внутрь объединённой ячейки.
      const inside = cells.some(function (c) { return c !== item && c.start < target && target < c.start + c.span; });
      if (inside) return null;
      const before = cells.find(function (c) { return c !== item && c.start === target; });
      plan.push({ row: row, cell: item.cell, before: before ? before.cell : null });
    }
    return plan;
  }

  function isNoop(d) { return d.target === d.source || d.target === d.source + 1; }

  function markSource(on) {
    table.querySelectorAll('.tw-drag-src').forEach(function (c) { c.classList.remove('tw-drag-src'); });
    if (!on) return;
    if (drag.kind === 'row') {
      Array.from(table.rows[drag.source].cells).forEach(function (c) { c.classList.add('tw-drag-src'); });
    } else {
      Array.from(table.rows).forEach(function (row) {
        const item = layout(row).find(function (c) { return c.start <= drag.source && drag.source < c.start + c.span; });
        if (item && item.span === 1) item.cell.classList.add('tw-drag-src');
      });
    }
  }

  function updateDrop(x, y) {
    const t = rel(table.getBoundingClientRect());
    if (drag.kind === 'row') {
      drag.target = rowTarget(y);
      drag.valid = !isNoop(drag) && canMoveRow(drag.source, drag.target);
      if (drag.valid) {
        dropLine.style.left = t.left + 'px';
        dropLine.style.width = (t.right - t.left) + 'px';
        dropLine.style.top = (rowLineY(drag.target) - 1) + 'px';
        dropLine.style.height = '2px';
      }
    } else {
      drag.target = colTarget(x);
      drag.valid = !isNoop(drag) && !!planColumnMove(drag.source, drag.target);
      if (drag.valid) {
        dropLine.style.top = t.top + 'px';
        dropLine.style.height = (t.bottom - t.top) + 'px';
        dropLine.style.left = (colLineX(drag.target) - 1) + 'px';
        dropLine.style.width = '2px';
      }
    }
    dropLine.hidden = !drag.valid;
  }

  function finishDrag(commit) {
    const d = drag;
    drag = null;
    document.documentElement.classList.remove('tw-dragging');
    d.el.classList.remove('is-dragging');
    dropLine.hidden = true;
    if (!d.started) {
      // Просто клик по хэндлеру — выделяем строку/столбец.
      if (!commit) return;
      // Shift+клик по хэндлеру строки, когда уже выделены строки, — выделить все строки между ними.
      if (d.kind === 'row' && d.shift && selection) {
        const n = columnCount();
        let from = null, to = null;
        if (selection.kind === 'row') { from = to = selection.row.rowIndex; }
        else if (selection.kind === 'range' && selection.range.c1 === 0 && selection.range.c2 === n - 1) {
          from = selection.range.r1; to = selection.range.r2;
        }
        if (from !== null) {
          const r1 = Math.min(from, d.source), r2 = Math.max(to, d.source);
          if (r1 !== r2) {
            select('range', normalizeRange({ r: r1, c: 0, span: n, rspan: 1 }, { r: r2, c: 0, span: n, rspan: 1 }));
            return;
          }
        }
      }
      // Shift+клик по хэндлеру столбца, когда уже выделены столбцы, — выделить все столбцы между ними.
      if (d.kind === 'col' && d.shift && selection) {
        const last = table.rows.length - 1;
        let from = null, to = null;
        if (selection.kind === 'col') { from = to = selection.index; }
        else if (selection.kind === 'range' && selection.range.r1 === 0 && selection.range.r2 === last) {
          from = selection.range.c1; to = selection.range.c2;
        }
        if (from !== null) {
          const c1 = Math.min(from, d.source), c2 = Math.max(to, d.source);
          if (c1 !== c2) { select('range', { r1: 0, c1: c1, r2: last, c2: c2 }); return; }
        }
      }
      select(d.kind, d.kind === 'row' ? table.rows[d.source] : d.source);
      return;
    }
    let prevHead = null;   // шапка и заглавный столбец до перемещения
    // Подсветку убираем до снимка истории, чтобы она не попала в отмену.
    table.querySelectorAll('.tw-drag-src').forEach(function (c) { c.classList.remove('tw-drag-src'); });
    if (commit && d.valid) {
      typing = null;
      record();
      prevHead = headState();
      if (d.kind === 'row') {
        const rows = table.rows;
        const moving = rows[d.source];
        const before = rows[d.target] || null;
        (before ? before.parentElement : tbody()).insertBefore(moving, before);
        if (selection && selection.kind === 'row') select('row', selection.row);
      } else {
        const plan = planColumnMove(d.source, d.target);
        plan.forEach(function (step) { if (step) step.row.insertBefore(step.cell, step.before); });
        const cg = colgroup();
        const col = cg.children[d.source];
        cg.insertBefore(col, cg.children[d.target] || null);
        // Выделенный столбец едет вместе со своим новым номером.
        if (selection && selection.kind === 'col') {
          const at = d.target > d.source ? d.target - 1 : d.target;
          let i = selection.index;
          if (i === d.source) i = at;
          else if (d.source < i && i <= at) i -= 1;
          else if (at <= i && i < d.source) i += 1;
          select('col', i);
        }
      }
    }
    if (prevHead) { afterHeadMove(prevHead); syncHeaders(); syncEdges(); if (selection) placeSelection(); }
    hideAll();
  }

  /* ---------- Выделение строки/столбца ---------- */
  const selFrame = document.createElement('div');
  selFrame.className = 'tw-sel';
  selFrame.hidden = true;
  wrap.appendChild(selFrame);

  let selection = null;   // { kind: 'row', row } | { kind: 'col', index }
  const HANDLE_GAP = 2;   // просвет между рамкой выделения и активным хэндлером
  const SEL_OUT = 1;      // расстояние между серединами линии таблицы и рамки: рамка идёт вплотную снаружи

  function select(kind, target) {
    if (kind === 'row') selection = { kind: 'row', row: target };
    else if (kind === 'col') selection = { kind: 'col', index: target };
    else selection = { kind: 'range', range: target };   // { r1, c1, r2, c2 } — номера строк и столбцов сетки
    placeSelection();
    table.dispatchEvent(new CustomEvent('tw:selection'));
  }

  // Центры линий вокруг строки r и столбца c (с учётом рамки таблицы у крайних).
  function rowLines(r) {
    const t = rel(table.getBoundingClientRect());
    const rows = table.rows;
    const rr = rel(rows[r].getBoundingClientRect());
    return {
      top: r === 0 ? t.top + 0.5 : rr.top - 0.5,
      bottom: r === rows.length - 1 ? t.bottom - 0.5 : rr.bottom - 0.5
    };
  }
  function colLines(c) {
    const t = rel(table.getBoundingClientRect());
    const rects = colRects();
    return {
      left: c === 0 ? t.left + 0.5 : rects[c].left - 0.5,
      right: c === rects.length - 1 ? t.right - 0.5 : rects[c].right - 0.5
    };
  }

  // Диапазон ячеек расширяется, чтобы объединённые ячейки попадали в него целиком.
  // Диапазон расширяется, чтобы объединённые ячейки (по горизонтали и вертикали) попадали в него целиком.
  function normalizeRange(a, b) {
    let r1 = Math.min(a.r, b.r), r2 = Math.max(a.r + a.rspan - 1, b.r + b.rspan - 1);
    let c1 = Math.min(a.c, b.c), c2 = Math.max(a.c + a.span - 1, b.c + b.span - 1);
    const g = gridMap();
    let changed = true;
    while (changed) {
      changed = false;
      g.all.forEach(function (it) {
        const rEnd = it.r + it.rspan - 1, cEnd = it.start + it.span - 1;
        if (it.r <= r2 && rEnd >= r1 && it.start <= c2 && cEnd >= c1) {
          if (it.start < c1) { c1 = it.start; changed = true; }
          if (cEnd > c2) { c2 = cEnd; changed = true; }
          if (it.r < r1) { r1 = it.r; changed = true; }
          if (rEnd > r2) { r2 = rEnd; changed = true; }
        }
      });
    }
    return { r1: r1, c1: c1, r2: r2, c2: c2 };
  }
  function gridPos(cell) {
    const it = itemOf(cell);
    return { r: it.r, c: it.start, span: it.span, rspan: it.rspan };
  }
  function clearSelection() {
    const had = !!selection;
    selection = null;
    if (had) table.dispatchEvent(new CustomEvent('tw:selection'));
    selFrame.hidden = true;
    activeRowHandle.hidden = true;
    activeColHandle.hidden = true;
  }

  // Рамка строится от центров линий таблицы: линия 1px, рамка 1px вплотную к ней снаружи.
  function placeSelection() {
    if (!selection) return;
    const t = rel(table.getBoundingClientRect());
    let top, bottom, left, right;
    if (selection.kind === 'row') {
      const row = selection.row;
      if (!row.isConnected || row.closest('table') !== table) { clearSelection(); return; }
      const r = rel(row.getBoundingClientRect());
      left = t.left + 0.5; right = t.right - 0.5;
      top = r.top - 0.5;
      // нижняя линия — граница самой строки, у последней строки — рамка таблицы
      bottom = row === table.rows[table.rows.length - 1] ? t.bottom - 0.5 : r.bottom - 0.5;
      if (row.rowIndex === 0) top = t.top + 0.5;
    } else if (selection.kind === 'col') {
      const rects = colRects();
      const i = selection.index;
      if (i >= rects.length) { clearSelection(); return; }
      top = t.top + 0.5; bottom = t.bottom - 0.5;
      left = i === 0 ? t.left + 0.5 : rects[i].left - 0.5;
      right = i === rects.length - 1 ? t.right - 0.5 : rects[i].right - 0.5;
    } else {
      const g = selection.range;
      if (g.r2 >= table.rows.length || g.c2 >= columnCount()) { clearSelection(); return; }
      top = rowLines(g.r1).top; bottom = rowLines(g.r2).bottom;
      left = colLines(g.c1).left; right = colLines(g.c2).right;
    }
    // Активный хэндлер — там же, где обычный: на левой линии по центру строки
    // или на верхней линии по центру столбца.
    activeRowHandle.hidden = selection.kind !== 'row';
    activeColHandle.hidden = selection.kind !== 'col';
    if (selection.kind === 'row') {
      // «Ухо» активного хэндлера — снаружи рамки выделения (рамка идёт на SEL_OUT снаружи линии); в окне — как раньше.
      const earOut = SEL_OUT;
      place(activeRowHandle, left - earOut, (top + bottom) / 2);
      fitRowHandle(activeRowHandle, bottom - top);
      activeRowHandle.classList.remove('is-locked');
    } else if (selection.kind === 'col') {
      place(activeColHandle, (left + right) / 2, top - SEL_OUT);
    }

    // Внешний край рамки: центр линии + отступ + половина толщины рамки.
    const pad = SEL_OUT + 0.5;
    const fx = left - pad, fy = top - pad;
    const fw = right - left + pad * 2, fh = bottom - top + pad * 2;
    selFrame.style.left = fx + 'px';
    selFrame.style.top = fy + 'px';
    selFrame.style.width = fw + 'px';
    selFrame.style.height = fh + 'px';

    // Рамка обрывается у активного хэндлера: вырезаем из неё прямоугольник
    // размером с хэндлер плюс 2px просвета с каждой стороны.
    const ah = selection.kind === 'row' ? activeRowHandle : selection.kind === 'col' ? activeColHandle : null;
    if (false && ah) {   // хэндлеры («Ухо») стоят снаружи таблицы — рамку не режем
      const big = ah.matches(':hover') || ah.classList.contains('is-dragging');
      const vertical = selection.kind === 'row';
      const hw = (vertical ? (big ? 12 : 5) : (big ? 32 : 24)) / 2 + HANDLE_GAP;
      const hh = (vertical ? (big ? 32 : 24) : (big ? 12 : 5)) / 2 + HANDLE_GAP;
      const cx = parseFloat(ah.style.left) - fx, cy = parseFloat(ah.style.top) - fy;
      selFrame.style.clipPath = 'path(evenodd, "M0 0H' + fw + 'V' + fh + 'H0Z' +
        'M' + (cx - hw) + ' ' + (cy - hh) + 'H' + (cx + hw) + 'V' + (cy + hh) + 'H' + (cx - hw) + 'Z")';
    } else {
      selFrame.style.clipPath = '';
    }
    selFrame.hidden = false;
  }

  // Таблица меняется (текст, ширина, вставки) — рамка едет следом.
  let selRaf = 0;
  function scheduleSelection() {
    if (!selection || selRaf) return;
    selRaf = requestAnimationFrame(function () { selRaf = 0; placeSelection(); });
  }
  new ResizeObserver(scheduleSelection).observe(table);
  new MutationObserver(scheduleSelection).observe(table, { childList: true, subtree: true, characterData: true, attributes: true });
  window.addEventListener('resize', scheduleSelection);

  // Клик в ячейку или мимо таблицы снимает выделение; Esc — тоже.
  document.addEventListener('pointerdown', function (e) {
    if (!selection) return;
    if (e.target.closest('.tw-handle, .tb, .twin, .tw-win-head')) return;   // хэндлеры, тулбары (в т. ч. шапка окна расширенного режима) и их окна выделение не снимают
    // Окно расширенного режима: шапка, рамка и меню «Ещё» выделение не снимают — снимает только клик в ячейку.
    if (e.target.closest('.tw-window') && !e.target.closest('.tw')) return;
    if (resizeHover !== null) return;          // тянем ширину — выделение оставляем
    clearSelection();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && selection && !drag) clearSelection();
  });

  /* ---------- Выделение диапазона ячеек протягиванием ---------- */
  // Нажали в ячейке и повели курсор в другую — выделяется прямоугольник ячеек.
  // Внутри одной ячейки протягивание по-прежнему выделяет текст.
  let cellDrag = null;   // { anchor, active }

  table.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || resizeHover !== null || drag) return;
    const cell = e.target.closest('th, td');
    if (!cell) return;
    cellDrag = { anchor: cell, active: false };
  });

  document.addEventListener('pointermove', function (e) {
    if (!cellDrag || !(e.buttons & 1)) return;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const cell = under && under.closest('.tw th, .tw td');
    if (!cell) return;
    if (!cellDrag.active) {
      if (cell === cellDrag.anchor) return;
      cellDrag.active = true;
      document.documentElement.classList.add('tw-cell-selecting');
      hideAll();
      if (document.activeElement && table.contains(document.activeElement)) document.activeElement.blur();
    }
    window.getSelection().removeAllRanges();     // текст не выделяем, выделяем ячейки
    const next = normalizeRange(gridPos(cellDrag.anchor), gridPos(cell));
    const cur = selection && selection.kind === 'range' && selection.range;
    if (!cur || cur.r1 !== next.r1 || cur.r2 !== next.r2 || cur.c1 !== next.c1 || cur.c2 !== next.c2) {
      select('range', next);
    }
  });

  function endCellDrag() {
    if (!cellDrag) return;
    cellDrag = null;
    document.documentElement.classList.remove('tw-cell-selecting');
  }
  document.addEventListener('pointerup', endCellDrag);
  document.addEventListener('pointercancel', endCellDrag);
  document.addEventListener('selectstart', function (e) {
    if (cellDrag && cellDrag.active) e.preventDefault();
  });

  // getSource — откуда тянем: у обычного хэндлера это ячейка под курсором,
  // у активного — выделенная строка/столбец.
  function startDragHandlers(h, kind, getSource) {
    h.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      const source = getSource();
      if (source === null) return;
      e.preventDefault();
      h.setPointerCapture(e.pointerId);
      drag = { kind: kind, source: source, target: source, startX: e.clientX, startY: e.clientY,
               started: false, valid: false, el: h,
               locked: false,                               // заглавную строку тоже можно двигать
               shift: e.shiftKey };
    });
    h.addEventListener('pointermove', function (e) {
      if (!drag || drag.el !== h) return;
      if (!drag.started) {
        if (drag.locked) return;
        if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < DRAG_THRESHOLD) return;
        drag.started = true;
        document.documentElement.classList.add('tw-dragging');
        h.classList.add('is-dragging');
        Object.values(btn).forEach(function (b) { b.hidden = true; });
        markSource(true);
      }
      const w = wrap.getBoundingClientRect();
      updateDrop(e.clientX - w.left, e.clientY - w.top);
    });
    h.addEventListener('pointerup', function () { if (drag && drag.el === h) finishDrag(true); });
    h.addEventListener('pointercancel', function () { if (drag && drag.el === h) finishDrag(false); });
  }
  startDragHandlers(handle, 'row', function () { return current ? current.parentElement.rowIndex : null; });
  startDragHandlers(colHandle, 'col', function () { return current ? startOf(current) : null; });

  // Активные хэндлеры: остаются на выделенной строке/столбце, пока выделение не снято.
  const activeRowHandle = makeHandle('row');
  const activeColHandle = makeHandle('col');
  activeRowHandle.classList.add('is-active');
  activeColHandle.classList.add('is-active');
  // Хэндлер растёт при наведении — вырез в рамке растёт вместе с ним.
  [activeRowHandle, activeColHandle].forEach(function (h) {
    h.addEventListener('pointerenter', placeSelection);
    h.addEventListener('pointerleave', function () { requestAnimationFrame(placeSelection); });
  });
  startDragHandlers(activeRowHandle, 'row', function () {
    return selection && selection.kind === 'row' ? selection.row.rowIndex : null;
  });
  startDragHandlers(activeColHandle, 'col', function () {
    return selection && selection.kind === 'col' ? selection.index : null;
  });
  // Плюсы крупных хэндлеров (окно расширенного режима): не начинают перетаскивание, а вставляют строку / столбец.
  function bigPlus(h, kind, getTarget) {
    h.querySelectorAll('.tw-hb-plus').forEach(function (pl) {
      pl.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); });
      pl.addEventListener('click', function (e) {
        e.stopPropagation();
        const t = getTarget();
        if (!t) return;
        typing = null;
        record();
        let cell;
        if (kind === 'row') cell = insertRow(t.row).cells[0];
        else cell = insertColumn(pl.classList.contains('is-left') ? t.left : t.right);
        if (selection) clearSelection();
        hideAll();
        if (cell) focusCell(cell);
      });
    });
  }
  bigPlus(handle, 'row', function () { return current ? { row: current.parentElement.rowIndex } : null; });
  bigPlus(activeRowHandle, 'row', function () { return selection && selection.kind === 'row' ? { row: selection.row.rowIndex } : null; });
  bigPlus(colHandle, 'col', function () { return current ? { left: startOf(current), right: startOf(current) + (current.colSpan || 1) } : null; });
  bigPlus(activeColHandle, 'col', function () { return selection && selection.kind === 'col' ? { left: selection.index, right: selection.index + 1 } : null; });

  /* ---------- Изменение ширины столбцов за вертикальные границы ---------- */
  // Внутренняя граница: меняются два соседних столбца, ширина таблицы та же.
  // Правая граница: меняется последний столбец и вместе с ним ширина таблицы — не шире колонки документа;
  // у расширенной таблицы правая граница не тянется. Левая граница не тянется.
  const MIN_COL_WIDTH = MIN_COL;   // самый узкий столбец, px (40) — общий минимум для перетаскивания границ, вставки и ширины таблицы
  const GRAB = 4;             // насколько близко к границе нужно навести, px

  const resizeLine = document.createElement('div');
  resizeLine.className = 'tw-resize-line';
  resizeLine.hidden = true;
  wrap.appendChild(resizeLine);

  let resizeHover = null;     // номер границы под курсором (1..n), n — правая граница
  let resize = null;          // { border, startX, widths, tableW, recorded }

  // Ширины столбцов в px по строке шапки (в ней нет объединённых ячеек).
  function columnWidths() {
    const e = colEdges();
    return e.slice(0, -1).map(function (x, i) { return e[i + 1] - x; });
  }

  // Граница ловится только там, где она видна: это край ячейки под курсором
  // (внутри объединённой ячейки линии нет — и тянуть там нечего).
  function borderAt(x, y, cell) {
    const t = rel(table.getBoundingClientRect());
    if (y < t.top || y > t.bottom) return null;
    const rects = colRects();
    const it = cell ? itemOf(cell) : null;
    for (let i = 1; i <= rects.length; i++) {
      const lineX = i < rects.length ? rects[i].left - 0.5 : t.right - 0.5;
      if (Math.abs(x - lineX) > GRAB) continue;
      if (it && i !== it.start && i !== it.start + it.span) continue;
      if (i === rects.length && isExpanded()) continue;   // расширенная таблица — правая граница не тянется
      return i;
    }
    return null;
  }

  function showResizeLine(i) {
    const t = rel(table.getBoundingClientRect());
    const rects = colRects();
    const x = i < rects.length ? rects[i].left - 0.5 : t.right - 0.5;
    resizeLine.style.left = x + 'px';
    resizeLine.style.top = t.top + 'px';
    resizeLine.style.height = (t.bottom - t.top) + 'px';
    resizeLine.hidden = false;
  }

  function setResizeHover(i) {
    resizeHover = i;
    wrap.classList.toggle('is-col-resize', i !== null);
    if (i !== null) { showResizeLine(i); hideAll(); }
    else if (!resize) resizeLine.hidden = true;
  }

  wrap.addEventListener('mousemove', function (e) {
    if (drag || resize) return;
    if (documentSelectionActive()) { setResizeHover(null); hideAll(); return; }
    // Над кнопками, хэндлерами и маркером границу не ловим — у них свои действия.
    if (!e.target.closest('.tw')) { if (resizeHover !== null) setResizeHover(null); return; }
    const w = wrap.getBoundingClientRect();
    const i = borderAt(e.clientX - w.left, e.clientY - w.top, e.target.closest('.tw th, .tw td'));
    if (i !== resizeHover) {
      setResizeHover(i);
      // Отошли от границы внутри той же ячейки — возвращаем её кнопки и хэндлеры.
      const cell = e.target.closest('.tw th, .tw td');
      if (i === null && cell && (isTopCell(cell) || isLeftCell(cell))) show(cell);
    }
  });
  wrap.addEventListener('mouseleave', function () { if (!resize) setResizeHover(null); });

  // Нажатие на границе не ставит курсор в ячейку.
  wrap.addEventListener('mousedown', function (e) {
    if (resizeHover !== null && e.button === 0) e.preventDefault();
  }, true);

  wrap.addEventListener('pointerdown', function (e) {
    if (resizeHover === null || e.button !== 0) return;
    e.preventDefault();
    wrap.setPointerCapture(e.pointerId);
    resize = {
      border: resizeHover,
      startX: e.clientX,
      widths: columnWidths(),
      tableW: table.getBoundingClientRect().width,
      recorded: false
    };
    document.documentElement.classList.add('tw-resizing');
  });

  wrap.addEventListener('pointermove', function (e) {
    if (!resize) return;
    const dx = e.clientX - resize.startX;
    if (!resize.recorded) {
      if (dx === 0) return;
      typing = null;
      record();                                 // одно перетаскивание — один шаг отмены
      resize.recorded = true;
    }
    const widths = resize.widths.slice();
    const k = resize.border;
    let tableW = resize.tableW;
    if (k < widths.length) {
      const pair = widths[k - 1] + widths[k];
      widths[k - 1] = Math.min(Math.max(widths[k - 1] + dx, MIN_COL_WIDTH), pair - MIN_COL_WIDTH);
      widths[k] = pair - widths[k - 1];
    } else {
      const last = widths.length - 1;
      // Таблица не шире колонки документа: за правую границу колонки не тянется (только уже).
      const maxW = widget.getBoundingClientRect().width;
      const delta = Math.min(Math.max(dx, MIN_COL_WIDTH - widths[last]), Math.max(0, maxW - resize.tableW));
      widths[last] += delta;
      tableW += delta;
      table.style.width = tableW + 'px';
      updateMinWidth();
    }
    const sum = widths.reduce(function (a, b) { return a + b; }, 0);
    Array.from(colgroup().children).forEach(function (c, i) {
      c.style.width = (widths[i] / sum * 100) + '%';
    });
    showResizeLine(k);
  });

  function endResize() {
    if (!resize) return;
    resize = null;
    document.documentElement.classList.remove('tw-resizing');
    setResizeHover(null);
  }
  wrap.addEventListener('pointerup', endResize);
  wrap.addEventListener('pointercancel', endResize);

  // Esc отменяет перетаскивание.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drag) finishDrag(false);
  });

  function isTopCell(cell) { return cell.parentElement.rowIndex === 0; }
  function isLeftCell(cell) { return startOf(cell) === 0; }

  // Крупный хэндлер строки — на всю высоту строки (от линии до линии); рамка 1px сверху и снизу входит в высоту.
  function fitRowHandle(h, lineToLine) {
    // «Ухо» строки: зона — во всю высоту строки (от линии до линии); в покое плашка на 12px ниже строки (поля 6px сверху и снизу — в CSS).
    h.style.height = Math.max(16, Math.round(lineToLine)) + 'px';
  }

  function place(b, x, y) {
    // Плюсы ставим на целые пиксели: иначе браузер округляет кружок и символ шрифта
    // по-разному, и плюс съезжает внутри кружка на полпикселя.
    if (b.classList.contains('tw-add')) { x = Math.round(x); y = Math.round(y); }
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.hidden = false;
  }

  function hideAll() {
    Object.values(btn).forEach(function (b) { b.hidden = true; });
    handle.hidden = true;
    colHandle.hidden = true;
    current = null;
  }

  function show(cell) {
    if (documentSelectionActive()) { hideAll(); return; }
    current = cell;
    const w = wrap.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    const cs = getComputedStyle(cell);

    // Центр линии слева и сверху: линия соседа или рамка таблицы, сразу снаружи ячейки.
    const left = r.left - w.left - 0.5;
    const top = r.top - w.top - 0.5;
    // Справа и снизу: своя граница ячейки, а если её нет — рамка таблицы снаружи.
    const right = r.right - w.left + (parseFloat(cs.borderRightWidth) ? -0.5 : 0.5);
    const bottom = r.bottom - w.top + (parseFloat(cs.borderBottomWidth) ? -0.5 : 0.5);

    const topCell = isTopCell(cell);
    const leftCell = isLeftCell(cell);

    Object.values(btn).forEach(function (b) { b.hidden = true; });
    handle.hidden = true;
    colHandle.hidden = true;

    if (topCell) {
      // В верхнем левом углу таблицы плюса нет — там главный маркер.
      // Плюсы на верхней границе таблицы — на левом и правом углу ячейки шапки: новый столбец слева / справа.
      if (startOf(cell) > 0) place(btn.colLeft, left, top - 1);
      place(btn.colRight, right, top - 1);
      // По горизонтали — центр ячейки, по вертикали — над верхней линией.
      place(colHandle, (left + right) / 2, top);
      if (selection && selection.kind === 'col' && selection.index === startOf(cell)) colHandle.hidden = true;
    }
    if (leftCell) {
      // Над шапкой строку не добавляем: у угловой ячейки верхний левый угол — для столбца.
      // По горизонтали — центр левой границы, по вертикали — центр ячейки.
      place(handle, left, (top + bottom) / 2);
      fitRowHandle(handle, bottom - top);
      // Плюсы на левой границе таблицы — на верхнем и нижнем углу ячейки левого столбца: новая строка сверху / снизу.
      if (!topCell) place(btn.rowAbove, left - 1, top);
      place(btn.rowBelow, left - 1, bottom);
      handle.classList.remove('is-locked');   // верхнюю (заглавную) строку тоже можно двигать
      // На выделенной строке уже стоит активный хэндлер.
      if (selection && selection.kind === 'row' && selection.row === cell.parentElement) handle.hidden = true;
    }
  }

  wrap.addEventListener('mouseover', function (e) {
    if (documentSelectionActive()) { hideAll(); return; }
    if (drag || resize || resizeHover !== null || (cellDrag && cellDrag.active)) return; // во время перетаскивания и у границы кнопки не трогаем
    if (e.target.closest('.tw-add, .tw-handle')) return; // курсор на кнопке — оставляем как есть
    if (e.target === table) return;   // курсор на внешней линии таблицы (по пути с ячейки на хэндлер) — хэндлеры не прячем
    const cell = e.target.closest('.tw th, .tw td');
    if (cell && (isTopCell(cell) || isLeftCell(cell))) {
      if (cell !== current) show(cell);
    } else {
      hideAll();
    }
  });
  wrap.addEventListener('mouseleave', function () { if (!drag) hideAll(); });

  // Пока курсор на ячейке, текст в ней может менять высоту строки — двигаем кнопки следом.
  table.addEventListener('input', function () { if (current) show(current); });
  window.addEventListener('resize', function () { if (current) show(current); });

  /* ---------- Команды таблицы (для тулбаров) ----------
     Активный элемент: выделенная строка / столбец / диапазон, а если выделения нет —
     ячейка, где стоит курсор (или куда последний раз кликнули). */
  let lastCell = null;
  table.addEventListener('focusin', function (e) {
    const c = e.target.closest('th, td');
    if (c) lastCell = c;
  });
  // В окне расширенного режима курсор ушёл из таблицы — активной ячейки больше нет: команды работают со всей таблицей.
  table.addEventListener('focusout', function (e) {
    if (!document.documentElement.classList.contains('tw-in-window')) return;
    if (e.relatedTarget && table.contains(e.relatedTarget)) return;
    lastCell = null;
  });

  function context() {
    // Выделение хэндлером — тот же диапазон ячеек, что и протягиванием: строка = диапазон на всю ширину,
    // столбец = диапазон на всю высоту. Все команды работают с ним одинаково.
    if (selection) {
      const n = columnCount(), last = table.rows.length - 1;
      if (selection.kind === 'row') {
        const r = selection.row.rowIndex;
        return { kind: 'range', range: normalizeRange({ r: r, c: 0, span: n, rspan: 1 }, { r: r, c: 0, span: n, rspan: 1 }) };
      }
      if (selection.kind === 'col') {
        const c = selection.index;
        // Столбец не расширяем на всю ширину из-за строк-групп, объединённых через все столбцы.
        return { kind: 'range', range: { r1: 0, c1: c, r2: last, c2: c } };
      }
      return { kind: 'range', range: selection.range };
    }
    if (lastCell && lastCell.isConnected && table.contains(lastCell)) {
      const p = gridPos(lastCell);
      return { kind: 'cell', cell: lastCell, r: p.r, c: p.c, span: p.span, rspan: p.rspan };
    }
    // Окно расширенного режима без курсора и выделения: активный элемент — вся таблица
    // (столбец добавляется в конец, строка — вниз, стиль текста, фон и границы — ко всем ячейкам).
    if (document.documentElement.classList.contains('tw-in-window')) {
      return { kind: 'range', range: { r1: 0, c1: 0, r2: table.rows.length - 1, c2: columnCount() - 1 } };
    }
    return null;
  }
  // Одиночная объединённая ячейка в активном элементе (для кнопки «Объединить» в нажатом состоянии).
  function activeMergedCell(ctx) {
    if (!ctx) return null;
    if (ctx.kind === 'cell') return isMerged(ctx.cell) ? ctx.cell : null;
    if (ctx.kind === 'range') {
      const g = gridMap(), R = ctx.range;
      const inside = g.all.filter(function (it) { return it.r >= R.r1 && it.r <= R.r2 && it.start >= R.c1 && it.start <= R.c2; });
      return inside.length === 1 && isMerged(inside[0].cell) ? inside[0].cell : null;
    }
    return null;
  }

  function change(fn) {
    typing = null;
    record();
    const res = fn();
    hideAll();
    return res;
  }

  /* ---------- Границы ячеек (окно «Границы») ----------
     Граница — сторона ячейки (t / b / l / r) со своими настройками «тип ширина цвет» в data-bd-t … data-bd-r.
     Общую сторону двух ячеек хранит одна из них (у соседней одноимённая сторона снимается), поэтому линия не двоится.
     Линии рисуются отдельным слоем поверх сетки; данные лежат в разметке таблицы, поэтому изменения отменяются Ctrl+Z. */
  const bdLayer = document.createElement('div');
  bdLayer.className = 'tw-bd-layer';
  wrap.appendChild(bdLayer);
  const BD_SIDES = { t: 'data-bd-t', b: 'data-bd-b', l: 'data-bd-l', r: 'data-bd-r' };
  // Все стороны активных ячеек: { item, side, opp, value, from } — value: своё оформление стороны или соседней ячейки
  // (from — соседняя ячейка, у которой хранится общая линия), null — оформления нет (линия по умолчанию).
  function cellsSides() {
    const R = borderRange();
    if (!R) return [];
    const g = gridMap(), out = [];
    const items = g.all.filter(function (it) { return it.r >= R.r1 && it.r + it.rspan - 1 <= R.r2 && it.start >= R.c1 && it.start + it.span - 1 <= R.c2; });
    items.forEach(function (it) {
      ['t', 'b', 'l', 'r'].forEach(function (k) {
        const opp = { t: 'b', b: 't', l: 'r', r: 'l' }[k];
        const own = it.cell.getAttribute(BD_SIDES[k]);
        let value = own, from = null;
        if (!own) {
          for (let i = 0; i < g.all.length; i++) {
            const o = g.all[i];
            if (o === it) continue;
            const rowsOverlap = o.r <= it.r + it.rspan - 1 && it.r <= o.r + o.rspan - 1;
            const colsOverlap = o.start <= it.start + it.span - 1 && it.start <= o.start + o.span - 1;
            const touch = k === 't' ? o.r + o.rspan === it.r && colsOverlap
              : k === 'b' ? o.r === it.r + it.rspan && colsOverlap
              : k === 'l' ? o.start + o.span === it.start && rowsOverlap
              : o.start === it.start + it.span && rowsOverlap;
            if (touch && o.cell.getAttribute(BD_SIDES[opp])) { value = o.cell.getAttribute(BD_SIDES[opp]); from = o; break; }
          }
        }
        out.push({ item: it, side: k, opp: opp, value: value, from: from });
      });
    });
    return out;
  }
  function borderRange() {
    const ctx = context();
    if (!ctx) return null;
    if (ctx.kind === 'range') return Object.assign({}, ctx.range);
    return { r1: ctx.r, c1: ctx.c, r2: ctx.r + ctx.rspan - 1, c2: ctx.c + ctx.span - 1 };
  }
  // type — одно из BORDER_TYPES окна; spec — { style, width, color }.
  function applyBorders(R, type, spec) {
    if (!R) return;
    const value = spec.style + ' ' + spec.width + ' ' + spec.color;
    const g = gridMap();
    const items = g.all.filter(function (it) { return it.r >= R.r1 && it.r + it.rspan - 1 <= R.r2 && it.start >= R.c1 && it.start + it.span - 1 <= R.c2; });
    const onTop = function (it) { return it.r === R.r1; }, onBottom = function (it) { return it.r + it.rspan - 1 === R.r2; };
    const onLeft = function (it) { return it.start === R.c1; }, onRight = function (it) { return it.start + it.span - 1 === R.c2; };
    const want = {
      'Все границы': function () { return 'tblr'; },
      'Внутренние границы': function (it) { return (onBottom(it) ? '' : 'b') + (onRight(it) ? '' : 'r'); },
      'Внешние границы': function (it) { return (onTop(it) ? 't' : '') + (onBottom(it) ? 'b' : '') + (onLeft(it) ? 'l' : '') + (onRight(it) ? 'r' : ''); },
      'Верхняя граница': function (it) { return onTop(it) ? 't' : ''; },
      'Внутренние горизонтальные': function (it) { return onBottom(it) ? '' : 'b'; },
      'Нижняя граница': function (it) { return onBottom(it) ? 'b' : ''; },
      'Левая граница': function (it) { return onLeft(it) ? 'l' : ''; },
      'Внутренние вертикальные': function (it) { return onRight(it) ? '' : 'r'; },
      'Правая граница': function (it) { return onRight(it) ? 'r' : ''; }
    }[type];
    if (!want) return;
    change(function () {
      items.forEach(function (it) {
        want(it).split('').forEach(function (side) {
          it.cell.setAttribute(BD_SIDES[side], value);
          // Та же линия у соседней ячейки (её противоположная сторона) снимается.
          const opp = { t: 'b', b: 't', l: 'r', r: 'l' }[side];
          g.all.forEach(function (o) {
            if (o === it) return;
            const rowsOverlap = o.r <= it.r + it.rspan - 1 && it.r <= o.r + o.rspan - 1;
            const colsOverlap = o.start <= it.start + it.span - 1 && it.start <= o.start + o.span - 1;
            const touch = side === 't' ? o.r + o.rspan === it.r && colsOverlap
              : side === 'b' ? o.r === it.r + it.rspan && colsOverlap
              : side === 'l' ? o.start + o.span === it.start && rowsOverlap
              : o.start === it.start + it.span && rowsOverlap;
            if (touch) o.cell.removeAttribute(BD_SIDES[opp]);
          });
        });
      });
    });
    drawBorders();
  }
  function drawBorders() {
    bdLayer.innerHTML = '';
    table.querySelectorAll('[data-bd-t], [data-bd-b], [data-bd-l], [data-bd-r]').forEach(function (cell) {
      const r = rel(cell.getBoundingClientRect());
      // Центры линий сетки: у ячейки своя линия справа и снизу (у крайних — линия рамки таблицы снаружи), слева и сверху — линия соседа.
      const yT = r.top - 0.5, yB = cell.classList.contains('edge-b') ? r.bottom + 0.5 : r.bottom - 0.5;
      const xL = r.left - 0.5, xR = cell.classList.contains('edge-r') ? r.right + 0.5 : r.right - 0.5;
      Object.keys(BD_SIDES).forEach(function (side) {
        const v = cell.getAttribute(BD_SIDES[side]);
        if (!v) return;
        const p = v.split(' '), w0 = parseFloat(p[1]) || 1;
        let style = p[0], color = p[2], w = w0;
        // «Нет» — линии нет: закрываем линию сетки цветом фона ячейки (у прозрачной — фон таблицы).
        if (style === 'none') {
          style = 'solid'; w = 1;
          const bg = getComputedStyle(cell).backgroundColor;
          color = /rgba\(.*,\s*0\)$|transparent/.test(bg) ? getComputedStyle(table).backgroundColor.replace(/rgba\(0, 0, 0, 0\)/, '#fff') : bg;
        }
        const d = document.createElement('div');
        d.className = 'tw-bd-line';
        if (side === 't' || side === 'b') {
          const y = side === 't' ? yT : yB;
          d.style.cssText = 'left:' + (xL - 0.5) + 'px;top:' + (y - w / 2) + 'px;width:' + (xR - xL + 1) + 'px;height:' + w + 'px;border-top:' + w + 'px ' + style + ' ' + color;
        } else {
          const x = side === 'l' ? xL : xR;
          d.style.cssText = 'top:' + (yT - 0.5) + 'px;left:' + (x - w / 2) + 'px;height:' + (yB - yT + 1) + 'px;width:' + w + 'px;border-left:' + w + 'px ' + style + ' ' + color;
        }
        bdLayer.appendChild(d);
      });
    });
  }
  let bdRaf = 0;
  function scheduleBorders() { if (!bdRaf) bdRaf = requestAnimationFrame(function () { bdRaf = 0; drawBorders(); }); }
  new ResizeObserver(scheduleBorders).observe(table);
  new MutationObserver(scheduleBorders).observe(table, { childList: true, subtree: true, characterData: true, attributes: true });
  window.addEventListener('resize', scheduleBorders);

  /* ---------- Заглавная строка / заглавный столбец ----------
     Состояние — в стиле таблицы (--tw-hrow: 0 — строка выключена; --tw-hcol: 1 — столбец включён), поэтому переключение
     отменяется Ctrl+Z. По умолчанию заглавная строка включена, заглавный столбец выключен. */
  function isHeader(kind) {
    const v = table.style.getPropertyValue(kind === 'row' ? '--tw-hrow' : '--tw-hcol').trim();
    return kind === 'row' ? v !== '0' : v === '1';
  }
  function syncHeaders() {
    table.classList.toggle('tw-hrow-off', !isHeader('row'));
    table.classList.toggle('tw-hcol-on', isHeader('col'));
  }
  function setHeader(kind, on) {
    if (isHeader(kind) === on) return;
    change(function () {
      if (kind === 'row') { if (on) table.style.removeProperty('--tw-hrow'); else table.style.setProperty('--tw-hrow', '0'); }
      else { if (on) table.style.setProperty('--tw-hcol', '1'); else table.style.removeProperty('--tw-hcol'); }
    });
    syncHeaders();
  }
  // Цвет заглавной строки / столбца (окно «Фон» у кружка в окне «Таблица»): --tw-hrow-bg / --tw-hcol-bg в стиле таблицы.
  // null — «Без фона» (прозрачный), пусто — по умолчанию #f8f8f8.
  function headerColor(kind) {
    const v = table.style.getPropertyValue(kind === 'row' ? '--tw-hrow-bg' : '--tw-hcol-bg').trim();
    return v === 'transparent' ? null : (v || '#f8f8f8');
  }
  function headerCells(kind) {
    return Array.from(kind === 'row' ? table.querySelectorAll('thead th') : table.querySelectorAll('tr:not(.group) > .edge-l'));
  }
  function setHeaderColor(kind, c) {
    const prop = kind === 'row' ? '--tw-hrow-bg' : '--tw-hcol-bg';
    const v = c === null ? 'transparent' : c.toLowerCase();
    if (table.style.getPropertyValue(prop).trim() === v) return;
    change(function () {
      if (v === '#f8f8f8') table.style.removeProperty(prop); else table.style.setProperty(prop, v);
      // Своя заливка ячеек заглавной строки / столбца перекрыла бы цвет — снимаем её.
      headerCells(kind).forEach(function (c) { c.style.removeProperty('background'); c.style.removeProperty('background-color'); });
    });
    document.dispatchEvent(new CustomEvent('tw:toggles'));
  }
  // После отмены / повтора стиль таблицы восстанавливается — пересчитываем оформление и сообщаем переключателям.
  let hdrState = isHeader('row') + ',' + isHeader('col') + ',' + headerColor('row') + ',' + headerColor('col');
  new MutationObserver(function () {
    syncHeaders();
    const now = isHeader('row') + ',' + isHeader('col') + ',' + headerColor('row') + ',' + headerColor('col');
    if (now !== hdrState) { hdrState = now; document.dispatchEvent(new CustomEvent('tw:toggles')); }
  }).observe(table, { attributes: true, attributeFilter: ['style'] });
  syncHeaders();

  /* ---------- Положение таблицы в тексте: по левому краю / по центру / по правому краю ----------
     Хранится в стиле таблицы (--tw-align), поэтому попадает в историю и отменяется Ctrl+Z.
     Сдвиг относительно колонки текста пересчитывается при любом изменении ширины таблицы или колонки. */
  function tableAlign() { return table.style.getPropertyValue('--tw-align').trim() || 'left'; }
  let expView = null;   // видимая ширина во время анимации: не обрезаем таблицу раньше сужения
  let expAnim = false;   // идёт анимация «Расширить» / «Уменьшить»: ширину и сдвиг ведёт она
  function placeAlign() {
    if (expAnim) return;
    // Колонка текста — блок виджета (он не сдвигается ни с таблицей, ни с окном расширенного режима).
    const wr = widget.getBoundingClientRect();
    const colW = wr.width;
    const tw = table.getBoundingClientRect().width;
    const a = tableAlign();
    let off = a === 'center' ? (colW - tw) / 2 : a === 'right' ? colW - tw : 0;
    if (tw > colW + 0.5) off = 0;   // таблица в скролле — видимая часть ровно по колонке текста
    // Расширенная таблица — по центру экрана (не меньше 20px от края), положение в тексте не учитывается.
    if (isExpanded()) {
      const ca = contentArea();
      off = ca.left + Math.max(EXPAND_GAP, (ca.width - tw) / 2) - wr.left;
    }
    widget.style.setProperty('--tw-shift', Math.round(off) + 'px');
    syncHScroll();
  }
  // Расширение / уменьшение — плавно, 300 мс (ease-in-out): ширина блока таблицы и её сдвиг меняются вместе,
  // тулбары, хэндлеры и рамки едут за таблицей каждый кадр.
  const EXPAND_MS = 300;
  function toggleExpand() {
    const tableW0 = table.getBoundingClientRect().width;
    const view0 = hscrollView();
    const w0 = wrap.offsetWidth;
    const s0 = parseFloat(widget.style.getPropertyValue('--tw-shift')) || 0;
    change(function () {
      if (isExpanded()) table.style.removeProperty('--tw-expand');
      else {
        // Ручная ширина не должна удерживать таблицу внутри расширенного контейнера.
        table.style.removeProperty('width');
        table.style.setProperty('--tw-expand', '1');
      }
    });
    updateMinWidth();
    placeAlign();
    const minF = wrap.style.minWidth, w1 = wrap.offsetWidth;
    const tableW1 = table.getBoundingClientRect().width;
    const finalWidth = table.style.width;
    const view1 = hscrollView();
    const s1 = parseFloat(widget.style.getPropertyValue('--tw-shift')) || 0;
    if (Math.abs(w1 - w0) < 1 && Math.abs(tableW1 - tableW0) < 1 && Math.abs(s1 - s0) < 1) { window.dispatchEvent(new Event('resize')); return; }
    expAnim = true;
    const t0 = performance.now();
    const ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    (function frame(now) {
      const t = Math.max(0, Math.min(1, (now - t0) / EXPAND_MS)), e = ease(t);
      expView = view0 + (view1 - view0) * e;
      wrap.style.minWidth = (w0 + (w1 - w0) * e) + 'px';
      // Ручная ширина может отличаться от ширины контейнера: анимируем саму таблицу тоже.
      table.style.width = (tableW0 + (tableW1 - tableW0) * e) + 'px';
      widget.style.setProperty('--tw-shift', Math.round(s0 + (s1 - s0) * e) + 'px');
      window.dispatchEvent(new Event('resize'));
      if (t < 1) { requestAnimationFrame(frame); return; }
      expAnim = false;
      expView = null;
      if (finalWidth) table.style.width = finalWidth; else table.style.removeProperty('width');
      wrap.style.minWidth = minF;
      placeAlign();
      window.dispatchEvent(new Event('resize'));
    })(t0);
  }
  window.addEventListener('resize', function () { if (isExpanded() && !expAnim) { updateMinWidth(); placeAlign(); } });
  function setTableAlign(value) {
    if (tableAlign() === value) return;
    change(function () {
      if (value === 'left') table.style.removeProperty('--tw-align'); else table.style.setProperty('--tw-align', value);
    });
    placeAlign();
    window.dispatchEvent(new Event('resize'));   // тулбары и хэндлеры встают на новое место
  }
  new ResizeObserver(placeAlign).observe(table);
  new ResizeObserver(placeAlign).observe(widget);
  new MutationObserver(placeAlign).observe(table, { attributes: true, attributeFilter: ['style'] });

  /* ---------- Сдвиг строк и столбцов на одну позицию ----------
     Сдвигается строка/столбец активного элемента: ячейки с курсором, выделенные строки, столбцы или диапазон.
     Соседняя строка (столбец) перепрыгивает через сдвигаемый блок. Строку шапки не двигаем и выше неё не ставим;
     если сдвиг разорвал бы объединённые ячейки или блок уже у края — ничего не происходит (как при перетаскивании).
     Выделение и курсор едут вместе с ячейками. Отменяется Ctrl+Z. */
  function activeSpan(ctx, axis) {
    if (!ctx) return null;
    if (ctx.kind === 'range') return axis === 'row' ? [ctx.range.r1, ctx.range.r2] : [ctx.range.c1, ctx.range.c2];
    if (ctx.kind === 'cell') return axis === 'row' ? [ctx.r, ctx.r + ctx.rspan - 1] : [ctx.c, ctx.c + ctx.span - 1];
    return null;
  }
  function caretPos() {
    const sel = window.getSelection();
    const a = document.activeElement;
    const cell = a && table.contains(a) ? a.closest('th, td') : null;
    if (!cell || !sel.rangeCount) return cell ? { cell: cell } : null;
    const r = sel.getRangeAt(0);
    return { cell: cell, node: r.startContainer, offset: r.startOffset };
  }
  function restoreCaretPos(p) {
    if (!p || !p.cell.isConnected) return;
    p.cell.focus({ preventScroll: true });
    const range = document.createRange();
    if (p.node && p.cell.contains(p.node)) range.setStart(p.node, p.offset); else range.setStart(p.cell, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  /* ---------- Выровнять столбцы ----------
     Выделены ячейки (строки, столбцы, диапазон) — общая ширина выделенных столбцов делится между ними поровну;
     выделения нет (курсор в ячейке или курсора нет) — поровну делится ширина всех столбцов таблицы.
     Ширина таблицы не меняется; ширины столбцов задаются долями (%). Отменяется Ctrl+Z. */
  function equalizeWidth() {
    const e = colEdges(), n = e.length - 1;
    let c1 = 0, c2 = n - 1;
    if (selection) { const R = context().range; c1 = R.c1; c2 = R.c2; }
    if (c2 <= c1) return;
    const widths = []; for (let i = 0; i < n; i++) widths.push(e[i + 1] - e[i]);
    const total = widths.reduce(function (x, y) { return x + y; }, 0);
    let part = 0; for (let i = c1; i <= c2; i++) part += widths[i];
    for (let i = c1; i <= c2; i++) widths[i] = part / (c2 - c1 + 1);
    const caret = caretPos();
    change(function () {
      Array.from(colgroup().children).forEach(function (col, i) { col.style.width = (widths[i] / total * 100) + '%'; });
    });
    if (selection) placeSelection();
    restoreCaretPos(caret);
  }
  // Делится ячейка с курсором (или одна объединённая ячейка в выделении); курсор остаётся на месте.
  function splitActive(ctx, fn) {
    const cell = ctx && ctx.kind === 'cell' ? ctx.cell : activeMergedCell(ctx);
    if (!cell) return;
    const caret = caretPos();
    change(function () { fn(cell); });
    if (selection) placeSelection();
    restoreCaretPos(caret);
  }
  /* ---------- Перемещение заглавной строки / столбца ----------
     Заглавные строку и столбец можно двигать, как остальные. Если заглавная строка (столбец) ушла со своего места
     (или на её место встала другая), настройка «Заглавная строка» («Заглавный столбец») у таблицы выключается,
     цвет заглавной строки (столбца) сбрасывается, а оформление её ячеек — до дефолтного (фон, стиль текста, границы).
     Строки шапки: первые строки таблицы всегда лежат в <thead> (ячейки th), остальные — в <tbody> (td). */
  function headState() {
    const g = gridMap();
    return {
      head: table.tHead ? Array.from(table.tHead.rows) : [],
      col: g.all.filter(function (it) { return it.start === 0 && !it.cell.parentElement.classList.contains('group'); }).map(function (it) { return it.cell; }),
      hrow: isHeader('row'), hcol: isHeader('col')
    };
  }
  function resetCellLook(c) {
    c.removeAttribute('style');
    Object.keys(BD_SIDES).forEach(function (k) { c.removeAttribute(BD_SIDES[k]); });
    c.querySelectorAll('span').forEach(function (sp) { sp.replaceWith.apply(sp, Array.from(sp.childNodes)); });
    c.normalize();
  }
  function retag(cell, tag) {
    if (cell.tagName.toLowerCase() === tag) return cell;
    const n = document.createElement(tag);
    Array.from(cell.attributes).forEach(function (a) { if (a.name !== 'scope') n.setAttribute(a.name, a.value); });
    if (tag === 'th') n.scope = 'col';
    while (cell.firstChild) n.appendChild(cell.firstChild);
    cell.replaceWith(n);
    return n;
  }
  function afterHeadMove(prev) {
    const rows = Array.from(table.rows);
    const n = prev.head.length;
    const rowMoved = n > 0 && prev.head.some(function (tr, i) { return rows[i] !== tr; });
    if (rowMoved) {
      if (prev.hrow) {
        table.style.setProperty('--tw-hrow', '0');
        table.style.removeProperty('--tw-hrow-bg');
        prev.head.forEach(function (tr) { Array.from(tr.cells).forEach(resetCellLook); });
      }
      // Первые n строк — шапка (th), остальные — тело таблицы (td); порядок строк сохраняется.
      const thead = table.tHead, tb = tbody();
      rows.forEach(function (tr, i) { (i < n ? thead : tb).appendChild(tr); });
      rows.forEach(function (tr, i) { Array.from(tr.cells).forEach(function (c) { retag(c, i < n ? 'th' : 'td'); }); });
    }
    if (prev.hcol) {
      const now = headState().col;
      const colMoved = prev.col.length !== now.length || prev.col.some(function (c, i) { return now[i] !== c; });
      if (colMoved) {
        table.style.removeProperty('--tw-hcol');
        table.style.removeProperty('--tw-hcol-bg');
        prev.col.forEach(function (c) { if (c.isConnected) resetCellLook(c); });
      }
    }
  }
  function moveRows(ctx, dir) {
    const span = activeSpan(ctx, 'row');
    if (!span) return;
    const r1 = span[0], r2 = span[1];
    const other = dir < 0 ? r1 - 1 : r2 + 1;                         // соседняя строка, через которую прыгаем
    if (other < 0 || other >= table.rows.length) return;
    if (rowspanTouches(gridMap(), Math.min(r1, other), Math.max(r2, other))) return;
    const caret = caretPos();
    change(function () {
      const prev = headState();
      const rows = table.rows;
      const neighbour = rows[other];
      if (dir < 0) rows[r2].after(neighbour);                         // соседняя сверху уходит под блок
      else rows[r1].before(neighbour);                                // соседняя снизу уходит над блоком
      afterHeadMove(prev);
    });
    syncHeaders(); syncEdges();
    followSelection('row', dir);
    restoreCaretPos(caret);
  }
  function moveCols(ctx, dir) {
    const span = activeSpan(ctx, 'col');
    if (!span) return;
    const c1 = span[0], c2 = span[1];
    const other = dir < 0 ? c1 - 1 : c2 + 1;
    if (other < 0 || other >= columnCount()) return;
    // Соседний столбец переносим на другую сторону блока.
    const target = dir < 0 ? c2 + 1 : c1;
    const plan = planColumnMove(other, target);
    if (!plan) return;
    const caret = caretPos();
    change(function () {
      const prev = headState();
      plan.forEach(function (step) { if (step) step.row.insertBefore(step.cell, step.before); });
      const cg = colgroup();
      cg.insertBefore(cg.children[other], cg.children[target] || null);
      afterHeadMove(prev);
    });
    syncHeaders(); syncEdges();
    followSelection('col', dir);
    restoreCaretPos(caret);
  }
  function followSelection(axis, dir) {
    if (!selection) return;
    if (selection.kind === 'row') { select('row', selection.row); return; }
    if (selection.kind === 'col') { if (axis === 'col') select('col', selection.index + dir); else placeSelection(); return; }
    const R = Object.assign({}, selection.range);
    if (axis === 'row') { R.r1 += dir; R.r2 += dir; } else { R.c1 += dir; R.c2 += dir; }
    select('range', R);
  }

  /* ---------- Таблица в скролле (Figma 2112:102924) ----------
     Таблица шире доступного места (колонки текста; у расширенной — ширины расширения): видимая ширина остаётся прежней,
     таблица прокручивается по горизонтали внутри скролл-контейнера. Под таблицей — контрол скролла (ползунок 6px #cdcdcd 80%,
     по ховеру 12px #c4c4c4 80%, скругление, поля 8px по бокам), сбоку контейнера — тень 8px (градиент к rgba(0,0,0,.15)):
     справа — пока есть что прокрутить вправо, слева — когда таблица уже прокручена.
     Прокрутка: колесо мыши с Shift / горизонтальный жест, перетаскивание ползунка, клик по дорожке; ячейка с курсором
     подкручивается в видимую область. Тулбары и окна не обрезаются (обрезается только таблица со своими слоями). */
  var hsReady = false;   // слои скролла ещё не созданы (updateMinWidth вызывается и раньше)
  const clip = document.createElement('div');
  clip.className = 'tw-clip';
  Array.from(wrap.children).forEach(function (el) { if (!el.matches('.tb, .twin')) clip.appendChild(el); });
  wrap.appendChild(clip);
  new MutationObserver(function (list) {
    list.forEach(function (m) { m.addedNodes.forEach(function (el) {
      if (el.nodeType === 1 && el !== clip && !el.matches('.tb, .twin, .tw-win-pop')) clip.appendChild(el);
    }); });
  }).observe(wrap, { childList: true });
  const hbar = document.createElement('div');
  hbar.className = 'tw-hscroll';
  hbar.hidden = true;
  hbar.innerHTML = '<div class="tw-hscroll-thumb"></div>';
  const thumb = hbar.firstChild;
  const shR = document.createElement('div'), shL = document.createElement('div');
  shR.className = 'tw-hshadow is-right'; shL.className = 'tw-hshadow is-left';
  shR.hidden = shL.hidden = true;
  widget.style.position = 'relative';
  widget.appendChild(hbar); widget.appendChild(shR); widget.appendChild(shL);
  let hs = { on: false, s: 0, view: 0, content: 0, left: 0 };
  // Видимая ширина таблицы: колонка текста, у расширенной — ширина расширения (и в окне расширенного режима).
  function hscrollView() { return expAnim && expView !== null ? expView : isExpanded() ? expandedWidth() : widget.getBoundingClientRect().width; }
  function syncHScroll() {
    if (!hsReady) return;
    const wr = widget.getBoundingClientRect();
    const view = hscrollView();
    const content = wrap.offsetWidth;
    const on = !widget.hidden && content > view + 0.5;
    hs.on = on; hs.view = view; hs.content = content;
    widget.classList.toggle('is-hscroll', on);
    if (!on) {
      hs.s = 0;
      widget.style.removeProperty('--tw-scroll');
      clip.style.removeProperty('clip-path');
      hbar.hidden = shR.hidden = shL.hidden = true;
      return;
    }
    hs.s = Math.max(0, Math.min(content - view, hs.s));
    widget.style.setProperty('--tw-scroll', Math.round(hs.s) + 'px');
    // Левый край видимой части в координатах блока виджета (и в документе, и в окне расширенного режима).
    hs.left = wrap.getBoundingClientRect().left + Math.round(hs.s) - wr.left;
    // Обрезка в координатах блока таблицы: видимая полоса [s; s + view], слева — с запасом под хэндлеры строк.
    const right = content - hs.s - view;
    clip.style.clipPath = 'inset(-9999px ' + right + 'px -9999px ' + (hs.s > 0.5 ? hs.s : -40) + 'px)';
    const tr = table.getBoundingClientRect();
    const top = tr.top - wr.top, h = tr.height;
    hbar.hidden = false;
    // Контрол — внутри таблицы у нижнего края (Figma 2031:123060): поля 2px слева, справа и снизу, высота 12px;
    // если низ таблицы ниже окна браузера, контрол прилипает к низу окна.
    const barBottom = Math.max(tr.top + 26, Math.min(tr.bottom - 2, window.innerHeight - 2));
    hbar.style.left = (hs.left + 2) + 'px'; hbar.style.width = (view - 4) + 'px'; hbar.style.top = (barBottom - 12 - wr.top) + 'px';
    const track = view - 4, tw = Math.max(24, track * view / content);
    thumb.style.width = tw + 'px';
    thumb.style.left = ((track - tw) * (hs.s / (content - view))) + 'px';
    [shR, shL].forEach(function (sh) { sh.style.top = (top + 1) + 'px'; sh.style.height = (h - 2) + 'px'; });   // тень внутри рамки таблицы
    shR.style.left = (hs.left + view - 8) + 'px';
    // Заглавный столбец залипает — левая тень у его правого края.
    const stick = isHeader('col') ? table.querySelector('tr:not(.group) > .edge-l') : null;
    shL.style.left = (hs.left + (stick ? stick.offsetWidth : 0)) + 'px';
    shR.hidden = hs.s >= content - view - 0.5;
    shL.hidden = hs.s <= 0.5;
  }
  function scrollTo(x) {
    if (!hs.on) return;
    hs.s = x;
    syncHScroll();
    syncVStick();
    window.dispatchEvent(new Event('resize'));   // тулбары, хэндлеры и окна встают на новое место
  }
  wrap.addEventListener('wheel', function (e) {
    if (!hs.on) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!d) return;
    e.preventDefault();
    scrollTo(hs.s + d);
  }, { passive: false });
  hbar.addEventListener('wheel', function (e) { if (!hs.on) return; e.preventDefault(); scrollTo(hs.s + (e.deltaX || e.deltaY)); }, { passive: false });
  thumb.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation();
    thumb.setPointerCapture(e.pointerId);
    const x0 = e.clientX, s0 = hs.s, track = hs.view - 4, tw = thumb.offsetWidth;
    const k = (hs.content - hs.view) / Math.max(1, track - tw);
    hbar.classList.add('is-drag');
    function mv(ev) { scrollTo(s0 + (ev.clientX - x0) * k); }
    function up() { thumb.removeEventListener('pointermove', mv); thumb.removeEventListener('pointerup', up); hbar.classList.remove('is-drag'); }
    thumb.addEventListener('pointermove', mv); thumb.addEventListener('pointerup', up);
  });
  hbar.addEventListener('pointerdown', function (e) {
    if (e.target === thumb) return;
    e.preventDefault();
    const r = hbar.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    scrollTo(frac * hs.content - hs.view / 2);   // место клика — в середину видимой части
  });
  hbar.addEventListener('mousedown', function (e) { e.preventDefault(); });
  // Ячейка с курсором — в видимую область.
  table.addEventListener('focusin', function (e) {
    if (!hs.on) return;
    const c = e.target.closest && e.target.closest('th, td');
    if (!c) return;
    const wr = wrap.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const l = cr.left - wr.left, rr = cr.right - wr.left;
    if (l < hs.s) scrollTo(l);
    else if (rr > hs.s + hs.view) scrollTo(Math.min(l, rr - hs.view));
  });
  window.addEventListener('resize', function () { syncHScroll(); });
  window.addEventListener('scroll', function () { if (hs.on) syncHScroll(); syncVStick(); }, true);
  /* ---------- Залипание заглавной строки при скролле страницы ----------
     1) страница скроллится, пока верх таблицы не дойдёт до низа верхнего тулбара редактора;
     2) дальше заглавная строка стоит под тулбаром, под ней прокручиваются строки таблицы — пока таблица не прокрутится полностью
        (низ таблицы не дойдёт до низа заглавной строки);
     3) дальше заглавная строка уходит вместе с концом таблицы. В окне расширенного режима — под залипшей шапкой окна. */
  function syncVStick() {
    const inWin = document.documentElement.classList.contains('tw-in-window');
    // В окне расширенного режима строка встаёт под шапку окна (она сама залипает под тулбаром редактора).
    const winHead = inWin ? document.querySelector('.tw-window .tw-win-head') : null;
    const tbar = winHead || document.querySelector('.app-toolbar');
    const head = table.tHead;
    let y = 0;
    if (!widget.hidden && isHeader('row') && head && tbar) {
      const top = tbar.getBoundingClientRect().bottom;
      const tr = table.getBoundingClientRect();
      y = Math.max(0, top - tr.top);   // строка стоит под тулбаром, пока таблица не прокрутится полностью
      y = Math.min(y, Math.max(0, tr.height - head.offsetHeight));   // не ниже низа таблицы
    }
    widget.classList.toggle('is-vstick', y > 0.5);
    if (winHead) winHead.classList.toggle('is-row-stuck', y > 0.5);   // тень — только под самым нижним залипшим элементом
    if (y > 0.5) widget.style.setProperty('--tw-sy', Math.round(y) + 'px'); else widget.style.removeProperty('--tw-sy');
    // Над залипшей строкой — верхняя граница таблицы со скруглёнными углами (4px), как у таблицы на своём месте.
    cap.hidden = !(y > 0.5);
    if (!cap.hidden) {
      const wr = widget.getBoundingClientRect(), tr = table.getBoundingClientRect();
      cap.style.top = (tr.top + Math.round(y) - wr.top) + 'px';
      if (hs.on) { cap.style.left = hs.left + 'px'; cap.style.width = hs.view + 'px'; }
      else { cap.style.left = (tr.left - wr.left) + 'px'; cap.style.width = tr.width + 'px'; }
    }
    // Тень под залипшей строкой: 8px, градиент от rgba(0,0,0,.15) к прозрачному, по ширине видимой части таблицы.
    shH.hidden = !(y > 0.5);
    if (!shH.hidden) {
      const wr = widget.getBoundingClientRect(), tr = table.getBoundingClientRect();
      shH.style.top = (head.getBoundingClientRect().bottom + Math.round(y) - wr.top) + 'px';
      if (hs.on) { shH.style.left = (hs.left + 1) + 'px'; shH.style.width = (hs.view - 2) + 'px'; }
      else { shH.style.left = (tr.left - wr.left + 1) + 'px'; shH.style.width = (tr.width - 2) + 'px'; }
    }
  }
  const shH = document.createElement('div');
  shH.className = 'tw-hshadow is-top';
  shH.hidden = true;
  widget.appendChild(shH);
  const cap = document.createElement('div');
  cap.className = 'tw-stickcap';
  cap.hidden = true;
  widget.appendChild(cap);
  window.addEventListener('resize', syncVStick);
  new ResizeObserver(syncVStick).observe(table);
  new ResizeObserver(function () { syncHScroll(); }).observe(table);
  hsReady = true;
  syncHScroll();

  const commands = {
    insertColRight: function (ctx) {
      if (!ctx) return;
      // Курсор в ячейке — столбец встаёт справа от ячейки с курсором.
      const index = ctx.kind === 'col' ? ctx.c + 1
        : ctx.kind === 'range' ? ctx.range.c2 + 1
        : ctx.kind === 'cell' ? ctx.c + ctx.span
        : columnCount();
      const cell = change(function () { return insertColumn(index); });
      clearSelection();
      if (cell) focusCell(cell);
    },
    insertRowBelow: function (ctx) {
      if (!ctx) return;
      // Курсор в ячейке — строка встаёт под ячейкой с курсором.
      const after = ctx.kind === 'row' ? ctx.r
        : ctx.kind === 'range' ? ctx.range.r2
        : ctx.kind === 'cell' ? ctx.r + ctx.rspan - 1
        : table.rows.length - 1;
      const row = change(function () { return insertRow(after); });
      clearSelection();
      if (row.cells[0]) focusCell(row.cells[0]);
    },
    // Сдвиг строк / столбцов активного элемента на одну позицию (подменю «Сдвинуть …»).
    alignWidth: function () { equalizeWidth(); },
    splitCellH: function (ctx) { splitActive(ctx, splitCellHorizontal); },
    splitCellV: function (ctx) { splitActive(ctx, splitCellVertical); },
    expandTable: function () { toggleExpand(); },
    tableAlignLeft: function () { setTableAlign('left'); },
    tableAlignCenter: function () { setTableAlign('center'); },
    tableAlignRight: function () { setTableAlign('right'); },
    moveRowUp: function (ctx) { moveRows(ctx, -1); },
    moveRowDown: function (ctx) { moveRows(ctx, 1); },
    moveColLeft: function (ctx) { moveCols(ctx, -1); },
    moveColRight: function (ctx) { moveCols(ctx, 1); },
    // Столбец слева от активного элемента (подменю «Добавить столбец/строку» → «Слева»).
    insertColLeft: function (ctx) {
      if (!ctx) return;
      const index = ctx.kind === 'col' ? ctx.c
        : ctx.kind === 'range' ? ctx.range.c1
        : ctx.kind === 'cell' ? ctx.c
        : 0;
      // Исходный столбец — тот, слева от которого вставляем (столбец ячейки с курсором / выделения).
      const cell = change(function () { return insertColumn(index, index); });
      clearSelection();
      if (cell) focusCell(cell);
    },
    // Строка сверху от активного элемента (подменю → «Сверху»). Выше строки шапки строк нет — новая строка встаёт сразу под шапкой.
    insertRowAbove: function (ctx) {
      if (!ctx) return;
      const top = ctx.kind === 'row' ? ctx.r
        : ctx.kind === 'range' ? ctx.range.r1
        : ctx.kind === 'cell' ? ctx.r
        : 1;
      const row = change(function () { return insertRow(Math.max(0, top - 1)); });
      clearSelection();
      if (row.cells[0]) focusCell(row.cells[0]);
    },
    deleteRow: function (ctx) {
      if (!ctx) return;
      let rows = ctx.kind === 'row' ? [ctx.r]
        : ctx.kind === 'range' ? Array.from({ length: ctx.range.r2 - ctx.range.r1 + 1 }, function (_, i) { return ctx.range.r1 + i; })
        : ctx.kind === 'cell' ? [ctx.r] : [];
      rows = rows.filter(function (r) { return r > 0; });          // строка шапки не удаляется
      if (!rows.length) return;
      change(function () { rows.sort(function (a, b) { return b - a; }).forEach(deleteRow); });
      clearSelection();
    },
    deleteCol: function (ctx) {
      if (!ctx) return;
      let cols = ctx.kind === 'col' ? [ctx.c]
        : ctx.kind === 'range' ? Array.from({ length: ctx.range.c2 - ctx.range.c1 + 1 }, function (_, i) { return ctx.range.c1 + i; })
        : ctx.kind === 'cell' ? [ctx.c] : [];
      if (!cols.length || cols.length >= columnCount()) return;    // хотя бы один столбец остаётся
      change(function () { cols.sort(function (a, b) { return b - a; }).forEach(deleteColumn); });
      clearSelection();
    },
    // Новая пустая таблица: 3 строки × 2 столбца, без заглавной строки и столбца — быстрая кнопка «Таблица» в пустой строке
    // и иконка «Таблица» в верхнем тулбаре. В демо одна таблица: новая встаёт на её место (Ctrl+Z возвращает прежнюю).
    // cols × rows — из окна создания таблицы; по умолчанию 2 столбца × 3 строки.
    newTable: function (ctx, cols, rows) {
      cols = cols || 2; rows = rows || 3;
      const idx = function (n) { return Array.apply(null, Array(n)); };
      change(function () {
        const tr = function (tag) { return '<tr>' + idx(cols).map(function () { return '<' + tag + (tag === 'th' ? ' scope="col"' : '') + '></' + tag + '>'; }).join('') + '</tr>'; };
        // Первая строка лежит в thead (чтобы «Заглавную строку» можно было включить), но заглавная строка выключена.
        table.innerHTML = '<colgroup>' + idx(cols).map(function () { return '<col>'; }).join('') + '</colgroup><thead>' + tr('th') + '</thead><tbody>' +
          idx(rows - 1).map(function () { return tr('td'); }).join('') + '</tbody>';
        // --tw-new: таблица только что создана — под ней кнопка «Заполнить таблицу» (в стиле — чтобы Ctrl+Z / Ctrl+Y её учитывали).
        table.setAttribute('style', '--tw-hrow: 0; --tw-new: 1');
        table.querySelectorAll('th, td').forEach(makeEditable);
        widget.hidden = false;
      });
      clearSelection();
      syncHeaders();
      syncEdges();
      updateMinWidth();
      focusCell(table.rows[0].cells[0]);
    },
    // «Заполнить таблицу»: таблица приводится к изначальному виду демо.
    fillDemoTable: function () {
      change(function () {
        table.innerHTML = INITIAL_TABLE.html;
        if (INITIAL_TABLE.style) table.setAttribute('style', INITIAL_TABLE.style); else table.removeAttribute('style');
        table.querySelectorAll('th, td').forEach(makeEditable);
        widget.hidden = false;
      });
      clearSelection();
      syncHeaders();
      syncEdges();
      updateMinWidth();
    },
    deleteTable: function () {
      change(function () { widget.hidden = true; });
      clearSelection();
      // На месте таблицы — пустая строка с курсором ввода (Figma 1049:22925).
      const line = document.querySelector('.doc-empty-line');
      if (line) setTimeout(function () { line.focus(); }, 0);
    },
    mergeCells: function (ctx) {
      const merged = activeMergedCell(ctx);
      if (merged) {
        // Повторное нажатие — разделить ячейку, сохранив выделение всего её диапазона.
        const p = gridPos(merged);
        const range = { r1: p.r, c1: p.c, r2: p.r + p.rspan - 1, c2: p.c + p.span - 1 };
        change(function () { splitCell(merged); });
        select('range', range);
        return;
      }
      if (!ctx || ctx.kind !== 'range' || !canMerge(ctx.range)) return;
      const cell = change(function () { return mergeRange(ctx.range); });
      const p = gridPos(cell);
      select('range', { r1: p.r, c1: p.c, r2: p.r + p.rspan - 1, c2: p.c + p.span - 1 });
    }
  };

  // Габариты активного элемента в координатах #tw-wrap (внешние края линий или рамки выделения).
  function activeBox() {
    if (selection && !selFrame.hidden) {
      // Объект — граница диапазона (внешний край линий ячеек), а не рамка выделения: рамка идёт на SEL_OUT снаружи.
      const l = parseFloat(selFrame.style.left) + SEL_OUT, t = parseFloat(selFrame.style.top) + SEL_OUT;
      return { left: l, top: t, right: l + parseFloat(selFrame.style.width) - 2 * SEL_OUT, bottom: t + parseFloat(selFrame.style.height) - 2 * SEL_OUT };
    }
    // Курсор в ячейке — тулбар встаёт по всей таблице (внешние края её рамки).
    const ctx = context();
    if (!ctx || ctx.kind !== 'cell') return null;
    return rel(table.getBoundingClientRect());
  }
  const TOOLBAR_GAP = 10;   // тулбар на 10px выше границы объекта (таблицы / рамки выделения), левые края совпадают

  // Ячейки активного элемента: ячейка с курсором, диапазон, строка или столбец.
  function activeCells(ctx) {
    if (!ctx) return [];
    if (ctx.kind === 'cell') return [ctx.cell];
    const g = gridMap();
    return g.all.filter(function (it) {
      if (ctx.kind === 'range') {
        const R = ctx.range;
        return it.r >= R.r1 && it.r <= R.r2 && it.start >= R.c1 && it.start <= R.c2;
      }
      if (ctx.kind === 'row') return it.r <= ctx.r && ctx.r < it.r + it.rspan;
      if (ctx.kind === 'col') return it.start <= ctx.c && ctx.c < it.start + it.span;
      return false;
    }).map(function (it) { return it.cell; });
  }

  // Ячейки для редакторов окон: 'all' — все ячейки, 'active' — активные, массив — заранее запомненные ячейки (если они ещё в таблице).
  function scopeCells(scope) {
    if (scope === 'all') return Array.from(table.querySelectorAll('th, td'));
    if (Array.isArray(scope)) { const live = scope.filter(function (c) { return c.isConnected && table.contains(c); }); if (live.length) return live; }
    return activeCells(context());
  }
  // rgb(…) → #RRGGBB
  function toHex(css) {
    const m = css && css.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return null;
    const a = m.length > 3 && +m[3] < 1 ? ('0' + Math.round(+m[3] * 255).toString(16)).slice(-2) : '';   // полупрозрачный — #RRGGBBAA
    return ('#' + m.slice(0, 3).map(function (v) { return ('0' + Math.round(+v).toString(16)).slice(-2); }).join('') + a).toUpperCase();
  }


  /* ---------- Формат текста (окно «Стиль текста») ----------
     Формат = { bold, italic, underline, strike }. Пишется inline-стилями:
     font-weight 600/400, font-style italic/normal, text-decoration-line.
     Выделение → формат всей ячейки; курсор → формат текста, который пойдёт после курсора (span с ZWSP). */
  const FMT_KEYS = ['bold', 'italic', 'underline', 'strike'];
  const ZWSP = '​';

  function decoOf(el, stop) {
    // Линии оформления действуют на потомков, поэтому собираем их по всей цепочке до ячейки.
    const d = { underline: false, strike: false };
    for (let e = el; e; e = e.parentElement) {
      const v = getComputedStyle(e).textDecorationLine || '';
      if (v.indexOf('underline') >= 0) d.underline = true;
      if (v.indexOf('line-through') >= 0) d.strike = true;
      if (e === stop) break;
    }
    return d;
  }
  function fmtOf(el, cell) {
    const cs = getComputedStyle(el), d = decoOf(el, cell);
    return { bold: parseInt(cs.fontWeight, 10) >= 600, italic: cs.fontStyle === 'italic', underline: d.underline, strike: d.strike };
  }
  // Элементы, в которых лежит текст ячейки (пустая ячейка — сама ячейка).
  function textHolders(cell) {
    const out = [];
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) if (n.data.replace(/[​\s]/g, '')) out.push(n.parentElement);
    return out.length ? out : [cell];
  }
  function ownDeco(el) {
    const v = el.style.textDecorationLine || '';
    return { underline: v.indexOf('underline') >= 0, strike: v.indexOf('line-through') >= 0 };
  }
  function setDeco(el, d) {
    const parts = [];
    if (d.underline) parts.push('underline');
    if (d.strike) parts.push('line-through');
    el.style.textDecorationLine = parts.length ? parts.join(' ') : 'none';
  }
  // Оформление ячейки опускаем на её содержимое (нужно, чтобы снять линию с части текста).
  function pushDecoDown(cell) {
    const d = ownDeco(cell);
    if (!d.underline && !d.strike) return;
    Array.from(cell.childNodes).forEach(function (n) {
      let el = n;
      if (n.nodeType === 3) { el = document.createElement('span'); cell.replaceChild(el, n); el.appendChild(n); }
      if (el.nodeType !== 1) return;
      const own = ownDeco(el);
      setDeco(el, { underline: own.underline || d.underline, strike: own.strike || d.strike });
    });
    cell.style.textDecorationLine = '';
  }
  function cssFor(f) {
    return { fontWeight: f.bold ? '600' : '400', fontStyle: f.italic ? 'italic' : 'normal' };
  }

  // Нативное выделение текста внутри одной редактируемой ячейки, отдельно от диапазона ячеек.
  function selectedTextRange() {
    const sel = window.getSelection();
    if (selection || !sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const cell = (node.nodeType === 1 ? node : node.parentElement).closest('th, td');
    if (!cell || !table.contains(cell) || !cell.contains(range.endContainer) || !range.toString()) return null;
    return range.cloneRange();
  }
  const FMT_COMMANDS = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough' };
  // Ячейки остаются plaintext-only для вставки. Только команда форматирования временно включает rich text.
  function withRichText(fn) {
    const range = selectedTextRange();
    if (!range) return;
    const node = range.startContainer;
    const cell = (node.nodeType === 1 ? node : node.parentElement).closest('th, td');
    const editable = cell.contentEditable;
    cell.contentEditable = 'true';
    try { return fn(); } finally { cell.contentEditable = editable; }
  }
  function selectedTextFormat() {
    return withRichText(function () {
      const fmt = {};
      FMT_KEYS.forEach(function (key) { fmt[key] = document.queryCommandState(FMT_COMMANDS[key]); });
      return fmt;
    });
  }
  function runTextCommand(command, value) {
    return withRichText(function () { return document.execCommand(command, false, value); });
  }
  function formatSelectedText(command, value) {
    if (!selectedTextRange()) return;
    if (['bold', 'italic', 'underline', 'strikeThrough', 'foreColor', 'hiliteColor', 'createLink', 'unlink', 'removeFormat'].indexOf(command) < 0) return;
    change(function () { runTextCommand(command, value); });
    table.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Формат активного элемента: значение ключа true, если так оформлен весь текст.
  function activeTextFormat() {
    if (selectedTextRange()) return selectedTextFormat();
    const ctx = context();
    if (!ctx) return null;
    if (ctx.kind === 'cell') {
      const sel = window.getSelection();
      let el = sel.rangeCount && ctx.cell.contains(sel.anchorNode) ? sel.anchorNode : ctx.cell;
      if (el.nodeType === 3) el = el.parentElement;
      return fmtOf(el, ctx.cell);
    }
    return cellsTextFormat(activeCells(ctx));
  }
  // Формат всего текста ячеек: ключ true, если так оформлен весь текст.
  function cellsTextFormat(cells) {
    const res = { bold: true, italic: true, underline: true, strike: true };
    cells.forEach(function (cell) {
      textHolders(cell).forEach(function (el) {
        const f = fmtOf(el, cell);
        FMT_KEYS.forEach(function (k) { if (!f[k]) res[k] = false; });
      });
    });
    return res;
  }

  // Применить формат. keys — что меняем (остальное в выделенных ячейках не трогаем).
  function applyTextFormat(fmt, keys) {
    const ctx = context();
    if (!ctx || !keys || !keys.length) return;
    if (selectedTextRange()) {
      change(function () {
        keys.forEach(function (key) {
          if (selectedTextFormat()[key] !== fmt[key]) runTextCommand(FMT_COMMANDS[key]);
        });
      });
      table.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (ctx.kind === 'cell') { setPendingFormat(ctx.cell, fmt); return; }
    applyCellsFormat(activeCells(ctx), fmt, keys);
  }
  // Оформить весь текст ячеек (кнопки B/I/U/S окон «Ячейки» / «Таблица → Ячейки» и выделение в окне «Стиль текста»).
  function applyCellsFormat(cells, fmt, keys) {
    if (!cells.length) return;
    const css = cssFor(fmt);
    change(function () {
      cells.forEach(function (cell) {
        const inner = cell.querySelectorAll('*');
        if (keys.indexOf('bold') >= 0) { cell.style.fontWeight = css.fontWeight; inner.forEach(function (e) { e.style.fontWeight = ''; }); }
        if (keys.indexOf('italic') >= 0) { cell.style.fontStyle = css.fontStyle; inner.forEach(function (e) { e.style.fontStyle = ''; }); }
        const du = keys.indexOf('underline') >= 0, ds = keys.indexOf('strike') >= 0;
        if (du || ds) {
          const own = ownDeco(cell);
          setDeco(cell, { underline: du ? fmt.underline : own.underline, strike: ds ? fmt.strike : own.strike });
          inner.forEach(function (e) {
            const o = ownDeco(e);
            const next = { underline: du ? false : o.underline, strike: ds ? false : o.strike };
            if (next.underline || next.strike) setDeco(e, next); else e.style.textDecorationLine = '';
          });
        }
        // Пустые style="" убираем, span без стилей разворачиваем.
        cell.querySelectorAll('span').forEach(function (e) {
          if (!e.getAttribute('style')) e.removeAttribute('style');
          if (!e.attributes.length) { while (e.firstChild) e.parentNode.insertBefore(e.firstChild, e); e.remove(); }
        });
        cell.normalize();
      });
    });
    if (selection) placeSelection();
  }

  // Курсор в ячейке: текст, набранный после курсора, получит формат fmt.
  let pending = null;   // span, ожидающий ввода
  function setPendingFormat(cell, fmt) {
    const sel = window.getSelection();
    if (!sel.rangeCount || !cell.contains(sel.anchorNode)) return;
    dropPending();
    const caret = sel.getRangeAt(0);
    caret.collapse(true);
    const cellDeco = ownDeco(cell);
    if ((cellDeco.underline && !fmt.underline) || (cellDeco.strike && !fmt.strike)) pushDecoDown(cell);
    // Разрезаем текст по курсору: правая часть уходит после нового span.
    const tail = document.createRange();
    tail.setStart(caret.startContainer, caret.startOffset);
    tail.setEnd(cell, cell.childNodes.length);
    const right = tail.extractContents();
    const span = document.createElement('span');
    const css = cssFor(fmt);
    span.style.fontWeight = css.fontWeight;
    span.style.fontStyle = css.fontStyle;
    const base = ownDeco(cell);   // линии ячейки (после pushDecoDown — только те, что остаются)
    setDeco(span, { underline: fmt.underline && !base.underline, strike: fmt.strike && !base.strike });
    if (span.style.textDecorationLine === 'none') span.style.textDecorationLine = '';
    span.appendChild(document.createTextNode(ZWSP));
    cell.appendChild(span);
    cell.appendChild(right);
    // Пустые обрезки после разреза.
    Array.from(cell.querySelectorAll('span')).forEach(function (e) { if (e !== span && !e.textContent) e.remove(); });
    const r = document.createRange();
    r.setStart(span.firstChild, 1);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    pending = span;
  }
  function dropPending() {
    if (!pending) return;
    const sp = pending;
    pending = null;
    if (!sp.isConnected) return;
    if (sp.textContent === ZWSP || !sp.textContent) {
      const parent = sp.parentNode;
      sp.remove();
      if (parent) parent.normalize();
    } else {
      sp.childNodes.forEach(function (n) { if (n.nodeType === 3) n.data = n.data.replace(/​/g, ''); });
    }
  }
  // После первого ввода убираем служебный ZWSP, сохраняя позицию курсора.
  table.addEventListener('input', function () {
    if (!pending || !pending.isConnected) return;
    const t = pending.firstChild;
    if (!t || t.nodeType !== 3 || t.data === ZWSP || t.data.indexOf(ZWSP) < 0) return;
    const sel = window.getSelection();
    const at = sel.rangeCount && sel.anchorNode === t ? sel.anchorOffset : null;
    const i = t.data.indexOf(ZWSP);
    t.data = t.data.replace(/​/g, '');
    if (at !== null) { const r = document.createRange(); r.setStart(t, at > i ? at - 1 : at); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
    pending = null;
  });
  // Курсор ушёл, ничего не набрано — убираем пустой span.
  document.addEventListener('selectionchange', function () {
    if (!pending) return;
    const sel = window.getSelection();
    if (sel.rangeCount && pending.contains(sel.anchorNode)) return;
    dropPending();
  });

  window.TableAPI = {
    context: context,
    selectedTextRange: selectedTextRange,
    formatSelectedText: formatSelectedText,
    columnCount: columnCount,
    // Диапазон R — одна ячейка (в т. ч. объединённая)?
    isSingleCellRange: function (R) {
      if (!R) return false;
      return gridMap().all.filter(function (it) { return it.r >= R.r1 && it.r <= R.r2 && it.start >= R.c1 && it.start <= R.c2; }).length === 1;
    },
    // Ширина таблицы (редактор «Ширина» окна «Таблица»): текущая, допустимые пределы и установка.
    // Не шире колонки текста документа и не уже, чем по 48px на столбец. Отменяется Ctrl+Z.
    tableWidth: function () { return Math.round(table.getBoundingClientRect().width); },
    // Способ задания ширины: 'fill' — «заполнить» (своей ширины нет, таблица во всю ширину колонки текста),
    // 'pct' — относительная (ширина в % от колонки текста), 'px' — фиксированная.
    tableWidthMode: function () {
      const w = table.style.width;
      if (/%$/.test(w)) return 'pct';
      return w || isExpanded() ? 'px' : 'fill';
    },
    // Относительная ширина: % от ширины колонки текста (1–100, не уже 48px на столбец). Отменяется Ctrl+Z.
    tableWidthPct: function () {
      const w = table.style.width;
      if (/%$/.test(w)) return Math.round(parseFloat(w));
      return Math.round(this.tableWidth() / this.tableWidthLimits().max * 100);
    },
    setTableWidthPct: function (pct) {
      const lim = this.tableWidthLimits();
      const minPct = Math.ceil(lim.min / lim.max * 100);
      const v = Math.max(Math.min(minPct, 100), Math.min(100, Math.round(pct)));
      if (this.tableWidthMode() === 'pct' && this.tableWidthPct() === v) return v;
      change(function () { table.style.removeProperty('--tw-expand'); table.style.width = v + '%'; });
      updateMinWidth();
      placeAlign();
      window.dispatchEvent(new Event('resize'));
      return v;
    },
    // Фиксированная ширина, равная текущей (выбор способа «фиксированная (px)» в меню способов).
    fixTableWidth: function () { if (this.tableWidthMode() !== 'px') this.setTableWidth(this.tableWidth()); },
    // «Заполнить»: таблица растягивается на всю ширину колонки текста (своя ширина и «Расширить» снимаются). Отменяется Ctrl+Z.
    fillTableWidth: function () {
      if (this.tableWidthMode() === 'fill') return;
      change(function () { table.style.removeProperty('width'); table.style.removeProperty('--tw-expand'); });
      updateMinWidth();
      placeAlign();
      window.dispatchEvent(new Event('resize'));
    },
    tableWidthLimits: function () { return { min: columnCount() * MIN_COL_WIDTH, max: Math.floor(widget.getBoundingClientRect().width) }; },
    setTableWidth: function (px) {
      const lim = this.tableWidthLimits();
      const v = Math.max(lim.min, Math.min(lim.max, Math.round(px)));
      if (v === this.tableWidth() && this.tableWidthMode() === 'px' && !isExpanded()) return v;
      change(function () {
        table.style.removeProperty('--tw-expand');   // своя ширина — таблица больше не «расширена»
        table.style.width = v + 'px';
      });
      updateMinWidth();
      placeAlign();
      window.dispatchEvent(new Event('resize'));
      return this.tableWidth();   // фактическая ширина (таблица не уже своего содержимого)
    },
    // Выделен диапазон, в который не входит целиком ни одна строка и ни один столбец.
    isRangeSelection: function () {
      return !!selection && selection.kind === 'range' && !this.isRowSelection() && !this.isColSelection();
    },
    // Выделены столбцы целиком: один столбец (хэндлер) или диапазон на всю высоту таблицы (один или несколько столбцов).
    // Диапазон на всю таблицу считается выделением строк.
    isColSelection: function () {
      if (!selection) return false;
      if (selection.kind === 'col') return true;
      if (selection.kind !== 'range') return false;
      const R = selection.range;
      const fullHeight = R.r1 === 0 && R.r2 === table.rows.length - 1;
      const fullWidth = R.c1 === 0 && R.c2 === columnCount() - 1;
      return fullHeight && !fullWidth;
    },
    // Выделены строки целиком: одна строка (хэндлер) или диапазон на всю ширину таблицы (одна или несколько строк).
    isRowSelection: function () {
      if (!selection) return false;
      if (selection.kind === 'row') return true;
      if (selection.kind !== 'range') return false;
      const R = selection.range;
      return R.c1 === 0 && R.c2 === columnCount() - 1;
    },
    // Заливка активного элемента: '#RRGGBB'; null — не залит; undefined — у выделенных ячеек разная заливка.
    activeFill: function () {
      const cells = activeCells(context());
      if (!cells.length) return null;
      // Фактический цвет: своя заливка или фон оформления (шапка, строки-группы). Прозрачный — «не залит».
      const fills = cells.map(function (c) {
        const bg = getComputedStyle(c).backgroundColor;
        const m = bg.match(/[\d.]+/g);
        if (!m || (m.length === 4 && +m[3] === 0)) return null;
        return toHex(bg);
      });
      return fills.every(function (f) { return f === fills[0]; }) ? fills[0] : undefined;
    },
    // Заливка всей таблицы — фактический фон ячеек: своя заливка из окна «Фон», а также фон заглавной строки / столбца
    // и строк-групп; прозрачный («Без фона») — не залита.
    // { kind: 'none' } — ни одна ячейка не залита; { kind: 'same', color } — все ячейки залиты одним цветом; { kind: 'mixed' } — по-разному.
    // То же для активных ячеек (выделение или ячейка с курсором) — редактор «Фон» окна «Ячейки».
    cellsFillState: function () { return this.tableFillState(activeCells(context())); },
    tableFillState: function (only) {
      const cells = only || Array.from(table.querySelectorAll('th, td'));
      const fills = cells.map(function (c) {
        const bg = getComputedStyle(c).backgroundColor;
        const m = bg.match(/[\d.]+/g);
        if (!m || (m.length === 4 && +m[3] === 0)) return null;
        return toHex(bg);
      });
      if (fills.every(function (f) { return f === null; })) return { kind: 'none' };
      if (fills.every(function (f) { return f === fills[0]; })) return { kind: 'same', color: fills[0] };
      return { kind: 'mixed' };
    },
    // Выравнивание текста в ячейках (редактор «Выравнивание» в окнах «Ячейки» / «Таблица → Ячейки»).
    // scope: 'active' — активные ячейки (выделение или ячейка с курсором), 'all' — все ячейки таблицы.
    // cellAlign → { h: 'left'|'center'|'right', v: 'top'|'middle'|'bottom' } или null, если у ячеек разное выравнивание.
    cellAlign: function (scope) {
      const cells = scopeCells(scope);
      if (!cells.length) return null;
      const vals = cells.map(function (c) { const cs = getComputedStyle(c); return cs.textAlign.replace('start', 'left').replace('end', 'right') + '|' + cs.verticalAlign; });
      if (!vals.every(function (v) { return v === vals[0]; })) return null;
      const p = vals[0].split('|');
      return { h: p[0], v: p[1] };
    },
    // Выровнять текст в ячейках. Отменяется Ctrl+Z.
    setCellAlign: function (scope, h, v) {
      const cells = scopeCells(scope);
      if (!cells.length) return;
      change(function () { cells.forEach(function (c) { c.style.textAlign = h; c.style.verticalAlign = v; }); });
      if (selection) placeSelection();
    },
    // Размер текста ячеек (поле размера в окнах «Ячейки» / «Таблица → Ячейки»): px или null, если размеры разные.
    cellFontSize: function (scope) {
      const cells = scopeCells(scope);
      if (!cells.length) return null;
      const vals = [];
      cells.forEach(function (c) { textHolders(c).forEach(function (el) { vals.push(Math.round(parseFloat(getComputedStyle(el).fontSize))); }); });
      if (!vals.length) vals.push(Math.round(parseFloat(getComputedStyle(cells[0]).fontSize)));
      return vals.every(function (v) { return v === vals[0]; }) ? vals[0] : null;
    },
    // Задать размер текста ячеек (весь текст). Отменяется Ctrl+Z.
    setCellFontSize: function (scope, px) {
      const cells = scopeCells(scope);
      if (!cells.length) return;
      change(function () {
        // Межстрочный интервал растёт вместе с размером (16 / 24 = 1,5), чтобы строки не наезжали друг на друга.
        cells.forEach(function (c) { c.style.fontSize = px + 'px'; c.style.lineHeight = Math.round(px * 1.5) + 'px'; c.querySelectorAll('*').forEach(function (e) { e.style.fontSize = ''; e.style.lineHeight = ''; }); });
      });
      if (selection) placeSelection();
    },
    // Начертание всего текста ячеек (B/I/U/S в окнах «Ячейки» / «Таблица → Ячейки»): key — bold / italic / underline / strike.
    cellsTextFormat: function (scope) { const cells = scopeCells(scope); return cells.length ? cellsTextFormat(cells) : null; },
    setCellsTextFormat: function (scope, key, on) {
      const f = {}; f[key] = on;
      applyCellsFormat(scopeCells(scope), f, [key]);
    },
    // ---- Границы активных ячеек (редактор «Границы» окна «Ячейки» — тот же редактор, что в окне «Таблица») ----
    // Оформление: { style, width, color } — общее значение или null. Сторона без своего оформления берётся у соседней ячейки
    // (общая линия хранится у одной из них), иначе — по умолчанию: сплошная 1px #d2d6da.
    cellsBorderStyle: function () {
      const st = new Set(), wd = new Set(), co = new Set();
      cellsSides().forEach(function (x) {
        const p = (x.value || 'solid 1 #d2d6da').split(' ');
        st.add(p[0]); wd.add(+p[1]); co.add(p[2].slice(0, 7).toLowerCase());
      });
      const one = function (set, def) { return set.size === 0 ? def : set.size === 1 ? Array.from(set)[0] : null; };
      return { style: one(st, 'solid'), width: one(wd, 1), color: one(co, '#d2d6da') };
    },
    // Толщина и/или цвет (patch: { width?, color? }) всех границ активных ячеек; остальное оформление линий сохраняется. Ctrl+Z.
    setCellsBorders: function (patch) {
      const sides = cellsSides();
      if (!sides.length) return;
      change(function () {
        sides.forEach(function (x) {
          const p = (x.value || 'solid 1 #d2d6da').split(' ');
          if (p[0] === 'none') p[0] = 'solid';
          if (patch.width) p[1] = String(patch.width);
          if (patch.color) p[2] = patch.color;
          x.item.cell.setAttribute(BD_SIDES[x.side], p.join(' '));
          if (x.from) x.from.cell.removeAttribute(BD_SIDES[x.opp]);   // общая линия — теперь у этой ячейки
        });
      });
      drawBorders();
    },
    // Убрать все границы активных ячеек (линии «Нет») / вернуть им границы по умолчанию. Ctrl+Z.
    removeCellsBorders: function () {
      const R = borderRange();
      if (R) applyBorders(R, 'Все границы', { style: 'none', width: 1, color: '#d2d6da' });
    },
    resetCellsBorders: function () {
      const sides = cellsSides();
      change(function () {
        sides.forEach(function (x) {
          x.item.cell.removeAttribute(BD_SIDES[x.side]);
          if (x.from) x.from.cell.removeAttribute(BD_SIDES[x.opp]);
        });
      });
      drawBorders();
    },
    // Цвет границ всей таблицы (строка «Границы» окна «Таблица»): '#rrggbb' — у всех линий один цвет; null — разные.
    tableBorderColor: function () { return this.tableBorderStyle().color; },
    // Оформление всех границ таблицы: { style, width, color } — общее значение или null, если у линий оно разное
    // (линии без своего оформления — сплошные, 1px, #d2d6da).
    tableBorderStyle: function () {
      const st = new Set(), wd = new Set(), co = new Set();
      Array.from(table.querySelectorAll('th, td')).forEach(function (c) {
        ['t', 'b', 'l', 'r'].forEach(function (k) {
          const v = c.getAttribute(BD_SIDES[k]);
          if (v) { const p = v.split(' '); st.add(p[0]); wd.add(+p[1]); co.add(p[2].slice(0, 7).toLowerCase()); }
          else if (c.classList.contains('edge-' + k)) { st.add('solid'); wd.add(1); co.add('#d2d6da'); }
        });
      });
      const one = function (set, def) { return set.size === 0 ? def : set.size === 1 ? Array.from(set)[0] : null; };
      return { style: one(st, 'solid'), width: one(wd, 1), color: one(co, '#d2d6da') };
    },
    // Убрать все границы таблицы (линии «Нет») / вернуть границы по умолчанию (как в демо изначально). Отменяется Ctrl+Z.
    removeTableBorders: function () {
      applyBorders({ r1: 0, c1: 0, r2: table.rows.length - 1, c2: columnCount() - 1 }, 'Все границы', { style: 'none', width: 1, color: '#d2d6da' });
    },
    resetTableBorders: function () {
      change(function () {
        Array.from(table.querySelectorAll('th, td')).forEach(function (c) { Object.keys(BD_SIDES).forEach(function (k) { c.removeAttribute(BD_SIDES[k]); }); });
      });
    },
    // Задать границам всей таблицы толщину и/или цвет (patch: { width?, color? }), остальное оформление линий сохраняется.
    // Отменяется Ctrl+Z.
    setTableBorders: function (patch) {
      const cur = this.tableBorderStyle();
      const R = { r1: 0, c1: 0, r2: table.rows.length - 1, c2: columnCount() - 1 };
      if (cur.style !== null && cur.width !== null && cur.color !== null) {
        applyBorders(R, 'Все границы', { style: cur.style, width: patch.width || cur.width, color: patch.color || cur.color });
        return;
      }
      // Оформление линий разное — меняем только заданное у линий со своим оформлением.
      change(function () {
        Array.from(table.querySelectorAll('th, td')).forEach(function (c) {
          ['t', 'b', 'l', 'r'].forEach(function (k) {
            const v = c.getAttribute(BD_SIDES[k]);
            if (!v) return;
            const p = v.split(' ');
            if (patch.width) p[1] = String(patch.width);
            if (patch.color) p[2] = patch.color;
            c.setAttribute(BD_SIDES[k], p.join(' '));
          });
        });
      });
    },
    // Активные ячейки (выделение или ячейка с курсором) — список, чтобы окно работало с ними, даже когда фокус в его поле ввода.
    activeCellList: function () { return activeCells(context()); },
    // Внутренние отступы ячеек (редактор «Отступы»): axis 'h' — слева и справа, 'v' — сверху и снизу.
    // cellPadding → число px или null, если у ячеек разные отступы.
    cellPadding: function (scope, axis) {
      const cells = scopeCells(scope);
      if (!cells.length) return null;
      const vals = cells.map(function (c) { const cs = getComputedStyle(c); return Math.round(parseFloat(axis === 'h' ? cs.paddingLeft : cs.paddingTop)); });
      return vals.every(function (v) { return v === vals[0]; }) ? vals[0] : null;
    },
    // Задать отступы ячеек. Отменяется Ctrl+Z.
    setCellPadding: function (scope, axis, px) {
      const cells = scopeCells(scope);
      if (!cells.length) return;
      change(function () {
        cells.forEach(function (c) {
          if (axis === 'h') { c.style.paddingLeft = px + 'px'; c.style.paddingRight = px + 'px'; }
          else { c.style.paddingTop = px + 'px'; c.style.paddingBottom = px + 'px'; }
        });
      });
      if (selection) placeSelection();
    },
    // Залить все ячейки таблицы одним цветом (кружок «Фон ячеек» в окне «Таблица»). null — без фона. Отменяется Ctrl+Z.
    fillAllCells: function (color) {
      const cells = Array.from(table.querySelectorAll('th, td'));
      change(function () {
        cells.forEach(function (c) { c.style.background = color || 'transparent'; });
        // Цвет заглавной строки / столбца становится тем же — кружки у переключателей показывают новый цвет.
        ['--tw-hrow-bg', '--tw-hcol-bg'].forEach(function (prop) {
          const v = color ? color.toLowerCase() : 'transparent';
          if (v === '#f8f8f8') table.style.removeProperty(prop); else table.style.setProperty(prop, v);
        });
      });
      document.dispatchEvent(new CustomEvent('tw:toggles'));
      if (selection) placeSelection();
    },
    // Залить фон активной ячейки / выделенных ячеек. color = null — без фона (прозрачный). Отменяется Ctrl+Z.
    applyFill: function (color) {
      const cells = activeCells(context());
      if (!cells.length) return;
      change(function () {
        // «Без фона» — фон действительно прозрачный, в том числе у шапки и строк-групп
        // (их серый — такая же заливка, как у любой ячейки).
        cells.forEach(function (c) { c.style.background = color || 'transparent'; });
      });
      if (selection) placeSelection();
    },
    activeTextFormat: activeTextFormat,
    applyTextFormat: applyTextFormat,
    activeBox: activeBox,
    // Поставить тулбар (созданный с container: #tw-wrap) над активным элементом.
    placeToolbar: function (tb) {
      if (selectedTextRange()) { tb.hide(); return; }
      const box = activeBox();
      if (!box) { tb.hide(); return; }
      tb.el.style.visibility = 'hidden';
      tb.el.hidden = false;
      const h = tb.el.offsetHeight;
      tb.el.style.visibility = '';
      // Тулбар таблицы (курсор в ячейке, выделения нет) — на 1px левее левого края таблицы (по правке пользователя).
      const shiftX = selection ? 0 : -1;
      // Таблица в скролле: объект ушёл влево за видимую часть — тулбар у левого края видимой части.
      const left = hs.on ? Math.max(box.left + shiftX, hs.s - 1) : box.left + shiftX;
      // Вертикальный скролл страницы: тулбар прилипает к низу верхнего тулбара редактора и уходит вместе с концом таблицы.
      let top = box.top - TOOLBAR_GAP - h;
      const appBar = document.querySelector('.app-toolbar');
      if (appBar && !document.documentElement.classList.contains('tw-in-window')) {
        const wr = wrap.getBoundingClientRect();
        const stickTop = appBar.getBoundingClientRect().bottom - wr.top;
        const tBottom = table.getBoundingClientRect().bottom - wr.top;
        if (top < stickTop) top = Math.min(stickTop, tBottom - h);
      }
      tb.showAt(left, top);
    },
    // Ячейка, которую делит окно «Разделение ячейки»: ячейка с курсором или одна объединённая ячейка в выделении.
    splitTarget: function () { const ctx = context(); return ctx && ctx.kind === 'cell' ? ctx.cell : activeMergedCell(ctx); },
    // Разделить ячейку на cols × rows; курсор — в первую часть.
    splitCellInto: function (cell, cols, rows) {
      if (!cell || !cell.isConnected || (cols < 2 && rows < 2)) return;
      change(function () { splitInto(cell, cols, rows); });
      clearSelection();
      syncEdges();
      focusCell(cell);
    },
    // Создать пустую таблицу cols × rows (окно создания таблицы).
    newTable: function (cols, rows) { commands.newTable(context(), cols, rows); },
    // Видимая ширина таблицы (для окна расширенного режима: окно не шире видимой части таблицы в скролле).
    hscrollView: function () { return hscrollView(); },
    // Выделена вся таблица (диапазон на все строки и все столбцы).
    isWholeSelection: function () {
      const ctx = context(); if (!selection || !ctx || ctx.kind !== 'range') return false;
      const R = ctx.range;
      return R.r1 === 0 && R.c1 === 0 && R.r2 === table.rows.length - 1 && R.c2 === columnCount() - 1;
    },
    // Видимая полоса таблицы в скролле (координаты окна браузера) или null, если скролла нет.
    hscrollBox: function () { if (!hs.on) return null; const wr = widget.getBoundingClientRect(); return { left: wr.left + hs.left, width: hs.view }; },
    // Пересчитать залипание заглавной строки (шапка окна расширенного режима меняет высоту, когда залипает).
    syncVStick: function () { syncVStick(); },
    // Отмена / возврат — как Ctrl+Z / Ctrl+Y (кнопки в шапке редактора и в шапке окна расширенного режима).
    undo: function () { undo(); },
    redo: function () { redo(); },
    run: function (id) {
      if (commands[id]) commands[id](context());
    },
    tableAlign: tableAlign,
    isHeader: isHeader,
    setHeader: setHeader,
    headerColor: headerColor,
    setHeaderColor: setHeaderColor,
    // Отметка в истории изменений и откат к ней (окно «Границы»: крестик сбрасывает изменения, внесённые в окне).
    historyMark: function () { return undoStack.length; },
    revertTo: function (mark) {
      if (undoStack.length <= mark) return;
      // Выделение после отката остаётся тем же (снимок таблицы его сбрасывает — возвращаем).
      const sel = selection && (selection.kind === 'row' ? { kind: 'row', r: selection.row.rowIndex }
        : selection.kind === 'col' ? { kind: 'col', c: selection.index } : { kind: 'range', range: Object.assign({}, selection.range) });
      while (undoStack.length > mark) undo();
      if (sel && sel.kind === 'row' && table.rows[sel.r]) select('row', table.rows[sel.r]);
      else if (sel && sel.kind === 'col') select('col', sel.c);
      else if (sel && sel.kind === 'range') select('range', sel.range);
    },
    borderRange: borderRange,
    applyBorders: applyBorders,
    isExpanded: isExpanded,
    isMergedActive: function () { return !!activeMergedCell(context()); },
    canMerge: function () { const c = context(); return !!(c && c.kind === 'range' && canMerge(c.range)); }
  };

  // Крайние ячейки пересчитываются при любом изменении структуры таблицы.
  new MutationObserver(syncEdges).observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['colspan', 'rowspan'] });
  syncEdges();

  updateMinWidth();
})();
