import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  default: ({ song, content, isLoading, error, viewMode, onSetViewMode, onRetry }) => (
    <div data-testid="mock-song-detail">
      <div>{song?.title}</div>
      <div>{isLoading ? 'Loading song' : content}</div>
      <div>{error}</div>
      {error && <button onClick={onRetry}>Try again</button>}
      <button onClick={() => onSetViewMode('lyrics')}>Lyrics</button>
    </div>
  )
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.endsWith('/songs/index.json')) {
        return Response.json([
          {
            filename: 'test.chordpro',
            title: 'Test Song',
            artist: 'Tester',
            genres: ['Bluegrass'],
            tags: ['banjo'],
            speed: 'fast'
          }
        ]);
      }

      return new Response('{title: Test Song}\n[C]Hello', {
        headers: { 'content-type': 'text/plain' }
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.className = '';
  });

  it('renders song list by default and can go home after selecting a song', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:');
    });

    expect(screen.getByTestId('mock-song-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-song-detail')).not.toBeInTheDocument();

    const selectButton = screen.getByRole('button', { name: /Select/i });
    fireEvent.click(selectButton);

    expect(screen.getByTestId('mock-song-detail')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('mock-song-detail')).toHaveTextContent('Hello');
    });

    fireEvent.click(screen.getByRole('button', { name: /Go to song list/i }));

    expect(screen.getByTestId('mock-song-list')).toBeInTheDocument();
  });

  it('searches song metadata from the manifest', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:');
    });

    fireEvent.change(screen.getByPlaceholderText(/Search by title/i), {
      target: { value: 'banjo' }
    });

    expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:banjo');

    fireEvent.change(screen.getByPlaceholderText(/Search by title/i), {
      target: { value: 'jazz' }
    });

    expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:0:jazz');
  });

  it('opens a song from a direct link and responds to history navigation', async () => {
    window.history.replaceState(null, '', '/#/song/test.chordpro');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('mock-song-detail')).toHaveTextContent('Hello'));
    window.history.replaceState(null, '', '/#/');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(screen.getByTestId('mock-song-list')).toBeInTheDocument();
  });

  it('keeps the search when returning from a song', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search songs' }), { target: { value: 'banjo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(window.location.hash).toBe('#/song/test.chordpro');
    fireEvent.click(screen.getByRole('button', { name: 'Go to song list' }));
    expect(screen.getByRole('textbox', { name: 'Search songs' })).toHaveValue('banjo');
  });

  it('shows an index error and recovers on retry', async () => {
    fetch.mockRejectedValueOnce(new Error('Offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the song list');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles an unknown song link without pretending the library is empty', async () => {
    window.history.replaceState(null, '', '/#/song/missing.chordpro');
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('This song is not in the songbook');
    fireEvent.click(screen.getByRole('button', { name: 'Back to songs' }));
    expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:');
  });

  it('rejects app HTML returned as song content and lets the user retry', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('mock-song-list')).toHaveTextContent('Songs:1:'));
    fetch.mockResolvedValueOnce(new Response('<!doctype html><html>App</html>', { headers: { 'content-type': 'text/html' } }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(await screen.findByText('Could not load this song.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByTestId('mock-song-detail')).toHaveTextContent('Hello'));
    expect(screen.queryByText('Could not load this song.')).not.toBeInTheDocument();
  });
});
