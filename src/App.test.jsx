import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

vi.mock('./components/SongList.jsx', () => ({
  default: ({ songs, query, onSelect, isLoading }) => (
    <div data-testid="mock-song-list">
      {isLoading ? 'Loading' : `Songs:${songs.length}:${query}`}
      <button onClick={() => onSelect({ filename: 'test.chordpro', title: 'Test Song', artist: 'Tester' })}>Select</button>
    </div>
  )
}));

vi.mock('./components/SongDetail.jsx', () => ({
  default: ({ song, content, viewMode, onSetViewMode, onBack }) => (
    <div data-testid="mock-song-detail">
      <div>{song?.title}</div>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSetViewMode('lyrics')}>Lyrics</button>
    </div>
  )
}));

describe('App', () => {
  it('renders song list by default and can go home after selecting a song', async () => {
    render(<App />);

    expect(screen.getByTestId('mock-song-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-song-detail')).not.toBeInTheDocument();

    const selectButton = screen.getByRole('button', { name: /Select/i });
    await userEvent.click(selectButton);

    expect(screen.getByTestId('mock-song-detail')).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /Back/i });
    await userEvent.click(backButton);

    expect(screen.getByTestId('mock-song-list')).toBeInTheDocument();
  });
});
