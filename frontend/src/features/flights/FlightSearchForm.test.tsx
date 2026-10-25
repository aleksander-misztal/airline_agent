import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authApi } from "../../api";
import { FlightSearchForm } from "./FlightSearchForm";

const TODAY = "2026-11-01";

beforeEach(async () => {
  await authApi.login("admin", "admin");
});

function setup() {
  const onSearch = vi.fn();
  render(<FlightSearchForm today={TODAY} onSearch={onSearch} />);
  return onSearch;
}

const airportBox = (label: string) => screen.getByRole("combobox", { name: label });
// Tylko opcje listy lotnisk (lista klas podróży też ma elementy o roli "option").
const suggestions = () => within(screen.getByRole("listbox")).getAllByRole("option");

async function pickAirport(label: string, query: string, optionName: RegExp) {
  await userEvent.click(airportBox(label));
  await userEvent.type(airportBox(label), query);
  await userEvent.click(await screen.findByRole("option", { name: optionName }));
}

const setDate = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => userEvent.click(screen.getByRole("button", { name: "Szukaj lotów" }));

const group = (name: string) => within(screen.getByRole("group", { name }));
const more = (name: string) => screen.getByRole("button", { name: `Więcej: ${name}` });
const less = (name: string) => screen.getByRole("button", { name: `Mniej: ${name}` });
async function clickTimes(button: HTMLElement, times: number) {
  for (let i = 0; i < times; i += 1) await userEvent.click(button);
}

async function fillValidRoundTrip() {
  await pickAirport("Skąd", "war", /Warszawa/);
  await pickAirport("Dokąd", "doh", /Doha/);
  setDate("Data wylotu", "2026-11-10");
  setDate("Data powrotu", "2026-11-20");
}

describe("FlightSearchForm – fields", () => {
  it("renders the defaults", () => {
    setup();

    expect(screen.getByRole("radio", { name: "W obie strony" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "W jedną stronę" })).not.toBeChecked();
    expect(group("Dorośli").getByText("1")).toBeInTheDocument();
    expect(group("Dzieci").getByText("0")).toBeInTheDocument();
    expect(group("Niemowlęta").getByText("0")).toBeInTheDocument();
    expect(screen.getByLabelText("Klasa podróży")).toHaveValue("economy");
    expect(screen.getByRole("button", { name: "Szukaj lotów" })).toBeEnabled();
  });

  it("hides the return date for a one-way trip and brings it back", async () => {
    setup();
    expect(screen.getByLabelText("Data powrotu")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "W jedną stronę" }));
    expect(screen.queryByLabelText("Data powrotu")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "W obie strony" }));
    expect(screen.getByLabelText("Data powrotu")).toBeInTheDocument();
  });

  it("does not allow dates before today, and the return before the departure", () => {
    setup();
    expect(screen.getByLabelText("Data wylotu")).toHaveAttribute("min", TODAY);
    expect(screen.getByLabelText("Data powrotu")).toHaveAttribute("min", TODAY);

    setDate("Data wylotu", "2026-11-10");

    expect(screen.getByLabelText("Data powrotu")).toHaveAttribute("min", "2026-11-10");
  });
});

describe("FlightSearchForm – airport suggestions", () => {
  it("offers popular airports when the field is focused and empty", async () => {
    setup();

    await userEvent.click(airportBox("Skąd"));

    await screen.findByRole("listbox");
    expect(suggestions().length).toBeGreaterThan(3);
  });

  it("filters suggestions while typing and selects with the mouse", async () => {
    setup();

    await pickAirport("Skąd", "war", /Warszawa/);

    expect(airportBox("Skąd")).toHaveValue("Warszawa (WAW)");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects with the keyboard", async () => {
    setup();
    await userEvent.click(airportBox("Skąd"));
    await userEvent.type(airportBox("Skąd"), "dub");
    await vi.waitFor(() => expect(suggestions()).toHaveLength(1));

    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(airportBox("Skąd")).toHaveValue("Dubaj (DXB)");
  });

  it("closes the list on Escape", async () => {
    setup();
    await userEvent.click(airportBox("Skąd"));
    await screen.findByRole("listbox");

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("tells when nothing matches", async () => {
    setup();
    await userEvent.click(airportBox("Skąd"));

    await userEvent.type(airportBox("Skąd"), "zzzz");

    expect(await screen.findByText("Brak pasujących lotnisk")).toBeInTheDocument();
  });

  it("forgets the selection when the text is edited", async () => {
    setup();
    await pickAirport("Skąd", "war", /Warszawa/);

    await userEvent.type(airportBox("Skąd"), "x");
    await submit();

    expect(screen.getByText("Wybierz lotnisko wylotu")).toBeInTheDocument();
  });

  it("swaps the airports", async () => {
    setup();
    await pickAirport("Skąd", "war", /Warszawa/);
    await pickAirport("Dokąd", "doh", /Doha/);

    await userEvent.click(screen.getByRole("button", { name: "Zamień lotniska" }));

    expect(airportBox("Skąd")).toHaveValue("Doha (DOH)");
    expect(airportBox("Dokąd")).toHaveValue("Warszawa (WAW)");
  });
});

describe("FlightSearchForm – passengers", () => {
  it("does not let adults go below 1", () => {
    setup();

    expect(less("Dorośli")).toBeDisabled();
    expect(less("Dzieci")).toBeDisabled();
    expect(less("Niemowlęta")).toBeDisabled();
  });

  it("changes the counts", async () => {
    setup();

    await userEvent.click(more("Dorośli"));
    await userEvent.click(more("Dzieci"));

    expect(group("Dorośli").getByText("2")).toBeInTheDocument();
    expect(group("Dzieci").getByText("1")).toBeInTheDocument();
  });

  it("limits the whole group to 9 passengers", async () => {
    setup();

    await clickTimes(more("Dorośli"), 8);

    expect(group("Dorośli").getByText("9")).toBeInTheDocument();
    expect(more("Dorośli")).toBeDisabled();
    expect(more("Dzieci")).toBeDisabled();
    expect(more("Niemowlęta")).toBeDisabled();
  });

  it("counts children and infants in the group limit", async () => {
    setup();

    await clickTimes(more("Dzieci"), 8);

    expect(more("Dorośli")).toBeDisabled();
    expect(more("Dzieci")).toBeDisabled();
  });

  it("allows no more infants than adults", async () => {
    setup();

    await userEvent.click(more("Niemowlęta"));

    expect(more("Niemowlęta")).toBeDisabled();
    expect(less("Dorośli")).toBeDisabled();

    await userEvent.click(more("Dorośli"));

    expect(more("Niemowlęta")).toBeEnabled();
  });
});

describe("FlightSearchForm – validation", () => {
  it("lists every missing field and does not search", async () => {
    const onSearch = setup();

    await submit();

    expect(screen.getByText("Wybierz lotnisko wylotu")).toBeInTheDocument();
    expect(screen.getByText("Wybierz lotnisko przylotu")).toBeInTheDocument();
    expect(screen.getByText("Podaj datę wylotu")).toBeInTheDocument();
    expect(screen.getByText("Podaj datę powrotu")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("rejects the same airport for departure and arrival", async () => {
    const onSearch = setup();
    await pickAirport("Skąd", "war", /Warszawa/);
    await pickAirport("Dokąd", "war", /Warszawa/);
    setDate("Data wylotu", "2026-11-10");
    setDate("Data powrotu", "2026-11-20");

    await submit();

    expect(screen.getByText("Lotnisko przylotu musi być inne niż wylotu")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("rejects a departure date in the past", async () => {
    const onSearch = setup();
    await fillValidRoundTrip();
    setDate("Data wylotu", "2026-10-31");

    await submit();

    expect(screen.getByText("Data wylotu nie może być w przeszłości")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("rejects a return before the departure", async () => {
    const onSearch = setup();
    await fillValidRoundTrip();
    setDate("Data powrotu", "2026-11-05");

    await submit();

    expect(screen.getByText("Powrót nie może być wcześniej niż wylot")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not ask for a return date on a one-way trip", async () => {
    const onSearch = setup();
    await userEvent.click(screen.getByRole("radio", { name: "W jedną stronę" }));
    await pickAirport("Skąd", "war", /Warszawa/);
    await pickAirport("Dokąd", "doh", /Doha/);
    setDate("Data wylotu", "2026-11-10");

    await submit();

    expect(screen.queryByText("Podaj datę powrotu")).not.toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("clears the messages after the fields are fixed", async () => {
    const onSearch = setup();
    await submit();
    expect(screen.getByText("Wybierz lotnisko wylotu")).toBeInTheDocument();

    await fillValidRoundTrip();
    await submit();

    expect(screen.queryByText("Wybierz lotnisko wylotu")).not.toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});

describe("FlightSearchForm – submit", () => {
  it("passes the complete criteria", async () => {
    const onSearch = setup();
    await fillValidRoundTrip();
    await userEvent.click(more("Dorośli"));
    await userEvent.click(more("Dzieci"));
    await userEvent.selectOptions(screen.getByLabelText("Klasa podróży"), "business");

    await submit();

    expect(onSearch).toHaveBeenCalledWith({
      tripType: "round_trip",
      from: expect.objectContaining({ code: "WAW", city: "Warszawa" }),
      to: expect.objectContaining({ code: "DOH", city: "Doha" }),
      departureDate: "2026-11-10",
      returnDate: "2026-11-20",
      passengers: { adults: 2, children: 1, infants: 0 },
      cabin: "business",
    });
  });

  it("sends no return date for a one-way trip", async () => {
    const onSearch = setup();
    await fillValidRoundTrip();
    await userEvent.click(screen.getByRole("radio", { name: "W jedną stronę" }));

    await submit();

    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ tripType: "one_way", returnDate: null }));
  });
});
