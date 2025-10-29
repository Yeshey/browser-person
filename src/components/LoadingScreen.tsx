type LoadingScreenProps = {
  progress: string;
};

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #333',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h2 style={{ marginBottom: '10px', fontWeight: 'normal' }}>
          Loading AI Model...
        </h2>
        <p style={{ color: '#888', fontSize: '14px' }}>{progress}</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}