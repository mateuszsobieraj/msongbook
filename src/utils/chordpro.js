import ChordSheetJS from 'chordsheetjs';

export function parseChordPro(text) {
  if (!text) return '';
  // Remove ChordPro directives in braces {meta: ...} and chords in brackets [C], [G7] etc.
  let t = text.replace(/\{[^}]*\}/g, '');
  t = t.replace(/\[[^\]]*\]/g, '');
  // Normalize newlines and remove excessive empty lines
  t = t.replace(/\r/g, '');
  t = t.replace(/\n{3,}/g, '\n\n');
  // Trim trailing whitespace on lines and overall
  t = t.split('\n').map(l => l.replace(/\s+$/g, '')).join('\n');
  return t.trim();
}

export function renderChordsOnly(rawText) {
  if (!rawText) return '';
  
  const lines = rawText.replace(/\r/g, '').split('\n');
  const out = lines.map(line => {
    const matches = [];
    let m;
    const re = /\[([^\]]+)\]/g;
    while ((m = re.exec(line)) !== null) {
      matches.push(m[1].trim());
    }
    return matches.join(' ');
  });
  
  // Strip leading empty chord lines
  let firstNonEmpty = 0;
  while (firstNonEmpty < out.length && out[firstNonEmpty].trim() === '') firstNonEmpty++;
  const trimmed = out.slice(firstNonEmpty);
  
  if (trimmed.length === 0) {
    return '<div class="chords-only-line empty"></div>';
  }
  
  // Return HTML string as in vanilla version
  return trimmed.map(l => 
    l ? `<div class="chords-only-line">${escapeHtml(l)}</div>` : '<div class="chords-only-line empty"></div>'
  ).join('');
}

// Parse ChordPro text to chordsheetjs Song object
export function parseAndRenderChordPro(chordProText) {
  if (!chordProText) return null;
  try {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(chordProText);
    return song;
  } catch (error) {
    console.error('parsing chordPro error:', error);
    return null;
  }
}

// Render Song object to HTML string using chordsheetjs DivFormatter (responsive layout)
export function renderChordSheetHtml(song) {
  if (!song) return '';
  try {
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    return formatter.format(song);
  } catch (error) {
    console.error('render error:', error);
    return '';
  }
}

// Returns CSS needed for HtmlDivFormatter output, scoped to .chordsheet
export function getChordSheetCss() {
  const formatter = new ChordSheetJS.HtmlDivFormatter();
  return formatter.cssString('.chordsheet ');
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
