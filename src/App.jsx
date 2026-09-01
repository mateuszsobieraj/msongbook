import { useState, useEffect } from 'react';
import SongList from './components/SongList.jsx';
import SongDetail from './components/SongDetail.jsx';

function App() {
  const assetBase = import.meta.env.BASE_URL;
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [query, setQuery] = useState('');
  const [songContent, setSongContent] = useState(null);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [songError, setSongError] = useState('');
  const [viewMode, setViewMode] = useState('fullview');
  const [isLoading, setIsLoading] = useState(true);

  // Load songs index on mount
  useEffect(() => {
    async function loadSongs() {
      setIsLoading(true);
      try {
        const res = await fetch(`${assetBase}songs/index.json`);
        if (!res.ok) throw new Error('No manifest');
        const list = await res.json();
        const mapped = list.map((s) => ({
          filename: s.filename,
          title: s.title || (s.filename ? s.filename.replace(/[_-]/g, ' ').replace(/\.chordpro$/i, '') : 'Untitled'),
          artist: s.artist || '',
          genres: Array.isArray(s.genres) ? s.genres : [],
          tags: Array.isArray(s.tags) ? s.tags : [],
          speed: s.speed || ''
        }));
        setSongs(mapped);
      } catch (err) {
        console.warn('Failed to load songs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSongs();
  }, []);

  // Load song content when currentSong changes
  useEffect(() => {
    if (!currentSong) {
      setSongContent(null);
      setIsSongLoading(false);
      setSongError('');
      return;
    }

    const controller = new AbortController();

    async function loadContent() {
      setIsSongLoading(true);
      setSongError('');
      setSongContent(null);
      try {
        const res = await fetch(`${assetBase}songs/${currentSong.filename}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Failed to load song');
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(text)) {
          throw new Error('Song file returned the app HTML instead of song content');
        }
        setSongContent(text);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error loading song', err);
        setSongError('Could not load this song.');
        setSongContent(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsSongLoading(false);
        }
      }
    }
    loadContent();
    return () => controller.abort();
  }, [assetBase, currentSong]);

  useEffect(() => {
    document.body.classList.toggle('song-open', Boolean(currentSong));
    return () => document.body.classList.remove('song-open');
  }, [currentSong]);

  const filteredSongs = songs.filter(song => {
    const searchableText = [
      song.title,
      song.artist,
      song.speed,
      ...(song.genres || []),
      ...(song.tags || [])
    ].join(' ').toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    setViewMode('fullview');
  };

  const handleBack = () => {
    setCurrentSong(null);
    setSongContent(null);
    setSongError('');
    setIsSongLoading(false);
    setViewMode('fullview');
  };

  const goHome = () => {
    setQuery('');
    handleBack();
  };

  return (
    <div className="app">
      <header>
        <div className="brand">
          <button className="brand-left" type="button" onClick={goHome} aria-label="Go to song list">
            <img src={`${assetBase}assets/banjo.svg`} alt="banjo" className="logo" />
            <h1>MSongbook</h1>
          </button>
          {!currentSong && (
            <div className="brand-right">
              <div className="search-box header-search">
                <input
                  type="text"
                  placeholder="Search by title, artist, genre, tag..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {!currentSong ? (
          <SongList 
            songs={filteredSongs} 
            query={query} 
            onSelect={handleSongSelect}
            isLoading={isLoading}
          />
        ) : (
          <SongDetail 
            song={currentSong}
            content={songContent}
            isLoading={isSongLoading}
            error={songError}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
          />
        )}
      </main>
    </div>
  );
}

export default App;
