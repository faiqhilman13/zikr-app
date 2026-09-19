/**
 * The one place the deployed origin is written down. Anything needing an absolute URL
 * reads it from here: the canonical and social tags in index.html, the locale pages,
 * robots.txt and the sitemap. Change it here and everything follows, except
 * twa-manifest.json, which Bubblewrap reads outside this build and which a test keeps
 * in step.
 */
export const SITE_URL = 'https://myzikr.netlify.app';

/** Bare host, as Digital Asset Links and the TWA config spell it. */
export const SITE_HOST = new URL(SITE_URL).host;
