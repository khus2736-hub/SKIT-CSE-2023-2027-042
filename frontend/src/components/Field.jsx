import React from 'react';

export default function Field({ label, required, error, hint, fullWidth, children }) {
  return (
    <div className={`form-field ${fullWidth ? 'full-width' : ''}`}>
      {label && (
        <label className={`field-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      {children}
      {error && <span className="field-error">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
}
