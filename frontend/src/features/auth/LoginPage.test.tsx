import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { server } from "../../api/mocks/server";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "./authStore";

beforeEach(() => {
  useAuthStore.setState({ status: "anonymous" });
});

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
      </Routes>
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
    expect(screen.getByLabelText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasło")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Zaloguj się" })).toBeEnabled();
  });

  it("validates empty fields without calling the API", async () => {
    renderLogin();
    const loginSpy = vi.spyOn(useAuthStore.getState(), "login");

    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(screen.getByText("Podaj login")).toBeInTheDocument();
    expect(screen.getByText("Podaj hasło")).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("validates only the missing field", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(screen.queryByText("Podaj login")).not.toBeInTheDocument();
    expect(screen.getByText("Podaj hasło")).toBeInTheDocument();
  });

  it("shows an error message for wrong credentials", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Hasło"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nieprawidłowy login lub hasło");
    expect(screen.getByRole("heading", { name: "Logowanie" })).toBeInTheDocument();
  });

  it("redirects to /dashboard after logging in with admin/admin", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Hasło"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("submits with the Enter key", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Hasło"), "admin{Enter}");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    server.use(
      http.post("*/api/auth/login", async () => {
        await delay(200);
        return HttpResponse.json({ user: { id: "u-1", username: "admin", displayName: "Administrator" } });
      }),
    );
    renderLogin();

    await userEvent.type(screen.getByLabelText("Login"), "admin");
    await userEvent.type(screen.getByLabelText("Hasło"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(screen.queryByRole("button", { name: "Zaloguj się" })).toBeDisabled();
  });
});
