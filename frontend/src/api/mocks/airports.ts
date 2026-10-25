import type { Airport } from "../types";

// Kolejność = popularność (dla pustej frazy i przy remisach).
export const airports: Airport[] = [
  { code: "WAW", city: "Warszawa", country: "Polska", name: "Warsaw Chopin Airport" },
  { code: "DOH", city: "Doha", country: "Katar", name: "Hamad International Airport" },
  { code: "KRK", city: "Kraków", country: "Polska", name: "John Paul II International Airport Kraków-Balice" },
  { code: "DXB", city: "Dubaj", country: "Zjednoczone Emiraty Arabskie", name: "Dubai International Airport" },
  { code: "LHR", city: "Londyn", country: "Wielka Brytania", name: "Heathrow Airport" },
  { code: "FRA", city: "Frankfurt", country: "Niemcy", name: "Frankfurt Airport" },
  { code: "CDG", city: "Paryż", country: "Francja", name: "Charles de Gaulle Airport" },
  { code: "JFK", city: "Nowy Jork", country: "USA", name: "John F. Kennedy International Airport" },
  { code: "BKK", city: "Bangkok", country: "Tajlandia", name: "Suvarnabhumi Airport" },
  { code: "SIN", city: "Singapur", country: "Singapur", name: "Changi Airport" },
  { code: "GDN", city: "Gdańsk", country: "Polska", name: "Lech Wałęsa Airport" },
  { code: "KTW", city: "Katowice", country: "Polska", name: "Katowice Airport" },
  { code: "WRO", city: "Wrocław", country: "Polska", name: "Copernicus Airport" },
  { code: "POZ", city: "Poznań", country: "Polska", name: "Ławica Airport" },
  { code: "AMS", city: "Amsterdam", country: "Holandia", name: "Schiphol Airport" },
  { code: "IST", city: "Stambuł", country: "Turcja", name: "Istanbul Airport" },
  { code: "DEL", city: "Delhi", country: "Indie", name: "Indira Gandhi International Airport" },
  { code: "SYD", city: "Sydney", country: "Australia", name: "Kingsford Smith Airport" },
  { code: "NBO", city: "Nairobi", country: "Kenia", name: "Jomo Kenyatta International Airport" },
  { code: "JNB", city: "Johannesburg", country: "RPA", name: "O. R. Tambo International Airport" },
  { code: "CPT", city: "Kapsztad", country: "RPA", name: "Cape Town International Airport" },
  { code: "MLE", city: "Male", country: "Malediwy", name: "Velana International Airport" },
];

const LIMIT = 8;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/ł/g, "l");

// 0 = dokładny kod, 1 = początek kodu, 2 = początek miasta, 3 = początek nazwy, 4 = fraza w środku
function rank(airport: Airport, q: string): number | null {
  const code = normalize(airport.code);
  const city = normalize(airport.city);
  const name = normalize(airport.name);
  if (code === q) return 0;
  if (code.startsWith(q)) return 1;
  if (city.startsWith(q)) return 2;
  if (name.startsWith(q)) return 3;
  if ([city, name, normalize(airport.country)].some((field) => field.includes(q))) return 4;
  return null;
}

export function searchAirports(query: string): Airport[] {
  const q = normalize(query.trim());
  if (!q) return airports.slice(0, LIMIT);

  return airports
    .map((airport, index) => ({ airport, index, score: rank(airport, q) }))
    .filter((match): match is { airport: Airport; index: number; score: number } => match.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, LIMIT)
    .map((match) => match.airport);
}
