import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../../api/reports';
import { departmentsApi } from '../../api/departments';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { exportToCsv } from '../../utils/csvExport';
import { formatDate } from '../../utils/formatters';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('employees'); // employees, attendance, leaves, tasks
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Common filters
  const [departmentId, setDepartmentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    departmentsApi.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const fetchReport = useCallback(async () => {
    if (from && to && from > to) {
      showToast('From date cannot be after To date', 'error');
      return;
    }

    setLoading(true);
    try {
      let res = [];
      if (activeTab === 'employees') {
        res = await reportsApi.getEmployeesReport({ departmentId, status });
      } else if (activeTab === 'attendance') {
        res = await reportsApi.getAttendanceReport({ from, to, departmentId });
      } else if (activeTab === 'leaves') {
        res = await reportsApi.getLeavesReport({ from, to, departmentId });
      } else if (activeTab === 'tasks') {
        res = await reportsApi.getTasksReport({ from, to, departmentId });
      }
      setData(res);
    } catch (err) {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, departmentId, from, to, status, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      showToast('No data available to export', 'error');
      return;
    }

    if (activeTab === 'employees') {
      const headers = [
        { label: 'Employee Code', key: 'employeeCode' },
        { label: 'First Name', key: 'firstName' },
        { label: 'Last Name', key: 'lastName' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Department', key: 'departmentName' },
        { label: 'Designation', key: 'designationTitle' },
        { label: 'Status', key: 'status' },
        { label: 'Joining Date', key: 'joiningDate' }
      ];
      exportToCsv('amagen_employees_report', headers, data);
    } else if (activeTab === 'attendance') {
      const headers = [
        { label: 'Employee Code', key: 'employeeCode' },
        { label: 'Employee Name', key: 'employeeName' },
        { label: 'Department', key: 'departmentName' },
        { label: 'Present Days', key: 'presentDays' },
        { label: 'Half Days', key: 'halfDays' },
        { label: 'Late Days', key: 'lateDays' },
        { label: 'Total Hours', key: 'totalHours' }
      ];
      exportToCsv('amagen_attendance_report', headers, data);
    } else if (activeTab === 'leaves') {
      const headers = [
        { label: 'Employee Code', key: 'employeeCode' },
        { label: 'Employee Name', key: 'employeeName' },
        { label: 'Department', key: 'departmentName' },
        { label: 'Total Requests', key: 'totalRequests' },
        { label: 'Pending', key: 'pending' },
        { label: 'Approved', key: 'approved' },
        { label: 'Rejected', key: 'rejected' },
        { label: 'Cancelled', key: 'cancelled' },
        { label: 'Approved Days', key: 'approvedDays' }
      ];
      exportToCsv('amagen_leaves_report', headers, data);
    } else if (activeTab === 'tasks') {
      const headers = [
        { label: 'Employee Code', key: 'employeeCode' },
        { label: 'Employee Name', key: 'employeeName' },
        { label: 'Department', key: 'departmentName' },
        { label: 'Total Tasks', key: 'total' },
        { label: 'Pending', key: 'pending' },
        { label: 'In Progress', key: 'inProgress' },
        { label: 'Completed', key: 'completed' },
        { label: 'Overdue', key: 'overdue' }
      ];
      exportToCsv('amagen_tasks_report', headers, data);
    }
    showToast('Report downloaded successfully!', 'success');
  };

  // Define table columns according to current tab
  const getColumns = () => {
    if (activeTab === 'employees') {
      return [
        { header: 'Code', key: 'employeeCode', render: (val) => <strong>{val}</strong> },
        { header: 'Name', key: 'firstName', render: (_, r) => `${r.firstName} ${r.lastName}` },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Department', key: 'departmentName', render: (val) => val || '—' },
        { header: 'Designation', key: 'designationTitle', render: (val) => val || '—' },
        { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
        { header: 'Joining Date', key: 'joiningDate', render: (val) => formatDate(val) }
      ];
    } else if (activeTab === 'attendance') {
      return [
        { header: 'Code', key: 'employeeCode', render: (val) => <strong>{val}</strong> },
        { header: 'Employee', key: 'employeeName' },
        { header: 'Department', key: 'departmentName', render: (val) => val || '—' },
        { header: 'Present Days', key: 'presentDays' },
        { header: 'Half Days', key: 'halfDays' },
        { header: 'Late Days', key: 'lateDays' },
        { header: 'Total Hours', key: 'totalHours', render: (val) => `${Number(val || 0).toFixed(2)} hrs` }
      ];
    } else if (activeTab === 'leaves') {
      return [
        { header: 'Code', key: 'employeeCode', render: (val) => <strong>{val}</strong> },
        { header: 'Employee', key: 'employeeName' },
        { header: 'Department', key: 'departmentName', render: (val) => val || '—' },
        { header: 'Total Requests', key: 'totalRequests' },
        { header: 'Pending', key: 'pending' },
        { header: 'Approved', key: 'approved' },
        { header: 'Rejected', key: 'rejected' },
        { header: 'Cancelled', key: 'cancelled' },
        { header: 'Approved Days', key: 'approvedDays', render: (val) => <strong>{val} days</strong> }
      ];
    } else if (activeTab === 'tasks') {
      return [
        { header: 'Code', key: 'employeeCode', render: (val) => <strong>{val}</strong> },
        { header: 'Employee', key: 'employeeName' },
        { header: 'Department', key: 'departmentName', render: (val) => val || '—' },
        { header: 'Total Assigned', key: 'total' },
        { header: 'Pending', key: 'pending' },
        { header: 'In Progress', key: 'inProgress' },
        { header: 'Completed', key: 'completed' },
        {
          header: 'Overdue',
          key: 'overdue',
          render: (val) => (
            <span style={{ color: val > 0 ? '#ef4444' : 'inherit', fontWeight: val > 0 ? 600 : 400 }}>
              {val}
            </span>
          )
        }
      ];
    }
    return [];
  };

  return (
    <div>
      <PageHeader
        title="Analytical Reports"
        subtitle="Generate and export organizational workforce data and performance summaries"
        actions={
          <button className="btn btn-primary" onClick={handleExportCsv} disabled={loading || data.length === 0}>
            Download CSV Export
          </button>
        }
      />

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('employees');
            setStatus('');
          }}
        >
          Workforce Directory
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance Summary
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          Leave Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Task Performance
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {activeTab === 'employees' ? (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        ) : (
          <>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="From Date"
              title="From date"
            />
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To Date"
              title="To date"
            />
          </>
        )}

        {(departmentId || from || to || status) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setDepartmentId('');
              setFrom('');
              setTo('');
              setStatus('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader message="Generating report..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={getColumns()}
            data={data}
            emptyMessage="No records found for the selected scope."
          />
        </div>
      )}
    </div>
  );
}
