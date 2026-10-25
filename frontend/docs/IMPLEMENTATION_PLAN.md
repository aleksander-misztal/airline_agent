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

GET    /api/dashboard                     → { avios, milesFlown, flightsTaken, upcomingBookings[] }

GET    /api/airports?q=                   → Airport[]  (podpowiedzi lotnisk po mieście, kodzie lub nazwie)
GET    /api/flights/search                → { outbound: FlightOffer[], inbound: FlightOffer[] | null }
       ?from&to&departureDate&returnDate?&adults&children&infants&cabin
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
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 2 – Layout
- **Testy:** header z logo/nazwą i nawigacją, „Wyloguj” widoczne tylko po zalogowaniu, footer.
- **Funkcjonalność:** Header, Footer i layout strony w stylu Qatar Airways.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 3 – Logowanie
- **Testy:** walidacja pustych pól, błędne dane → komunikat, `admin/admin` → `/chat`, wejście na `/chat` bez logowania → `/login`, wylogowanie → `/login`.
- **Funkcjonalność:** LoginPage z hero, store sesji (Zustand), ProtectedRoute.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 4 – Czat
- **Testy:** wysłanie wiadomości → pojawia się w liście → odpowiedź bota; wskaźnik „pisze…”; Enter wysyła, Shift+Enter nowa linia; klik w szybką podpowiedź wysyła ją; renderowanie wiadomości wg `type` (nieznany typ → fallback).
- **Funkcjonalność:** ChatPage, MessageList (auto-scroll), MessageInput, szybkie podpowiedzi (Status lotu, Moja rezerwacja, Bagaż, Odprawa online), rejestr rendererów wiadomości.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 5 – Rozmowy
- **Testy:** nowa rozmowa, lista rozmów, przełączanie między rozmowami, usuwanie.
- **Funkcjonalność:** Sidebar z historią rozmów.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 6 – Dopracowanie
- **Testy:** e2e Playwright – logowanie → rozmowa → wylogowanie.
- **Funkcjonalność:** responsywność (mobile), puste stany, obsługa błędów: brak połączenia z serwerem, wygaśnięcie sesji (401 → ekran logowania z komunikatem), zamykanie komunikatów, ErrorBoundary na awarie renderowania.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

## Dodatkowe wymagania (po etapie 6)

Nowa strona **Dashboard** z zakładkami **Dashboard** i **Asystent** oraz popup z agentem na Dashboardzie.

### Założenia
- Po zalogowaniu użytkownik trafia na **`/dashboard`** (wcześniej `/chat`). Zakładka „Asystent” prowadzi do istniejącego czatu pod `/chat` (adres się nie zmienia, żeby nie ruszać reszty).
- Dashboard ma **kafelki**: saldo **Avios** (punkty milowe, widoczne też w pasku górnym na każdej stronie), **przebyte mile**, **liczba odbytych lotów**, **nadchodzące rezerwacje** i **przekierowanie do wyszukiwarki lotów** (zewnętrzny link w nowej karcie, adres w `config/brand.ts`).
- Dane kafelków pochodzą z nowego endpointu `GET /api/dashboard` (na razie mock MSW), ten sam kontrakt dla backend_py i backend_ts. Jeden store zasila kafelki i pasek górny.
- Popup z agentem jest dostępny na **Dashboardzie i w Wyszukiwarce lotów** (nie na stronie Asystent, gdzie jest pełny czat). Na każdej z tych stron ma własne, pasujące do niej podpowiedzi.
- Kafelek „Wyszukiwarka lotów” na Dashboardzie prowadzi teraz do **wewnętrznej zakładki Wyszukaj loty**, a nie do zewnętrznej strony.
- Popup i strona Asystent współdzielą **ten sam store rozmów** i to samo API, więc rozmowa z popupu jest zwykłą rozmową z historii.
- Zachowanie popupu: pierwsze otwarcie na danej wizycie na Dashboardzie zaczyna **nową rozmowę**. Zamknięcie i ponowne otwarcie kontynuuje ją. Przycisk „Nowa rozmowa” w popupie zaczyna kolejną. Po przejściu do zakładki Asystent ta rozmowa jest otwarta i widoczna na liście rozmów.

### Etap 7 – Nawigacja i Dashboard
- **Testy:**
  - API: `GET /api/dashboard` zwraca saldo, mile, loty i rezerwacje; bez sesji 401.
  - Store: ładowanie, stan błędu, reset po wylogowaniu.
  - Header: zakładki Dashboard / Asystent tylko po zalogowaniu, aktywna zakładka oznaczona (`aria-current`), saldo Avios przy użytkowniku (ukryte bez logowania i do czasu załadowania).
  - Dashboard: powitanie z imieniem; kafelki Avios, Przebyte mile, Odbyte loty; lista nadchodzących rezerwacji i stan pusty; link do wyszukiwarki lotów (nowa karta, `noopener`); stan ładowania i błędu z „Spróbuj ponownie”.
  - Routing: logowanie → `/dashboard`, nieznany adres → `/dashboard`, `/dashboard` chroniony, przełączanie zakładek, Avios w pasku także na Asystencie, wygaśnięcie sesji przy 401 z `/api/dashboard`.
  - e2e: kafelki, pasek, zakładki, link; zakładki bez poziomego przewijania na telefonie.
- **Funkcjonalność:** `dashboardApi` + mock, `dashboardStore`, `DashboardPage` z kafelkami, `Header` z zakładkami i saldem Avios, trasa `/dashboard`, aktualizacja przekierowań i istniejących testów.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 8 – Wyszukiwarka lotów: zakładka i formularz
- **Zakres formularza:** rodzaj podróży (w obie strony / w jedną stronę), lotnisko wylotu i przylotu z podpowiedziami (po mieście, kodzie lub nazwie) i przyciskiem zamiany miejscami, data wylotu i powrotu, pasażerowie (dorośli, dzieci 2–11, niemowlęta do 2 lat), klasa podróży (Economy / Business / First). Poza zakresem na razie: loty wieloetapowe (multi-city), płatność Avios, rezerwacja i płatność.
- **Walidacja:** wylot i przylot wymagane i różne; data wylotu nie w przeszłości; powrót nie wcześniej niż wylot (przy podróży w obie strony); co najmniej 1 dorosły, razem maks. 9 pasażerów, niemowląt nie więcej niż dorosłych.
- **Testy:**
  - API: `GET /api/airports?q=` filtruje po mieście, kodzie i nazwie (bez rozróżniania wielkości liter i polskich znaków); bez sesji 401.
  - Formularz: pola i etykiety, ukrycie daty powrotu przy podróży w jedną stronę, podpowiedzi lotnisk (klawiatura i mysz), zamiana miejscami, liczniki pasażerów z granicami, każdy komunikat walidacji, poprawne wysłanie przekazuje komplet danych.
  - Routing i nawigacja: zakładka „Wyszukaj loty” (`/flights`) w pasku, chroniona; kafelek na Dashboardzie prowadzi do zakładki zamiast do zewnętrznej strony.
  - e2e: wypełnienie formularza z podpowiedzią lotniska; formularz mieści się na telefonie.
- **Funkcjonalność:** `airportsApi` + mock, `FlightSearchPage` z formularzem i komponentem wyboru lotniska, trasa `/flights`, zakładka w `Header`, przepięcie kafelka; usunięcie `flightSearchUrl` z konfiguracji.
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 9 – Popup z agentem (wszystkie widoki poza Asystentem)
- **Zakres:** okrągła ikona agenta (oryks) w prawym dolnym rogu **każdego widoku po zalogowaniu poza zakładką Asystent** (Dashboard, Wyszukaj loty i kolejne). Klik otwiera mały czat w oknie; na telefonie okno zajmuje cały ekran. Okno ma nagłówek z przyciskami „Nowa rozmowa” i „Zamknij asystenta”. Podpowiedzi zależą od widoku (Dashboard: saldo Avios, rezerwacje; wyszukiwarka: klasy podróży, bagaż, zmiana daty, podróż z dzieckiem).
- **Rozmowa:** pierwsze otwarcie po wejściu z zakładki Asystent zaczyna **nową rozmowę**. Zamknięcie i ponowne otwarcie, także po zmianie widoku (Dashboard ↔ Wyszukaj loty), kontynuuje ją. Rozmowa z okna jest zwykłą rozmową z historii: po przejściu do zakładki Asystent jest na liście i otwarta.
- **Testy:** ikona widoczna na Dashboardzie i w wyszukiwarce, ukryta na stronie Asystent i bez logowania; klik otwiera dialog „Asystent” z ekranem powitalnym, podpowiedziami dla widoku i fokusem w polu; wysłanie wiadomości (odpowiedź, karta lotu, błąd z zamknięciem komunikatu); pierwsze otwarcie nie dziedziczy rozmowy otwartej w zakładce Asystent; zamknięcie i ponowne otwarcie kontynuuje; „Nowa rozmowa” zaczyna kolejną; Esc zamyka, a fokus wraca na ikonę; rozmowa z okna jest na liście w zakładce Asystent i otwarta; nowe odpowiedzi bota (Avios, klasy, zmiana daty, dzieci); e2e na desktopie i telefonie (pełny ekran, brak poziomego przewijania).
- **Funkcjonalność:** `AgentLauncher` (ikona + okno), `ChatPanel` wyciągnięty z `ChatPage` i używany w obu miejscach, podpowiedzi per widok, animacja wejścia okna (z poszanowaniem „reduce motion”).
- [x] testy · [x] implementacja · [x] akceptacja · [x] push

### Etap 10 – Wyszukiwarka lotów: wyniki
- **Zakres:** lista ofert dla wylotu i (przy podróży w obie strony) osobno dla powrotu; w ofercie: numer lotu, godziny, czas lotu, przesiadki, cena za całą grupę w wybranej klasie; sortowanie (cena, czas lotu, godzina wylotu); filtr „tylko bezpośrednie”; wybór oferty i podsumowanie z ceną łączną (bez dalszej rezerwacji); stany: ładowanie, brak wyników, błąd z ponowieniem.
- **Testy:** `GET /api/flights/search` (kontrakt, ceny dla klas i liczby pasażerów, loty powrotne tylko przy dacie powrotu, 400 dla błędnych danych, 401 bez sesji); lista i sortowanie; filtr; wybór i suma; stany pustych wyników i błędu; e2e: wyszukanie, sortowanie, wybór lotu tam i z powrotem; wyniki na telefonie bez poziomego przewijania.
- **Funkcjonalność:** `flightsApi` + mock (deterministyczne oferty), `flightSearchStore`, komponenty wyników, podsumowanie wyboru.
- [ ] testy · [ ] implementacja · [ ] akceptacja · [ ] push
