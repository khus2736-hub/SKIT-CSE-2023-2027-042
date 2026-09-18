import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const { user, isAdmin } = useAuth();
  const homePath = !user ? '/login' : isAdmin ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>403</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '1.5rem' }}>
        You do not have permission to access this resource, or your account is not linked to an employee record.
      </p>
      <Link to={homePath} className="btn btn-primary">
        Return to Safe Area
      </Link>
    </div>
  );
}
