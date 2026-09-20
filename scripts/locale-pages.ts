import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import { languageNames, resources, rtl, supported, type AppLanguage } from '../src/locales';
import { SITE_URL } from '../src/site';

/**
 * Writes one static landing page per non-default locale after the build.
 *
 * The app itself renders client side, which leaves crawlers an empty root element and
 * a single URL for every language. These pages give each language a real URL with real
 * text, and hand the visitor to the app with ?lang= when they tap through. They are
 * generated from the same `resources` the app uses, so there is no second copy of the
 * marketing copy to keep in step.
 */

const DEFAULT: AppLanguage = 'en';
export const localePath = (locale: AppLanguage) => locale === DEFAULT ? '/' : `/${locale}/`;

const esc = (value: string) => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

type Strings = Record<string, string>;
const stringsFor = (locale: AppLanguage) => resources[locale].translation as unknown as Strings;

/**
 * Every page carries the full set including itself and an x-default. Google drops a
 * pair whose return link is missing, so a page left out of one set invalidates it for
 * all of them.
 */
const hreflang = (site: string) => [
  ...supported.map((locale) => `    <link rel="alternate" hreflang="${locale}" href="${site}${localePath(locale)}" />`),
  `    <link rel="alternate" hreflang="x-default" href="${site}${localePath(DEFAULT)}" />`
].join('\n');

const trustIcon = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  lock: trustIcon('<circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>'),
  offline: trustIcon('<path d="m2 2 20 20"/><path d="M5.8 5.8A8 8 0 0 0 4 10a4 4 0 0 0 0 8h11"/><path d="M9.5 4.2a8 8 0 0 1 10.3 6.3 4 4 0 0 1 .7 7.1"/>'),
  noAccount: trustIcon('<path d="M2 21a8 8 0 0 1 11.3-7.3"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/>')
};

/**
 * The landing markup itself, shared by the locale pages and by the English copy
 * injected into the app shell. Mirrors Landing.tsx so the same stylesheet applies and
 * React replacing it on mount is not visible.
 */
export function landingBody(locale: AppLanguage, options: { marker?: boolean } = {}): string {
  const t = stringsFor(locale);
  const others = supported.filter((other) => other !== locale);
  return `    <main class="landing"${options.marker ? ' data-prerendered' : ''}>
      <header class="landing-nav">
        <a class="brand" href="${localePath(locale)}" aria-label="${esc(t.brandHome)}"><span class="brand-mark"><img src="/brand-symbol.png" alt="" /></span><span>${esc(t.brand)}</span></a>
        <a class="text-link" href="#privacy">${esc(t.privacy)}</a>
      </header>
      <section class="hero" id="top">
        <div class="hero-copy">
          <p class="eyebrow">${esc(t.tagline)}</p>
          <h1>${esc(t.landingTitle)}</h1>
          <p class="hero-body">${esc(t.landingBody)}</p>
          <div class="hero-actions"><a class="button" href="/?lang=${locale}">${esc(t.begin)}</a></div>
          <div class="trust-row">
            <span>${ICONS.lock}${esc(t.private)}</span><span>${ICONS.offline}${esc(t.offline)}</span><span>${ICONS.noAccount}${esc(t.noAccount)}</span>
          </div>
        </div>
        <div class="ritual-preview" aria-label="${esc(t.previewLabel)}">
          <div class="preview-orbit"><span lang="ar" dir="rtl">سُبْحَانَ ٱللَّٰهِ</span><small>SubhanAllah</small><strong>33</strong></div>
          <p>${esc(t.previewTagline)}</p>
        </div>
      </section>
      <section class="landing-section" id="privacy">
        <p class="eyebrow">${esc(t.private)}</p>
        <h2>${esc(t.privacyTitle)}</h2>
        <p>${esc(t.privacyBody)}</p>
        <div class="footer-links"><a href="/privacy.html">${esc(t.privacy)}</a><a href="/support.html">${esc(t.support)}</a></div>
      </section>
      <section class="landing-section">
        <p class="eyebrow">${esc(t.otherLanguages)}</p>
        <div class="footer-links">
${others.map((other) => `          <a href="${localePath(other)}" hreflang="${other}" lang="${other}">${esc(languageNames[other])}</a>`).join('\n')}
        </div>
      </section>
    </main>`;
}

export function page(locale: AppLanguage, site: string, css: string): string {
  const t = stringsFor(locale);
  const dir = rtl.includes(locale) ? 'rtl' : 'ltr';
  const canonical = `${site}${localePath(locale)}`;

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#faf8f5" />
    <title>${esc(t.seoTitle)}</title>
    <meta name="description" content="${esc(t.seoDescription)}" />
    <link rel="canonical" href="${canonical}" />
    <meta http-equiv="content-language" content="${locale}" />
${hreflang(site)}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Zikr" />
    <meta property="og:title" content="${esc(t.seoTitle)}" />
    <meta property="og:description" content="${esc(t.seoDescription)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${site}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${site}/og-image.png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192.png" type="image/png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="stylesheet" href="${css}" />
    <script src="/theme-init.js"></script>
    <script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Zikr',
  url: canonical,
  description: t.seoDescription,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  inLanguage: locale,
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}, null, 2).split('\n').map((line) => `      ${line}`).join('\n')}
    </script>
  </head>
  <body>
${landingBody(locale)}
  </body>
</html>
`;
}

/** Locale URLs, each listing every alternate, per Google's sitemap annotation format. */
export function sitemap(site: string, lastmod: string): string {
  const alternates = [
    ...supported.map((locale) => `      <xhtml:link rel="alternate" hreflang="${locale}" href="${site}${localePath(locale)}" />`),
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${site}${localePath(DEFAULT)}" />`
  ].join('\n');

  const localeUrls = supported.map((locale) => `  <url>
    <loc>${site}${localePath(locale)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${locale === DEFAULT ? '1.0' : '0.8'}</priority>
${alternates}
  </url>`).join('\n');

  const staticUrls = ['/privacy.html', '/support.html'].map((page) => `  <url>
    <loc>${site}${page}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localeUrls}
${staticUrls}
</urlset>
`;
}

/** Generated so the sitemap URL cannot drift from the site constant. */
export function robots(site: string): string {
  return `User-agent: *
Allow: /

# Form thank-you page, no standalone value in search.
Disallow: /feedback-received.html

# Private usage dashboard.
Disallow: /analytics.html

Sitemap: ${site}/sitemap.xml
`;
}

export function localePages(options: { site?: string } = {}): Plugin {
  const site = (options.site ?? SITE_URL).replace(/\/$/, '');
  return {
    name: 'zikr-locale-pages',
    // index.html carries a placeholder rather than a hardcoded origin, substituted in
    // dev and build alike so what you see locally matches what ships.
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', site);
    },
    // Runs before the PWA plugin's closeBundle so the generated pages are in dist in
    // time to be precached alongside everything else.
    async closeBundle() {
      const dist = path.resolve('dist');
      const index = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
      const css = index.match(/href="(\/assets\/index-[^"]+\.css)"/)?.[1];
      if (!css) throw new Error('locale-pages: could not find the built stylesheet in dist/index.html');

      // The default locale must carry the same annotations, or its alternates have no
      // return link and Google discards the whole cluster. English also gets the landing
      // prerendered into the root element: it is the one locale served by the app shell,
      // which otherwise ships no text for a crawler to read. React clears the container
      // on mount and renders the same markup, so nothing visibly changes.
      let shell = index;
      if (!shell.includes('hreflang=')) shell = shell.replace('  </head>', `${hreflang(site)}\n  </head>`);
      shell = shell.replace('<div id="root"></div>', `<div id="root">\n${landingBody(DEFAULT, { marker: true })}\n    </div>`);
      if (shell !== index) await fs.writeFile(path.join(dist, 'index.html'), shell);

      for (const locale of supported.filter((item) => item !== DEFAULT)) {
        const dir = path.join(dist, locale);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'index.html'), page(locale, site, css));
      }

      const lastmod = new Date().toISOString().slice(0, 10);
      await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap(site, lastmod));
      await fs.writeFile(path.join(dist, 'robots.txt'), robots(site));
    }
  };
}
