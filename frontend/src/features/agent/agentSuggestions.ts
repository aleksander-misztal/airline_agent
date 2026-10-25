import { suggestions as generalSuggestions, type Suggestion } from "../chat/suggestions";

const dashboardSuggestions: Suggestion[] = [
  { label: "Saldo Avios", prompt: "Ile mam punktów Avios?" },
  { label: "Moje rezerwacje", prompt: "Chcę sprawdzić moją rezerwację" },
  { label: "Status lotu", prompt: "Jaki jest status mojego lotu QR123?" },
  { label: "Odprawa online", prompt: "Jak zrobić odprawę online?" },
];

const flightSearchSuggestions: Suggestion[] = [
  { label: "Klasy podróży", prompt: "Czym różnią się klasy Economy, Business i First?" },
  { label: "Bagaż w mojej klasie", prompt: "Ile bagażu mogę zabrać?" },
  { label: "Zmiana daty", prompt: "Czy mogę zmienić datę lotu?" },
  { label: "Podróż z dzieckiem", prompt: "Jak podróżować z dzieckiem lub niemowlęciem?" },
];

/** Podpowiedzi w oknie asystenta dopasowane do widoku, na którym użytkownik jest. */
export function suggestionsFor(pathname: string): Suggestion[] {
  if (pathname.startsWith("/dashboard")) return dashboardSuggestions;
  if (pathname.startsWith("/flights")) return flightSearchSuggestions;
  return generalSuggestions;
}
