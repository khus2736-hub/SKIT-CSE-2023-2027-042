import React from 'react';
import { formatStatus } from '../utils/formatters';

export default function StatusBadge({ status }) {
  if (!status) return <span>—</span>;

  const s = String(status).toUpperCase();
  let badgeClass = 'badge-neutral';

  if (['ACTIVE', 'PRESENT', 'APPROVED', 'COMPLETED'].includes(s)) {
    badgeClass = 'badge-active';
  } else if (['INACTIVE', 'REJECTED', 'CANCELLED'].includes(s)) {
    badgeClass = 'badge-inactive';
  } else if (['PENDING', 'HALF_DAY', 'IN_PROGRESS', 'MEDIUM'].includes(s)) {
    badgeClass = 'badge-pending';
  } else if (['OVERDUE', 'HIGH'].includes(s)) {
    badgeClass = 'badge-overdue';
  } else if (['LOW', 'UNPAID', 'CASUAL', 'SICK', 'EARNED'].includes(s)) {
    badgeClass = 'badge-low';
  }

  return <span className={`badge ${badgeClass}`}>{formatStatus(status)}</span>;
}
