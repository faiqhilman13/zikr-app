import { describe, expect, it } from 'vitest';
import { supported } from '../src/locales';
import { landingBody, localePath, page, sitemap } from './locale-pages';

const SITE = 'https://myzikr.netlify.app';
const pages = supported.filter((locale) => locale !== 'en').map((locale) => ({ locale, html: page(locale, SITE, '/assets/index-test.css') }));

const alternates = (html: string) => [...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ hreflang: m[1], href: m[2] }));

describe('locale landing pages', () => {
  it('declares every language plus x-default on every page', () => {
    for (const { html } of pages) {
      const set = alternates(html);
      expect(set.map((a) => a.hreflang).sort()).toEqual([...supported, 'x-default'].sort());
    }
  });

  // Google ignores an annotation whose page leaves itself out, which silently
  // invalidates the whole cluster.
  it('includes a self-referencing entry on each page', () => {
    for (const { locale, html } of pages) {
      expect(alternates(html)).toContainEqual({ hreflang: locale, href: `${SITE}${localePath(locale)}` });
    }
  });

  // If A points at B, B must point back, or the pair is dropped.
  it('links reciprocally between every pair', () => {
    for (const { html } of pages) {
      for (const other of supported) {
        expect(alternates(html)).toContainEqual({ hreflang: other, href: `${SITE}${localePath(other)}` });
      }
    }
  });

  it('canonicals each page to itself, and that URL is in its own hreflang set', () => {
    for (const { locale, html } of pages) {
      const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical).toBe(`${SITE}${localePath(locale)}`);
      expect(alternates(html).map((a) => a.href)).toContain(canonical);
    }
  });

  it('marks Arabic right to left and the rest left to right', () => {
    for (const { locale, html } of pages) {
      expect(html).toContain(`<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`);
    }
  });

  it('carries the language into the app through the call to action', () => {
    for (const { locale, html } of pages) {
      expect(html).toContain(`href="/?lang=${locale}"`);
    }
  });

  it('translates the title and description rather than reusing English', () => {
    const titles = pages.map(({ html }) => html.match(/<title>(.*?)<\/title>/)?.[1]);
    expect(new Set(titles).size).toBe(pages.length);
    for (const title of titles) expect(title).not.toContain('Free Tasbih Counter');
  });

  it('lists every locale in the sitemap with its alternates', () => {
    const xml = sitemap(SITE, '2026-09-19');
    for (const locale of supported) {
      expect(xml).toContain(`<loc>${SITE}${localePath(locale)}</loc>`);
      expect(xml).toContain(`hreflang="${locale}" href="${SITE}${localePath(locale)}"`);
    }
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('hreflang="x-default"');
  });

  // Only the copy injected into the app shell may carry the marker. The stylesheet hides
  // it for returning visitors, and React's own Landing must never match that rule or the
  // landing would stay hidden after a reset.
  it('marks only the prerendered copy, never a locale page', () => {
    expect(landingBody('en', { marker: true })).toContain('<main class="landing" data-prerendered>');
    expect(landingBody('en')).toContain('<main class="landing">');
    for (const { html } of pages) expect(html).not.toContain('data-prerendered');
  });
});
