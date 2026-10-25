import { formatNumber } from "../../lib/format";
import type { FlightCardPayload, TextPayload } from "../types";
import { summary } from "./dashboard";

export type BotReply =
  | { type: "text"; payload: TextPayload }
  | { type: "flight_card"; payload: FlightCardPayload };

const text = (t: string): BotReply => ({ type: "text", payload: { text: t } });

// Prosty bot oparty o słowa kluczowe – do podmiany na prawdziwego agenta w backendzie.
export function botReply(content: string): BotReply {
  if (/avios|punkt/i.test(content)) {
    return text(`Na Twoim koncie jest ${formatNumber(summary.avios)} Avios. Punkty możesz wymienić na loty i ulepszenia klasy.`);
  }
  if (/klas/i.test(content)) {
    return text(
      "Economy – podstawowy komfort i 30 kg bagażu rejestrowanego. Business – leżące fotele i dostęp do salonu. First – prywatna przestrzeń i najwyższy poziom obsługi.",
    );
  }
  if (/(zmie|zmian).*\bdat|\bdat.*(zmie|zmian)/i.test(content)) {
    return text("Datę lotu możesz zmienić do 24 godzin przed odlotem. Opłata zależy od taryfy.");
  }
  if (/dziec|niemowl/i.test(content)) {
    return text("Dzieci w wieku 2–11 lat mają własne miejsce, a niemowlęta (do 2 lat) podróżują na kolanach dorosłego.");
  }
  if (/\b(lot|lotu|lotów|status)/i.test(content)) {
    const flightNumber = content.match(/\b([A-Z]{2}\d{2,4})\b/i)?.[1].toUpperCase() ?? "QR123";
    return {
      type: "flight_card",
      payload: {
        flightNumber,
        from: "Warszawa (WAW)",
        to: "Doha (DOH)",
        departure: "2026-11-02T14:35:00+01:00",
        arrival: "2026-11-02T22:50:00+03:00",
        status: "Planowy",
        gate: "B12",
      },
    };
  }
  if (/bagaż|bagaz/i.test(content)) {
    return text("Bagaż podręczny: do 7 kg. Bagaż rejestrowany: 30 kg w klasie Economy, 40 kg w Business.");
  }
  if (/rezerwac/i.test(content)) {
    return text("Rezerwację możesz zmienić do 24 godzin przed odlotem. Podaj numer rezerwacji, a pomogę w zmianie.");
  }
  if (/odpraw/i.test(content)) {
    return text("Odprawa online otwiera się 48 godzin przed odlotem i zamyka 90 minut przed startem.");
  }
  return text("Jestem wirtualnym asystentem Qatar Airways. Zapytaj o status lotu, rezerwację, bagaż lub odprawę online.");
}
