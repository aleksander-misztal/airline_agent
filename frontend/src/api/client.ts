const baseUrl: string = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

/** Wywoływany, gdy API odrzuci żądanie 401 poza logowaniem, czyli sesja wygasła. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function request<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const url = new URL(path, baseUrl || window.location.origin);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Brak połączenia z serwerem");
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/api/auth/")) onUnauthorized?.();
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error ?? `Błąd serwera (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
