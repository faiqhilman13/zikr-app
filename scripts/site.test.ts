import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE_HOST, SITE_URL } from '../src/site';
import { robots, sitemap } from './locale-pages';

const twa = JSON.parse(fs.readFileSync('twa-manifest.json', 'utf8')) as Record<string, string>;

describe('site origin', () => {
  it('has no trailing slash, so joined paths never double up', () => {
    expect(SITE_URL).not.toMatch(/\/$/);
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  // Bubblewrap reads twa-manifest.json outside this build, so nothing substitutes the
  // origin for it. Digital Asset Links verification is bound to that exact host: if it
  // drifts from the site, the published app shows a browser URL bar and nothing else
  // reports the mismatch.
  it('agrees with the TWA config, which the build cannot rewrite', () => {
    expect(twa.host).toBe(SITE_HOST);
    for (const field of ['iconUrl', 'maskableIconUrl', 'webManifestUrl', 'fullScopeUrl']) {
      expect(twa[field]).toContain(SITE_URL);
    }
  });

  it('points robots and the sitemap at the same origin', () => {
    expect(robots(SITE_URL)).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(sitemap(SITE_URL, '2026-09-19')).toContain(`<loc>${SITE_URL}/</loc>`);
  });
});
