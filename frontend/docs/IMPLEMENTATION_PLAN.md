# Frontend – plan implementacji

> Projekt treningowy. Wygląd i branding wzorowane na Qatar Airways – tylko do nauki, nie do publicznego wdrożenia.

## Założenia

- **`/frontend` to samodzielna aplikacja** z wydzieloną warstwą API w `src/api/`.
  - UI importuje wyłącznie z `src/api` – nigdy nie woła `fetch` bezpośrednio.
  - Na razie API obsługują mocki (MSW). Później: wyłączenie mocków + `VITE_API_URL` → backend py lub ts.
- **Wygląd Qatar Airways**: bordo `#5C0632` jako kolor główny, biel, szarości, dużo przestrzeni, elegancka typografia, duży hero na logowaniu. Nazwa, kolory i assety w jednym pliku konfiguracyjnym (`src/config/brand.ts`).
- **Logowanie (mock)**: `admin/admin` zawsze wpuszcza. Docelowo backend: hasła argon2id w Postgres, JWT w ciasteczku httpOnly.
- **Uruchamianie lokalne z konsoli** (bez Dockera na tym etapie): `npm run dev`.

## Assety marki (`public/brand/`)

| Plik | Co to | Rozmiar | Użycie |
|---|---|---|---|
| `logo-full.png` | Pełne logo: napis „QATAR AIRWAYS” + arabski + oryks, przezroczyste tło, przycięte | 1023×287 | header, strona logowania |
| `logo-wordmark.png` | Sam napis, bez oryksa, przezroczyste tło | 1347×459 | wąskie miejsca, gdzie oryks się nie zmieści |
| `logo-oryx.png` | Sam oryks (symbol), przezroczyste tło | 640×480 | favicon, avatar bota w czacie, sidebar mobile |

Kolory z logo: bordo `#5C0632`, szary napisu „AIRWAYS” ok. `#5C6670`.

## Stack

| Co | Wybór |
|---|---|
| Build / dev | Vite |
| UI | React + TypeScript |
| Routing | React Router |
| Style | Tailwind CSS |
| Stan sesji | Zustand |
| Mocki API | MSW (Mock Service Worker) |
| Testy unit/komponenty | Vitest + React Testing Library + MSW |
| Testy e2e | Playwright (etap 6) |

## Struktura

```
frontend/
├── docs/
├── public/
└── src/
    ├── api/            # warstwa API (osobny moduł)
    │   ├── types.ts    # kontrakt: User, Conversation, Message...
    │   ├── client.ts   # klient HTTP (credentials: include, błędy)
    │   ├── auth.ts
    │   ├── chat.ts
    │   └── mocks/      # handlery MSW
    ├── config/         # brand.ts, env
    ├── components/     # wspólne UI (Header, Footer, Button...)
    ├── features/
    │   ├── auth/       # LoginPage, store sesji, ProtectedRoute
    │   └── chat/       # ChatPage, MessageList, MessageInput, Sidebar, renderery wiadomości
    ├── App.tsx
    └── main.tsx
```

## Kontrakt API (wspólny dla backend_py i backend_ts)

```
GET    /api/health

POST   /api/auth/login                    { username, password } → { user }  (+ ciasteczko z tokenem)
POST   /api/auth/logout
GET    /api/auth/me                       → { user }

GET    /api/conversations                 → Conversation[]
POST   /api/conversations                 → Conversation
DELETE /api/conversations/:id
GET    /api/conversations/:id/messages    → Message[]
POST   /api/conversations/:id/messages    { content } → Message (odpowiedź agenta)
```

Wiadomość ma typ, żeby łatwo dodawać nowe rodzaje treści:

```ts
type Message = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "flight_card" /* | ... */;
  payload: unknown;
  createdAt: string;
};
```

Później: `POST /api/conversations/:id/messages/stream` (SSE) do odpowiedzi na żywo.

## Cykl pracy w każdym etapie

1. **Testy** – piszę testy opisujące wymagania (na start czerwone).
2. **Implementacja** – kod, aż testy przejdą.
3. **Weryfikacja** – `npm test` + `npm run build`.
4. **Akceptacja** – sprawdzasz w przeglądarce (`npm run dev`).
5. **Commit + push** – dopiero po akceptacji.

## Etapy

### Etap 0 – Setup
- **Testy:** smoke test – aplikacja się renderuje; `npm test` i `npm run build` przechodzą.
- **Funkcjonalność:** Vite + React + TS + Tailwind + Vitest + MSW, theme Qatar Airways (kolory, fonty), struktura folderów.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 1 – Warstwa API
- **Testy:** login ok / błędne dane, `me` zalogowany / niezalogowany, lista / tworzenie / usuwanie rozmów, wysłanie wiadomości zwraca odpowiedź bota, obsługa błędów HTTP.
- **Funkcjonalność:** `src/api/` – typy, klient HTTP, `auth.ts`, `chat.ts`, handlery MSW (`admin/admin`, bot na słowach kluczowych: lot, rezerwacja, bagaż, odprawa).
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push

### Etap 2 – Layout
- **Testy:** header z logo/nazwą i nawigacją, „Wyloguj” widoczne tylko po zalogowaniu, footer.
- **Funkcjonalność:** Header, Footer i layout strony w stylu Qatar Airways.
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push

### Etap 3 – Logowanie
- **Testy:** walidacja pustych pól, błędne dane → komunikat, `admin/admin` → `/chat`, wejście na `/chat` bez logowania → `/login`, wylogowanie → `/login`.
- **Funkcjonalność:** LoginPage z hero, store sesji (Zustand), ProtectedRoute.
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push

### Etap 4 – Czat
- **Testy:** wysłanie wiadomości → pojawia się w liście → odpowiedź bota; wskaźnik „pisze…”; Enter wysyła, Shift+Enter nowa linia; klik w szybką podpowiedź wysyła ją; renderowanie wiadomości wg `type` (nieznany typ → fallback).
- **Funkcjonalność:** ChatPage, MessageList (auto-scroll), MessageInput, szybkie podpowiedzi (Status lotu, Moja rezerwacja, Bagaż, Odprawa online), rejestr rendererów wiadomości.
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push

### Etap 5 – Rozmowy
- **Testy:** nowa rozmowa, lista rozmów, przełączanie między rozmowami, usuwanie.
- **Funkcjonalność:** Sidebar z historią rozmów.
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push

### Etap 6 – Dopracowanie
- **Testy:** e2e Playwright – logowanie → rozmowa → wylogowanie.
- **Funkcjonalność:** responsywność (mobile), puste stany, obsługa błędów (toast / komunikat).
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push
