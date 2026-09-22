import React, { useEffect, useId, useMemo, useState } from 'react';
import { renderChordsOnly, renderLyricsOnlyHtml, parseAndRenderChordPro, renderChordSheetHtml, renderSongChords } from '../utils/chordpro.js';
import { boundedNumber, readPreference, writePreference } from '../utils/preferences.js';

export default function SongDetail({ song, content, isLoading = content === null, error = '', viewMode, onSetViewMode, onBack, onRetry }) {
  const preferenceKey = `songSettings:${song.filename || song.title}`;
  const [saved] = useState(() => readPreference(preferenceKey, {}) || {});
  const [fontSizeScale, setFontSizeScale] = useState(() => boundedNumber(saved.fontSizeScale, 1, 0.6, 2.5));
  const [transpose, setTranspose] = useState(() => Math.round(boundedNumber(saved.transpose, 0, -12, 12)));
  const [capo, setCapo] = useState(() => Math.round(boundedNumber(saved.capo, 0, 0, 8)));
  const [darkMode, setDarkMode] = useState(() => [true, 1].includes(readPreference('songDarkMode', false)));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsId = useId();
  const [displaySettingsOpen, setDisplaySettingsOpen] = useState(false);
  const displaySettingsId = useId();

  useEffect(() => {
    if (!displaySettingsOpen) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(displaySettingsId)?.scrollIntoView?.({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [displaySettingsOpen, displaySettingsId]);

  useEffect(() => {
    writePreference(preferenceKey, { fontSizeScale, transpose, capo });
  }, [preferenceKey, fontSizeScale, transpose, capo]);

  useEffect(() => { writePreference('songDarkMode', darkMode); }, [darkMode]);

  const increaseFont = () => setFontSizeScale(s => Math.min(2.5, s + 0.1));
  const decreaseFont = () => setFontSizeScale(s => Math.max(0.6, s - 0.1));
  const resetFont = () => setFontSizeScale(1);

  const toggleDarkMode = () => {
    setDarkMode(d => !d);
  };

  const parsedSong = useMemo(() => parseAndRenderChordPro(content), [content]);
  const lyricsHtml = useMemo(() => renderLyricsOnlyHtml(content), [content]);

  // Both playable views use the same transformed song.
  const rendered = useMemo(() => {
    if (isLoading) return { html: '' };
    if (parsedSong) {
      const soundingSong = parsedSong.transpose(transpose);
      const shapesSong = soundingSong.setCapo(capo).transpose(-capo);
      const html = renderChordSheetHtml(shapesSong);
      return {
        type: html ? 'chordsheet' : 'fallback',
        html,
        chordsHtml: renderSongChords(shapesSong),
        soundingKey: soundingSong.key?.toString(),
        shapesKey: shapesSong.key?.toString()
      };
    }
    return { type: 'fallback', chordsHtml: renderChordsOnly(content) };
  }, [parsedSong, content, isLoading, transpose, capo]);

  const contentStyle = {
    '--song-font-scale': String(fontSizeScale)
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="empty-state">Loading song…</div>;
    }

    if (error) {
      return <div className="empty-state" role="alert"><p>{error}</p><button className="control-button" onClick={onRetry}>Try again</button></div>;
    }

    switch (viewMode) {
      case 'fullview':
        // Nicely formatted lyrics with chords above (chordsheetjs)
        if (rendered.type === 'chordsheet') {
          return <div className="chordsheet" dangerouslySetInnerHTML={{ __html: rendered.html }} />;
        }
        return <pre className="chords">{content}</pre>;
      case 'chordpro':
        // Exact raw .chordpro file content
        return <pre className="chords chordpro-raw">{content}</pre>;
      case 'chords':
        // Only chords, formatted for playing
        return <div className="chords-only" dangerouslySetInnerHTML={{ __html: rendered.chordsHtml }} />;
      case 'lyrics':
      default:
        // Only lyrics, formatted for singing
        return <div className="chords lyrics-only" dangerouslySetInnerHTML={{ __html: lyricsHtml }} />;
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
      <div className="song-toolbar">
        <button className="back-button" aria-label="Back to songs" onClick={onBack}>←</button>
        <div className="song-heading">
          <h2>{song.title}</h2>
          {song.artist && <p className="artist">{song.artist}</p>}
        </div>
        <button className="control-button" aria-expanded={displaySettingsOpen} aria-controls={displaySettingsId} onClick={() => setDisplaySettingsOpen(open => !open)}>Settings</button>
      </div>
      <div className="top-controls">
        <div className="song-controls">
          <button 
            className={`control-button ${viewMode === 'fullview' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('fullview')}
            aria-pressed={viewMode === 'fullview'}
          >
            Lyrics + chords
          </button>
          <button 
            className={`control-button ${viewMode === 'lyrics' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('lyrics')}
            aria-pressed={viewMode === 'lyrics'}
          >
            Lyrics
          </button>
        </div>
      </div>
      <div className="display-settings" id={displaySettingsId} hidden={!displaySettingsOpen}>
        <div className="song-controls" role="group" aria-label="Additional song views">
          <button 
            className={`control-button ${viewMode === 'chords' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('chords')}
            aria-pressed={viewMode === 'chords'}
          >
            Chords
          </button>
          <button 
            className={`control-button ${viewMode === 'chordpro' ? 'active' : ''}`} 
            onClick={() => onSetViewMode('chordpro')}
            aria-pressed={viewMode === 'chordpro'}
          >
            ChordPro
          </button>
        </div>
        <div className="font-controls" role="group" aria-label="Text size and appearance">
          <button className="font-button" onClick={decreaseFont} title="Decrease font size" aria-label="Decrease font size" disabled={fontSizeScale <= 0.6}>−</button>
          <button className="font-button" onClick={resetFont} title="Reset font size" aria-label="Reset font size">A</button>
          <button className="font-button" onClick={increaseFont} title="Increase font size" aria-label="Increase font size" disabled={fontSizeScale >= 2.5}>+</button>
          <button 
            className="font-button" 
            onClick={toggleDarkMode} 
            title={darkMode ? 'Light mode' : 'Dark mode'}
            aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            aria-pressed={darkMode}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      {(viewMode === 'fullview' || viewMode === 'chords') && !isLoading && !error && parsedSong && (
        <div className="transpose-settings">
          <button
            type="button"
            className="control-button transpose-toggle"
            aria-expanded={settingsOpen}
            aria-controls={settingsId}
            aria-label="Key & capo"
            onClick={() => setSettingsOpen(open => !open)}
          >
            Key &amp; capo · {rendered.soundingKey || 'Unknown'} · capo {capo} <span aria-hidden="true">{settingsOpen ? '▴' : '▾'}</span>
          </button>
          <div id={settingsId} className="transpose-controls" hidden={!settingsOpen}>
          <div className="transpose-group">
            <span>Sounding key:</span>
            <button aria-label="Transpose down" disabled={transpose <= -12} onClick={() => handleTranspose(-1)}>-</button>
            <span className="transpose-value" aria-live="polite">{rendered.soundingKey || 'Unknown'} ({transpose > 0 ? `+${transpose}` : transpose})</span>
            <button aria-label="Transpose up" disabled={transpose >= 12} onClick={() => handleTranspose(1)}>+</button>
          </div>
          <div className="transpose-group">
            <span>Capo:</span>
            <button aria-label="Decrease capo" disabled={capo <= 0} onClick={() => handleCapo(-1)}>-</button>
            <span className="transpose-value" aria-live="polite">{capo}</span>
            <button aria-label="Increase capo" disabled={capo >= 8} onClick={() => handleCapo(1)}>+</button>
          </div>
          <span>Chord shapes: {rendered.shapesKey || 'Unknown'}</span>
          </div>
        </div>
      )}
      
      <div
        className={`song-content ${viewMode === 'fullview' && rendered.type === 'chordsheet' ? 'mode-flex' : ''}`}
        style={contentStyle}
      >
        {renderContent()}
      </div>
    </div>
  );
}
