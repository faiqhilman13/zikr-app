import { describe, expect, it } from 'vitest';
import { embedUrl, listenLibrary, youtubeId } from './listen';

describe('youtubeId', () => {
  it.each([
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ']
  ])('reads %s', (input, id) => expect(youtubeId(input)).toBe(id));

  it.each(['', 'not a link', 'https://vimeo.com/123', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=short'])('rejects %s', (input) => {
    expect(youtubeId(input)).toBeNull();
  });
});

describe('listenLibrary', () => {
  it('holds only well-formed, unique entries', () => {
    const ids = listenLibrary.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of listenLibrary) {
      expect(youtubeId(item.id)).toBe(item.id);
      expect(item.title.trim()).not.toBe('');
      if (item.artist !== undefined) expect(item.artist.trim()).not.toBe('');
      if (item.start !== undefined) expect(Number.isInteger(item.start) && item.start >= 0).toBe(true);
      expect(['nasheed', 'zikr']).toContain(item.kind);
    }
  });

  it('embeds through the privacy-enhanced host only', () => {
    expect(new URL(embedUrl('dQw4w9WgXcQ')).host).toBe('www.youtube-nocookie.com');
  });

  it('starts where the entry says', () => {
    expect(new URL(embedUrl('dQw4w9WgXcQ', 153)).searchParams.get('start')).toBe('153');
    expect(new URL(embedUrl('dQw4w9WgXcQ')).searchParams.has('start')).toBe(false);
  });
});
