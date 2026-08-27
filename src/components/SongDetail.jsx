import React, { useMemo, useState } from 'react';
import { parseChordPro, renderChordsOnly, parseAndRenderChordPro, renderChordSheetHtml } from '../utils/chordpro.js';

export default function SongDetail({ song, content, viewMode, onSetViewMode, onBack }) {
  const isLoading = content === null;
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('songDarkMode') === '1');

  const increaseFont = () => setFontSizeScale(s => Math.min(2.5, s + 0.1));
  const decreaseFont = () => setFontSizeScale(s => Math.max(0.6, s - 0.1));
  const resetFont = () => setFontSizeScale(1);

  const toggleDarkMode = () => {
    setDarkMode(d => {
      localStorage.setItem('songDarkMode', d ? '0' : '1');
      return !d;
    });
  };

  // Memoize parsing to avoid re-parsing on each render
  const rendered = useMemo(() => {
    if (isLoading) return { html: '' };
    let songObj = parseAndRenderChordPro(content);
    // Always compute clean lyrics (without chords) for the Lyrics view
    const cleanLyrics = parseChordPro(content);
    
    if (songObj) {
      // Apply transposition and capo for FullView mode
      if (viewMode === 'fullview') {
        if (transpose !== 0) {
          songObj = songObj.transpose(transpose);
        }
        if (capo > 0) {
          songObj = songObj.setCapo(capo).transpose(-capo);
        }
      }
      return { 
        type: 'chordsheet', 
        html: renderChordSheetHtml(songObj),
        lyrics: cleanLyrics
      };
    }
    return { 
      type: 'fallback', 
      lyrics: cleanLyrics
    };
  }, [content, isLoading, viewMode, transpose, capo]);

  // Style variable for dynamic font sizing
  const contentStyle = {
    fontSize: `${fontSizeScale}rem`
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="empty-state">Loading song…</div>;
    }

    switch (viewMode) {
      case 'fullview':
        // Nicely formatted lyrics with chords above (chordsheetjs)
        if (rendered.type === 'chordsheet') {
          return <div className="chordsheet" style={contentStyle} dangerouslySetInnerHTML={{ __html: rendered.html }} />;
        }
        return <pre className="chords" style={contentStyle}>{content}</pre>;
      case 'chordpro':
        // Exact raw .chordpro file content
        return <pre className="chords chordpro-raw" style={contentStyle}>{content}</pre>;
      case 'chords':
        // Only chords, formatted for playing
        return <div className="chords-only" style={contentStyle} dangerouslySetInnerHTML={{ __html: renderChordsOnly(content) }} />;
      case 'lyrics':
      default:
        // Only lyrics, formatted for singing
        return <div className="chords lyrics-only" style={contentStyle}>{rendered.lyrics}</div>;
    }
  };

  const handleTranspose = (semitones) => {
    setTranspose(t => Math.max(-12, Math.min(12, t + semitones)));
  };

  const handleCapo = (delta) => {
    setCapo(c => Math.max(0, Math.min(8, c + delta)));
  };

  return (
    <div className={`song-detail ${darkMode ? 'dark' : ''}`}>
      <div className="top-controls">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="song-controls">
          <button 
            className={`control-button ${viewMode === 'fullview' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('fullview')}
          >
            FullView
          </button>
          <button 
            className={`control-button ${viewMode === 'lyrics' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('lyrics')}
          >
            Lyrics
          </button>
          <button 
            className={`control-button ${viewMode === 'chords' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('chords')}
          >
            Chords
          </button>
          <button 
            className={`control-button ${viewMode === 'chordpro' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('chordpro')}
          >
            ChordPro
          </button>
        </div>
        <div className="font-controls">
          <button className="font-button" onClick={decreaseFont} title="Decrease font size">−</button>
          <button className="font-button" onClick={resetFont} title="Reset font size">A</button>
          <button className="font-button" onClick={increaseFont} title="Increase font size">+</button>
          <button 
            className="font-button" 
            onClick={toggleDarkMode} 
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      {/* Transpose controls visible only in fullview mode */}
      {viewMode === 'fullview' && (
        <div className="transpose-controls">
          <div className="transpose-group">
            <label>Key:</label>
            <button onClick={() => handleTranspose(-1)}>-</button>
            <span className="transpose-value">{transpose > 0 ? `+${transpose}` : transpose}</span>
            <button onClick={() => handleTranspose(1)}>+</button>
          </div>
          <div className="transpose-group">
            <label>Capo:</label>
            <button onClick={() => handleCapo(-1)}>-</button>
            <span className="transpose-value">{capo}</span>
            <button onClick={() => handleCapo(1)}>+</button>
          </div>
        </div>
      )}
      
      {viewMode !== 'fullview' && <h2>{song.title}</h2>}
      {song.artist && <p className="artist">{song.artist}</p>}
      <div className={`song-content ${viewMode === 'fullview' && rendered.type === 'chordsheet' ? 'mode-flex' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
}
