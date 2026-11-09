import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import CheckInCard from '../../components/CheckInCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function EmployeeDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDashboard = () => {
    dashboardApi.getEmployeeDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      showToast('Task status updated', 'success');
      fetchDashboard();
    } catch (err) {
      showToast('Failed to update task status', 'error');
    }
  };

  if (loading) {
    return <Loader message="Loading your dashboard..." />;
  }

  if (!data) {
    return <div className="card">Unable to load dashboard data.</div>;
  }

  const taskColumns = [
    {
      header: 'Task Title',
      key: 'title',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {val}
            {row.overdue && <span className="badge badge-overdue" style={{ fontSize: '0.65rem' }}>OVERDUE</span>}
          </div>
          {row.description && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      render: (val) => formatDate(val)
    },
    {
      header: 'Update Status',
      key: 'status',
      render: (val, row) => (
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          value={val}
          onChange={(e) => handleTaskStatusChange(row.id, e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${data.employee?.firstName || 'Colleague'}!`}
        subtitle={`${data.employee?.designationTitle || 'Employee'} • ${data.employee?.departmentName || 'Amagen Pharma'}`}
      />

      {/* Check In / Out Card */}
      <CheckInCard onStatusChange={() => fetchDashboard()} />

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <StatCard
          label="This Month's Attendance"
          value={`${data.monthAttendance.presentDays} days`}
          meta={`${data.monthAttendance.totalHours} hrs logged • ${data.monthAttendance.lateDays} late`}
        />
        <StatCard
          label="Leave Summary (Year)"
          value={`${data.leaveSummary.approvedDaysThisYear} days taken`}
          meta={`${data.leaveSummary.pending} pending • ${data.leaveSummary.approved} approved`}
        />
        <StatCard
          label="My Active Tasks"
          value={data.taskStats.pending + data.taskStats.inProgress}
          meta={`${data.taskStats.inProgress} in progress • ${data.taskStats.overdue} overdue`}
        />
        <StatCard
          label="Completed Tasks"
          value={data.taskStats.completed}
          meta={`Out of ${data.taskStats.total} total assigned`}
        />
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Upcoming Assigned Tasks</h2>
          <Link to="/employee/tasks" className="btn btn-secondary btn-sm">
            View All Tasks
          </Link>
        </div>
        <DataTable
          columns={taskColumns}
          data={data.upcomingTasks}
          emptyMessage="No pending tasks assigned to you right now. Great job!"
        />
      </div>
    </div>
  );
}
