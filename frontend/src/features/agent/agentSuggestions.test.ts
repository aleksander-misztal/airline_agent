import { suggestions as generalSuggestions } from "../chat/suggestions";
import { suggestionsFor } from "./agentSuggestions";

const labels = (pathname: string) => suggestionsFor(pathname).map((s) => s.label);

describe("suggestionsFor", () => {
  it("offers account suggestions on the dashboard", () => {
    expect(labels("/dashboard")).toEqual(["Saldo Avios", "Moje rezerwacje", "Status lotu", "Odprawa online"]);
  });

  it("offers booking suggestions on the flight search", () => {
    expect(labels("/flights")).toEqual(["Klasy podróży", "Bagaż w mojej klasie", "Zmiana daty", "Podróż z dzieckiem"]);
  });

  it("falls back to the general suggestions elsewhere", () => {
    expect(suggestionsFor("/cos-innego")).toEqual(generalSuggestions);
  });

  it("gives every suggestion a non-empty prompt", () => {
    for (const path of ["/dashboard", "/flights", "/x"]) {
      for (const { prompt } of suggestionsFor(path)) expect(prompt.trim().length).toBeGreaterThan(5);
    }
  });
});
