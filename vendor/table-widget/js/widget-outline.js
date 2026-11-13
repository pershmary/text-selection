/* Таблица сохраняет активную обводку при курсоре или выделении ячеек.
   Диапазон ячеек подсвечивается полупрозрачным фоном без собственной обводки. */
(function () {
  const widget = document.querySelector('.table-widget');
  const scroll = widget.querySelector('.table-scroll');
  const wrap = document.getElementById('tw-wrap');
  const table = wrap.querySelector('.tw');
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'tw-outline');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(NS, 'rect');
  svg.appendChild(rect);
  svg.setAttribute('hidden', '');   // у SVG нет свойства hidden — только атрибут
  scroll.appendChild(svg);
  let hover = false;

  function state() {
    if (widget.hidden || document.documentElement.classList.contains('tw-dragging') ||
        document.documentElement.classList.contains('doc-selecting') || widget.classList.contains('is-fully-selected')) return null;
    // Активная — при настоящем выделении (слой выделения виден); в окне расширенного режима без курсора
    // context() отдаёт всю таблицу как диапазон для команд — это не выделение.
    const sel = wrap.querySelector('.tw-sel');
    if (sel && !sel.hidden) return 'active';
    const a = document.activeElement;
    const caret = a && table.contains(a) && a.closest('th, td');
    if (caret) return 'active';   // только курсор в ячейке; без курсора и без выделения активной обводки нет
    return hover ? 'hover' : null;
  }
  let raf = 0;
  function update() {
    raf = 0;
    const st = state();
    svg.classList.toggle('is-hover', st === 'hover');
    if (!st) { svg.setAttribute('hidden', ''); return; }
    svg.removeAttribute('hidden');
    let anc = scroll;   // ближайший позиционированный предок (у svg нет offsetParent)
    while (anc && anc !== document.body && getComputedStyle(anc).position === 'static') anc = anc.parentElement;
    const base = (anc || document.body).getBoundingClientRect();
    const tr = table.getBoundingClientRect();
    let left = tr.left, width = tr.width;
    const hb = TableAPI.hscrollBox && TableAPI.hscrollBox();
    if (hb) { left = hb.left; width = hb.width; }
    // Внешний край обводки — на 1px снаружи рамки таблицы; линия 1px по центру своего пикселя.
    const w = width + 2, h = tr.height + 2;
    svg.style.left = (left - 1 - base.left) + 'px';
    svg.style.top = (tr.top - 1 - base.top) + 'px';
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    rect.setAttribute('x', .5); rect.setAttribute('y', .5);
    rect.setAttribute('width', w - 1); rect.setAttribute('height', h - 1);
    rect.setAttribute('rx', 4.5); rect.setAttribute('ry', 4.5);
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }
  wrap.addEventListener('pointerenter', function () { hover = true; schedule(); });
  wrap.addEventListener('pointerleave', function () { hover = false; schedule(); });
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.addEventListener('pointerup', schedule);
  table.addEventListener('tw:selection', schedule);
  table.addEventListener('input', schedule);
  new ResizeObserver(schedule).observe(table);
  new MutationObserver(schedule).observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['colspan', 'rowspan', 'style'] });
  new MutationObserver(schedule).observe(wrap, { subtree: true, attributes: true, attributeFilter: ['hidden'] });   // тулбар ячейки показан / скрыт
  new MutationObserver(schedule).observe(widget, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);
  schedule();
})();
