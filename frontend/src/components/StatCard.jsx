import React from 'react';

export default function StatCard({ label, value, meta }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {meta && <span className="stat-meta">{meta}</span>}
    </div>
  );
}
