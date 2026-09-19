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
    // The chosen palette, resolved by the app and cached here. Values are re-validated
    // before use: this script writes to a style attribute, so it trusts nothing it reads.
    var palette = JSON.parse(localStorage.getItem('zikr-palette') || 'null');
    if (palette && typeof palette === 'object') {
      Object.keys(palette).forEach(function (name) {
        var value = palette[name];
        if (/^--[a-z0-9-]+$/.test(name) && typeof value === 'string'
          && /^(#[0-9a-f]{6}|rgba?\([\d.,\s]+\)|0 [\d.]+px [\d.]+px rgba?\([\d.,\s]+\))$/i.test(value)) {
          document.documentElement.style.setProperty(name, value);
        }
      });
    }
  } catch (error) { /* default light theme */ }
})();
