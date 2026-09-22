# MSongbook

Śpiewnik React/Vite z plikami ChordPro, wyszukiwaniem, transpozycją i capo.

## Uruchomienie

Wymagany Node.js 24 i npm.

```sh
npm ci
npm run dev
```

## Dodawanie piosenek

Dodaj plik `.chordpro`, `.cho` lub `.crd` do `public/songs/`, np.:

```text
{title: My Song}
{artist: My Artist}
{key: G}
{genres: Folk}
{tags: acoustic, singalong}
{speed: slow}

[G]First line [C]of the song
```

Uruchom `npm run generate:index`, aby odświeżyć katalog podczas pracy lokalnej.
`npm run build` generuje indeks automatycznie. Nie edytuj indeksu ręcznie.
Nie dopisuj nieznanych metadanych: brak tonacji jest pokazywany jako `Unknown`.

## Korzystanie

- Na telefonie nagłówek piosenki z powrotem i przyciskiem `Settings` pozostaje dostępny podczas przewijania. `Settings` rozwija wielkość tekstu, tryb ciemny oraz dodatkowe widoki Chords i ChordPro.
- `Key & capo` pokazuje aktualną tonację i capo; przyciski zmiany są domyślnie zwinięte.
- Link w postaci `/#/song/nazwa.chordpro` otwiera konkretną piosenkę; działa też odświeżanie i historia przeglądarki.
- Powrót do listy zachowuje wyszukiwanie i pozycję przewijania w bieżącej sesji.
- FullView i Chords pokazują te same przeliczone akordy. ChordPro pokazuje oryginalny plik.
- Sounding key to tonacja brzmienia; Chord shapes to tonacja chwytów po uwzględnieniu capo.
- Tonacja, capo i wielkość tekstu są zapamiętywane osobno dla piosenki w tej przeglądarce. Tryb ciemny i wyszukiwanie są wspólne.
- Jeśli zapis lokalny jest niedostępny, aplikacja nadal działa bez zapamiętywania ustawień.

## Weryfikacja i publikacja

```sh
npm test
npm run build
npm run preview
```

GitHub Actions sprawdza testy i build dla pull requestów. Push na `main` buduje i publikuje artefakt `dist` przez GitHub Pages.
W ustawieniach repozytorium Pages jako źródło wybierz **GitHub Actions**.
Publikowany jest wynik buildu, a nie źródłowy `index.html`; nie potrzeba przekierowania do `/dist/`.

Historyczne pliki `dist` znajdujące się już w Git pozostają śledzone mimo `.gitignore`.
Źródłem zmian są `src/` i `public/`; katalog `mtunebook-publish/` nie jest używany przez workflow.
