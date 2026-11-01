// Esquelet mentre es carreguen les dades (sobretot quan el servidor es desperta).
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregant…">
      <div className="skeleton mb-2 h-9 w-48" />
      <div className="skeleton mb-7 h-4 w-64" />
      <div className="skeleton mb-6 h-24 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
