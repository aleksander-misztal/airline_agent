import { authApi } from "./auth";
import { ApiError } from "./client";
import { dashboardApi } from "./dashboard";

describe("dashboardApi", () => {
  it("rejects requests without a session with 401", async () => {
    const err = (await dashboardApi.getSummary().catch((e) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  it("returns balance, miles, flights and upcoming bookings", async () => {
    await authApi.login("admin", "admin");

    const summary = await dashboardApi.getSummary();

    expect(summary).toMatchObject({
      avios: expect.any(Number),
      milesFlown: expect.any(Number),
      flightsTaken: expect.any(Number),
      upcomingBookings: expect.any(Array),
    });
    expect(summary.upcomingBookings.length).toBeGreaterThan(0);
    expect(summary.upcomingBookings[0]).toMatchObject({
      reference: expect.any(String),
      flightNumber: expect.any(String),
      from: expect.any(String),
      to: expect.any(String),
      departure: expect.any(String),
      arrival: expect.any(String),
    });
  });

  it("lists bookings from the nearest departure", async () => {
    await authApi.login("admin", "admin");

    const { upcomingBookings } = await dashboardApi.getSummary();

    const departures = upcomingBookings.map((b) => b.departure);
    expect([...departures].sort()).toEqual(departures);
  });
});
