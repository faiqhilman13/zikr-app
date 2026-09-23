/**
 * The Listen library: nasheeds and recited dhikr hand-picked from YouTube. Nothing is
 * downloaded or re-hosted; each entry is only a YouTube video id, played through the
 * privacy-enhanced embed once someone taps play.
 *
 * To add one, copy the 11-character id from the YouTube link (after `v=`, `youtu.be/`
 * or `shorts/`) and add a row. A test rejects malformed ids and duplicates. While the list is empty the Listen tab is
 * hidden, so an unfinished library never reaches anyone.
 */
export type ListenKind = 'nasheed' | 'zikr';

export interface ListenItem {
  /** YouTube video id, e.g. `dQw4w9WgXcQ`. */
  id: string;
  title: string;
  /** Reciter, munshid or channel, as they credit themselves. */
  artist?: string;
  kind: ListenKind;
  /** Optional Arabic title shown under the English one. */
  arabic?: string;
  /** Seconds into the video to begin, for long gatherings where the recitation starts later. */
  start?: number;
}

export const listenLibrary: ListenItem[] = [
  { id: 'Gw0oEE9LFHA', title: 'Supreme Salawat', kind: 'zikr', start: 153 },
  { id: '0sBScYnDMjk', title: 'Divine Meditation: The Great Light of the Warrior Spirit', kind: 'zikr', start: 92 },
  { id: 'SqjyTaw9qMc', title: 'Divine Meditation: The Litany of the Unveiling of the Reality of Oneness', kind: 'zikr', start: 424 },
  // Waiting on titles:
  // { id: 'gS3d6ninTlE', title: '', kind: 'zikr', start: 650 },
  // { id: 'hG1nRCaubWg', title: '', kind: 'zikr', start: 4065 },
  // { id: 'arQq9Upjq-M', title: '', kind: 'zikr', start: 878 },
  // { id: 'nXxv1rmVhek', title: '', kind: 'zikr', start: 191 },
];

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Accepts a bare id or any common YouTube link and returns the video id, or null. */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') candidate = url.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    candidate = url.searchParams.get('v');
    const [, kind, id] = url.pathname.split('/');
    if (!candidate && (kind === 'shorts' || kind === 'embed' || kind === 'live')) candidate = id ?? null;
  }
  return candidate && ID.test(candidate) ? candidate : null;
}

/** Privacy-enhanced embed: YouTube sets no cookies until the viewer plays. */
export const embedUrl = (id: string, start = 0) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1${start > 0 ? `&start=${Math.floor(start)}` : ''}`;
export const watchUrl = (id: string, start = 0) => `https://www.youtube.com/watch?v=${id}${start > 0 ? `&t=${Math.floor(start)}s` : ''}`;
