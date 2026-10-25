import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FlightOffer } from "../../api";
import { connectingOffer, directOffer, roundTripOffer } from "../../test/fixtures";
import { plainPrice } from "../../test/utils";
import { OfferCard } from "./OfferCard";

function setup(offer: FlightOffer, props: Partial<React.ComponentProps<typeof OfferCard>> = {}) {
  const handlers = { onToggle: vi.fn(), onReserve: vi.fn() };
  render(
    <ul>
      <OfferCard offer={offer} expanded={false} {...handlers} {...props} />
    </ul>,
  );
  return handlers;
}

const card = () => screen.getByRole("listitem");
const timelines = () => screen.getAllByRole("list", { name: "Przebieg lotu" });
const events = (timeline: HTMLElement) => within(timeline).getAllByRole("listitem");

describe("OfferCard – collapsed", () => {
  it("summarises a direct flight", () => {
    setup(directOffer);
    const item = within(card());

    expect(item.getByText("14:35")).toBeInTheDocument();
    expect(item.getByText("22:50")).toBeInTheDocument();
    expect(item.getByText("WAW → DOH")).toBeInTheDocument();
    expect(item.getByText("6 h 15 min")).toBeInTheDocument();
    expect(item.getByText("Bezpośredni")).toBeInTheDocument();
    expect(item.getByText(plainPrice(2450))).toBeInTheDocument();
  });

  it("summarises a connecting flight with its stop", () => {
    setup(connectingOffer);
    const item = within(card());

    expect(item.getByText("1 przesiadka")).toBeInTheDocument();
    expect(item.getByText("7 h 55 min")).toBeInTheDocument();
    expect(item.getByText("Przez IST")).toBeInTheDocument();
    expect(item.getByText("06:10")).toBeInTheDocument();
    expect(item.getByText("16:05")).toBeInTheDocument();
  });

  it("shows both directions of a round trip with one price", () => {
    setup(roundTripOffer);
    const item = within(card());

    expect(item.getByText("Tam")).toBeInTheDocument();
    expect(item.getByText("Powrót")).toBeInTheDocument();
    expect(item.getByText("WAW → DOH")).toBeInTheDocument();
    expect(item.getByText("DOH → WAW")).toBeInTheDocument();
    expect(item.getByText("03:05")).toBeInTheDocument();
    expect(item.getAllByText(plainPrice(4100))).toHaveLength(1);
  });

  it("exposes the offer id for tests and tooling", () => {
    setup(directOffer);

    expect(card()).toHaveAttribute("data-offer-id", "o-direct");
  });

  it("hides the details and the reserve button", () => {
    setup(directOffer);

    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Przebieg lotu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rezerwuj" })).not.toBeInTheDocument();
  });

  it("asks to expand when the header is clicked", async () => {
    const { onToggle } = setup(directOffer);

    await userEvent.click(screen.getByRole("button", { expanded: false }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("OfferCard – expanded", () => {
  it("links the header to the details it opens", () => {
    setup(directOffer, { expanded: true });

    const header = screen.getByRole("button", { expanded: true });
    const details = screen.getByRole("region", { name: "Szczegóły lotu" });
    expect(header).toHaveAttribute("aria-controls", details.id);
  });

  it("draws a vertical timeline of a direct flight: airport, date, time, then the flight itself", () => {
    setup(directOffer, { expanded: true });
    const [timeline] = timelines();
    const [departure, flight, arrival] = events(timeline);

    expect(events(timeline)).toHaveLength(3);
    expect(departure).toHaveTextContent("14:35");
    expect(departure).toHaveTextContent("02.11.2026");
    expect(departure).toHaveTextContent("Warszawa (WAW)");
    expect(departure).toHaveTextContent("Warsaw Chopin Airport");
    expect(flight).toHaveTextContent("QR123");
    expect(flight).toHaveTextContent("Airbus A350-900");
    expect(flight).toHaveTextContent("6 h 15 min");
    expect(arrival).toHaveTextContent("22:50");
    expect(arrival).toHaveTextContent("Doha (DOH)");
    expect(arrival).toHaveTextContent("Hamad International Airport");
  });

  it("shows the total travel time of the leg", () => {
    setup(directOffer, { expanded: true });

    expect(screen.getByText("Czas podróży: 6 h 15 min")).toBeInTheDocument();
  });

  it("shows each flight, its aircraft and the layover of a connection", () => {
    setup(connectingOffer, { expanded: true });
    const [timeline] = timelines();
    const items = events(timeline);

    expect(items).toHaveLength(7);
    expect(items[0]).toHaveTextContent("06:10");
    expect(items[1]).toHaveTextContent("QR271");
    expect(items[1]).toHaveTextContent("Airbus A320");
    expect(items[2]).toHaveTextContent("10:25");
    expect(items[2]).toHaveTextContent("Istanbul Airport");
    expect(items[3]).toHaveTextContent("Przesiadka 2 h 15 min");
    expect(items[4]).toHaveTextContent("12:40");
    expect(items[5]).toHaveTextContent("QR242");
    expect(items[5]).toHaveTextContent("Boeing 787-8 Dreamliner");
    expect(items[6]).toHaveTextContent("16:05");
    expect(screen.getByText("Czas podróży: 7 h 55 min")).toBeInTheDocument();
  });

  it("has a timeline for each direction of a round trip", () => {
    setup(roundTripOffer, { expanded: true });

    expect(timelines()).toHaveLength(2);
    expect(screen.getByText("Tam · 02.11.2026")).toBeInTheDocument();
    expect(screen.getByText("Powrót · 12.11.2026")).toBeInTheDocument();
    expect(events(timelines()[1])[0]).toHaveTextContent("03:05");
  });

  it("shows the ticket price and the reserve button together", async () => {
    const { onReserve } = setup(directOffer, { expanded: true });
    const group = within(screen.getByRole("group", { name: "Cena i rezerwacja" }));

    expect(group.getByText(plainPrice(2450))).toBeInTheDocument();
    expect(group.getByText("cena za wszystkich pasażerów")).toBeInTheDocument();
    await userEvent.click(group.getByRole("button", { name: "Rezerwuj" }));

    expect(onReserve).toHaveBeenCalledTimes(1);
  });

  it("is busy while the reservation is being made", () => {
    setup(directOffer, { expanded: true, reserving: true });

    expect(screen.getByRole("button", { name: "Rezerwuję…" })).toBeDisabled();
  });

  it("confirms the reservation with its code instead of the button", () => {
    setup(directOffer, { expanded: true, reservation: "ABC123" });

    expect(screen.getByRole("status")).toHaveTextContent("Rezerwacja potwierdzona. Kod rezerwacji: ABC123");
    expect(screen.queryByRole("button", { name: "Rezerwuj" })).not.toBeInTheDocument();
  });

  it("marks a reserved offer in the collapsed header too", () => {
    setup(directOffer, { reservation: "ABC123" });

    expect(within(card()).getByText("Zarezerwowano")).toBeInTheDocument();
  });

  it("shows a reservation error and keeps the button", () => {
    setup(directOffer, { expanded: true, error: "Nie udało się zarezerwować lotu. Spróbuj ponownie." });

    expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się zarezerwować lotu");
    expect(screen.getByRole("button", { name: "Rezerwuj" })).toBeEnabled();
  });
});
