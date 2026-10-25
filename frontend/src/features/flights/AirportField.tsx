import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { airportsApi, type Airport } from "../../api";

export const airportLabel = (airport: Airport) => `${airport.city} (${airport.code})`;

type AirportFieldProps = {
  label: string;
  text: string;
  selected: Airport | null;
  error?: string;
  onTextChange: (text: string) => void;
  onSelect: (airport: Airport) => void;
};

export function AirportField({ label, text, selected, error, onTextChange, onSelect }: AirportFieldProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Airport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(-1);
  const latestRequest = useRef(0);

  // Przy wybranym lotnisku pole pokazuje jego etykietę, więc podpowiadamy listę popularnych.
  const query = selected ? "" : text;

  useEffect(() => {
    if (!open) return;
    const request = ++latestRequest.current;
    airportsApi
      .search(query)
      .then((result) => result)
      .catch(() => [] as Airport[])
      .then((result) => {
        if (request !== latestRequest.current) return; // nowsze zapytanie wyprzedziło to
        setOptions(result);
        setActive(-1);
        setLoaded(true);
      });
  }, [open, query]);

  function choose(airport: Airport) {
    onSelect(airport);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (options.length > 0) setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && options.length > 0) setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && open && active >= 0 && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && loaded;
  const showOptions = showList && options.length > 0;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={showOptions}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        placeholder="Miasto lub lotnisko"
        value={text}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-600"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {showList && (
        // mouseDown nie odbiera fokusu polu, dzięki czemu kliknięcie opcji zdąży się wykonać przed zamknięciem listy
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-neutral-200"
        >
          {showOptions ? (
            <ul id={listId} role="listbox" aria-label={label}>
              {options.map((airport, index) => (
                <li
                  key={airport.code}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onClick={() => choose(airport)}
                  className={`cursor-pointer px-4 py-2.5 ${index === active ? "bg-brand-50" : "hover:bg-neutral-100"}`}
                >
                  <span className="block text-sm font-medium text-neutral-900">{airportLabel(airport)}</span>
                  <span className="block text-xs text-brand-gray">{`${airport.name}, ${airport.country}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-brand-gray">Brak pasujących lotnisk</p>
          )}
        </div>
      )}
    </div>
  );
}
