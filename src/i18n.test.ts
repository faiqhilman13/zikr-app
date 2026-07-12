import { describe, expect, it } from 'vitest';
import { resources } from './i18n';

describe('translations', () => {
  it('keeps Malay and Arabic coverage aligned with English', () => {
    const english = Object.keys(resources.en.translation).sort();
    expect(Object.keys(resources.ms.translation).sort()).toEqual(english);
    expect(Object.keys(resources.ar.translation).sort()).toEqual(english);
  });
});
