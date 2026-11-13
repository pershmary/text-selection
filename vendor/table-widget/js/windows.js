/* ---------- Окна команд тулбара ----------
   TableWindows[name](tb) → DOM-элемент окна (создаётся один раз на тулбар).
   Окно открывает tb.toggleWindow(win, id): левый край окна = левый край кнопки, 4px под тулбаром.
   Логика окон описывается отдельными задачами; сейчас окно «Фон» — вёрстка + открытие/закрытие. */
const TableWindows = (function () {
  const ICONS = {
    eyedropper: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M12.2337 0.64521L10.5286 2.35089L10.3306 2.15463C9.72403 1.54564 8.66843 1.54143 8.05007 2.16053C7.42329 2.78636 7.42329 3.80724 8.05007 4.43476L8.24721 4.63186L1.48567 11.3914C0.99536 11.8816 0.769582 12.5841 0.868992 13.2706L0.382896 13.7583C-0.128474 14.2468 -0.126789 15.1279 0.382896 15.6164C0.869834 16.1277 1.75188 16.1277 2.24219 15.6173L2.72829 15.1296C3.4132 15.2307 4.11834 15.0032 4.60865 14.5138L11.3702 7.75431L11.5665 7.95057C12.1941 8.57809 13.2143 8.57809 13.847 7.94551C14.4738 7.31799 14.4738 6.29711 13.847 5.67128L13.6516 5.47333L15.3567 3.7685C16.2151 2.94472 16.2143 1.4673 15.355 0.64521C14.9253 0.215632 14.3601 0 13.7948 0C13.2295 0 12.6634 0.215632 12.2337 0.64521ZM10.8251 3.24542L12.8293 1.24157C13.3441 0.726072 14.2446 0.726071 14.7611 1.24325C15.2901 1.75032 15.291 2.66423 14.7611 3.17214L12.7569 5.176C12.5917 5.33941 12.5917 5.60726 12.7569 5.77151L13.2505 6.26595C13.5496 6.56412 13.5496 7.05098 13.2463 7.35505C12.9473 7.65407 12.462 7.65407 12.1621 7.35505L8.64569 3.83925C8.34746 3.54023 8.34746 3.05422 8.65074 2.75099C8.94055 2.45786 9.44518 2.45786 9.73498 2.75099L10.2295 3.24542C10.3121 3.32713 10.4199 3.36756 10.5277 3.36756C10.6356 3.36756 10.7434 3.32713 10.8251 3.24542ZM0.978511 14.3538L1.62467 13.7069C1.73082 13.6008 1.77126 13.4466 1.73419 13.3026C1.60951 12.8216 1.7384 12.3306 2.08128 11.9869L8.84367 5.22738L10.7746 7.15795L4.01303 13.9183C3.671 14.2603 3.17984 14.39 2.69796 14.2654C2.55137 14.2283 2.39805 14.2696 2.29274 14.3749L1.64742 15.0218C1.55054 15.122 1.44018 15.1641 1.33234 15.1641C0.968402 15.1641 0.637317 14.6823 0.978511 14.3538Z"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.7917 16.875C17.9306 16.9861 18 17.1389 18 17.3333C18 17.5278 17.9306 17.6806 17.7917 17.7917C17.7361 17.875 17.6667 17.9306 17.5833 17.9583C17.5 17.9861 17.4167 18 17.3333 18C17.25 18 17.1667 17.9861 17.0833 17.9583C17 17.9306 16.9306 17.875 16.875 17.7917L12 12.9583L7.125 17.7917C7.06944 17.875 7 17.9306 6.91667 17.9583C6.83333 17.9861 6.75 18 6.66667 18C6.58333 18 6.5 17.9861 6.41667 17.9583C6.33333 17.9306 6.26389 17.875 6.20833 17.7917C6.06944 17.6806 6 17.5278 6 17.3333C6 17.1389 6.06944 16.9861 6.20833 16.875L11.0417 12L6.20833 7.125C6.06944 7.01389 6 6.86111 6 6.66667C6 6.47222 6.06944 6.31944 6.20833 6.20833C6.31944 6.06944 6.47222 6 6.66667 6C6.86111 6 7.01389 6.06944 7.125 6.20833L12 11.0417L16.875 6.20833C16.9861 6.06944 17.1389 6 17.3333 6C17.5278 6 17.6806 6.06944 17.7917 6.20833C17.9306 6.31944 18 6.47222 18 6.66667C18 6.86111 17.9306 7.01389 17.7917 7.125L12.9583 12L17.7917 16.875Z"/></svg>',
    pin: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M0 14C0 6.26801 6.26801 0 14 0C21.732 0 28 6.26801 28 14C28 21.732 21.732 28 14 28C6.26801 28 0 21.732 0 14Z" fill="#333333" fill-opacity="0.05"/><path fill="currentColor" d="M19.7969 10.7578L17.1172 8.05078L14.4102 11.8242L13.8359 11.6602L13.8633 11.6875C13.6992 11.6328 13.5352 11.5964 13.3711 11.5781C13.207 11.5599 13.043 11.5508 12.8789 11.5508H12.8516C12.7057 11.5508 12.5599 11.5599 12.4141 11.5781C12.2682 11.5781 12.1315 11.5964 12.0039 11.6328H11.9766C11.8307 11.6693 11.6849 11.724 11.5391 11.7969C11.3932 11.8516 11.2565 11.9154 11.1289 11.9883L15.8047 16.6641V16.6914C15.8776 16.5456 15.9414 16.3997 15.9961 16.2539C16.069 16.1081 16.1237 15.9531 16.1602 15.7891V15.8164C16.1966 15.6706 16.224 15.5156 16.2422 15.3516C16.2604 15.1875 16.2695 15.0234 16.2695 14.8594C16.2695 14.7135 16.2604 14.5586 16.2422 14.3945C16.224 14.2305 16.1966 14.0846 16.1602 13.957L15.9961 13.3555L19.7969 10.7578ZM11.5938 14.832L13.0156 16.2266L7.10938 20.7383L11.5938 14.832ZM20.7812 10.5117C20.8177 10.5482 20.8451 10.5938 20.8633 10.6484C20.8815 10.6849 20.8906 10.7214 20.8906 10.7578V10.8672H20.8633C20.8451 10.9401 20.8086 11.013 20.7539 11.0859C20.6992 11.1589 20.6354 11.2135 20.5625 11.25L17.0625 13.7656C17.1172 13.9297 17.1536 14.112 17.1719 14.3125C17.1901 14.4948 17.1992 14.6862 17.1992 14.8867C17.1992 15.0872 17.1901 15.2878 17.1719 15.4883C17.1536 15.6706 17.1172 15.8438 17.0625 16.0078V16.0352C16.9714 16.4362 16.8255 16.8099 16.625 17.1562C16.4427 17.4844 16.2148 17.7852 15.9414 18.0586L9.81641 11.9336C10.0716 11.6602 10.3633 11.4323 10.6914 11.25C11.0378 11.0495 11.4115 10.8945 11.8125 10.7852L11.7852 10.8125C11.9674 10.7578 12.1406 10.7214 12.3047 10.7031C12.487 10.6849 12.6693 10.6758 12.8516 10.6758H12.8789C13.0794 10.6758 13.2799 10.694 13.4805 10.7305C13.681 10.7487 13.8724 10.7852 14.0547 10.8398L16.5703 7.25781C16.625 7.1849 16.6888 7.12109 16.7617 7.06641C16.8346 7.01172 16.9076 6.97526 16.9805 6.95703H17.1445C17.181 6.95703 17.2174 6.96615 17.2539 6.98438C17.2904 6.98438 17.3268 6.99349 17.3633 7.01172L20.7812 10.5117Z"/></svg>',
    slash: '<svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M17.611328 0.314697L0.611328 21.3147" stroke="#d2d6da" fill="none"/></svg>'
  };
  // Палитра «Окна Фона» (Figma, node 2002:170964): один ряд из 10. Первая — «Без фона» (белый кружок с диагональю, без цвета), дальше 9 полупрозрачных цветов 25% (0x40);
  // полупрозрачный кружок: слева цвет, справа он же на «шахматке».
  const FILLS = [null].concat(['#a6a6a6', '#fe2819', '#ff7d05', '#ffd707', '#14c730', '#11d1f3', '#117df3', '#723eff', '#f10dd6']
    .map(function (c) { return c + '40'; }));
  function swatchBg(c) {
    if (c && c.length === 9) {
      const solid = c.slice(0, 7);
      return 'linear-gradient(90deg, ' + solid + ' 0 50%, transparent 50%), linear-gradient(90deg, transparent 50%, ' + c + ' 50%), repeating-conic-gradient(#d9d9d9 0 25%, #fff 0 50%) 0 0 / 8px 8px';
    }
    return c || '';
  }
  // Подпись цвета: HEX без альфы + прозрачность, если она не 100%.
  function colorLabel(c) {
    if (!c) return '';
    return c.length === 9 ? c.slice(0, 7).toUpperCase() + ' ' + Math.round(parseInt(c.slice(7), 16) / 255 * 100) + '%' : c.toUpperCase();
  }
  // Овал «Выбранный цвет» — один компонент во всех окнах выбора цвета («Фон», «Цвет границ»):
  // полупрозрачный цвет — целиком на «шахматке», без половинки сплошным цветом.
  function paintCurrent(el, c) {
    el.style.background = c && c.length === 9
      ? 'linear-gradient(' + c + ', ' + c + '), repeating-conic-gradient(#d9d9d9 0 25%, #fff 0 50%) 0 0 / 8px 8px' : (c || '');
  }
  function pickInto(w, c) {
    paintCurrent(w.querySelector('.twin-current'), c);
    w.querySelector('.twin-hexcode').textContent = c ? c.slice(0, 7).toUpperCase() : '';
    w.querySelector('.twin-op').textContent = c && c.length === 9 ? String(Math.round(parseInt(c.slice(7), 16) / 255 * 100)) : '100';
  }

  // Вёрстка окна «Фон» — общая для команды «Фон» и кружков цвета заглавной строки/столбца в окне «Таблица».
  function fillHtml() {
    return (
      '<div class="twin-head">' +
        '<div class="twin-title">Фон</div>' +
        '<div class="twin-cmds">' +
          '<div class="twin-cmds-group">' +
            '<button type="button" class="twin-btn" title="Пипетка" aria-label="Пипетка">' + ICONS.eyedropper + '</button>' +
            '<button type="button" class="twin-btn twin-reset" title="Сбросить" aria-label="Сбросить" disabled><span class="twin-ico24" aria-hidden="true"></span></button>' +
          '</div>' +
          '<button type="button" class="twin-btn twin-done" title="Применить" aria-label="Применить"><span class="twin-ico16" aria-hidden="true"></span></button>' +
        '</div>' +
        '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="twin-body">' +
        '<div class="twin-panel twin-code">' +
          '<div class="twin-code-left">' +
            '<div class="twin-current" aria-label="Выбранный цвет"></div>' +
            '<button type="button" class="twin-btn" title="Закрепить" aria-label="Закрепить">' + ICONS.pin + '</button>' +
          '</div>' +
          '<div class="twin-code-right">' +
            '<div class="twin-field twin-hex">HEX<span class="twin-ico16 twin-hex-arrow" aria-hidden="true"></span></div>' +
            '<div class="twin-code-nums">' +
              '<div class="twin-field twin-hexcode"></div>' +
              '<div class="twin-opacity"><div class="twin-field twin-op">100</div><div class="twin-pct">%</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="twin-panel">' +
          '<div class="twin-swatches">' +
            FILLS.map(function (c) {
              if (c === null) return '<button type="button" class="twin-swatch" style="background:#fff" title="Без фона" aria-label="Без фона">' + ICONS.slash + '</button>';
              return '<button type="button" class="twin-swatch" style="background:' + swatchBg(c) + '" title="' + colorLabel(c) + '" aria-label="' + colorLabel(c) + '"></button>';
            }).join('') +
          '</div>' +
          '<div class="twin-foot">' +
            '<div class="twin-divider"></div>' +
            '<button type="button" class="twin-link">Другой цвет</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }
  function fill(tb) {
    if (tb._fillWin) return tb._fillWin;
    const w = document.createElement('div');
    w.className = 'twin twin--fill';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Фон');
    w.hidden = true;
    w.innerHTML = fillHtml();
    // Окно не забирает курсор из ячейки.
    w.addEventListener('mousedown', function (e) { e.preventDefault(); });
    w.querySelector('.twin-close').addEventListener('click', function () { tb.closeWindow(); });

    // Выбор цвета в палитре: эллипс «Выбранный цвет» окрашивается, в поле кода — HEX цвета.
    const current = w.querySelector('.twin-current');
    const code = w.querySelector('.twin-hexcode');
    let picked;                 // undefined — цвет ещё не выбран; null — «без фона»
    function pick(color) {
      picked = color;
      pickInto(w, color);
    }
    w.querySelectorAll('.twin-swatch').forEach(function (sw, i) {
      sw.addEventListener('click', function () { pick(FILLS[i]); });
    });
    // При открытии в первом блоке — фактический цвет ячейки (если она залита), иначе пусто.
    w.addEventListener('tw:open', function () {
      const f = TableAPI.activeFill();
      if (f) pick(f.toLowerCase());
      else { pick(null); picked = undefined; }
    });

    // Зелёная галка: залить активную ячейку / выделенные ячейки цветом из эллипса и закрыть окно.
    w.querySelector('.twin-done').addEventListener('click', function () {
      if (picked !== undefined) TableAPI.applyFill(picked);
      tb.closeWindow();
    });

    tb._fillWin = w;
    return w;
  }

  // Окно «Фон» поверх окна «Таблица» — для цвета заглавной строки/столбца. Та же вёрстка и палитра, что у команды «Фон».
  // Галка — применить цвет из эллипса, крестик — закрыть без изменений.
  function headerFillWindow(onApply) {
    const w = document.createElement('div');
    w.className = 'twin twin--bdcolor twin--hdrfill';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Фон');
    w.hidden = true;
    w.innerHTML = fillHtml();
    const current = w.querySelector('.twin-current'), code = w.querySelector('.twin-hexcode');
    let picked;
    function pick(c) { picked = c; pickInto(w, c); }
    w.querySelectorAll('.twin-swatch').forEach(function (sw, i) { sw.addEventListener('click', function () { pick(FILLS[i]); }); });
    w.querySelector('.twin-done').addEventListener('click', function () { if (picked !== undefined) onApply(picked); w.hidden = true; });
    w.querySelector('.twin-close').addEventListener('click', function (e) { e.stopPropagation(); w.hidden = true; });
    w._open = function (c) { pick(c); w.hidden = false; };
    w._unpick = function () { picked = undefined; };   // цвет не выбран: галка ничего не меняет
    return w;
  }

  // Окно «Стиль текста». Пока только вёрстка + открытие/закрытие; логику опишет пользователь.
  const STYLE_ICONS = {
    back: '<svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 0L7.5 1.25L2.5 6.5L7.5 11.75L6 13L0 6.50001L6 0Z" fill="#F47843"/></svg>',
    marker: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.2949 6.70508L11.7051 16.2959L11.0576 15.6484L9.11426 17.5928L8.80273 17.46L5.30273 15.96L4.62402 15.6689L7.85059 12.4414L6.99902 11.5898L16.5898 2L21.2949 6.70508ZM6.37598 15.3301L8.88574 16.4062L10.3506 14.9414L8.55762 13.1484L6.37598 15.3301ZM8.41406 11.5898L11.7051 14.8809L12.9395 13.6465L9.64844 10.3555L8.41406 11.5898ZM10.3555 9.64844L13.6465 12.9395L19.8809 6.70508L16.5898 3.41406L10.3555 9.64844Z" fill="currentColor"/><rect x="4" y="19" width="16" height="3" fill="none" stroke="black" stroke-opacity="0.15" stroke-width="0.4"/></svg>'
  };
  function textStyle(tb) {
    if (tb._styleWin) return tb._styleWin;
    const w = document.createElement('div');
    w.className = 'twin twin--style';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Стиль текста');
    w.hidden = true;
    const fmt = [['', 'Жирный', ' is-b'], ['', 'Курсив', ''], ['', 'Подчёркнутый', ' is-u'], ['', 'Зачёркнутый', '']];
    const STYLES = [['h1', 'Заголовок 1'], ['h2', 'Заголовок 2'], ['h3', 'Заголовок 3'], ['h4', 'Заголовок 4'], ['h5', 'Заголовок 5'], ['body', 'Основной текст'], ['own', 'Свой стиль']];
    // Параметры стилей (по меню «Меню с текстом»): шрифт, размер, B/I/U/S, цвет текста.
    const STYLE_PARAMS = {
      h1: { font: 'Inter', size: 32, bold: true }, h2: { font: 'Inter', size: 28, bold: true },
      h3: { font: 'Inter', size: 24, bold: true }, h4: { font: 'Inter', size: 20, bold: true },
      h5: { font: 'Inter', size: 18, bold: true }, body: { font: 'Inter', size: 16 }, own: { font: 'Inter', size: 14 }
    };
    w.innerHTML =
      '<div class="twin-style-main">' +
      '<div class="twin-head">' +
        '<button type="button" class="twin-btn twin-back" title="Назад" aria-label="Назад">' + STYLE_ICONS.back + '</button>' +
        '<div class="twin-title">Основной текст</div>' +
        '<div class="twin-cmds">' +
          '<button type="button" class="twin-btn twin-reset" title="Сбросить" aria-label="Сбросить" disabled><span class="twin-ico24" aria-hidden="true"></span></button>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true"></span></button>' +
          '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть">' + ICONS.close + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="twin-body">' +
        '<div class="twin-panel twin-style-panel">' +
          '<div class="twin-style-row1">' +
            '<div class="twin-field twin-font">Inter<span class="twin-ico16 twin-hex-arrow" aria-hidden="true"></span></div>' +
            '<div class="twin-field twin-size">16</div>' +
          '</div>' +
          '<div class="twin-style-row2">' +
            '<div class="twin-fmt">' + fmt.map(function (f) {
              return '<button type="button" class="twin-btn twin-sq" title="' + f[1] + '" aria-label="' + f[1] + '" aria-pressed="false"><span class="twin-ico24' + f[2] + '" aria-hidden="true">' + f[0] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="twin-vdiv" aria-hidden="true"></div>' +
            '<div class="twin-colors">' +
              '<button type="button" class="twin-btn twin-sq" title="Цвет текста" aria-label="Цвет текста"><span class="twin-textcolor"></span></button>' +
              '<button type="button" class="twin-btn twin-sq" title="Цвет выделения" aria-label="Цвет выделения">' + STYLE_ICONS.marker + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>' +
      // Меню стилей текста: заменяет окно по кнопке «Назад». Выбранный стиль — «Основной текст».
      '<div class="twin-style-menu" role="menu" aria-label="Стили текста" hidden>' +
        STYLES.map(function (st) {
          return '<button type="button" class="twin-menu-item" role="menuitemradio" aria-checked="' + (st[0] === 'body') + '"><span class="twin-menu-' + st[0] + '">' + st[1] + '</span>' +
            '<span class="twin-menu-arrow" data-style="' + st[0] + '" title="Настроить стиль"><i><svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 12L11 6H10L14 12L10 18H11L15 12Z" fill="currentColor"/></svg></i></span></button>';
        }).join('') +
      '</div>';
    w.addEventListener('mousedown', function (e) { e.preventDefault(); });
    w.querySelector('.twin-close').addEventListener('click', function () { tb.closeWindow(); });
    // «Назад» — окно заменяется меню стилей на том же месте (левый верхний угол не двигается).
    const mainPane = w.querySelector('.twin-style-main'), menuPane = w.querySelector('.twin-style-menu');
    function showMenu(on) {
      mainPane.hidden = on;
      menuPane.hidden = !on;
      w.classList.toggle('is-menu', on);
    }
    w.querySelector('.twin-back').addEventListener('click', function () { showMenu(true); });
    // Пункты меню: клик выбирает стиль (выбран всегда один). Применение стиля к тексту — позже.
    const menuItems = Array.from(menuPane.querySelectorAll('.twin-menu-item'));
    // Стрелка в плашке — открыть окно настройки текста для этого стиля вместо списка стилей.
    const titleEl = mainPane.querySelector('.twin-title'), fontEl = mainPane.querySelector('.twin-font'), sizeEl = mainPane.querySelector('.twin-size');
    function showStyleSettings(key) {
      const st = STYLES.filter(function (x) { return x[0] === key; })[0];
      const prm = STYLE_PARAMS[key];
      titleEl.textContent = st[1];
      fontEl.firstChild.nodeValue = prm.font;
      sizeEl.textContent = String(prm.size);
      initial = { bold: !!prm.bold, italic: !!prm.italic, underline: !!prm.underline, strike: !!prm.strike };
      FMT.forEach(function (k, i) { fmtBtns[i].setAttribute('aria-pressed', initial[k] ? 'true' : 'false'); });
      showMenu(false);
    }
    menuPane.querySelectorAll('.twin-menu-arrow').forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); showStyleSettings(a.getAttribute('data-style')); });
    });
    menuItems.forEach(function (it) {
      it.addEventListener('click', function () {
        menuItems.forEach(function (x) { x.setAttribute('aria-checked', String(x === it)); });
      });
    });
    w.addEventListener('tw:open', function () {
      showMenu(false);
      mainPane.querySelector('.twin-title').textContent = 'Основной текст';
      mainPane.querySelector('.twin-size').textContent = '16';
    });
    // B / I / U / S — переключатели. При открытии показывают фактический формат активного элемента.
    const FMT = ['bold', 'italic', 'underline', 'strike'];
    const fmtBtns = Array.from(w.querySelectorAll('.twin-fmt .twin-sq'));
    let initial = null;
    fmtBtns.forEach(function (b) {
      b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
    });
    function current() {
      const f = {};
      FMT.forEach(function (k, i) { f[k] = fmtBtns[i].getAttribute('aria-pressed') === 'true'; });
      return f;
    }
    w.addEventListener('tw:open', function () {
      initial = TableAPI.activeTextFormat() || { bold: false, italic: false, underline: false, strike: false };
      FMT.forEach(function (k, i) { fmtBtns[i].setAttribute('aria-pressed', initial[k] ? 'true' : 'false'); });
    });
    // Зелёная галка: применить изменённые настройки к выделенным ячейкам
    // или (курсор в ячейке) к тексту, который пойдёт после курсора.
    w.querySelector('.twin-done').addEventListener('click', function () {
      const f = current();
      const changed = FMT.filter(function (k) { return !initial || f[k] !== initial[k]; });
      if (changed.length) TableAPI.applyTextFormat(f, changed);
      tb.closeWindow();
    });
    tb._styleWin = w;
    return w;
  }

  // Палитра окна «Цвет границ» (Figma 2924:153621): 12 цветов и 9 полупрозрачных (тот же цвет с прозрачностью 25%).
  const BORDER_COLORS = ['#000000', '#d2d6da', '#cc3d00', '#313e78', '#d4090e', '#ff7d05', '#e5cb45', '#009918', '#29b5cf', '#117df3', '#723eff', '#ff3075']
    .concat(['#a6a6a6', '#fe2819', '#ff7d05', '#ffd707', '#14c730', '#11d1f3', '#117df3', '#723eff', '#f10dd6'].map(function (c) { return c + '40'; }));   // 25% (0x40)
  // Кружок/овал цвета: непрозрачный — сплошная заливка; полупрозрачный (#rrggbbaa) — слева цвет, справа он же на «шахматке».
  function paintSwatch(el, c) {
    el.style.background = swatchBg(c);
  }
  function borderColorWindow(onApply) {
    const w = document.createElement('div');
    w.className = 'twin twin--bdcolor';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Цвет границ');
    w.hidden = true;
    w.innerHTML =
      '<div class="twin-head">' +
        '<div class="twin-title">Границы</div>' +
        '<div class="twin-cmds">' +
          '<div class="twin-cmds-group">' +
            '<button type="button" class="twin-btn" title="Пипетка" aria-label="Пипетка">' + ICONS.eyedropper + '</button>' +
            '<button type="button" class="twin-btn twin-reset" title="Сбросить" aria-label="Сбросить" disabled><span class="twin-ico24" aria-hidden="true">\ue629</span></button>' +
          '</div>' +
          '<button type="button" class="twin-btn twin-done" title="Применить" aria-label="Применить"><span class="twin-ico16" aria-hidden="true">\ue75e</span></button>' +
        '</div>' +
        '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="twin-body">' +
        '<div class="twin-panel twin-code">' +
          '<div class="twin-code-left">' +
            '<div class="twin-current" aria-label="Выбранный цвет"></div>' +
            '<button type="button" class="twin-btn" title="Закрепить" aria-label="Закрепить">' + ICONS.pin + '</button>' +
          '</div>' +
          '<div class="twin-code-right">' +
            '<div class="twin-field twin-hex">HEX<span class="twin-ico16 twin-hex-arrow" aria-hidden="true">\ue9aa</span></div>' +
            '<div class="twin-code-nums">' +
              '<div class="twin-field twin-hexcode"></div>' +
              '<div class="twin-opacity"><div class="twin-field twin-op">100</div><div class="twin-pct">%</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="twin-panel">' +
          '<div class="twin-swatches">' +
            BORDER_COLORS.map(function (c) { return '<button type="button" class="twin-swatch" data-color="' + c + '" title="' + c + '" aria-label="' + c + '"></button>'; }).join('') +
          '</div>' +
          '<div class="twin-foot">' +
            '<div class="twin-divider"></div>' +
            '<button type="button" class="twin-link">Другой цвет</button>' +   // пока без действия
          '</div>' +
        '</div>' +
      '</div>';
    const cur = w.querySelector('.twin-current'), code = w.querySelector('.twin-hexcode'), op = w.querySelector('.twin-op');
    let picked = null;
    function pick(c) {
      picked = c;
      paintCurrent(cur, c);
      code.textContent = c.slice(0, 7).toUpperCase();
      op.textContent = c.length === 9 ? String(Math.round(parseInt(c.slice(7), 16) / 255 * 100)) : '100';
    }
    w.querySelectorAll('.twin-swatch').forEach(function (sw) {
      paintSwatch(sw, sw.dataset.color);
      sw.addEventListener('click', function () { pick(sw.dataset.color); });
    });
    w.querySelector('.twin-done').addEventListener('click', function () { if (picked) onApply(picked); w.hidden = true; });
    w.querySelector('.twin-close').addEventListener('click', function (e) { e.stopPropagation(); w.hidden = true; });
    w._open = function (c) { pick(c); w.hidden = false; };
    return w;
  }
  // Окно «Границы»: выбор границы слева, её настройки справа (логика — в borders()).
  const BORDER_TYPES = [
      ["Все границы", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5ZM11.5 4H5C4.44772 4 4 4.44772 4 5V11.5H11.5V4ZM12.5 4V11.5H20V5C20 4.44772 19.5523 4 19 4H12.5ZM11.5 12.5H4V19C4 19.5523 4.44772 20 5 20H11.5V12.5ZM12.5 20H19C19.5523 20 20 19.5523 20 19V12.5H12.5V20Z\" fill=\"#656C87\"/></svg>"],
      ["Внутренние границы", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M8 3H7V4H8V3Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 20H4V21H5V20Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M11 20H10V21H11V20Z\" fill=\"#656C87\"/><path d=\"M13 3H14V4H13V3Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 20H19V21H20V20Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M21 7H20V8H21V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M21 13H20V14H21V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/><path d=\"M11.5 5H12.5V11.5H19V12.5H12.5V19H11.5V12.5H5V11.5H11.5V5Z\" fill=\"#656C87\"/></svg>"],
      ["Внешние границы", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12.5 10H11.5V11H12.5V10Z\" fill=\"#656C87\"/><path d=\"M11 11.5H10V12.5H11V11.5Z\" fill=\"#656C87\"/><path d=\"M17 11.5H16V12.5H17V11.5Z\" fill=\"#656C87\"/><path d=\"M13 11.5H14V12.5H13V11.5Z\" fill=\"#656C87\"/><path d=\"M7 11.5H8V12.5H7V11.5Z\" fill=\"#656C87\"/><path d=\"M12.5 7H11.5V8H12.5V7Z\" fill=\"#656C87\"/><path d=\"M11.5 16H12.5V17H11.5V16Z\" fill=\"#656C87\"/><path d=\"M12.5 13H11.5V14H12.5V13Z\" fill=\"#656C87\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 4H11.5V5H12.5V4H19C19.5523 4 20 4.44772 20 5V11.5H19V12.5H20V19C20 19.5523 19.5523 20 19 20H12.5V19H11.5V20H5C4.44772 20 4 19.5523 4 19V12.5H5V11.5H4V5C4 4.44772 4.44772 4 5 4Z\" fill=\"#656C87\"/></svg>"],
      ["Верхняя граница", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4 3.5C4 3.22386 4.22386 3 4.5 3H19.5C19.7761 3 20 3.22386 20 3.5C20 3.77614 19.7761 4 19.5 4H4.5C4.22386 4 4 3.77614 4 3.5Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 21V20H4V21H5Z\" fill=\"#656C87\"/><path d=\"M10 20H11V21H10V20Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 21V20H19V21H20Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M21 7H20V8H21V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M21 13H20V14H21V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/></svg>"],
      ["Внутренние горизонтальные", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M8 3H7V4H8V3Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 20H4V21H5V20Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M11 20H10V21H11V20Z\" fill=\"#656C87\"/><path d=\"M13 3H14V4H13V3Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 20H19V21H20V20Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M21 7H20V8H21V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M21 13H20V14H21V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/><path d=\"M12.5 5H11.5V6H12.5V5Z\" fill=\"#656C87\"/><path d=\"M11.5 8H12.5V9H11.5V8Z\" fill=\"#656C87\"/><path d=\"M12.5 15H11.5V16H12.5V15Z\" fill=\"#656C87\"/><path d=\"M11.5 18H12.5V19H11.5V18Z\" fill=\"#656C87\"/><path d=\"M19 11.5H5V12.5H19V11.5Z\" fill=\"#656C87\"/></svg>"],
      ["Нижняя граница", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M4 20.5C4 20.2239 4.22386 20 4.5 20H19.5C19.7761 20 20 20.2239 20 20.5C20 20.7761 19.7761 21 19.5 21H4.5C4.22386 21 4 20.7761 4 20.5Z\" fill=\"#656C87\"/><path d=\"M7 3H8V4H7V3Z\" fill=\"#656C87\"/><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M14 3H13V4H14V3Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M21 7H20V8H21V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M21 13H20V14H21V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/></svg>"],
      ["Левая граница", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M8 3H7V4H8V3Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 20H4V21H5V20Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M11 20H10V21H11V20Z\" fill=\"#656C87\"/><path d=\"M13 3H14V4H13V3Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 20H19V21H20V20Z\" fill=\"#656C87\"/><path d=\"M3.5 5C3.22386 5 3 5.22386 3 5.5V18.5C3 18.7761 3.22386 19 3.5 19C3.77614 19 4 18.7761 4 18.5V5.5C4 5.22386 3.77614 5 3.5 5Z\" fill=\"#656C87\"/><path d=\"M20 7H21V8H20V7Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M20 13H21V14H20V13Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/></svg>"],
      ["Внутренние вертикальные", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M8 3H7V4H8V3Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 20H4V21H5V20Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M11 20H10V21H11V20Z\" fill=\"#656C87\"/><path d=\"M13 3H14V4H13V3Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 20H19V21H20V20Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M21 7H20V8H21V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M21 10H20V11H21V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M21 13H20V14H21V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/><path d=\"M21 16H20V17H21V16Z\" fill=\"#656C87\"/><path d=\"M12.5 5H11.5V19H12.5V5Z\" fill=\"#656C87\"/><path d=\"M5 11.5H6V12.5H5V11.5Z\" fill=\"#656C87\"/><path d=\"M9 11.5H8V12.5H9V11.5Z\" fill=\"#656C87\"/><path d=\"M15 11.5H16V12.5H15V11.5Z\" fill=\"#656C87\"/><path d=\"M19 11.5H18V12.5H19V11.5Z\" fill=\"#656C87\"/></svg>"],
      ["Правая граница", "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M5 3H4V4H5V3Z\" fill=\"#656C87\"/><path d=\"M8 3H7V4H8V3Z\" fill=\"#656C87\"/><path d=\"M7 20H8V21H7V20Z\" fill=\"#656C87\"/><path d=\"M5 20H4V21H5V20Z\" fill=\"#656C87\"/><path d=\"M10 3H11V4H10V3Z\" fill=\"#656C87\"/><path d=\"M11 20H10V21H11V20Z\" fill=\"#656C87\"/><path d=\"M13 3H14V4H13V3Z\" fill=\"#656C87\"/><path d=\"M14 20H13V21H14V20Z\" fill=\"#656C87\"/><path d=\"M16 3H17V4H16V3Z\" fill=\"#656C87\"/><path d=\"M20 3H19V4H20V3Z\" fill=\"#656C87\"/><path d=\"M16 20H17V21H16V20Z\" fill=\"#656C87\"/><path d=\"M20 20H19V21H20V20Z\" fill=\"#656C87\"/><path d=\"M20.5 5C20.2239 5 20 5.22386 20 5.5V18.5C20 18.7761 20.2239 19 20.5 19C20.7761 19 21 18.7761 21 18.5V5.5C21 5.22386 20.7761 5 20.5 5Z\" fill=\"#656C87\"/><path d=\"M3 7H4V8H3V7Z\" fill=\"#656C87\"/><path d=\"M3 10H4V11H3V10Z\" fill=\"#656C87\"/><path d=\"M3 13H4V14H3V13Z\" fill=\"#656C87\"/><path d=\"M3 16H4V17H3V16Z\" fill=\"#656C87\"/></svg>"]
    ];
  // Кнопка выбора границы (общая для обеих сеток).
  function bdBtnHtml(b) {
    return '<button type="button" class="twin-bd-btn" title="' + b[0] + '" aria-label="' + b[0] + '" aria-pressed="false">' +
      b[1].replace(/#656C87/g, 'currentColor').replace('<svg ', '<svg aria-hidden="true" ') + '</button>';
  }
  const BT = {};
  BORDER_TYPES.forEach(function (b) { BT[b[0]] = b; });
  const CELL_BORDER_GRID = [null, BT['Верхняя граница'], null,
    BT['Левая граница'], ['Все границы', '<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M17.4844 20.0312C17.8281 20.0312 18 20.1875 18 20.5C18 20.8438 17.8281 21.0156 17.4844 21.0156H6.51562C6.17188 21.0156 6 20.8438 6 20.5C6 20.1875 6.17188 20.0312 6.51562 20.0312H17.4844ZM3.51562 6.01562C3.82812 6.01562 3.98438 6.1875 3.98438 6.53125V17.5C3.98438 17.8438 3.82812 18.0156 3.51562 18.0156C3.17188 18.0156 3 17.8438 3 17.5V6.53125C3 6.1875 3.17188 6.01562 3.51562 6.01562ZM20.4844 6.01562C20.8281 6.01562 21 6.1875 21 6.53125V17.5C21 17.8438 20.8281 18.0156 20.4844 18.0156C20.1719 18.0156 20.0156 17.8438 20.0156 17.5V6.53125C20.0156 6.1875 20.1719 6.01562 20.4844 6.01562ZM17.4844 3.01562C17.8281 3.01562 18 3.1875 18 3.53125C18 3.84375 17.8281 4 17.4844 4H6.51562C6.17188 4 6 3.84375 6 3.53125C6 3.1875 6.17188 3.01562 6.51562 3.01562H17.4844Z\" fill=\"#656C87\"/></svg>'], BT['Правая граница'],
    null, BT['Нижняя граница'], null];
  function borders(tb) {
    if (tb._bordersWin) return tb._bordersWin;
    const w = document.createElement('div');
    w.className = 'twin twin--borders';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Границы');
    w.hidden = true;
    const ctl = buildBorders(w, { getTarget: function () { return TableAPI.borderRange(); }, onDone: function () { tb.closeWindow(); }, events: w,
      onClose: function () { tb.closeWindow(); } });
    w.addEventListener('tw:open', ctl.enter);
    tb._bordersWin = w;
    return w;
  }
  // Содержимое окна «Границы»: выбор границы слева, линия / толщина / цвет справа. Используется в окне «Границы» и как
  // расширенные настройки (провал по стрелке у редактора «Границы») в окнах «Таблица» и «Ячейки» (Figma 960:51434).
  // opts: { back: fn — кнопка «Назад» в шапке, getTarget: fn → диапазон, onDone: fn, onClose: fn — свой крестик (сброс изменений
  //   с момента входа), events: элемент, на котором приходят tw:close }.
  function buildBorders(w, opts) {
    w.innerHTML =
      '<div class="twin-head">' +
        (opts.back ? '<button type="button" class="twin-btn twin-back" title="Назад" aria-label="Назад">' + STYLE_ICONS.back + '</button>' : '') +
        '<div class="twin-title">Границы</div>' +
        '<div class="twin-cmds">' +
          '<button type="button" class="twin-btn twin-reset twin-bd-reset" title="Сбросить" aria-label="Сбросить" disabled><span class="twin-ico24" aria-hidden="true">\ue629</span></button>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true">\ue75e</span></button>' +
          '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть">' +
            // в расширенных настройках окон «Таблица» / «Ячейки» — тот же крестик, что в шапке этих окон (символ U+E66C)
            (opts.back ? '<span class="twin-close24" aria-hidden="true">\ue66c</span>' : ICONS.close) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="twin-body">' +
        '<div class="twin-panel twin-bd-panel">' +
          '<div class="twin-bd-grid-box"><div class="twin-bd-grid">' +
            BORDER_TYPES.map(bdBtnHtml).join('') +
          '</div>' +
          // Единичная ячейка (Figma 1120:46891): крестом — верхняя, левая, все, правая, нижняя; углы пустые.
          '<div class="twin-bd-grid twin-bd-grid--cell" hidden>' +
            CELL_BORDER_GRID.map(function (t) { return t ? bdBtnHtml(t) : '<span aria-hidden="true"></span>'; }).join('') +
          '</div></div>' +
          '<div class="twin-bd-props">' +
            '<div class="twin-bd-row"><div class="twin-bd-label w60">Линия</div><button type="button" class="twin-bd-line" title="Тип линии" aria-label="Тип линии"></button></div>' +
            '<div class="twin-bd-row"><div class="twin-bd-label">Толщина</div><div class="twin-field twin-bd-width"><input type="text" class="twin-bd-wval" inputmode="numeric" value="1" aria-label="Толщина"><button type="button" class="twin-bd-warr" title="Выбрать толщину" aria-label="Выбрать толщину"><span class="twin-ico16" aria-hidden="true">\ue9aa</span></button></div></div>' +
            '<div class="twin-bd-row"><div class="twin-bd-label w60">Цвет</div><button type="button" class="twin-bd-color" title="Цвет" aria-label="Цвет границы"><span class="twin-bd-swatch"></span><span class="twin-bd-hex">#D2D6DA</span></button></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    w.addEventListener('mousedown', function (e) { if (!e.target.closest('input')) e.preventDefault(); });   // поле «Толщина» можно редактировать
    // Крестик: все изменения, внесённые в окне с момента открытия, сбрасываются (таблица и настройки правой части).
    let openMark = 0, openSpec = null;
    if (opts.onClose) w.querySelector('.twin-head .twin-close').addEventListener('click', function () {
      TableAPI.revertTo(openMark);
      if (openSpec) { Object.assign(spec, openSpec); showSpec(); }
      opts.onClose();
    });
    if (opts.back) w.querySelector('.twin-head .twin-back').addEventListener('click', opts.back);
    // Логика окна:
    // 1) пользователь выбирает границу в левой части — к ней сразу применяются текущие настройки правой части;
    // 2) в правой части задаёт настройки — они применяются к выбранной границе;
    // 3) при выборе следующей границы к ней применяются уже выставленные настройки.
    // Выбрана может быть одна граница; повторный клик снимает выбор (заданная граница остаётся). При открытии окна выбор сброшен.
    // Настройки правой части сохраняются между открытиями окна. Тип линии и толщина переключаются по клику, цвет — системная палитра.
    // Начертание линии — выпадающий список (по клику на «Линия»).
    const LINE_ITEMS = [
      ['none', 'Нет', '\ue665'],
      ['solid', 'Сплошная', '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect y="11" width="24" height="2" fill="currentColor"/></svg>'],
      ['dashed', 'Пунктир', '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="0.5" y="11" width="3" height="2" fill="currentColor"/><rect x="5.5" y="11" width="3" height="2" fill="currentColor"/><rect x="10.5" y="11" width="3" height="2" fill="currentColor"/><rect x="15.5" y="11" width="3" height="2" fill="currentColor"/><rect x="20.5" y="11" width="3" height="2" fill="currentColor"/></svg>'],
      ['dotted', 'Точки', '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/><circle cx="22" cy="12" r="1" fill="currentColor"/></svg>']
    ];
    // Толщина — выпадающее меню (стрелка в поле) или своё значение (ввод в поле). Figma «Меню толщины», 1280:86977.
    const WIDTH_ITEMS = [1, 2, 4, 6, 8].map(function (v) {
      return [String(v), v + ' px', '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect y="' + (12 - Math.ceil(v / 2)) + '" width="24" height="' + v + '" fill="currentColor"/></svg>'];
    });
    const widthList = document.createElement('div');
    widthList.className = 'twin-bd-list twin-bd-wlist';
    widthList.setAttribute('role', 'menu');
    widthList.setAttribute('aria-label', 'Толщина линии');
    widthList.hidden = true;
    widthList.innerHTML = '<div class="twin-mn-list">' + WIDTH_ITEMS.map(function (m) {
      return '<div class="twin-mn-item" role="menuitemradio" tabindex="-1" data-value="' + m[0] + '" aria-checked="false">' +
        '<span class="twin-mn-ico" aria-hidden="true">' + m[2] + '</span><span class="twin-mn-text">' + m[1] + '</span><span class="twin-mn-radio" aria-hidden="true"></span></div>';
    }).join('') + '</div>';
    w.appendChild(widthList);
    const lineList = document.createElement('div');
    lineList.className = 'twin-bd-list';
    lineList.setAttribute('role', 'menu');
    lineList.setAttribute('aria-label', 'Начертание линии');
    lineList.hidden = true;
    lineList.innerHTML = '<div class="twin-mn-list">' + LINE_ITEMS.map(function (m) {
      return '<div class="twin-mn-item" role="menuitemradio" tabindex="-1" data-value="' + m[0] + '" aria-checked="false">' +
        '<span class="twin-mn-ico" aria-hidden="true">' + m[2] + '</span><span class="twin-mn-text">' + m[1] + '</span><span class="twin-mn-radio" aria-hidden="true"></span></div>';
    }).join('') + '</div>';
    w.appendChild(lineList);
    const DEFAULT_SPEC = { style: 'solid', width: 1, color: '#d2d6da' };
    const spec = Object.assign({}, DEFAULT_SPEC);
    const bdBtns = Array.from(w.querySelectorAll('.twin-bd-btn'));
    const lineBtn = w.querySelector('.twin-bd-line'), widthBtn = w.querySelector('.twin-bd-width');
    // Круговая стрелка в шапке: настройки правой части — к значениям по умолчанию (к выбранной границе применяются сразу).
    const resetBtn = w.querySelector('.twin-head .twin-reset');
    resetBtn.addEventListener('click', function () {
      Object.assign(spec, DEFAULT_SPEC);
      closeLineList(); closeWidthList(); colorWin.hidden = true;
      showSpec();
      applyCurrent();
    });
    let current = null, target = null;   // выбранная граница и диапазон ячеек, к которому она относится
    function showSpec() {
      // В элементе «Линия» меняется только тип линии; цвет (#656C87) и толщина (2px) — всегда как в макете (Figma 1372:85873).
      lineBtn.style.setProperty('--bd-style', spec.style === 'none' ? 'hidden' : spec.style);
      // Вариант «Нет» — на месте элемента «Линия» кнопка-ссылка «Нет» (Figma 1380:93350); по клику — тот же список.
      lineBtn.classList.toggle('is-none', spec.style === 'none');
      lineBtn.textContent = spec.style === 'none' ? 'Нет' : '';
      w.querySelector('.twin-bd-wval').value = spec.width;
      paintSwatch(w.querySelector('.twin-bd-swatch'), spec.color);
      // «Сбросить» активна, пока настройки отличаются от значений по умолчанию.
      const dirty = spec.style !== DEFAULT_SPEC.style || spec.width !== DEFAULT_SPEC.width || spec.color !== DEFAULT_SPEC.color;
      resetBtn.disabled = !dirty;
      resetBtn.classList.toggle('is-active', dirty);
      w.querySelector('.twin-bd-hex').textContent = spec.color.slice(0, 7).toUpperCase();
    }
    function applyCurrent() { if (current && target) TableAPI.applyBorders(target, current, spec); }
    showSpec();
    bdBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        const on = b.getAttribute('aria-pressed') !== 'true';
        bdBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        current = null;
        if (!on) return;
        b.setAttribute('aria-pressed', 'true');
        current = b.getAttribute('title');
        target = opts.getTarget();
        applyCurrent();
      });
    });
    function closeLineList() { lineList.hidden = true; }
    lineBtn.addEventListener('click', function () {
      if (!lineList.hidden) { closeLineList(); return; }
      closeWidthList();
      lineList.querySelectorAll('[data-value]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.value === spec.style)); });
      lineList.hidden = false;
      // Центр списка — на вертикальной оси кнопки «Линия», верхний край списка — по её нижнему краю.
      const wr = w.getBoundingClientRect(), br = lineBtn.getBoundingClientRect();
      if (spec.style === 'none') {
        // Вызов с кнопки «Нет»: левые края иконок списка совпадают с левым краем текста кнопки.
        lineList.style.left = '0px';
        const lr = lineList.getBoundingClientRect(), ic = lineList.querySelector('.twin-mn-ico').getBoundingClientRect();
        const tr = document.createRange(); tr.selectNodeContents(lineBtn);
        lineList.style.left = (tr.getBoundingClientRect().left - (ic.left - lr.left) - wr.left) + 'px';
      } else {
        lineList.style.left = (br.left + br.width / 2 - lineList.getBoundingClientRect().width / 2 - wr.left) + 'px';
      }
      lineList.style.top = (br.bottom - wr.top) + 'px';
    });
    lineList.querySelectorAll('.twin-mn-item').forEach(function (it) {
      it.addEventListener('click', function () { spec.style = it.dataset.value; showSpec(); closeLineList(); applyCurrent(); });
    });
    w.addEventListener('click', function (e) {
      if (!lineList.hidden && !e.target.closest('.twin-bd-list, .twin-bd-line')) closeLineList();
      if (!widthList.hidden && !e.target.closest('.twin-bd-list, .twin-bd-warr')) closeWidthList();
    });
    opts.events.addEventListener('tw:close', function () { closeLineList(); closeWidthList(); });
    // Меню толщины: верхний край заходит на нижнюю границу поля; левые края иконок пунктов совпадают с левым краем текста в поле.
    const wInput = w.querySelector('.twin-bd-wval'), wArrow = w.querySelector('.twin-bd-warr');
    function closeWidthList() { widthList.hidden = true; }
    wArrow.addEventListener('click', function () {
      if (!widthList.hidden) { closeWidthList(); return; }
      closeLineList();
      widthList.querySelectorAll('[data-value]').forEach(function (x) { x.setAttribute('aria-checked', String(+x.dataset.value === spec.width)); });
      widthList.style.left = '0px'; widthList.style.top = '0px';
      widthList.hidden = false;
      const wr = w.getBoundingClientRect(), fr = widthBtn.getBoundingClientRect(), ir = wInput.getBoundingClientRect();
      const ic = widthList.querySelector('.twin-mn-ico').getBoundingClientRect();
      widthList.style.left = (ir.left - (ic.left - widthList.getBoundingClientRect().left) - wr.left) + 'px';
      widthList.style.top = (fr.bottom - 1 - wr.top) + 'px';   // на 1px заходит на нижнюю границу поля
    });
    widthList.querySelectorAll('.twin-mn-item').forEach(function (it) {
      it.addEventListener('click', function () { spec.width = +it.dataset.value; showSpec(); closeWidthList(); applyCurrent(); });
    });
    // Своё значение: целое от 1 до 20 px, применяется по завершении ввода — через 0,7 с после последнего нажатия,
    // по Enter или при уходе из поля.
    let wTimer = 0;
    function commitWidth() {
      clearTimeout(wTimer);
      const v = parseInt(wInput.value, 10);
      if (v >= 1 && v <= 20 && v !== spec.width) { spec.width = v; applyCurrent(); }
      showSpec();
    }
    wInput.addEventListener('change', commitWidth);
    wInput.addEventListener('input', function () {
      clearTimeout(wTimer);
      wTimer = setTimeout(function () {
        const v = parseInt(wInput.value, 10);
        if (v >= 1 && v <= 20 && v !== spec.width) { spec.width = v; applyCurrent(); }   // пока поле в фокусе, текст в нём не трогаем
      }, 700);
    });
    wInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitWidth(); wInput.blur(); } });
    wInput.addEventListener('focus', closeWidthList);
    // Цвет — окно «Цвет границ» (Figma 2924:153621; «Другой цвет» пока без действия) поверх окна «Границы»: овал «Выбранный цвет» по левому краю и по
    // вертикальному центру совпадает с кружком в строке «Цвет». Галка — применить цвет к выбранной границе, крестик — закрыть без изменений.
    const colorBtn = w.querySelector('.twin-bd-color');
    const colorWin = borderColorWindow(function (c) { spec.color = c; showSpec(); applyCurrent(); });
    w.appendChild(colorWin);
    colorBtn.addEventListener('click', function () {
      closeLineList(); closeWidthList();
      colorWin._open(spec.color);
      colorWin.style.left = '0px'; colorWin.style.top = '0px';
      const wr = w.getBoundingClientRect(), sr = w.querySelector('.twin-bd-swatch').getBoundingClientRect();
      const er = colorWin.querySelector('.twin-current').getBoundingClientRect();
      colorWin.style.left = (sr.left - er.left) + 'px';
      colorWin.style.top = (sr.top + sr.height / 2 - (er.top + er.height / 2)) + 'px';
    });
    opts.events.addEventListener('tw:close', function () { colorWin.hidden = true; });
    w.querySelector('.twin-head .twin-done').addEventListener('click', opts.onDone);
    // Вход (открытие окна / провал в расширенные настройки): выбор границы сброшен, списки закрыты.
    const gridAll = w.querySelector('.twin-bd-grid:not(.twin-bd-grid--cell)'), gridCell = w.querySelector('.twin-bd-grid--cell');
    function enter() {
      // Для единичной ячейки — своя сетка кнопок (верхняя / левая / все / правая / нижняя); остальная логика та же.
      const single = TableAPI.isSingleCellRange(opts.getTarget());
      gridAll.hidden = single; gridCell.hidden = !single;
      bdBtns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); current = null; target = null; closeLineList(); closeWidthList(); colorWin.hidden = true;
      openMark = TableAPI.historyMark(); openSpec = Object.assign({}, spec); }
    return { enter: enter };
  }

  // Окно «Таблица» (команда «Настроить»). Пока только вёрстка + открытие/закрытие; логику опишет пользователь.
  const CHEVRON = '<svg width="5" height="12" viewBox="0 0 5 12" aria-hidden="true"><path d="M5 6L1 0H0L4 6L0 12H1L5 6Z" fill="currentColor"/></svg>';
  function tableSettings(tb) {
    if (tb._tableWin) return tb._tableWin;
    const w = document.createElement('div');
    w.className = 'twin twin--table';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Таблица');
    w.hidden = true;
    w.innerHTML =
      '<div class="twin-head ts-main">' +
        '<div class="twin-title">Таблица</div>' +
        '<div class="twin-cmds">' +
          '<button type="button" class="twin-btn twin-reset" title="Сбросить настройки" aria-label="Сбросить настройки" disabled><span class="twin-ico24" aria-hidden="true">\ue629</span></button>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true">\ue75e</span></button>' +
          '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть"><span class="twin-close24" aria-hidden="true">\ue66c</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="twin-body ts-main">' +
        '<div class="twin-panel twin-ts-panel">' +
          '<div class="twin-ts-row"><div class="twin-ts-label w132">Заглавная строка</div>' +
            '<button type="button" class="twin-switch" role="switch" aria-checked="true" aria-label="Заглавная строка"></button>' +
            '<span class="twin-ts-swatch twin-ts-hdr" data-kind="row" style="margin-left:4px" title="Цвет заглавной строки"></span></div>' +
          '<div class="twin-ts-row"><div class="twin-ts-label w132">Заглавный столбец</div>' +
            '<button type="button" class="twin-switch" role="switch" aria-checked="false" aria-label="Заглавный столбец"></button>' +
            '<span class="twin-ts-swatch twin-ts-hdr" data-kind="col" style="margin-left:4px" title="Цвет заглавного столбца"></span></div>' +
        '</div>' +
        '<div class="twin-panel twin-ts-panel">' +
          '<div class="twin-ts-row"><div class="twin-ts-label w59">Ячейки</div>' +
            '<button type="button" class="twin-ts-link">Основной текст</button>' +
            '<span class="twin-ts-swatch twin-ts-cellfill" title="Фон ячеек" hidden></span>' +
            '<button type="button" class="twin-ts-arrow" title="Настроить ячейки" aria-label="Настроить ячейки">' + CHEVRON + '</button></div>' +
          bordersEditorHtml('w59') +
        '</div>' +
        '<div class="twin-panel twin-ts-panel">' +
          '<div class="twin-ts-row"><div class="twin-ts-label w54">Ширина</div>' +
            '<div class="twin-field twin-ts-width"><input class="twin-ts-wval" inputmode="numeric" aria-label="Ширина таблицы" value="820"><button type="button" class="twin-ts-fill">заполнить</button></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="twin-ts-foot ts-main">' +
        '<button type="button" class="twin-ts-chip twin-ts-chip-bd" hidden>Границы</button>' +
        '<button type="button" class="twin-ts-chip">Скругления</button>' +
        '<button type="button" class="twin-ts-chip">Тень</button>' +
      '</div>' +
      // Вид «Ячейки» (Figma 670:16506): провал по стрелке у «Ячейки», «Назад» — обратно в основной вид окна.
      '<div class="twin-head ts-cells">' +
        '<button type="button" class="twin-btn twin-back" title="Назад" aria-label="Назад">' + STYLE_ICONS.back + '</button>' +
        '<div class="twin-title">Ячейки</div>' +
        '<div class="twin-cmds">' +
          '<button type="button" class="twin-btn twin-reset" title="Сбросить настройки" aria-label="Сбросить настройки" disabled><span class="twin-ico24" aria-hidden="true">\ue629</span></button>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true">\ue75e</span></button>' +
          '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть"><span class="twin-close24" aria-hidden="true">\ue66c</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="twin-body ts-cells">' +
        cellsPanelsHtml() +
        fillEditorHtml() +
      '</div>' +
      '';
    w.addEventListener('mousedown', function (e) { if (!e.target.closest('input')) e.preventDefault(); });   // поля «Отступы» редактируются
    w.querySelectorAll('.twin-close').forEach(function (b) { b.addEventListener('click', function () { tb.closeWindow(); }); });
    // Провал в вид «Ячейки» по стрелке у «Ячейки» и обратно по «Назад». При каждом открытии окна — основной вид.
    function showCells(on) {
      w.classList.toggle('is-cells', on); w.setAttribute('aria-label', on ? 'Ячейки' : 'Таблица');
      // При входе: ячейки не залиты — редактора фона нет, в подвале чипса «Фон»; иначе — редактор.
      if (on) { fillEd.enter(); syncCellFill(); cellsBody._syncAlign(); }
    }
    w.querySelector('.twin-ts-arrow[title="Настроить ячейки"]').addEventListener('click', function () { showCells(true); });
    w.querySelector('.ts-cells .twin-back').addEventListener('click', function () { showCells(false); });
    w.querySelector('.ts-cells .twin-done').addEventListener('click', function () { tb.closeWindow(); });
    w.addEventListener('tw:open', function () { showCells(false); });
    const cellsBody = w.querySelector('.twin-body.ts-cells');
    wireCellsPanels(cellsBody, 'all');
    // «Заглавная строка» / «Заглавный столбец»: нажатие переключает активное/неактивное состояние.
    // Состояние общее с пунктами меню и кнопками окна расширенного режима (TableToggles) и хранится в таблице.
    const tsSwitches = Array.from(w.querySelectorAll('.twin-switch')).filter(function (sw) { return TableToggles.has(sw.getAttribute('aria-label')); });
    function syncTsSwitches() { tsSwitches.forEach(function (sw) { sw.setAttribute('aria-checked', String(TableToggles.get(sw.getAttribute('aria-label')))); }); }
    tsSwitches.forEach(function (sw) { sw.addEventListener('click', function () { TableToggles.toggle(sw.getAttribute('aria-label')); }); });
    document.addEventListener('tw:toggles', syncTsSwitches);
    w.addEventListener('tw:open', syncTsSwitches);
    syncTsSwitches();
    // Заливка ячеек (Figma 1364:78377), кружок у «Ячейки → Основной текст»: все ячейки залиты одним цветом — кружок этого цвета;
    // по-разному — белый кружок; ни одна не залита — перечёркнутый кружок (как «Без фона» в окне «Фон»). Чипсы «Фон ячеек» нет.
    const fillSw = w.querySelector('.twin-ts-cellfill');
    // В виде «Ячейки» — редактор «Фон» (общий с окном «Ячейки», wireFillEditor): объект — все ячейки таблицы.
    const fillEd = wireFillEditor(w, w.querySelector('.twin-body.ts-cells'), {
      state: function () { return TableAPI.tableFillState(); },
      fill: function (c) { TableAPI.fillAllCells(c); }
    });
    function syncCellFill() {
      const st = TableAPI.tableFillState();
      fillSw.hidden = false;
      fillSw.classList.toggle('is-none', st.kind === 'none');
      fillSw.style.background = st.kind === 'same' ? swatchBg(st.color) : st.kind === 'none' ? '' : '#fff';
      fillSw.title = st.kind === 'same' ? 'Фон ячеек: ' + colorLabel(st.color) : st.kind === 'none' ? 'Фон ячеек: без фона' : 'Фон ячеек: разный';
      fillEd.sync();
    }
    w.addEventListener('tw:open', syncCellFill);
    new MutationObserver(function () { if (!w.hidden) syncCellFill(); })
      .observe(document.querySelector('#tw-wrap .tw'), { attributes: true, attributeFilter: ['style', 'class'], subtree: true, childList: true });
    syncCellFill();
    // Кружки цвета у заглавной строки/столбца: показывают текущий цвет, по нажатию — окно «Фон» поверх окна «Таблица»;
    // овал «Выбранный цвет» по левому краю и вертикальному центру совпадает с нажатым кружком.
    const hdrSwatches = Array.from(w.querySelectorAll('.twin-ts-hdr'));
    // Кружок показывает цвет заглавной строки / столбца; «Без фона» — перечёркнутый кружок.
    function syncHdrSwatches() { hdrSwatches.forEach(function (sw) {
      const c = TableAPI.headerColor(sw.dataset.kind);
      sw.classList.toggle('is-none', !c);
      sw.style.background = swatchBg(c);
    }); }
    let hdrKind = 'row';   // 'row' / 'col' — заглавная строка / столбец; 'cells' — все ячейки (кружок «Фон ячеек»)
    const hdrWin = headerFillWindow(function (c) {
      if (hdrKind === 'cells') TableAPI.fillAllCells(c);
      else { TableAPI.setHeaderColor(hdrKind, c); syncHdrSwatches(); }
    });
    w.appendChild(hdrWin);
    // Кружок «Фон ячеек» у «Ячейки → Основной текст»: то же окно «Фон», цвет применяется ко всем ячейкам.
    // При разной заливке ячеек цвет в окне не выбран — галка ничего не меняет, пока не выбран цвет.
    // Кружок «Фон ячеек» (основной вид) и элемент выбора цвета «Фон» (вид «Ячейки», как в окне «Границы»): окно «Фон», совмещённое с кружком.
    [[w.querySelector('.twin-ts-cellfill'), w.querySelector('.twin-ts-cellfill')]].forEach(function (p) {
      p[0].addEventListener('click', function () {
        const st = TableAPI.tableFillState();
        openHdrWin(p[1], 'cells', st.kind === 'same' ? st.color : st.kind === 'none' ? null : undefined);
      });
    });
    function openHdrWin(sw, kind, color) {
        hdrKind = kind;
        hdrWin._open(color);
        if (color === undefined) hdrWin._unpick();
        hdrWin.style.left = '0px'; hdrWin.style.top = '0px';
        const sr = sw.getBoundingClientRect(), er = hdrWin.querySelector('.twin-current').getBoundingClientRect();
        let dx = sr.left - er.left;
        // Не выходит за правый край экрана (отступ 20px): тогда окно сдвигается влево, вертикальное совпадение сохраняется.
        const hr = hdrWin.getBoundingClientRect(), maxRight = document.documentElement.clientWidth;
        if (hr.right + dx > maxRight) dx = maxRight - hr.right;
        hdrWin.style.left = dx + 'px';
        hdrWin.style.top = (sr.top + sr.height / 2 - (er.top + er.height / 2)) + 'px';
    }
    hdrSwatches.forEach(function (sw) {
      sw.addEventListener('click', function () { openHdrWin(sw, sw.dataset.kind, TableAPI.headerColor(sw.dataset.kind)); });
    });
    document.addEventListener('tw:toggles', syncHdrSwatches);
    // Редактор «Границы» — общий с окном «Ячейки» (wireBordersEditor): объект — все границы таблицы.
    const tblBd = wireBordersEditor(w, w.querySelector('.ts-main .twin-bd-editor'), w.querySelector('.twin-ts-chip-bd'), {
      style: function () { return TableAPI.tableBorderStyle(); },
      setColor: function (c) { TableAPI.setTableBorders({ color: c }); },
      setWidth: function (v) { TableAPI.setTableBorders({ width: v }); },
      remove: function () { TableAPI.removeTableBorders(); },
      reset: function () { TableAPI.resetTableBorders(); }
    }, function () { hdrWin.hidden = true; });
    const bdColorWin = tblBd.colorWin;
    addBordersDrill(w, tb, function () { return { r1: 0, c1: 0, r2: document.querySelector('#tw-wrap .tw').rows.length - 1, c2: TableAPI.columnCount() - 1 }; }, tblBd.sync);
    // Редактор «Ширина»: ширина таблицы в px — только цифры; применяется по Enter, при уходе из поля и через 0,7 с после ввода.
    // Больше ширины колонки текста не бывает (и меньше 48px на столбец): значение приводится к допустимому.
    const wVal = w.querySelector('.twin-ts-wval');
    let editing = false;   // пользователь вводит значение — поле не перезаписываем
    // Способ «заполнить» — поле пустое, в нём плейсхолдер с шириной таблицы (цвет placeholder-color_inputText);
    // фиксированный способ — значение в поле.
    function syncWidthVal() {
      if (editing) return;
      const fill = TableAPI.tableWidthMode() === 'fill';
      wVal.placeholder = fill ? String(TableAPI.tableWidth()) : '';   // плейсхолдер с шириной — только у способа «заполнить»
      const mode = TableAPI.tableWidthMode();
      wVal.value = fill ? '' : mode === 'pct' ? String(TableAPI.tableWidthPct()) : String(TableAPI.tableWidth());
      // Кнопка справа показывает выбранный способ: «px» — фиксированный, «%» — относительный, «заполнить».
      wFill.textContent = modeLabel();
    }
    function modeLabel() { const mode = TableAPI.tableWidthMode(); return mode === 'px' ? 'px' : mode === 'pct' ? '%' : 'заполнить'; }
    const wFill = w.querySelector('.twin-ts-fill');
    // Кнопка способа — меню «Меню размеров» (Figma 3946:166818): фиксированная (px), относительная (%), заполнить.
    // Выбранный способ отмечен точкой слева. Базовая линия и левый край текста первого пункта совпадают с текстом кнопки.
    const wMenu = document.createElement('div');
    wMenu.className = 'twin-wmenu';
    wMenu.setAttribute('role', 'menu');
    wMenu.hidden = true;
    const W_MODES = [['px', 'фиксированная (px)'], ['pct', 'относительная (%)'], ['fill', 'заполнить']];
    wMenu.innerHTML = W_MODES.map(function (m) {
      return '<button type="button" class="twin-wmenu-item" role="menuitemradio" data-mode="' + m[0] + '" aria-checked="false"><span class="twin-wmenu-dot" aria-hidden="true"></span><span class="twin-wmenu-text">' + m[1] + '</span></button>';
    }).join('');
    w.appendChild(wMenu);
    function baselineOf(el) {   // y базовой линии текста элемента (экранные координаты)
      const m = document.createElement('span');
      m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.appendChild(m); const y = m.getBoundingClientRect().top; m.remove(); return y;
    }
    function textLeft(el) { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().left; }
    function openWMenu() {
      const mode = TableAPI.tableWidthMode();
      wMenu.querySelectorAll('.twin-wmenu-item').forEach(function (it) { it.setAttribute('aria-checked', String(it.dataset.mode === mode)); });
      wMenu.style.left = '0px'; wMenu.style.top = '0px';
      wMenu.hidden = false;
      const first = wMenu.querySelector('.twin-wmenu-text');
      const dx = textLeft(wFill) - textLeft(first), dy = baselineOf(wFill) - baselineOf(first);
      wMenu.style.left = dx + 'px'; wMenu.style.top = dy + 'px';
    }
    function closeWMenu() { wMenu.hidden = true; }
    wFill.addEventListener('click', function () { if (wMenu.hidden) openWMenu(); else closeWMenu(); });
    wMenu.querySelectorAll('.twin-wmenu-item').forEach(function (it) {
      it.addEventListener('click', function () {
        editing = false;
        if (it.dataset.mode === 'px') TableAPI.fixTableWidth();
        else if (it.dataset.mode === 'pct') TableAPI.setTableWidthPct(TableAPI.tableWidthPct());
        else TableAPI.fillTableWidth();
        closeWMenu(); syncWidthVal();
      });
    });
    w.addEventListener('mousedown', function (e) { if (!wMenu.hidden && !e.target.closest('.twin-wmenu, .twin-ts-fill')) closeWMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wMenu.hidden) { e.stopPropagation(); closeWMenu(); } }, true);
    w.addEventListener('tw:close', closeWMenu);
    (function () {
      let timer = 0;
      function commit(final) {
        clearTimeout(timer);
        if (!final && !editing) return;   // ввод отменён (например, нажали «заполнить»)
        if (final) editing = false;
        if (w.hidden) return;
        const v = parseInt(wVal.value, 10), lim = TableAPI.tableWidthLimits();
        // Относительный способ: число — проценты от ширины колонки текста.
        if (TableAPI.tableWidthMode() === 'pct') {
          if (v > 0 && (final || v >= 10)) { const ap = TableAPI.setTableWidthPct(v); if (final || ap !== v) wVal.value = String(ap); syncWidthVal(); }
          else if (final) wFill.textContent = modeLabel();
          return;
        }
        // Пока вводят, слишком маленькое число не применяем (это может быть начало ввода); больше ширины текста — сразу предел.
        if (!final && !(v >= lim.min)) return;
        if (v > 0) {
          const applied = TableAPI.setTableWidth(v);
          if (final || applied !== v) wVal.value = String(applied);
          syncWidthVal();
        }
        // Поле очистили и подтвердили: остаётся пустым, способ и ширина не меняются (надпись — текущего способа).
        else if (final) wFill.textContent = modeLabel();
      }
      wVal.addEventListener('input', function () {
        wVal.value = wVal.value.replace(/[^0-9]/g, '').slice(0, 4);
        editing = true;
        // Ввод руками — способ сразу фиксированный: надпись в кнопке «px» (пустое поле — способ прежний до подтверждения).
        // В относительном способе число — проценты, способ остаётся «%».
        if (wVal.value && TableAPI.tableWidthMode() !== 'pct') wFill.textContent = 'px';
        else wFill.textContent = modeLabel();
        clearTimeout(timer); timer = setTimeout(function () { commit(false); }, 700);
      });
      wVal.addEventListener('change', function () { commit(true); });
      wVal.addEventListener('blur', function () { if (editing) commit(true); });
      wVal.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); } });
    })();
    w.addEventListener('tw:open', function () { editing = false; syncWidthVal(); });
    new ResizeObserver(syncWidthVal).observe(document.querySelector('#tw-wrap .tw'));
    w.addEventListener('tw:open', function () { hdrWin.hidden = true; syncHdrSwatches(); });
    w.addEventListener('tw:close', function () { hdrWin.hidden = true; });
    syncHdrSwatches();
    // Настраиваемый объект — вся таблица: окно встаёт верхом по верху таблицы, на 8px правее её правого края.
    w._anchor = function () { const t = document.querySelector('#tw-wrap .tw'); return t ? t.getBoundingClientRect() : null; };
    tb._tableWin = w;
    return w;
  }

  // Окно «Ячейки» (команда «Настроить» в тулбарах строк, столбцов и диапазона). Пока вёрстка + открытие/закрытие.
  function alignIcon(col) {
    // Три полоски (9, 14 и 7px) выровнены по левому краю / центру / правому краю — как значок выравнивания текста.
    const ws = [9, 14, 7];
    return '<svg width="14" height="13" viewBox="0 0 14 13" aria-hidden="true">' + ws.map(function (wd, i) {
      const x = col === 0 ? 0 : col === 1 ? (14 - wd) / 2 : 14 - wd;
      return '<rect x="' + x + '" y="' + (i * 5) + '" width="' + wd + '" height="3" rx="1.5" fill="#7B62F8"/>';
    }).join('') + '</svg>';
  }
  // Панели «Шрифт» и «Выравнивание / Отступы» — общие для окна «Ячейки» и вида «Ячейки» в окне «Таблица».
  // ---- Редактор «Границы» — один и тот же в окне «Таблица» и в окне «Ячейки» ----
  // Кружок — окно выбора цвета границ (как в окне «Границы»); поле — толщина 1–20 px; крестик — убрать границы
  // (редактор прячется, в подвале окна — чипса «Границы», по ней редактор возвращается с границами по умолчанию).
  // Подвал окна с чипсами прячется, если в нём не осталось видимых чипс.
  function syncFoot(chip) {
    const foot = chip.parentNode;
    if (foot) foot.hidden = Array.from(foot.children).every(function (c) { return c.hidden; });
  }
  function bordersEditorHtml(labelCls) {
    return '<div class="twin-ts-row twin-bd-editor"><div class="twin-ts-label ' + labelCls + '">Границы</div>' +
      '<div class="twin-ts-editors">' +
        '<span class="twin-ts-swatch" style="background:#eaeaea" title="Цвет границ"></span>' +
        '<button type="button" class="twin-ts-linetype" title="Тип линии" aria-label="Тип линии"></button>' +
        '<div class="twin-ts-num"><div class="twin-field"><input class="twin-ts-bdwidth" inputmode="numeric" aria-label="Толщина границ" value="1"></div><button type="button" class="twin-ts-x twin-ts-bdclear" title="Убрать границы" aria-label="Убрать границы"></button></div>' +
      '</div>' +
      '<button type="button" class="twin-ts-arrow" title="Настроить границы" aria-label="Настроить границы">' + CHEVRON + '</button></div>';
  }
  // api: { style() → { style, width, color }, setColor(c), setWidth(n), remove(), reset() }; beforeColor — закрыть другие окна поверх.
  function wireBordersEditor(w, row, chip, api, beforeColor) {
    const sw = row.querySelector('.twin-ts-swatch'), bdW = row.querySelector('.twin-ts-bdwidth');
    function syncSwatch() { const c = api.style().color; sw.style.background = c || '#fff'; sw.title = c ? 'Цвет границ: ' + c.toUpperCase() : 'Цвет границ: разный'; }
    function syncWidth() { const v = api.style().width; bdW.value = v === null ? '' : String(v); }
    function syncEditor() {
      const none = api.style().style === 'none'; row.hidden = none; chip.hidden = !none; syncFoot(chip);
      // Панель, где кроме редактора ничего нет (окно «Ячейки»), прячется вместе с ним.
      const panel = row.parentElement;
      if (panel) panel.hidden = Array.from(panel.children).every(function (c) { return c.hidden; });
    }
    function syncAll() { syncSwatch(); syncWidth(); syncEditor(); }
    const colorWin = borderColorWindow(function (c) { api.setColor(c); syncSwatch(); });
    w.appendChild(colorWin);
    sw.addEventListener('click', function () {
      if (beforeColor) beforeColor();
      colorWin._open(api.style().color || '#d2d6da');
      colorWin.style.left = '0px'; colorWin.style.top = '0px';
      const sr = sw.getBoundingClientRect(), er = colorWin.querySelector('.twin-current').getBoundingClientRect();
      let dx = sr.left - er.left;
      const hr = colorWin.getBoundingClientRect(), maxRight = document.documentElement.clientWidth;
      if (hr.right + dx > maxRight) dx = maxRight - hr.right;
      colorWin.style.left = dx + 'px';
      colorWin.style.top = (sr.top + sr.height / 2 - (er.top + er.height / 2)) + 'px';
    });
    // Толщина: только цифры, 1–20 px; применяется по Enter, при уходе из поля и через 0,7 с после ввода. При разной — пусто.
    let timer = 0;
    function commit(final) {
      clearTimeout(timer);
      if (w.hidden || row.hidden) return;   // окно закрыто или границы убраны крестиком — толщину не применяем
      const v = parseInt(bdW.value, 10);
      if (v >= 1 && v <= 20 && v !== api.style().width) api.setWidth(v);
      if (final) syncWidth();
    }
    bdW.addEventListener('input', function () {
      bdW.value = bdW.value.replace(/[^0-9]/g, '').slice(0, 2);
      if (parseInt(bdW.value, 10) > 20) bdW.value = '20';
      clearTimeout(timer); timer = setTimeout(function () { commit(false); }, 700);
    });
    bdW.addEventListener('change', function () { commit(true); });
    bdW.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); bdW.select(); } });
    row.querySelector('.twin-ts-bdclear').addEventListener('click', function () {
      clearTimeout(timer); colorWin.hidden = true;
      const hadFocus = row.contains(document.activeElement);
      api.remove(); syncEditor();
      if (hadFocus) keepFocus();
    });
    chip.addEventListener('click', function () { const hadFocus = chip === document.activeElement; api.reset(); syncAll(); if (hadFocus) keepFocus(); });
    // Спрятанный элемент с фокусом теряет его, фокус уходит со страницы и окно закрывается — оставляем фокус в окне.
    function keepFocus() { if (w.tabIndex < 0 && !w.hasAttribute('tabindex')) w.tabIndex = -1; w.focus({ preventScroll: true }); }
    w.addEventListener('tw:open', function () { colorWin.hidden = true; syncAll(); });
    w.addEventListener('tw:close', function () { colorWin.hidden = true; });
    return { colorWin: colorWin, sync: syncAll };
  }
  // Провал по стрелке у редактора «Границы»: в том же окне — расширенные настройки границ (Figma 960:51434):
  // шапка «Назад» · «Границы» · сброс · галка · крестик, ниже — те же редакторы, что в окне «Границы».
  // «Назад» — обратно в основной вид окна (редактор «Границы» показывает изменения); галка и крестик — как у окна.
  function addBordersDrill(w, tb, getTarget, onBack) {
    const view = document.createElement('div');
    view.className = 'twin--borders twin-bdview';
    w.appendChild(view);
    function leave() { w.classList.remove('is-bd'); if (onBack) onBack(); }
    const ctl = buildBorders(view, { back: leave, getTarget: getTarget, onDone: function () { tb.closeWindow(); }, events: w });
    // Крестик — закрыть окно (изменения, сделанные в окне, сбрасывает общий обработчик крестика окон).
    view.querySelector('.twin-head .twin-close').addEventListener('click', function () { tb.closeWindow(); });
    w.querySelector('.twin-bd-editor .twin-ts-arrow').addEventListener('click', function () { w.classList.add('is-bd'); ctl.enter(); });
    w.addEventListener('tw:open', function () { w.classList.remove('is-bd'); });
    return view;
  }
  // ---- Редактор «Фон» — один и тот же в виде «Ячейки» окна «Таблица» и в окне «Ячейки» ----
  // Строка: кружок + подпись («Несколько цветов» / HEX) — по нажатию окно «Фон», совмещённое с кружком; крестик убирает фон
  // (редактор прячется, в подвале — чипса «Фон»; по чипсе редактор возвращается с цветом #FFFFFF).
  // При открытии: ячейки не залиты — редактора нет, в подвале чипса «Фон»; иначе — редактор.
  // Строка редактора (в окне «Ячейки» — в одном облачке с «Границы», после него); fillEditorHtml — то же в своём облачке.
  function fillRowHtml(labelCls) {
    return '<div class="twin-ts-row twin-ts-fillpanel"><div class="twin-ts-label ' + (labelCls || 'w28') + '">Фон</div>' +
          '<button type="button" class="twin-bd-color twin-ts-fillbtn" title="Фон" aria-label="Фон ячеек"><span class="twin-bd-swatch twin-ts-cellfill2"></span><span class="twin-bd-hex twin-ts-bubble-text"></span></button>' +
          '<button type="button" class="twin-ts-clear" title="Убрать фон" aria-label="Убрать фон"><span aria-hidden="true">\ue66c</span></button>' +
        '</div>';
  }
  function fillEditorHtml() {
    return '<div class="twin-panel twin-ts-panel">' + fillRowHtml() + '</div>';
  }
  // root — контейнер редактора (вид / окно); api: { state() → { kind, color }, fill(c) }.
  // Редактор всегда на месте: крестик убирает фон — вместо кружка с цветом перечёркнутый кружок, подписи и крестика нет.
  function wireFillEditor(w, root, api) {
    const btn = root.querySelector('.twin-ts-fillbtn');
    const sw = root.querySelector('.twin-ts-cellfill2'), text = root.querySelector('.twin-ts-bubble-text'), clear = root.querySelector('.twin-ts-clear');
    const fillWin = headerFillWindow(function (c) { api.fill(c); sync(); });
    w.appendChild(fillWin);
    function sync() {
      const st = api.state();
      sw.classList.toggle('is-none', st.kind === 'none');
      sw.style.background = st.kind === 'same' ? swatchBg(st.color.toLowerCase()) : st.kind === 'none' ? '' : '#fff';
      sw.title = st.kind === 'same' ? 'Фон ячеек: ' + colorLabel(st.color) : st.kind === 'none' ? 'Фон ячеек: без фона' : 'Фон ячеек: разный';
      text.textContent = st.kind === 'same' ? colorLabel(st.color) : st.kind === 'none' ? '' : 'Несколько цветов';
      text.classList.toggle('is-muted', st.kind === 'mixed');
      text.hidden = st.kind === 'none';
      clear.hidden = st.kind === 'none';
      btn.classList.toggle('is-none', st.kind === 'none');
    }
    function enter() { fillWin.hidden = true; sync(); }
    btn.addEventListener('click', function () {
      const st = api.state();
      fillWin._open(st.kind === 'same' ? st.color : st.kind === 'none' ? null : undefined);
      if (st.kind === 'mixed') fillWin._unpick();   // разный фон — цвет не выбран, галка ничего не меняет
      fillWin.style.left = '0px'; fillWin.style.top = '0px';
      const sr = sw.getBoundingClientRect(), er = fillWin.querySelector('.twin-current').getBoundingClientRect();
      let dx = sr.left - er.left;
      const hr = fillWin.getBoundingClientRect(), maxRight = document.documentElement.clientWidth;
      if (hr.right + dx > maxRight) dx = maxRight - hr.right;
      fillWin.style.left = dx + 'px';
      fillWin.style.top = (sr.top + sr.height / 2 - (er.top + er.height / 2)) + 'px';
    });
    function keepFocus() { if (!w.hasAttribute('tabindex')) w.tabIndex = -1; w.focus({ preventScroll: true }); }
    clear.addEventListener('click', function () { fillWin.hidden = true; api.fill(null); sync(); keepFocus(); });
    w.addEventListener('tw:close', function () { fillWin.hidden = true; });
    return { sync: sync, enter: enter, win: fillWin };
  }
  function cellsPanelsHtml() {
    const fmt = [['', 'Жирный', ' is-b'], ['', 'Курсив', ''], ['', 'Подчёркнутый', ' is-u'], ['', 'Зачёркнутый', '']];
    const COLS = [20, 77, 134], ROWS = [13.5, 33, 52.5];
    const H_NAMES = ['слева', 'по центру', 'справа'], V_NAMES = ['сверху', 'посередине', 'снизу'];
    let cells = '';
    ROWS.forEach(function (y, r) {
      COLS.forEach(function (x, c) {
        cells += '<button type="button" class="twin-cs-cell" role="radio" data-h="' + ['left', 'center', 'right'][c] + '" data-v="' + ['top', 'middle', 'bottom'][r] + '" aria-checked="' + (r === 0 && c === 0) + '" style="left:' + x + 'px;top:' + y + 'px" title="' + V_NAMES[r] + ', ' + H_NAMES[c] + '" aria-label="' + V_NAMES[r] + ', ' + H_NAMES[c] + '">' + alignIcon(c) + '</button>';
      });
    });
    return (
        '<div class="twin-panel twin-ts-panel">' +
          '<div class="twin-cs-font"><b>Шрифт</b><button type="button" class="twin-ts-link">Основной текст</button></div>' +
          '<div class="twin-style-row1">' +
            '<div class="twin-field twin-font">Inter<span class="twin-ico16 twin-hex-arrow" aria-hidden="true"></span></div>' +
            '<div class="twin-field twin-size"><input class="twin-cs-sizeval" inputmode="numeric" aria-label="Размер текста" value="16"></div>' +
          '</div>' +
          '<div class="twin-style-row2">' +
            '<div class="twin-fmt">' + fmt.map(function (f) {
              return '<button type="button" class="twin-btn twin-sq" title="' + f[1] + '" aria-label="' + f[1] + '" aria-pressed="false"><span class="twin-ico24' + f[2] + '" aria-hidden="true">' + f[0] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="twin-vdiv" aria-hidden="true"></div>' +
            '<div class="twin-colors">' +
              '<button type="button" class="twin-btn twin-sq" title="Цвет текста" aria-label="Цвет текста"><span class="twin-textcolor"></span></button>' +
              '<button type="button" class="twin-btn twin-sq" title="Цвет выделения" aria-label="Цвет выделения">' + STYLE_ICONS.marker + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="twin-panel twin-ts-panel twin-cs-panel2">' +
          '<div class="twin-cs-align-row"><div class="twin-cs-label">Выравнивание</div><div class="twin-cs-align" role="radiogroup" aria-label="Выравнивание">' + cells + '</div></div>' +
          '<div class="twin-cs-pad-row"><div class="twin-cs-label">Отступы</div>' +
            '<div class="twin-cs-pads">' +
              '<div class="twin-field twin-cs-pad" title="Отступ по горизонтали"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="0" y="1" width="1" height="10" rx="0.5" fill="#8991A9"/><rect x="3.5" y="3.5" width="5" height="5" rx="1.5" fill="none" stroke="#8991A9"/><rect x="11" y="1" width="1" height="10" rx="0.5" fill="#8991A9"/></svg><input class="twin-cs-padval" data-axis="h" inputmode="numeric" aria-label="Отступ по горизонтали" value="8"></div>' +
              '<div class="twin-field twin-cs-pad" title="Отступ по вертикали"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="0" width="10" height="1" rx="0.5" fill="#8991A9"/><rect x="1" y="11" width="10" height="1" rx="0.5" fill="#8991A9"/><rect x="3.5" y="3.5" width="5" height="5" rx="1.5" fill="none" stroke="#8991A9"/></svg><input class="twin-cs-padval" data-axis="v" inputmode="numeric" aria-label="Отступ по вертикали" value="8"></div>' +
            '</div>' +
            '<button type="button" class="twin-cs-toggle" title="Отступы по сторонам" aria-label="Отступы по сторонам"><span class="twin-ico24" aria-hidden="true"></span></button>' +
          '</div>' +
        '</div>'
    );
  }
  // scope — к каким ячейкам применяется выравнивание: 'active' (окно «Ячейки») или 'all' (вид «Ячейки» окна «Таблица»).
  function wireCellsPanels(w, scope) {
    // Состояния кнопок (как в окне «Стиль текста»): B/I/U/S переключаются, в сетке выравнивания выбран один вариант.
    // B / I / U / S — начертание всего текста ячеек: жирный, курсив, подчёркнутый, зачёркнутый. Применяется сразу.
    const FMT = ['bold', 'italic', 'underline', 'strike'];
    const fmtBtns = Array.from(w.querySelectorAll('.twin-fmt .twin-sq'));
    fmtBtns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        TableAPI.setCellsTextFormat(target, FMT[i], on);
      });
    });
    function syncFmt() { const f = TableAPI.cellsTextFormat(target) || {}; fmtBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(!!f[FMT[i]])); }); }
    // Выравнивание: выбранный вариант выравнивает текст в ячейках по горизонтали и вертикали.
    // Показывается текущее выравнивание ячеек; если у них разное — ни один вариант не выбран.
    const alignCells = Array.from(w.querySelectorAll('.twin-cs-cell'));
    function mark(h, v) { alignCells.forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.h === h && x.dataset.v === v)); }); }
    alignCells.forEach(function (b) {
      b.addEventListener('click', function () { mark(b.dataset.h, b.dataset.v); TableAPI.setCellAlign(target, b.dataset.h, b.dataset.v); });
    });
    // Отступы: два поля ввода — по горизонтали (слева и справа) и по вертикали (сверху и снизу) внутри ячеек.
    // Значение применяется по завершении ввода (Enter, уход из поля) и через 0,7 с после последнего изменения. 0–40 px.
    let target = scope;   // 'all' или запомненные при открытии активные ячейки
    const pads = Array.from(w.querySelectorAll('.twin-cs-padval'));
    function syncPads() { pads.forEach(function (inp) { const v = TableAPI.cellPadding(target, inp.dataset.axis); inp.value = v === null ? '' : String(v); }); }
    pads.forEach(function (inp) {
      let timer = 0;
      function commit(final) {
        clearTimeout(timer);
        const win = inp.closest('.twin');
        if (win && win.hidden) return;   // окно уже закрыто (крестик сбросил изменения) — ввод не применяем
        const v = parseInt(inp.value, 10);
        if (v >= 0 && v <= 40 && v !== TableAPI.cellPadding(target, inp.dataset.axis)) TableAPI.setCellPadding(target, inp.dataset.axis, v);
        if (final) syncPads();
      }
      inp.addEventListener('input', function () { inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 2); clearTimeout(timer); timer = setTimeout(function () { commit(false); }, 700); });
      inp.addEventListener('change', function () { commit(true); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); inp.select(); } });   // фокус остаётся в поле
    });
    // Размер текста: поле ввода (только цифры, 1–100 px), применяется так же, как отступы.
    const sizeInp = w.querySelector('.twin-cs-sizeval');
    function syncSize() { const v = TableAPI.cellFontSize(target); sizeInp.value = v === null ? '' : String(v); }
    (function () {
      let timer = 0;
      function commit(final) {
        clearTimeout(timer);
        const win = sizeInp.closest('.twin');
        if (win && win.hidden) return;
        const v = parseInt(sizeInp.value, 10);
        if (v >= 1 && v <= 100 && v !== TableAPI.cellFontSize(target)) TableAPI.setCellFontSize(target, v);
        if (final) syncSize();
      }
      sizeInp.addEventListener('input', function () {
        sizeInp.value = sizeInp.value.replace(/[^0-9]/g, '').slice(0, 3);
        if (parseInt(sizeInp.value, 10) > 100) sizeInp.value = '100';   // не больше 100
        clearTimeout(timer); timer = setTimeout(function () { commit(false); }, 700);
      });
      sizeInp.addEventListener('change', function () { commit(true); });
      sizeInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); sizeInp.select(); } });
    })();
    w._syncAlign = function () {
      target = scope === 'active' ? TableAPI.activeCellList() : scope;
      const a = TableAPI.cellAlign(target); if (a) mark(a.h, a.v); else mark(null, null);
      syncPads();
      syncFmt();
      syncSize();
    };
  }
  function cellsSettings(tb) {
    if (tb._cellsWin) return tb._cellsWin;
    const w = document.createElement('div');
    w.className = 'twin twin--table twin--cells';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', 'Ячейки');
    w.hidden = true;
    w.innerHTML =
      '<div class="twin-head">' +
        '<div class="twin-title">Ячейки</div>' +
        '<div class="twin-cmds">' +
          '<button type="button" class="twin-btn twin-reset" title="Сбросить настройки" aria-label="Сбросить настройки" disabled><span class="twin-ico24" aria-hidden="true"></span></button>' +
          '<button type="button" class="twin-btn twin-done" title="Сохранить" aria-label="Сохранить"><span class="twin-ico16" aria-hidden="true"></span></button>' +
          '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть"><span class="twin-close24" aria-hidden="true"></span></button>' +
        '</div>' +
      '</div>' +
      '<div class="twin-body">' +
        cellsPanelsHtml() +
        '<div class="twin-panel twin-ts-panel">' +
          bordersEditorHtml('w79') +
          fillRowHtml('w79') +
        '</div>' +
      '</div>' +
      '<div class="twin-ts-foot"><button type="button" class="twin-ts-chip twin-ts-chip-bd" hidden>Границы</button></div>';
    w.addEventListener('mousedown', function (e) { if (!e.target.closest('input')) e.preventDefault(); });   // поля «Отступы» редактируются
    w.querySelector('.twin-close').addEventListener('click', function () { tb.closeWindow(); });
    // Настраиваемый объект — выделенные ячейки: окно встаёт верхом по верху рамки выделения, на 8px правее неё.
    // Объект настройки — выделение (рамка), а если выделения нет — ячейка с курсором.
    w._anchor = function () {
      const f = document.querySelector('#tw-wrap .tw-sel');
      if (f && !f.hidden) return f.getBoundingClientRect();
      const ctx = TableAPI.context();
      return ctx && ctx.kind === 'cell' ? ctx.cell.getBoundingClientRect() : null;
    };
    wireCellsPanels(w, 'active');
    w.addEventListener('tw:open', function () { w._syncAlign(); });
    // Редактор «Фон» — тот же, что в виде «Ячейки» окна «Таблица» (wireFillEditor): объект — активные ячейки.
    const fillEd = wireFillEditor(w, w, {
      state: function () { return TableAPI.cellsFillState(); },
      fill: function (c) { TableAPI.applyFill(c); }
    });
    w.addEventListener('tw:open', function () { fillEd.enter(); });
    new MutationObserver(function () { if (!w.hidden) fillEd.sync(); })
      .observe(document.querySelector('#tw-wrap .tw'), { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
    // Редактор «Границы» — тот же, что в окне «Таблица» (wireBordersEditor): объект — границы активных ячеек
    // (выделение или ячейка с курсором).
    const cellsBd = wireBordersEditor(w, w.querySelector('.twin-bd-editor'), w.querySelector('.twin-ts-chip-bd'), {
      style: function () { return TableAPI.cellsBorderStyle(); },
      setColor: function (c) { TableAPI.setCellsBorders({ color: c }); },
      setWidth: function (v) { TableAPI.setCellsBorders({ width: v }); },
      remove: function () { TableAPI.removeCellsBorders(); },
      reset: function () { TableAPI.resetCellsBorders(); }
    });
    addBordersDrill(w, tb, function () { return TableAPI.borderRange(); }, cellsBd.sync);
    tb._cellsWin = w;
    return w;
  }
  // «Настроить»: курсор в таблице (тулбар ячейки) — окно «Таблица», выделение (тулбары выделения) — окно «Ячейки».
  // Выбор — по активному элементу: есть выделение (строки, столбцы, диапазон) — «Ячейки», иначе — «Таблица».
  function settings(tb) {
    const sel = TableAPI.isRowSelection() || TableAPI.isColSelection() || TableAPI.isRangeSelection();
    return sel ? cellsSettings(tb) : tableSettings(tb);
  }

  // Меню «Ещё»: все команды над таблицей (названия — текстом, иконки — рядом). Крестик закрывает меню,
  // стрелка вниз ничего не делает. Пункт запускает ту же команду, что и кнопка тулбара (onCommand(название)),
  // переключатели «Заглавная строка» / «Заглавный столбец» — общее состояние TableToggles.
  const MENU_SVG = {
    advMode: '\ue63c',   // «Расширенный режим» — cbuc-icons24 U+E63C (Figma 3658:328521)
    // «Настроить ячейку / ячейки» — одна иконка везде: шестерёнка U+E75D, как у «Настроить таблицу»
    cell: '\ue75d',   // шестерёнка — как у «Настроить таблицу» (по правке пользователя)
    width: '<svg width="24" height="24" viewBox="4 4 24 24" fill="none" aria-hidden="true"><path fill="currentColor" d="M7.89062 25.2812C7.45312 25.2812 7.23438 25.0625 7.23438 24.625V8.40625C7.23438 7.96875 7.45312 7.75 7.89062 7.75C8.29688 7.75 8.5 7.96875 8.5 8.40625V24.625C8.5 25.0625 8.29688 25.2812 7.89062 25.2812ZM24.1094 25.2812C23.7031 25.2812 23.5 25.0625 23.5 24.625V8.40625C23.5 7.96875 23.7031 7.75 24.1094 7.75C24.5469 7.75 24.7656 7.96875 24.7656 8.40625V24.625C24.7656 25.0625 24.5469 25.2812 24.1094 25.2812ZM13.5156 11.5C13.8594 11.5 14.1406 11.625 14.3594 11.875C14.6094 12.125 14.7344 12.4219 14.7344 12.7656V20.2656C14.7344 20.6094 14.6094 20.9062 14.3594 21.1562C14.1406 21.4062 13.8594 21.5312 13.5156 21.5312H12.25C11.9062 21.5312 11.6094 21.4062 11.3594 21.1562C11.1094 20.9062 10.9844 20.6094 10.9844 20.2656V12.7656C10.9844 12.4219 11.1094 12.125 11.3594 11.875C11.6094 11.625 11.9062 11.5 12.25 11.5H13.5156ZM19.75 11.5C20.0938 11.5 20.3906 11.625 20.6406 11.875C20.8906 12.125 21.0156 12.4219 21.0156 12.7656V20.2656C21.0156 20.6094 20.8906 20.9062 20.6406 21.1562C20.3906 21.4062 20.0938 21.5312 19.75 21.5312H18.4844C18.1406 21.5312 17.8438 21.4062 17.5938 21.1562C17.375 20.9062 17.2656 20.6094 17.2656 20.2656V12.7656C17.2656 12.4219 17.375 12.125 17.5938 11.875C17.8438 11.625 18.1406 11.5 18.4844 11.5H19.75Z"/></svg>',
    merge: '<svg width="24" height="24" viewBox="4 4 24 24" fill="none" aria-hidden="true"><path fill="currentColor" d="M22.9844 7.51562C23.5469 7.51562 24.0156 7.71875 24.3906 8.125C24.7969 8.5 25 8.96875 25 9.53125V23.5C25 24.0625 24.7969 24.5469 24.3906 24.9531C24.0156 25.3281 23.5469 25.5156 22.9844 25.5156H9.01562C8.45312 25.5156 7.96875 25.3281 7.5625 24.9531C7.1875 24.5469 7 24.0625 7 23.5V9.53125C7 8.96875 7.1875 8.5 7.5625 8.125C7.96875 7.71875 8.45312 7.51562 9.01562 7.51562H22.9844ZM16.5156 8.5V12.5312H24.0156V9.53125C24.0156 9.25 23.9062 9.01562 23.6875 8.82812C23.5 8.60938 23.2656 8.5 22.9844 8.5H16.5156ZM7.98438 13.5156V19.5156H24.0156V13.5156H7.98438ZM15.4844 12.5312V8.5H9.01562C8.73438 8.5 8.48438 8.60938 8.26562 8.82812C8.07812 9.01562 7.98438 9.25 7.98438 9.53125V12.5312H15.4844ZM7.98438 23.5C7.98438 23.7812 8.07812 24.0312 8.26562 24.25C8.48438 24.4375 8.73438 24.5312 9.01562 24.5312H15.4844V20.5H7.98438V23.5ZM22.9844 24.5312C23.2656 24.5312 23.5 24.4375 23.6875 24.25C23.9062 24.0312 24.0156 23.7812 24.0156 23.5V20.5H16.5156V24.5312H22.9844Z"/></svg>'
  };
  const MENU_ITEMS = [
    ['', 'Добавить столбец', 'sub'], ['', 'Добавить строку', 'sub'],
    ['', 'Сдвинуть столбец', 'sub'], ['', 'Сдвинуть строку', 'sub'],
    ['', 'Стиль текста'], ['', 'Фон'], ['', 'Границы'],
    ['', 'Разделить', 'sub'], [MENU_SVG.advMode, 'Расширенный режим'], ['', 'Настроить', 'sub'],
    // Меню таблицы: вместо «Настроить» со стрелкой — две команды: иконка «Настроить таблицу» — как у «Настроить» (U+E75D), «Настроить ячейку» — общая иконка настройки ячеек.
    ['', 'Настроить таблицу'], [MENU_SVG.cell, 'Настроить ячейку'], [MENU_SVG.cell, 'Настроить ячейки'],
    ['', 'Заглавная строка', 'switch'], ['', 'Заглавный столбец', 'switch'],
    ['', 'Расширить'], ['', 'Положение в тексте', 'sub'],   // бывшее «Выравнивание» (U+E6C0): переименовано по образцу 769:6069, иконка U+EC05
    // Добавлено по макету 3086:182040: иконки «Выровнять столбцы» и «Объединить» — векторы, «Очистить ячейки» — U+EB14.
    [MENU_SVG.width, 'Выровнять столбцы'], ['', 'Очистить ячейки'], [MENU_SVG.merge, 'Объединить'],
    ['', 'Удалить строку', 'danger'], ['', 'Удалить столбец', 'danger'], ['', 'Удалить таблицу', 'danger'],
    // Добавлено по макету 3154:139764 (иконки — U+EADD «плюс» и U+EB0E): в справочнике, в меню пока не входят.
    ['', 'Добавить столбец/строку', 'sub'], ['', 'Сдвинуть столбец/строку', 'sub']
  ];
  // Меню таблицы (из тулбара ячейки / таблицы) — все команды, кроме команд над диапазоном ячеек.
  // Подменю пунктов: [иконка, подпись, команда]. Открывается по наведению на пункт (и по клику), команда — по клику на пункт подменю.
  const SUBMENUS = {
    'Добавить столбец/строку': [['\ueb1a', 'Справа', 'insertColRight'], ['\ueb19', 'Слева', 'insertColLeft'],
                                ['\ueb18', 'Снизу', 'insertRowBelow'], ['\ueb17', 'Сверху', 'insertRowAbove']],
    // Figma 2692:141162. У «Сдвинуть столбец» / «Сдвинуть строку» — только подходящие по смыслу направления.
    'Сдвинуть столбец/строку': [['\ueb1a', 'Вправо', 'moveColRight'], ['\ueb19', 'Влево', 'moveColLeft'],
                                ['\ueb18', 'Вниз', 'moveRowDown'], ['\ueb17', 'Вверх', 'moveRowUp']],
    'Сдвинуть столбец': [['\ueb1a', 'Вправо', 'moveColRight'], ['\ueb19', 'Влево', 'moveColLeft']],
    'Сдвинуть строку': [['\ueb18', 'Вниз', 'moveRowDown'], ['\ueb17', 'Вверх', 'moveRowUp']],
    // Figma 3129:183295: выбор одного варианта (радио) — у текущего справа точка. 4-й элемент — значение варианта.
    'Положение в тексте': [['\uec05', 'По левому краю', 'tableAlignLeft', 'left'], ['\ue9ff', 'По центру', 'tableAlignCenter', 'center'],
                           ['\uec06', 'По правому краю', 'tableAlignRight', 'right']],
    // Figma 3129:183837: подменю пункта «Удалить» (в меню таблицы — исходная команда «Удалить таблицу»). Иконки красные (5-й элемент — 'danger').
    'Удалить таблицу': [['\ue954', 'Строку', 'deleteRow', undefined, 'danger'], ['\ue951', 'Столбец', 'deleteCol', undefined, 'danger'],
                        ['\ue957', 'Таблицу', 'deleteTable', undefined, 'danger']]
  };
  // Подменю «Удалить» в меню группы «Ячейка» окна расширенного режима — без «Таблицу» (она в группе «Таблица»).
  SUBMENUS['Удалить ячейку'] = SUBMENUS['Удалить таблицу'].slice(0, 2);
  // Figma 2596:212639: подменю «Разделить ячейку» (исходная команда «Разделить»). «На несколько ячеек» пока без действия — окно будет позже.
  SUBMENUS['Разделить'] = [['\ueb13', 'По горизонтали', 'splitCellH'], ['\ueb10', 'По вертикали', 'splitCellV'],
                           // иконка «На несколько ячеек» — шестерёнка U+E75D, как у «Настроить» (по правке пользователя)
                           ['\ue75d', 'На несколько ячеек', 'splitCellDialog']];
  // Figma 3066:172526: подменю «Настроить» (только у пункта со стрелкой — в меню таблицы).
  SUBMENUS['Настроить'] = [['\ue958', 'Таблицу', 'tableSettingsWin'], ['\ueb0c', 'Ячейку', 'cellSettingsWin']];   // иконки — Figma 3658:328529 / 3658:328530
  // Разметка пунктов подменю: [иконка, подпись, команда, значение радио?, 'danger'?].
  function subListHtml(items) {
    return '<div class="twin-mn-list">' + items.map(function (m) {
      const radio = m[3] !== undefined;
      return '<div class="twin-mn-item' + (m[4] === 'danger' ? ' is-danger' : '') + '" role="' + (radio ? 'menuitemradio' : 'menuitem') + '" tabindex="-1" data-cmd="' + m[2] + '"' +
        (radio ? ' data-value="' + m[3] + '" aria-checked="false"' : '') + '>' +
        '<span class="twin-mn-ico" aria-hidden="true">' + m[0] + '</span><span class="twin-mn-text">' + m[1] + '</span>' +
        (radio ? '<span class="twin-mn-radio" aria-hidden="true"></span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // Меню кнопки тулбара с теми же пунктами, что у подменю команды name (например, «Разделить ячейку», «Положение в тексте»).
  // Открывается по клику на кнопку по правилам меню тулбара: на 4px ниже тулбара, иконки пунктов — на оси иконки кнопки.
  // Вид — как у подменю, но с крестиком (без стрелки вниз). Пункт запускает команду, меню закрывается.
  function commandMenu(name, key) {
    return function (tb) {
      if (tb[key]) return tb[key];
      const w = document.createElement('div');
      w.className = 'twin twin--menu twin--cmdmenu';
      w.setAttribute('role', 'menu');
      w.setAttribute('aria-label', name);
      w.hidden = true;
      w.innerHTML = subListHtml(SUBMENUS[name]) + MENU_CLOSE_HTML;   // у меню из тулбара — крестик
      w.addEventListener('mousedown', function (e) { e.preventDefault(); });
      w.querySelector('.twin-close').addEventListener('click', function () { tb.closeWindow(); });
      w.querySelectorAll('.twin-mn-item').forEach(function (si) {
        si.addEventListener('click', function () { Toolbar.runCommand(si.dataset.cmd, tb, w); });
      });
      if (SUBMENU_VALUE[name]) w.addEventListener('tw:open', function () {
        const v = SUBMENU_VALUE[name]();
        w.querySelectorAll('[data-value]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.value === v)); });
      });
      tb[key] = w;
      return w;
    };
  }
  const splitMenu = commandMenu('Разделить', '_splitMenu');
  const alignMenu = commandMenu('Положение в тексте', '_alignMenu');
  const insertMenu = commandMenu('Добавить столбец/строку', '_insertMenu');
  // Текущее значение для подменю-радио.
  const SUBMENU_VALUE = { 'Положение в тексте': function () { return TableAPI.tableAlign(); } };
  // Меню таблицы (тулбар ячейки; в окне расширенного режима — когда курсор в ячейке) — по образцу Figma 769:6069.
  // «Настроить» открывает настройки таблицы, «Удалить» удаляет таблицу напрямую,
  // как в группе «Таблица» расширенного режима; оба пункта без подменю.
  const TABLE_MENU = { include: ['Добавить столбец/строку', 'Сдвинуть столбец/строку', 'Фон', 'Стиль текста', 'Границы',
    'Разделить', 'Выровнять столбцы', 'Расширить', 'Положение в тексте', 'Расширенный режим', 'Настроить', 'Удалить таблицу'],   // «Выровнять столбцы» — после «Разделить ячейку»
    rename: { 'Разделить': 'Разделить ячейку', 'Удалить таблицу': 'Удалить' },
    noSub: ['Настроить'], cmdName: { 'Настроить': 'Настроить таблицу' } };
  // Меню строки / нескольких строк (тулбар «Строки»): свой состав и порядок; «Удалить строку» подписано «Удалить».
  // Состав — по образцу Figma 769:6828; в конце меню нет стрелки вниз.
  // «Настроить ячейки» — после «Очистить ячейки» (во всех меню диапазонов).
  const ROWS_MENU = { include: ['Добавить столбец/строку', 'Сдвинуть строку', 'Фон', 'Стиль текста', 'Границы', 'Объединить',
    'Выровнять столбцы', 'Очистить ячейки', 'Настроить ячейки', 'Удалить строку'], rename: { 'Удалить строку': 'Удалить' },
    noFoot: true };
  // Меню диапазона ячеек (тулбар «Диапазон»: целиком не выделены ни строки, ни столбцы).
  // Вставка и сдвиг — объединены, как в меню таблицы: «Добавить столбец/строку», «Сдвинуть столбец/строку».
  const RANGE_MENU = { include: ['Добавить столбец/строку', 'Сдвинуть столбец/строку', 'Фон', 'Стиль текста',
    'Границы', 'Объединить', 'Выровнять столбцы', 'Очистить ячейки', 'Настроить ячейки', 'Удалить строку', 'Удалить столбец'],
    onlyMultiCol: ['Выровнять столбцы'] };   // «Выровнять столбцы» — только если диапазон задевает несколько столбцов
  // Меню «Ещё» группы «Ячейка» в тулбаре окна расширенного режима (Figma 3665:261927). Без стрелки вниз в конце.
  // «Настроить» — без подменю, открывает окно настройки ячейки; «Удалить» — подменю «Строку» / «Столбец».
  // Без курсора в таблице неактивны пункты, которым нужна ячейка (needsCaret).
  // Команды столбцов и строк (вставка, сдвиг, удаление) из этого меню перенесены в меню группы «Столбцы и строки».
  const ADV_CELL_MENU = { include: ['Фон', 'Стиль текста', 'Границы', 'Разделить', 'Настроить'],
    rename: { 'Разделить': 'Разделить ячейку' }, noSub: ['Настроить'],
    cmdName: { 'Настроить': 'Настроить ячейку' },
    needsCaret: ['Разделить', 'Настроить'], noFoot: true };
  // Меню «Ещё» группы «Столбцы и строки» в тулбаре окна расширенного режима: вставка, сдвиг и удаление столбцов и строк.
  // Без курсора в таблице неактивны пункты, которым нужна ячейка (needsCaret).
  const ADV_ROWCOL_MENU = { include: ['Добавить столбец/строку', 'Сдвинуть столбец/строку', 'Удалить столбец', 'Удалить строку'],
    rename: { 'Добавить столбец/строку': 'Вставить столбец/строку' },
    needsCaret: ['Сдвинуть столбец/строку', 'Удалить столбец', 'Удалить строку'], noFoot: true };
  // Меню «Ещё» группы «Таблица» в тулбаре окна расширенного режима (Figma 3665:275812).
  // «Настроить» — без подменю, открывает окно настройки таблицы; «Удалить» — без подменю, удаляет таблицу.
  const ADV_TABLE_MENU = { include: ['Выровнять столбцы', 'Расширить', 'Положение в тексте', 'Настроить', 'Удалить таблицу'],
    rename: { 'Удалить таблицу': 'Удалить' }, noSub: ['Настроить'], cmdName: { 'Настроить': 'Настроить таблицу' } };
  // Меню «Ещё» в окне расширенного режима, когда курсор не стоит в таблице.
  const ADV_NO_CARET_MENU = { include: ['Добавить столбец', 'Добавить строку', 'Стиль текста', 'Фон', 'Границы', 'Заглавная строка',
    'Заглавный столбец', 'Расширить', 'Положение в тексте', 'Настроить'], noSub: ['Настроить'] };
  // Меню столбца / нескольких столбцов (тулбар «Столбцы»).
  // «Выровнять столбцы» показывается, только если выделено несколько столбцов (onlyMultiCol).
  // Состав — по образцу Figma 769:9137.
  const COLS_MENU = { include: ['Добавить столбец/строку', 'Сдвинуть столбец', 'Фон', 'Стиль текста', 'Границы', 'Объединить',
    'Выровнять столбцы', 'Очистить ячейки', 'Настроить ячейки', 'Удалить столбец'], rename: { 'Удалить столбец': 'Удалить' }, onlyMultiCol: ['Выровнять столбцы'],
    noFoot: true };   // в образце нет стрелки вниз в конце меню   // в образце нет стрелки вниз в конце меню
  // opts: массив исключаемых названий или { include: [названия по порядку], rename: { старое: новое }, noSub: [названия без стрелки] }.
  // Крестик меню (серый кружок 28px справа сверху, заходит за край меню на 14px).
  const MENU_CLOSE_HTML = '<button type="button" class="twin-btn twin-close" title="Закрыть" aria-label="Закрыть"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="14" fill="#CDCDCD" fill-opacity="0.8"/><path d="M19.7917 18.875C19.9306 18.9861 20 19.1389 20 19.3333C20 19.5278 19.9306 19.6806 19.7917 19.7917C19.7361 19.875 19.6667 19.9306 19.5833 19.9583C19.5 19.9861 19.4167 20 19.3333 20C19.25 20 19.1667 19.9861 19.0833 19.9583C19 19.9306 18.9306 19.875 18.875 19.7917L14 14.9583L9.125 19.7917C9.06944 19.875 9 19.9306 8.91667 19.9583C8.83333 19.9861 8.75 20 8.66667 20C8.58333 20 8.5 19.9861 8.41667 19.9583C8.33333 19.9306 8.26389 19.875 8.20833 19.7917C8.06944 19.6806 8 19.5278 8 19.3333C8 19.1389 8.06944 18.9861 8.20833 18.875L13.0417 14L8.20833 9.125C8.06944 9.01389 8 8.86111 8 8.66667C8 8.47222 8.06944 8.31944 8.20833 8.20833C8.31944 8.06944 8.47222 8 8.66667 8C8.86111 8 9.01389 8.06944 9.125 8.20833L14 13.0417L18.875 8.20833C18.9861 8.06944 19.1389 8 19.3333 8C19.5278 8 19.6806 8.06944 19.7917 8.20833C19.9306 8.31944 20 8.47222 20 8.66667C20 8.86111 19.9306 9.01389 19.7917 9.125L14.9583 14L19.7917 18.875Z" fill="white"/></svg></button>';
  function moreMenu(onClose, opts, onCommand) {
    let items = MENU_ITEMS;
    if (Array.isArray(opts)) items = MENU_ITEMS.filter(function (m) { return opts.indexOf(m[1]) < 0; });
    else if (opts && opts.include) items = opts.include.map(function (name) { return MENU_ITEMS.filter(function (m) { return m[1] === name; })[0]; });
    if (opts && opts.noSub) items = items.map(function (m) { return opts.noSub.indexOf(m[1]) >= 0 && m[2] === 'sub' ? [m[0], m[1]] : m; });
    items = items.map(function (m) { return [m[0], m[1], m[2], m[1]]; });   // m[3] — исходное название команды
    if (opts && opts.sub) items = items.map(function (m) { return opts.sub.indexOf(m[1]) >= 0 ? [m[0], m[1], m[2] === 'danger' ? 'danger-sub' : 'sub', m[3]] : m; });   // m[3] — исходное название команды
    if (opts && opts.rename) items = items.map(function (m) { return opts.rename[m[1]] ? [m[0], opts.rename[m[1]], m[2], m[3]] : m; });
    const w = document.createElement('div');
    w.className = 'twin twin--menu';
    w.setAttribute('role', 'menu');
    w.setAttribute('aria-label', 'Все команды');
    w.hidden = true;
    w.innerHTML =
      '<div class="twin-mn-list">' + items.map(function (m) {
        return '<div class="twin-mn-item' + (m[2] === 'danger' ? ' is-danger' : m[2] === 'sub' ? ' has-sub' : m[2] === 'danger-sub' ? ' is-danger has-sub' : m[2] === 'switch' ? ' has-switch' : '') + '" role="menuitem" tabindex="-1" data-name="' + m[3] + '">' +
          '<span class="twin-mn-ico" aria-hidden="true">' + m[0] + '</span><span class="twin-mn-text">' + m[1] + '</span>' +
          (m[2] === 'sub' || m[2] === 'danger-sub' ? '<span class="twin-mn-sub" aria-hidden="true"></span>' : '') +
          (m[2] === 'switch' ? '<button type="button" class="twin-switch" role="switch" aria-checked="false" aria-label="' + m[1] + '"></button>' : '') +
          '</div>';
      }).join('') + '</div>' +
      (opts && opts.noFoot ? '' : '<div class="twin-mn-foot"><button type="button" class="twin-mn-more" title="Ещё" aria-label="Ещё"><svg width="18" height="6" viewBox="0 0 18 6" aria-hidden="true"><path d="M17.5 0L9 4.9L0.5 0L0 0.9L9 6L18 0.9L17.5 0Z" fill="#8991A9"/></svg></button></div>') +
      MENU_CLOSE_HTML;
    w.addEventListener('mousedown', function (e) { e.preventDefault(); });
    w.querySelector('.twin-close').addEventListener('click', function () { onClose(); });
    // «Расширить» ↔ «Уменьшить» (Figma 2048:189852, иконка U+EBC0): пока таблица расширена, пункт показывает «Уменьшить».
    function syncExpand() {
      const it = w.querySelector('.twin-mn-list > .twin-mn-item[data-name="Расширить"]');
      if (!it) return;
      const on = TableAPI.isExpanded();
      it.querySelector('.twin-mn-ico').textContent = on ? '\uebc0' : '\uea79';
      it.querySelector('.twin-mn-text').textContent = on ? 'Уменьшить' : 'Расширить';
    }
    w.addEventListener('tw:open', syncExpand);
    function syncSwitches() {
      w.querySelectorAll('.twin-switch').forEach(function (sw) { sw.setAttribute('aria-checked', String(TableToggles.get(sw.getAttribute('aria-label')))); });
    }
    syncSwitches();
    document.addEventListener('tw:toggles', syncSwitches);
    w.addEventListener('tw:open', syncSwitches);
    // Подменю: одно открытое за раз; закрывается при наведении на другой пункт, при уходе мыши с меню и при закрытии меню.
    let openSub = null;
    const closeBtn = w.querySelector(':scope > .twin-close');
    function closeSub() {
      if (!openSub) return;
      openSub.sm.hidden = true;
      openSub.it.classList.remove('is-open');
      if (closeBtn) closeBtn.style.visibility = '';
      openSub = null;
    }
    // Правила отображения дочернего меню (меню по стрелке):
    // 1) заезжает на родительское на 1px;
    // 2) базовая линия 1-го пункта дочернего меню = базовая линия пункта, из которого его вызвали;
    // 3) если дочернее меню перекрывает крестик родительского — крестик скрывается.
    function showSub(it, sm) {
      if (openSub && openSub.sm === sm) return;
      closeSub();
      if (sm._value) {
        const v = sm._value();
        sm.querySelectorAll('[data-value]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.value === v)); });
      }
      sm.hidden = false;
      const wr = w.getBoundingClientRect(), sw = sm.getBoundingClientRect().width;
      let x = wr.width - 1;
      // Не помещается справа — открываем слева от меню (тоже с заходом на 1px).
      if (wr.left + x + sw > document.documentElement.clientWidth) x = document.documentElement.clientWidth - wr.left - sw;
      sm.style.left = x + 'px';
      sm.style.top = '0px';
      const pt = it.querySelector('.twin-mn-text'), st = sm.querySelector('.twin-mn-text');
      sm.style.top = (baseline(pt) - baseline(st)) + 'px';
      fitWindowToScene(sm);
      it.classList.add('is-open');
      if (closeBtn) {
        const c = closeBtn.getBoundingClientRect(), r = sm.getBoundingClientRect();
        const overlap = c.left < r.right && c.right > r.left && c.top < r.bottom && c.bottom > r.top;
        closeBtn.style.visibility = overlap ? 'hidden' : '';
      }
      openSub = { it: it, sm: sm };
    }
    // Положение базовой линии текста (px от верха окна браузера): нулевой inline-block на базовой линии.
    function baseline(el) {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
      el.appendChild(probe);
      const y = probe.getBoundingClientRect().top;
      probe.remove();
      return y;
    }
    w.addEventListener('mouseleave', closeSub);
    w.addEventListener('tw:close', closeSub);
    w.querySelectorAll('.twin-mn-item').forEach(function (it) {
      const name = it.dataset.name;
      const subItems = it.classList.contains('has-sub') ? SUBMENUS[(opts && opts.subKey && opts.subKey[name]) || name] : null;   // подменю — только у пункта со стрелкой
      let sm = null;
      if (subItems) {
        sm = document.createElement('div');
        sm.className = 'twin-mn-submenu';
        sm.setAttribute('role', 'menu');
        sm.setAttribute('aria-label', name);
        sm.hidden = true;
        sm.innerHTML = subListHtml(subItems);
        if (SUBMENU_VALUE[name]) sm._value = SUBMENU_VALUE[name];
        w.appendChild(sm);
        sm.querySelectorAll('.twin-mn-item').forEach(function (si) {
          si.addEventListener('click', function (e) {
            e.stopPropagation();
            closeSub();
            if (onCommand) onCommand(si.dataset.cmd, w);
          });
        });
      }
      it.addEventListener('mouseenter', function () { if (sm && !it.classList.contains('is-disabled')) showSub(it, sm); else closeSub(); });
      it.addEventListener('click', function (e) {
        if (sm) { if (!it.classList.contains('is-disabled')) showSub(it, sm); return; }
        if (TableToggles.has(name)) { TableToggles.toggle(name); return; }
        if (e.target.closest('.twin-mn-sub')) return;          // стрелка подменю: подменю пока не описано
        if (it.classList.contains('is-disabled')) return;
        const id = Toolbar.commandByName((opts && opts.cmdName && opts.cmdName[name]) || name);
        if (id && onCommand) onCommand(id, w);
      });
    });
    return w;
  }
  function more(tb) {
    // В тулбаре таблицы (курсор в ячейке) — меню таблицы (TABLE_MENU, образец 769:6069).
    // В тулбаре строк / столбцов — меню строки / столбца; выделена вся таблица (такой же диапазон ячеек) — меню диапазона
    // (RANGE_MENU: вставка и сдвиг столбцов/строк, оба удаления).
    const label = tb.el.getAttribute('aria-label');
    let opts = label === 'Ячейка' ? TABLE_MENU : label === 'Строки' ? ROWS_MENU : label === 'Столбцы' ? COLS_MENU : label === 'Диапазон' ? RANGE_MENU : null;
    if ((opts === ROWS_MENU || opts === COLS_MENU) && TableAPI.isWholeSelection && TableAPI.isWholeSelection()) opts = RANGE_MENU;
    tb._moreWins = tb._moreWins || new Map();
    if (tb._moreWins.has(opts)) return tb._moreWins.get(opts);
    const w = moreMenu(function () { tb.closeWindow(); }, opts, function (id, menu) { Toolbar.runCommand(id, tb, menu); });
    if (opts && opts.onlyMultiCol) {
      w.addEventListener('tw:open', function () {
        const ctx = TableAPI.context();
        const multi = !!(ctx && ctx.kind === 'range' && ctx.range.c2 > ctx.range.c1);
        w.querySelectorAll('.twin-mn-item').forEach(function (it) {
          if (opts.onlyMultiCol.indexOf(it.querySelector('.twin-mn-text').textContent) >= 0) it.hidden = !multi;
        });
      });
    }
    tb._moreWins.set(opts, w);
    tb._moreWin = w;
    return w;
  }

  // Esc закрывает открытое окно.
  // Открыто вложенное окно цвета — Esc закрывает только его (раньше остальных обработчиков: выделение и окно «Границы» остаются).
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    // Открыто окно «Разделение ячейки» — Esc закрывает только его (окно расширенного режима, выделение и окна команд остаются).
    const split = document.querySelector('.tw-split:not([hidden])');
    if (split) { e.preventDefault(); e.stopImmediatePropagation(); window.SplitDialog.close(); return; }
    const inner = document.querySelector('.twin--bdcolor:not([hidden])');
    if (inner && inner.offsetParent) { inner.hidden = true; e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.twin:not([hidden]) > .twin-head .twin-close, .twin--menu:not([hidden]) > .twin-close').forEach(function (b) { b.click(); });
  });

  return { MENU_SVG: MENU_SVG, splitMenu: splitMenu, alignMenu: alignMenu, insertMenu: insertMenu, fill: fill, textStyle: textStyle, borders: borders, tableSettings: tableSettings, cellsSettings: cellsSettings, settings: settings, more: more, moreMenu: moreMenu, ADV_NO_CARET_MENU: ADV_NO_CARET_MENU, ADV_CELL_MENU: ADV_CELL_MENU, ADV_ROWCOL_MENU: ADV_ROWCOL_MENU, ADV_TABLE_MENU: ADV_TABLE_MENU, TABLE_MENU: TABLE_MENU, ROWS_MENU: ROWS_MENU, COLS_MENU: COLS_MENU, RANGE_MENU: RANGE_MENU };
})();
