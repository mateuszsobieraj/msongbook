# 🎵 mSongbook - Twój Osobisty Śpiewnik

Prosta i piękna aplikacja webowa do zarządzania swoim śpiewnikiem z piosenkami w formacie ChordPro.

## Funkcje

✨ **Główne możliwości:**
- 🔍 Wyszukiwanie piosenek po tytule i artyście
- 📝 Wyświetlanie tekstu z akordami
- 💾 Przechowywanie danych w przeglądarce (localStorage)
- 📱 Responsywny design
- 🎨 Piękny interfejs z gradientem

## Jak zacząć?

1. **Otwórz plik `index.html` w przeglądarce** (po prostu dwuklik)
2. Strona będzie działać bez potrzeby instalacji czegokolwiek!

## Jak dodać piosenki?

Piosenki przechowywane są w formacie JSON w `localStorage`. Aby dodać nowe piosenki, otwórz konsolę przeglądarki (F12) i wykonaj:

```javascript
// Załaduj istniejące piosenki
const songs = JSON.parse(localStorage.getItem('songs')) || [];

// Dodaj nową piosenkę
songs.push({
  id: Date.now(),
  title: 'Tytuł piosenki',
  artist: 'Artysta',
  chords: `[D]Tekst [A]piosenki
[G]Z akordami [D]w formacie ChordPro`
});

// Zapisz z powrotem
localStorage.setItem('songs', JSON.stringify(songs));

// Odśwież stronę
location.reload();
```

## Format ChordPro

Piosenki w aplikacji używają formatu ChordPro:

```
[D]Pierwszy wers piosenki
[A]Drugi wers
[G]Z akordami w [D]nawiasach

Chorus:
[Em]Refren [Am]piosenki
[D]Wszyscy [G]śpiewają
```

## Struktura piosenki

```json
{
  "id": 1,
  "title": "Nazwa piosenki",
  "artist": "Artysta",
  "chords": "[D]Tekst [A]z akordami"
}
```

## Plany na przyszłość

- 📲 Edycja piosenek w interfejsie
- 💾 Export/import piosenek (JSON)
- 🎵 Ustawienia transpozycji akordów
- 📚 Ulubione piosenki
- 🌙 Dark mode
- 🎤 Wyświetlanie na wielkich ekranach

## Technologia

- HTML5
- CSS3 (bez frameworków!)
- Vanilla JavaScript
- localStorage (brak backendu wymagany)

---

Stworzony z ❤️ dla wszystkich, którzy kochają śpiewać!