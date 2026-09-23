import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { ListenItem } from '../data/listen';
import { ListenView } from './ListenView';

const items: ListenItem[] = [
  { id: 'aaaaaaaaaaa', title: 'Tala al-Badru', artist: 'Munshid One', kind: 'nasheed' },
  { id: 'bbbbbbbbbbb', title: 'Morning adhkar', artist: 'Reciter Two', kind: 'zikr' }
];

function Harness() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  return <ListenView items={items} playingId={playingId} onPlay={setPlayingId} onStop={() => setPlayingId(null)} />;
}

describe('ListenView', () => {
  it('loads nothing from YouTube until play is tapped', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play Tala al-Badru' }));
    const frame = container.querySelector('iframe');
    expect(frame?.getAttribute('src')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/aaaaaaaaaaa\?/);
    fireEvent.click(screen.getByRole('button', { name: 'Stop Tala al-Badru' }));
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('plays one recording at a time', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Tala al-Badru' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play Morning adhkar' }));
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(container.querySelector('iframe')?.getAttribute('title')).toBe('Morning adhkar');
  });

  it('filters by kind', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Dhikr' }));
    expect(screen.queryByText('Tala al-Badru')).toBeNull();
    expect(screen.getByText('Morning adhkar')).toBeInTheDocument();
  });
});
