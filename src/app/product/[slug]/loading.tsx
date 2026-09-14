export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-8 lg:px-8 lg:py-12">
      <div className="h-3 w-56 rounded bg-sand" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="flex gap-4">
          <div className="hidden w-20 space-y-3 lg:block">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 w-20 rounded-lg bg-sand" />
            ))}
          </div>
          <div className="aspect-[4/5] flex-1 rounded-2xl bg-sand" />
        </div>
        <div className="space-y-5">
          <div className="h-3 w-24 rounded bg-sand" />
          <div className="h-10 w-3/4 rounded bg-sand" />
          <div className="h-4 w-32 rounded bg-sand" />
          <div className="h-8 w-28 rounded bg-sand" />
          <div className="h-20 w-full rounded bg-sand" />
          <div className="h-14 w-full rounded-full bg-sand" />
        </div>
      </div>
    </div>
  );
}
