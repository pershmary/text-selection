// Кнопки «Отменить» / «Повторить» в шапке текстового редактора и в шапке окна расширенного режима — то же, что Ctrl+Z / Ctrl+Y.
// Курсор остаётся на месте (нажатие не забирает фокус).
document.addEventListener('mousedown', function (e) {
  if (e.target.closest('.app-ghost[title="Отменить"], .app-ghost[title="Повторить"], .tw-win-round[title="Отменить"], .tw-win-round[title="Повторить"]')) e.preventDefault();
}, true);
document.addEventListener('click', function (e) {
  const b = e.target.closest('.app-ghost[title="Отменить"], .app-ghost[title="Повторить"], .tw-win-round[title="Отменить"], .tw-win-round[title="Повторить"]');
  if (!b) return;
  if (b.title === 'Отменить') TableAPI.undo(); else TableAPI.redo();
});
