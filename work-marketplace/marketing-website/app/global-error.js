'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Something went wrong!</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#6366f1',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
