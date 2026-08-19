/**
 * Shown when a Studio page cannot read its content from the API.
 *
 * Rendering an empty form instead would be dangerous: the fields would look
 * blank, and saving would overwrite the live website with nothing.
 */
export function LoadFailure({ what }: { what: string }) {
  return (
    <div className="studio-load-failure" role="alert">
      <h2>Could not load {what}</h2>
      <p>
        Your content is safe — this page just could not reach the server, so the form is hidden to
        make sure nothing gets overwritten by mistake.
      </p>
      <p className="studio-hint">Wait a moment and reload the page. If it keeps failing, the backend may still be restarting.</p>
    </div>
  );
}
