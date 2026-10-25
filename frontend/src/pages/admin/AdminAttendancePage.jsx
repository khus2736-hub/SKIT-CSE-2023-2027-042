import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate, formatDateTime, formatHours } from '../../utils/formatters';

export default function AdminAttendancePage() {
  const [searchParams] = useSearchParams();
  const initialEmployeeId = searchParams.get('employeeId') || '';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [departmentId, setDepartmentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown options
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { showToast } = useToast();

  useEffect(() => {
    employeesApi.getAllActive().then(setEmployees).catch(console.error);
    departmentsApi.getDepartments({ active: true }).then(setDepartments).catch(console.error);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (from && to && from > to) {
      showToast('From date cannot be after To date', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await attendanceApi.getAttendanceAdmin({
        employeeId,
        departmentId,
        from,
        to,
        status,
        page,
        size: 10
      });
      setRecords(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  }, [employeeId, departmentId, from, to, status, page, showToast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      render: (val) => <strong>{formatDate(val)}</strong>
    },
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
      header: 'Check In',
      key: 'checkIn',
      render: (val, row) => (
        <div>
          <span>{formatDateTime(val)}</span>
          {row.late && <span style={{ marginLeft: '0.5rem', background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Late</span>}
        </div>
      )
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (val) => formatDateTime(val)
    },
    {
      header: 'Duration',
      key: 'workHours',
      render: (val) => formatHours(val)
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Records"
        subtitle="Monitor workforce presence, timeliness, and daily logged hours"
      />

      <div className="filters-bar">
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
          style={{ width: 'auto', minWidth: '160px' }}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
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

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="HALF_DAY">Half Day</option>
        </select>

        {(employeeId || departmentId || from || to || status) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setEmployeeId('');
              setDepartmentId('');
              setFrom('');
              setTo('');
              setStatus('');
              setPage(0);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading attendance records..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={records}
            emptyMessage="No attendance records found matching filters."
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
