import { useAnalysisQuery } from './features/analysis/useAnalysisQuery';
import { useAnalysisStore } from './stores/useAnalysisStore';

function App() {
  const analysisId = useAnalysisStore((state) => state.analysisId);
  const setAnalysisId = useAnalysisStore((state) => state.setAnalysisId);
  const { data, isFetching, isLoading, error } = useAnalysisQuery(analysisId);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-cyan-300">Speech Mirror</p>
          <h1 className="text-3xl font-semibold">Frontend core is ready.</h1>
          <p className="max-w-2xl text-zinc-300">
            This app is prepared for async STT analysis flows with Axios, TanStack Query, and
            Zustand.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Analysis ID
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
              onChange={(event) => setAnalysisId(event.target.value)}
              placeholder="analysis-id"
              value={analysisId}
            />
          </label>

          <div className="mt-4 text-sm text-zinc-300">
            {isLoading && <p>Loading analysis...</p>}
            {isFetching && !isLoading && <p>Refreshing analysis...</p>}
            {error && <p className="text-red-300">Unable to load analysis.</p>}
            {data && (
              <pre className="overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-200">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
            {!analysisId && <p>Enter an analysis ID to start polling.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
