import { authApi } from "./auth";
import { airportsApi } from "./airports";
import { ApiError } from "./client";

const codes = async (q: string) => (await airportsApi.search(q)).map((a) => a.code);

describe("airportsApi", () => {
  it("rejects requests without a session with 401", async () => {
    const err = (await airportsApi.search("war").catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  describe("with a session", () => {
    beforeEach(async () => {
      await authApi.login("admin", "admin");
    });

    it("returns airports with code, city, country and name", async () => {
      const [first] = await airportsApi.search("doh");

      expect(first).toEqual({
        code: "DOH",
        city: "Doha",
        country: "Katar",
        name: "Hamad International Airport",
      });
    });

    it("finds by city, ignoring case", async () => {
      await expect(codes("war")).resolves.toContain("WAW");
      await expect(codes("WAR")).resolves.toContain("WAW");
    });

    it("ignores Polish diacritics", async () => {
      await expect(codes("krakow")).resolves.toEqual(["KRK"]);
      await expect(codes("gdansk")).resolves.toEqual(["GDN"]);
      await expect(codes("Kraków")).resolves.toEqual(["KRK"]);
    });

    it("finds by IATA code", async () => {
      await expect(codes("dxb")).resolves.toEqual(["DXB"]);
    });

    it("finds by airport name", async () => {
      await expect(codes("hamad")).resolves.toEqual(["DOH"]);
    });

    it("ranks a code match before other matches", async () => {
      const result = await codes("lh");

      expect(result[0]).toBe("LHR");
    });

    it("returns nothing for an unknown phrase", async () => {
      await expect(codes("zzzz")).resolves.toEqual([]);
    });

    it("returns the popular airports for an empty phrase, at most 8", async () => {
      const result = await codes("");

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(8);
      expect(result).toContain("WAW");
      expect(result).toContain("DOH");
    });

    it("limits the number of suggestions", async () => {
      const result = await codes("a");

      expect(result.length).toBeLessThanOrEqual(8);
    });
  });
});
