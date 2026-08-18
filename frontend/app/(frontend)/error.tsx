"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-page">
      <div className="status-page-inner"><div className="status-page-copy"><p>Agomoni Run 2.0</p><h1>The route is temporarily unavailable.</h1><p>Please try again. No registration or result information has been changed.</p><button type="button" className="button button--vermilion" onClick={reset}>Try again</button></div></div>
    </main>
  );
}
