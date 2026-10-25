import { brand } from "./config/brand";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <img src={brand.logo.full} alt={brand.name} className="w-72 max-w-full" />
      <p className="text-lg font-light tracking-wide text-brand-gray">
        {brand.assistantName}
      </p>
      <div className="h-1 w-16 rounded-full bg-brand" />
    </main>
  );
}
