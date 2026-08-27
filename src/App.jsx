import { useState, useEffect } from 'react';
import SongList from './components/SongList.jsx';
import SongDetail from './components/SongDetail.jsx';

function App() {
  const assetBase = import.meta.env.BASE_URL;
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [query, setQuery] = useState('');
  const [songContent, setSongContent] = useState(null);
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
          artist: s.artist || ''
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
      return;
    }

    async function loadContent() {
      try {
        const res = await fetch(`${assetBase}songs/${currentSong.filename}`);
        if (!res.ok) throw new Error('Failed to load song');
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(text)) {
          throw new Error('Song file returned the app HTML instead of song content');
        }
        setSongContent(text);
      } catch (err) {
        console.error('Error loading song', err);
        setSongContent(null);
      }
    }
    loadContent();
  }, [currentSong]);

  const filteredSongs = songs.filter(song =>
    (song.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (song.artist || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    setViewMode('fullview');
    document.body.classList.add('song-open');
  };

  const handleBack = () => {
    setCurrentSong(null);
    setSongContent(null);
    setViewMode('fullview');
    document.body.classList.remove('song-open');
  };

  const goHome = () => {
    setQuery('');
    handleBack();
  };

  return (
    <div className="app">
      <header>
        <div className="brand">
          <div className="brand-left" onClick={goHome} style={{cursor: 'pointer'}}>
            <img src={`${assetBase}assets/banjo.svg`} alt="banjo" className="logo" />
            <h1>MSongbook</h1>
          </div>
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
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;
