import React from 'react';

export default function Pagination({ page = 0, size = 10, totalElements = 0, totalPages = 1, onPageChange }) {
  if (totalPages <= 1 && totalElements <= size) return null;

  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{totalElements}</strong> entries
      </div>
      <div className="pagination-actions">
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.8125rem' }}>
          Page {page + 1} of {Math.max(1, totalPages)}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
