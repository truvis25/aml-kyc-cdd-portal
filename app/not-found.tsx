import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f9fafb', margin: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '4rem', fontWeight: 700, color: '#e5e7eb', margin: '0 0 1rem' }}>404</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>Page not found</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            style={{ borderRadius: '0.375rem', background: '#2563eb', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, color: '#fff', textDecoration: 'none' }}
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
