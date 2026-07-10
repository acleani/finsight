export default function LoadingStock() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Caricamento analisi">
      <div className="card h-36 p-5">
        <div className="h-6 w-64 rounded bg-surface-2" />
        <div className="mt-3 h-4 w-40 rounded bg-surface-2" />
        <div className="mt-2 h-4 w-full max-w-xl rounded bg-surface-2" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-64 p-5">
            <div className="h-5 w-40 rounded bg-surface-2" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((j) => <div key={j} className="h-4 w-full rounded bg-surface-2" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="card h-96 p-5">
        <div className="h-5 w-48 rounded bg-surface-2" />
        <div className="mt-4 h-72 rounded bg-surface-2" />
      </div>
    </div>
  );
}
