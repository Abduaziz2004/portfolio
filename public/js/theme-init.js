// Sahifa ko'rinishidan oldin ishlaydi: saqlangan mavzuni darhol qo'llaydi.
(function () {
  try {
    if (localStorage.getItem('color-theme') === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {
    /* localStorage mavjud emas — standart (dark) mavzu qoladi */
  }
})();
