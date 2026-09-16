/** Skeleton shown while the (dynamic) episode list streams in. */
export default function EpisodesLoading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری اپیزودها">
      <div className="border-b border-line bg-surface">
        <div className="container-page py-14 md:py-20">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
          <div className="mt-4 h-11 w-72 max-w-full animate-pulse rounded-lg bg-surface-2" />
          <div className="mt-5 h-5 w-full max-w-xl animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="container-page py-12 md:py-16">
        <div className="h-12 w-full animate-pulse rounded-xl bg-surface-2" />
        <ul className="mt-10 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex gap-5 rounded-xl border border-line bg-surface p-5">
              <div className="size-12 shrink-0 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
                <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-surface-2" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
