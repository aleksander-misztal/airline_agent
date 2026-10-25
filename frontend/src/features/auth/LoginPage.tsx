import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { PageLoader } from "../../components/PageLoader";
import { brand } from "../../config/brand";
import { useAuthStore } from "./authStore";

type FieldErrors = { username?: string; password?: string };

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-600";

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") return <PageLoader />;
  if (status === "authenticated") return <Navigate to="/chat" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Podaj login";
    if (!password) errors.password = "Podaj hasło";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    await login(username.trim(), password);
    setSubmitting(false);
  }

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white lg:flex lg:flex-col lg:justify-center lg:px-16">
        <img
          src={brand.logo.oryx}
          alt=""
          className="pointer-events-none absolute -right-24 -bottom-16 w-[34rem] opacity-10 brightness-0 invert"
        />
        <p className="relative text-sm font-medium tracking-[0.2em] uppercase text-white/70">{brand.name}</p>
        <h2 className="relative mt-4 text-5xl leading-tight font-light">
          Twój asystent
          <br />
          podróży
        </h2>
        <p className="relative mt-6 max-w-md text-lg font-light text-white/80">
          Sprawdź status lotu, zarządzaj rezerwacją i zadaj pytanie o bagaż lub odprawę online.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm ring-1 ring-neutral-200 sm:p-10"
        >
          <h1 className="text-3xl font-light text-brand">Logowanie</h1>
          <p className="mt-2 text-sm text-brand-gray">Zaloguj się, aby rozmawiać z asystentem.</p>

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-neutral-800">
                Login
              </label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                className={inputClass}
              />
              {fieldErrors.username && (
                <p id="username-error" className="mt-1.5 text-sm text-red-700">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-800">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={inputClass}
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-red-700">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full cursor-pointer rounded-full bg-brand px-6 py-3 text-base font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            Zaloguj się
          </button>

          {import.meta.env.DEV && (
            <p className="mt-6 text-center text-xs text-brand-gray">Środowisko testowe – dane: admin / admin</p>
          )}
        </form>
      </section>
    </div>
  );
}
