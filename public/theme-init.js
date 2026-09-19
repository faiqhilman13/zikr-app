// Runs synchronously before first paint so dark-mode users never see a light flash.
// The app mirrors its theme preference into localStorage for this script to read.
(function () {
  try {
    var preference = localStorage.getItem('zikr-theme');
    var dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0a1628' : '#faf8f5');
    // The shell ships the landing prerendered for search and for a first visit. Someone
    // who already onboarded is on their way to the counter, so mark the document before
    // paint and let CSS hide it rather than flashing the marketing page at them.
    document.documentElement.dataset.boot = localStorage.getItem('zikr-onboarded') === '1' ? 'app' : 'landing';
  } catch (error) { /* default light theme */ }
})();
