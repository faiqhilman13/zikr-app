// Runs synchronously before first paint so dark-mode users never see a light flash.
// The app mirrors its theme preference into localStorage for this script to read.
(function () {
  try {
    var preference = localStorage.getItem('zikr-theme');
    var dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0a1628' : '#faf8f5');
  } catch (error) { /* default light theme */ }
})();
