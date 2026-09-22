import { useState, useEffect, useRef } from 'react';
import SongList from './components/SongList.jsx';
import SongDetail from './components/SongDetail.jsx';
import { readPreference, writePreference } from './utils/preferences.js';

function readSongRoute() {
  const match = window.location.hash.match(/^#\/song\/(.+)$/);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); } catch { return '__invalid_route__'; }
}

function App() {
  const assetBase = import.meta.env.BASE_URL;
  const [songs, setSongs] = useState([]);
  const [songFilename, setSongFilename] = useState(readSongRoute);
  const currentSong = songs.find(song => song.filename === songFilename) || null;
  const [query, setQuery] = useState(() => {
    const saved = readPreference('songSearch', '');
    return typeof saved === 'string' ? saved : '';
  });
  const [songContent, setSongContent] = useState(null);
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [songError, setSongError] = useState('');
  const [viewMode, setViewMode] = useState('fullview');
  const [isLoading, setIsLoading] = useState(true);
  const [indexError, setIndexError] = useState('');
  const [indexAttempt, setIndexAttempt] = useState(0);
  const [songAttempt, setSongAttempt] = useState(0);
  const listScroll = useRef(0);

  useEffect(() => {
    const onHashChange = () => {
      setSongFilename(readSongRoute());
      setViewMode('fullview');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => { writePreference('songSearch', query); }, [query]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, songFilename ? 0 : listScroll.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [songFilename, isLoading]);

  // Load songs index on mount
  useEffect(() => {
    const controller = new AbortController();
    async function loadSongs() {
      setIsLoading(true);
      setIndexError('');
      try {
        const res = await fetch(`${assetBase}songs/index.json`, { signal: controller.signal });
        if (!res.ok) throw new Error('No manifest');
        const list = await res.json();
        if (!Array.isArray(list) || list.some(s => !s || typeof s.filename !== 'string' || !s.filename || /[/\\]/.test(s.filename))) {
          throw new Error('Invalid song index');
        }
        const mapped = list.map((s) => ({
          filename: s.filename,
          title: typeof s.title === 'string' && s.title ? s.title : s.filename.replace(/[_-]/g, ' ').replace(/\.(chordpro|cho|crd)$/i, ''),
          artist: typeof s.artist === 'string' ? s.artist : '',
          genres: Array.isArray(s.genres) ? s.genres : [],
          tags: Array.isArray(s.tags) ? s.tags : [],
          speed: s.speed || ''
        }));
        if (!controller.signal.aborted) setSongs(mapped);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn('Failed to load songs', err);
        setIndexError('Could not load the song list. Check your connection and try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadSongs();
    return () => controller.abort();
  }, [assetBase, indexAttempt]);

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
        const res = await fetch(`${assetBase}songs/${encodeURIComponent(currentSong.filename)}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Failed to load song');
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(text)) {
          throw new Error('Song file returned the app HTML instead of song content');
        }
        if (!controller.signal.aborted) setSongContent(text);
      } catch (err) {
        if (controller.signal.aborted || err.name === 'AbortError') return;
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
  }, [assetBase, currentSong, songAttempt]);

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

    return searchableText.includes(query.trim().toLowerCase());
  });

  const handleSongSelect = (song) => {
    listScroll.current = window.scrollY;
    window.location.hash = `/song/${encodeURIComponent(song.filename)}`;
    setSongFilename(song.filename);
    setSongContent(null);
    setIsSongLoading(true);
    setSongError('');
    setViewMode('fullview');
  };

  const handleBack = () => {
    window.location.hash = '/';
    setSongFilename('');
    setSongContent(null);
    setSongError('');
    setIsSongLoading(false);
    setViewMode('fullview');
  };

  const goHome = () => {
    handleBack();
  };

  return (
    <div className="app">
      <header className="app-header">
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
                  aria-label="Search songs"
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
        {indexError ? (
          <div className="empty-state" role="alert">
            <p>{indexError}</p>
            <button className="control-button" onClick={() => setIndexAttempt(n => n + 1)}>Try again</button>
          </div>
        ) : songFilename && !currentSong && !isLoading ? (
          <div className="empty-state" role="alert">
            <p>This song is not in the songbook.</p>
            <button className="control-button" onClick={handleBack}>Back to songs</button>
          </div>
        ) : !currentSong ? (
          <SongList 
            songs={filteredSongs} 
            query={query} 
            onSelect={handleSongSelect}
            isLoading={isLoading}
          />
        ) : (
          <SongDetail 
            key={currentSong.filename}
            song={currentSong}
            content={songContent}
            isLoading={isSongLoading}
            error={songError}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            onBack={handleBack}
            onRetry={() => setSongAttempt(n => n + 1)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
