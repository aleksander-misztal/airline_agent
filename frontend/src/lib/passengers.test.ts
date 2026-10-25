import { describePassengers } from "./passengers";

describe("describePassengers", () => {
  it.each([
    [{ adults: 1, children: 0, infants: 0 }, "1 dorosły"],
    [{ adults: 2, children: 0, infants: 0 }, "2 dorosłych"],
    [{ adults: 2, children: 1, infants: 0 }, "2 dorosłych, 1 dziecko"],
    [{ adults: 3, children: 2, infants: 0 }, "3 dorosłych, 2 dzieci"],
    [{ adults: 2, children: 5, infants: 0 }, "2 dorosłych, 5 dzieci"],
    [{ adults: 1, children: 0, infants: 1 }, "1 dorosły, 1 niemowlę"],
    [{ adults: 3, children: 0, infants: 2 }, "3 dorosłych, 2 niemowlęta"],
    [{ adults: 5, children: 0, infants: 5 }, "5 dorosłych, 5 niemowląt"],
  ])("%j → %s", (passengers, expected) => {
    expect(describePassengers(passengers)).toBe(expected);
  });
});
