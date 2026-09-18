export const isAppleMobile = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (/Macintosh|MacIntel/i.test(`${navigator.userAgent} ${navigator.platform}`) && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
