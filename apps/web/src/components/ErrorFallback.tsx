type ErrorFallbackProps = {
  error: Error | null;
};

export function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="w-16 h-16 bg-[var(--color-error-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[var(--color-error)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Etwas ist schiefgelaufen</h1>

        <p className="text-muted-foreground mb-6">
          Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu oder kontaktieren
          Sie den Support, wenn das Problem weiterhin besteht.
        </p>

        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Fehlerdetails anzeigen
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs text-muted-foreground overflow-auto">
              {error.message}
            </pre>
          </details>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}
