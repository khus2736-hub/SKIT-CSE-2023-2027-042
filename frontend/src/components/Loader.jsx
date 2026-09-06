import React from 'react';

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
      </div>
    </div>
  );
}
