export function PageLoader() {
  return (
    <div role="status" className="flex flex-1 items-center justify-center text-brand-gray">
      <span className="mr-3 size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      Ładowanie…
    </div>
  );
}
