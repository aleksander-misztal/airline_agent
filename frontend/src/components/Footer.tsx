import { brand } from "../config/brand";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{`© ${year} ${brand.name}`}</p>
        <p className="font-light text-white/70">Projekt treningowy – nie jest oficjalną stroną linii lotniczej.</p>
      </div>
    </footer>
  );
}
