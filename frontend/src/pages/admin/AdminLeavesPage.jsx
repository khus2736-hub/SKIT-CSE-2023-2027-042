import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leavesApi } from '../../api/leaves';
import { employeesApi } from '../../api/employees';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function AdminLeavesPage() {
  const [searchParams] = useSearchParams();
  const initialEmployeeId = searchParams.get('employeeId') || '';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters - default status PENDING
  const [status, setStatus] = useState('PENDING');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [leaveType, setLeaveType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Dropdown options
  const [employees, setEmployees] = useState([]);

  // Review modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // APPROVED or REJECTED
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    employeesApi.getAllActive().then(setEmployees).catch(console.error);
  }, []);

  const fetchLeaves = useCallback(async () => {
    if (from && to && from > to) {
      showToast('From date cannot be after To date', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await leavesApi.getLeavesAdmin({
        status,
        employeeId,
        leaveType,
        from,
        to,
        page,
        size: 10
      });
      setLeaves(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, employeeId, leaveType, from, to, page, showToast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const openReviewModal = (leave, action = 'APPROVED') => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setRemarks('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (reviewAction === 'REJECTED' && !remarks.trim()) {
      setErrorMsg('Remarks are required when rejecting a leave request');
      return;
    }

    setSubmitting(true);
    try {
      await leavesApi.reviewLeave(selectedLeave.id, {
        status: reviewAction,
        remarks: remarks.trim() || null
      });
      showToast(`Leave request ${reviewAction.toLowerCase()} successfully`, 'success');
      setModalOpen(false);
      fetchLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Review failed';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employeeName',
      render: (val, row) => (
        <div>
          <strong>{val || '—'}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.employeeCode}</div>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'leaveType',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Period',
      key: 'startDate',
      render: (val, row) => (
        <div>
          <span>{formatDate(val)} to {formatDate(row.endDate)}</span>
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
      header: 'Review Details',
      key: 'reviewerName',
      render: (val, row) => {
        if (!row.reviewedAt) return '—';
        return (
          <div style={{ fontSize: '0.75rem' }}>
            <div>By: <strong>{val || 'Admin'}</strong></div>
            {row.adminRemarks && <div style={{ color: 'var(--text-muted)' }}>"{row.adminRemarks}"</div>}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => {
        if (row.status !== 'PENDING') return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Closed</span>;
        return (
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openReviewModal(row, 'APPROVED')}
            >
              Approve
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => openReviewModal(row, 'REJECTED')}
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Review employee leave applications and maintain attendance balances"
      />

      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
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

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.employeeCode})
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={leaveType}
          onChange={(e) => {
            setLeaveType(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Leave Types</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="EARNED">Earned Leave</option>
          <option value="UNPAID">Unpaid Leave</option>
        </select>

        <input
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(0);
          }}
          placeholder="From Date"
          title="From date"
        />

        <input
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(0);
          }}
          placeholder="To Date"
          title="To date"
        />
      </div>

      {loading ? (
        <Loader message="Loading leave requests..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={leaves}
            emptyMessage="No leave requests found matching filters."
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

      {/* Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Review Leave: ${selectedLeave?.employeeName}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              className={`btn ${reviewAction === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
              onClick={handleReviewSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : `Confirm ${reviewAction === 'APPROVED' ? 'Approval' : 'Rejection'}`}
            </button>
          </>
        }
      >
        {selectedLeave && (
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ background: 'var(--bg-muted)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
              <div><strong>Period: </strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.days} days)</div>
              <div><strong>Type: </strong> {selectedLeave.leaveType}</div>
              <div><strong>Reason: </strong> {selectedLeave.reason}</div>
            </div>

            <Field label="Decision" required>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={reviewAction === 'APPROVED'}
                    onChange={() => setReviewAction('APPROVED')}
                  />
                  <span>Approve Leave</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={reviewAction === 'REJECTED'}
                    onChange={() => setReviewAction('REJECTED')}
                  />
                  <span>Reject Leave</span>
                </label>
              </div>
            </Field>

            <Field
              label="Administrative Remarks"
              required={reviewAction === 'REJECTED'}
              hint={reviewAction === 'REJECTED' ? 'Mandatory reason for rejection' : 'Optional notes'}
            >
              <textarea
                className="form-textarea"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={reviewAction === 'REJECTED' ? 'Explain why the leave request is being rejected...' : 'Optional approval comments...'}
                autoFocus
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  );
}
