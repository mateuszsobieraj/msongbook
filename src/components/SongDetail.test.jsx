import { fireEvent, render, screen } from '@testing-library/react';
import SongDetail from './SongDetail.jsx';

describe('SongDetail', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scales song content with the font controls', () => {
    render(
      <SongDetail
        song={{ title: 'Test Song', artist: 'Tester' }}
        content={`{title: Test Song}\n[C]Hello`}
        isLoading={false}
        viewMode="lyrics"
        onSetViewMode={vi.fn()}
        onBack={vi.fn()}
      />
    );

    const content = document.querySelector('.song-content');

    expect(content).toHaveStyle({ '--song-font-scale': '1' });

    expect(screen.queryByRole('button', { name: 'Increase font size' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByTitle('Increase font size'));

    expect(content).toHaveStyle({ '--song-font-scale': '1.1' });
  });

  it('uses the same transposed chord shapes in FullView and Chords with capo', () => {
    const props = {
      song: { filename: 'test.chordpro', title: 'Test Song' },
      content: '{title: Test Song}\n{key: C}\n[C]Hello [G/B]world [Am]again',
      isLoading: false,
      onSetViewMode: vi.fn()
    };
    const { rerender } = render(<SongDetail {...props} viewMode="fullview" />);
    const toggle = screen.getByRole('button', { name: 'Key & capo' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Transpose up' })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Transpose up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transpose up' }));
    expect(screen.getByText('D (+2)')).toBeInTheDocument();
    expect([...document.querySelectorAll('.chordsheet .chord')].map(el => el.textContent.trim()).filter(Boolean)).toEqual(['D', 'A/C#', 'Bm']);
    fireEvent.click(screen.getByRole('button', { name: 'Increase capo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase capo' }));
    expect(screen.getByText('Chord shapes: C')).toBeInTheDocument();
    const fullChords = [...document.querySelectorAll('.chordsheet .chord')].map(el => el.textContent.trim()).filter(Boolean);
    expect(fullChords).toEqual(['C', 'G/B', 'Am']);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Transpose up' })).not.toBeInTheDocument();
    expect([...document.querySelectorAll('.chordsheet .chord')].map(el => el.textContent.trim()).filter(Boolean)).toEqual(fullChords);
    fireEvent.click(toggle);
    rerender(<SongDetail {...props} viewMode="chords" />);
    expect(document.querySelector('.chords-only').textContent.trim()).toBe(fullChords.join(' '));
    expect(screen.getByRole('button', { name: 'Transpose up' })).toBeInTheDocument();
    rerender(<SongDetail {...props} viewMode="chordpro" />);
    expect(document.querySelector('.chordpro-raw').textContent).toBe(props.content);
  });

  it('restores settings for the same song and keeps other songs independent', () => {
    const props = { song: { filename: 'one.chordpro', title: 'One' }, content: '{key: C}\n[C]Hello', viewMode: 'fullview', onSetViewMode: vi.fn() };
    const first = render(<SongDetail {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Key & capo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transpose up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase font size' }));
    first.unmount();
    const second = render(<SongDetail {...props} />);
    expect(screen.getByRole('button', { name: 'Key & capo' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Key & capo' }));
    expect(screen.getByText('C# (+1)')).toBeInTheDocument();
    expect(document.querySelector('.song-content')).toHaveStyle({ '--song-font-scale': '1.1' });
    second.unmount();
    render(<SongDetail {...props} song={{ filename: 'two.chordpro', title: 'Two' }} />);
    expect(screen.getByText('C (0)')).toBeInTheDocument();
    expect(document.querySelector('.song-content')).toHaveStyle({ '--song-font-scale': '1' });
  });

  it('remains usable when local storage is blocked', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    try {
      render(<SongDetail song={{ title: 'Test' }} content="[C]Hello" viewMode="lyrics" onSetViewMode={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
      expect(screen.getByRole('button', { name: 'Light mode' })).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });

  it('keeps primary views visible and exposes additional views through Settings', () => {
    const changeView = vi.fn();
    const back = vi.fn();
    render(<SongDetail song={{ title: 'Test song', artist: 'Tester' }} content="[C]Hello" viewMode="fullview" onSetViewMode={changeView} onBack={back} />);
    expect(screen.getByRole('heading', { name: 'Test song' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lyrics + chords' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'ChordPro' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lyrics', exact: true }));
    expect(changeView).toHaveBeenLastCalledWith('lyrics');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'ChordPro' }));
    expect(changeView).toHaveBeenLastCalledWith('chordpro');
    fireEvent.click(screen.getByRole('button', { name: 'Chords', exact: true }));
    expect(changeView).toHaveBeenLastCalledWith('chords');
    expect(screen.getByRole('button', { name: 'Key & capo' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.queryByRole('button', { name: 'ChordPro' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to songs' }));
    expect(back).toHaveBeenCalledOnce();
  });
});
