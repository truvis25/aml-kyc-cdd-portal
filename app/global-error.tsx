'use client';

/**
 * Root-layout error boundary. Renders if an error occurs in `app/layout.tsx`
 * itself (where a regular `error.tsx` cannot catch). Must include its own
 * <html> and <body> because the failed layout did not render them.
 *
 * Keep this minimal — no imports of app utilities, no theming, no fonts.
 * Anything that itself can throw defeats the purpose of this last-resort
 * boundary.
 */

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: '40px 24px',
          background: '#f9fafb',
          color: '#111827',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            padding: 24,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          <h1 style={{ fontSize: 18, margin: '0 0 12px', color: '#dc2626' }}>
            The application failed to load
          </h1>
          <p style={{ fontSize: 14, margin: '0 0 16px', color: '#374151' }}>
            An unexpected error occurred while initialising the application. Please try again.
            If this persists, contact your system administrator.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: '#6b7280',
                margin: '0 0 16px',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
