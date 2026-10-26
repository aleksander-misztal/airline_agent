import { criteria } from "../../test/fixtures";
import { useRecentSearchesStore } from "./recentSearchesStore";
import type { SearchCriteria } from "./types";

const state = () => useRecentSearchesStore.getState();
const IST = { code: "IST", city: "Stambuł", country: "Turcja", name: "Istanbul Airport" };
const search = (overrides: Partial<SearchCriteria> = {}): SearchCriteria => ({ ...criteria, ...overrides });
const dests = () => state().items.map((i) => i.criteria.to.code);

/** Symuluje odświeżenie strony: pamięć aplikacji znika, localStorage zostaje. */
const reload = (userId = "u-1") => {
  useRecentSearchesStore.setState(useRecentSearchesStore.getInitialState(), true);
  state().load(userId);
};

beforeEach(() => {
  state().load("u-1");
});

describe("recentSearchesStore", () => {
  it("starts empty", () => {
    expect(state().items).toEqual([]);
  });

  it("puts the newest search first", () => {
    state().add(search());
    state().add(search({ to: IST }));

    expect(dests()).toEqual(["IST", "DOH"]);
  });

  it("keeps a repeated search once and moves it to the top", () => {
    state().add(search());
    state().add(search({ to: IST }));
    state().add(search());

    expect(dests()).toEqual(["DOH", "IST"]);
  });

  it("treats other dates, passengers or cabin as a different search", () => {
    state().add(search());
    state().add(search({ cabin: "business" }));
    state().add(search({ departureDate: "2026-12-01", returnDate: "2026-12-08" }));
    state().add(search({ passengers: { adults: 1, children: 0, infants: 0 } }));
    state().add(search({ tripType: "one_way", returnDate: null }));

    expect(state().items).toHaveLength(5);
  });

  it("keeps only the 5 most recent searches", () => {
    for (let day = 1; day <= 6; day += 1) {
      state().add(search({ departureDate: `2026-12-0${day}`, returnDate: `2026-12-1${day}` }));
    }

    expect(state().items).toHaveLength(5);
    expect(state().items[0].criteria.departureDate).toBe("2026-12-06");
    expect(state().items.map((i) => i.criteria.departureDate)).not.toContain("2026-12-01");
  });

  it("survives a page reload", () => {
    state().add(search());
    state().add(search({ to: IST }));

    reload();

    expect(state().items.map((i) => i.criteria)).toEqual([search({ to: IST }), search()]);
  });

  it("keeps a separate list for each user", () => {
    state().add(search());

    reload("u-2");
    expect(state().items).toEqual([]);
    state().add(search({ to: IST }));

    reload("u-1");
    expect(dests()).toEqual(["DOH"]);
    reload("u-2");
    expect(dests()).toEqual(["IST"]);
  });

  it("removes a single search, also from storage", () => {
    state().add(search());
    state().add(search({ to: IST }));
    const [newest] = state().items;

    state().remove(newest.id);

    expect(dests()).toEqual(["DOH"]);
    reload();
    expect(dests()).toEqual(["DOH"]);
  });

  it("clears the whole history, also from storage", () => {
    state().add(search());

    state().clear();

    expect(state().items).toEqual([]);
    reload();
    expect(state().items).toEqual([]);
  });

  it("forgets the in-memory list on reset but not the stored one", () => {
    state().add(search());

    state().reset();
    expect(state().items).toEqual([]);

    state().load("u-1");
    expect(dests()).toEqual(["DOH"]);
  });

  describe("damaged storage", () => {
    it("ignores data that is not JSON", () => {
      localStorage.setItem("recent-searches:u-1", "{to nie json");

      reload();

      expect(state().items).toEqual([]);
    });

    it("ignores data of the wrong shape", () => {
      localStorage.setItem("recent-searches:u-1", JSON.stringify({ nie: "lista" }));
      reload();
      expect(state().items).toEqual([]);

      localStorage.setItem("recent-searches:u-1", JSON.stringify([{ x: 1 }, 5, null]));
      reload();
      expect(state().items).toEqual([]);
    });

    it("keeps the valid entries when only some are broken", () => {
      localStorage.setItem("recent-searches:u-1", JSON.stringify([{ x: 1 }, search()]));

      reload();

      expect(state().items.map((i) => i.criteria)).toEqual([search()]);
    });

    it("keeps working in memory when storage cannot be written", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("pełne", "QuotaExceededError");
      });

      expect(() => state().add(search())).not.toThrow();

      expect(state().items).toHaveLength(1);
      vi.restoreAllMocks();
    });

    it("keeps working when storage cannot be read", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("zablokowane", "SecurityError");
      });

      expect(() => state().load("u-1")).not.toThrow();

      expect(state().items).toEqual([]);
      vi.restoreAllMocks();
    });
  });
});
