import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user, isAdmin } = useAuth();
  const homePath = !user ? '/login' : isAdmin ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '1.5rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to={homePath} className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
}
