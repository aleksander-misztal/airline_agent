import { BrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { brand } from "./config/brand";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-3xl font-light tracking-wide text-brand">{brand.assistantName}</h1>
          <div className="h-1 w-16 rounded-full bg-brand" />
          <p className="text-brand-gray">Logowanie i czat – wkrótce.</p>
        </div>
      </AppLayout>
    </BrowserRouter>
  );
}
