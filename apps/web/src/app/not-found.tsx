export default function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#1a1a2e' }}>
          {statusCode}
        </h1>
        <p style={{ color: '#666' }}>
          {statusCode === 404 ? 'Page not found' : 'An error occurred'}
        </p>
        <a 
          href="/" 
          style={{ 
            marginTop: '1.5rem', 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#7c3aed',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}