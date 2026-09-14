export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-10 lg:px-8 lg:py-14">
      <div className="h-3 w-40 rounded bg-sand" />
      <div className="mt-8 h-12 w-72 rounded bg-sand" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-sand" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-sand" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] w-full rounded-xl bg-sand" />
              <div className="mt-4 h-3 w-20 rounded bg-sand" />
              <div className="mt-2 h-4 w-40 max-w-full rounded bg-sand" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
