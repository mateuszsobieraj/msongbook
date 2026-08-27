import { useMemo } from 'react';

export default function SongList({ songs, query, onSelect, isLoading }) {
  // Group songs by first letter of title and sort
  const groupedSongs = useMemo(() => {
    if (!songs || songs.length === 0) return [];
    
    const groups = {};
    songs.forEach(song => {
      const letter = (song.title || '?').charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(song);
    });
    
    // Sort letters and sort songs within each group by title
    const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    sortedLetters.forEach(letter => {
      groups[letter].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    });
    
    return sortedLetters.map(letter => ({ letter, songs: groups[letter] }));
  }, [songs]);

  if (isLoading) {
    return <div className="empty-state">Loading songs…</div>;
  }

  if (groupedSongs.length === 0) {
    if (query) {
      return (
        <div className="empty-state">
          <h2>🦗 Crickets…</h2>
          <p>Even the banjo fell silent — no tune matches “{query}”</p>
        </div>
      );
    }
    return (
      <div className="empty-state">
        <h2>🎼 Your songbook is empty</h2>
        <p>Add your first songs in ChordPro format</p>
      </div>
    );
  }

  return (
    <div className="song-list">
      {groupedSongs.map(({ letter, songs: letterSongs }) => (
        <div key={letter} className="letter-section">
          <div className="letter-heading">
            {letter} <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 'normal' }}>({letterSongs.length})</span>
          </div>
          <div className="song-grid">
            {letterSongs.map((song) => (
              <div 
                key={song.filename} 
                className="song-card"
                onClick={() => onSelect(song)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(song);
                  }
                }}
              >
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
