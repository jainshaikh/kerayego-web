'use client';

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Something went wrong</h2>
        <p className="mb-5 text-sm text-slate-500">An error occurred loading this page.</p>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
