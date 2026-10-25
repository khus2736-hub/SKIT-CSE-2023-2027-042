import React, { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../../api/attendance';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import CheckInCard from '../../components/CheckInCard';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate, formatDateTime, formatHours } from '../../utils/formatters';

export default function MyAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { showToast } = useToast();

  const fetchMyAttendance = useCallback(async () => {
    if (from && to && from > to) {
      showToast('From date cannot be after To date', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await attendanceApi.getMyAttendance({
        from,
        to,
        page,
        size: 10
      });
      setRecords(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load attendance history', 'error');
    } finally {
      setLoading(false);
    }
  }, [from, to, page, showToast]);

  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      render: (val) => <strong>{formatDate(val)}</strong>
    },
    {
      header: 'Check In',
      key: 'checkIn',
      render: (val, row) => (
        <div>
          <span>{formatDateTime(val)}</span>
          {row.late && (
            <span style={{ marginLeft: '0.5rem', background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
              Late
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (val) => formatDateTime(val)
    },
    {
      header: 'Logged Hours',
      key: 'workHours',
      render: (val) => formatHours(val)
    },
    {
      header: 'Daily Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="My Attendance Log"
        subtitle="Review your check-in timings, total hours, and punctuality"
      />

      {/* Check In / Out Card */}
      <CheckInCard onStatusChange={() => fetchMyAttendance()} />

      {/* Date Filter Bar */}
      <div className="filters-bar">
        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Filter by Date Range:</label>
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

        {(from || to) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFrom('');
              setTo('');
              setPage(0);
            }}
          >
            Clear Date Range
          </button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading attendance history..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={records}
            emptyMessage="No attendance records found for this period."
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
    </div>
  );
}
