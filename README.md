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

Aplikacja wspiera dwie metody dodawania piosenek:

1) Przez przeglądarkę (localStorage)

Otwórz konsolę przeglądarki (F12) i wykonaj:

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

2) Przez pliki w katalogu `songs/` (polecane do publikacji)

- Dodaj pliki `.chordpro` do folderu `songs/` w repozytorium (np. `songs/moj_utwor.chordpro`).
- Wygeneruj manifest `songs/index.json`, którego używa aplikacja do listowania utworów.

Przykładowe polecenia do wygenerowania manifestu:

PowerShell (Windows, uruchom w katalogu repo):

```powershell
$files = Get-ChildItem .\songs -Filter *.chordpro | ForEach-Object -Begin {$i=1} -Process { $obj = @{ id = $i; filename = $_.Name; title = ($_.BaseName -replace '_',' '); artist = '' }; $i++; $obj }
$files | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 songs\index.json
```

Node.js (jeśli masz zainstalowane Node):

```bash
node -e "const fs=require('fs'); const files=fs.readdirSync('songs').filter(f=>f.endsWith('.chordpro')); const arr=files.map((f,i)=>({id:i+1,filename:f,title:f.replace(/_/g,' ').replace(/\.chordpro$/i,'')})); fs.writeFileSync('songs/index.json',JSON.stringify(arr,null,2));"
```

- Po wygenerowaniu manifestu odśwież stronę — lista piosenek załaduje się automatycznie.
- Możesz także edytować `songs/index.json` ręcznie, aby dodać tytuły/artystów.

Jeśli chcesz, mogę dodać prosty skrypt `scripts/generate-manifest.ps1` aby to zautomatyzować.

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