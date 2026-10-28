import React, { useState, useEffect, useCallback } from 'react';
import { leavesApi } from '../../api/leaves';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import ConfirmButton from '../../components/ConfirmButton';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function MyLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [status, setStatus] = useState('');

  // Apply Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useToast();

  const fetchMyLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leavesApi.getMyLeaves({
        status,
        page,
        size: 10
      });
      setLeaves(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load leave applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, page, showToast]);

  useEffect(() => {
    fetchMyLeaves();
  }, [fetchMyLeaves]);

  // Calculate day count
  const calculatedDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const openApplyModal = () => {
    setLeaveType('CASUAL');
    setStartDate('');
    setEndDate('');
    setReason('');
    setErrors({});
    setModalOpen(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    const todayStr = new Date().toISOString().substring(0, 10);

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (startDate < todayStr) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    } else if (startDate && endDate < startDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please state the reason for leave';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await leavesApi.applyLeave({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      });
      showToast('Leave request submitted successfully!', 'success');
      setModalOpen(false);
      fetchMyLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit leave request';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leaveId) => {
    try {
      await leavesApi.cancelLeave(leaveId);
      showToast('Leave request cancelled', 'success');
      fetchMyLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel leave request';
      showToast(msg, 'error');
    }
  };

  const columns = [
    {
      header: 'Leave Type',
      key: 'leaveType',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Date Window',
      key: 'startDate',
      render: (val, row) => (
        <div>
          <strong>{formatDate(val)} to {formatDate(row.endDate)}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.days} day(s)</div>
        </div>
      )
    },
    {
      header: 'Reason',
      key: 'reason'
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Reviewer Feedback',
      key: 'adminRemarks',
      render: (val, row) => {
        if (!row.reviewedAt) return <span style={{ color: 'var(--text-muted)' }}>Awaiting review</span>;
        return (
          <div style={{ fontSize: '0.8125rem' }}>
            <div>Reviewed by: <strong>{row.reviewerName || 'Administrator'}</strong></div>
            {val && <div style={{ color: 'var(--text-muted)' }}>"{val}"</div>}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val, row) => {
        if (row.status !== 'PENDING') return '—';
        return (
          <ConfirmButton
            onConfirm={() => handleCancel(val)}
            confirmText="Cancel leave?"
            className="btn btn-outline-danger btn-sm"
          >
            Cancel Request
          </ConfirmButton>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Leave Applications"
        subtitle="Apply for leave, track approval progress, and review remarks"
        actions={
          <button className="btn btn-primary" onClick={openApplyModal}>
            + Apply for Leave
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <Loader message="Loading your leave applications..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={leaves}
            emptyMessage="You haven't submitted any leave applications yet."
          />
          <Pagination
            page={page}
            size={10}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApply} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </>
        }
      >
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Leave Type" required>
            <select
              className="form-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="CASUAL">Casual Leave (Short emergency / personal)</option>
              <option value="SICK">Sick Leave (Medical treatment / illness)</option>
              <option value="EARNED">Earned / Privilege Leave (Planned vacation)</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Start Date" required error={errors.startDate}>
              <input
                type="date"
                className={`form-input ${errors.startDate ? 'has-error' : ''}`}
                value={startDate}
                min={new Date().toISOString().substring(0, 10)}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>

            <Field label="End Date" required error={errors.endDate}>
              <input
                type="date"
                className={`form-input ${errors.endDate ? 'has-error' : ''}`}
                value={endDate}
                min={startDate || new Date().toISOString().substring(0, 10)}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>

          {startDate && endDate && calculatedDays() > 0 && (
            <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-text)', fontSize: '0.875rem' }}>
              Total Duration: <strong>{calculatedDays()} day(s)</strong> (inclusive)
            </div>
          )}

          <Field label="Reason for Leave" required error={errors.reason}>
            <textarea
              className={`form-textarea ${errors.reason ? 'has-error' : ''}`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the circumstances for your absence..."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
