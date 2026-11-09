import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { dashboardApi } from '../../api/dashboard';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getAdminDashboard()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loader message="Loading dashboard metrics..." />;
  }

  if (!data) {
    return <div className="card">Unable to load dashboard data.</div>;
  }

  // Task chart data
  const taskChartData = [
    { name: 'Pending', value: data.taskStats.pending },
    { name: 'In Progress', value: data.taskStats.inProgress },
    { name: 'Completed', value: data.taskStats.completed }
  ].filter((d) => d.value > 0);

  const leaveColumns = [
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
      header: 'Dates',
      key: 'startDate',
      render: (val, row) => `${formatDate(val)} to ${formatDate(row.endDate)} (${row.days}d)`
    },
    {
      header: 'Reason',
      key: 'reason'
    },
    {
      header: 'Action',
      key: 'id',
      render: (id) => (
        <Link to={`/admin/leaves`} className="btn btn-secondary btn-sm">
          Review
        </Link>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Operational overview of Amagen Pharma workforce"
      />

      {/* Top Stat Cards */}
      <div className="stat-grid">
        <StatCard
          label="Total Employees"
          value={data.totalEmployees}
          meta={`${data.activeEmployees} active • ${data.inactiveEmployees} inactive`}
        />
        <StatCard
          label="Today's Attendance"
          value={`${data.attendanceToday.present + data.attendanceToday.halfDay} / ${data.activeEmployees}`}
          meta={`${data.attendanceToday.present} Present • ${data.attendanceToday.halfDay} Half Day • ${data.attendanceToday.late} Late`}
        />
        <StatCard
          label="Pending Leaves"
          value={data.pendingLeaves}
          meta={data.pendingLeaves > 0 ? 'Requires administrative review' : 'All caught up'}
        />
        <StatCard
          label="Task Monitoring"
          value={data.taskStats.total}
          meta={`${data.taskStats.completed} Done • ${data.taskStats.overdue} Overdue`}
        />
      </div>

      {/* Charts Grid */}
      <div className="chart-grid">
        {/* Attendance Trend Line Chart */}
        <div className="card">
          <h2 className="card-title">7-Day Attendance Trend</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={data.attendanceTrend} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="present" name="Present Count" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employees by Department Bar Chart */}
        <div className="card">
          <h2 className="card-title">Workforce by Department</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.employeesByDepartment} margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Active Staff" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Pie Chart */}
        <div className="card">
          <h2 className="card-title">Task Status Breakdown</h2>
          <div style={{ width: '100%', height: 260 }}>
            {taskChartData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={taskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No task data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Pending Leaves */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Pending Leave Approvals</h2>
          <Link to="/admin/leaves" className="btn btn-secondary btn-sm">
            View All Leaves
          </Link>
        </div>
        <DataTable
          columns={leaveColumns}
          data={data.recentLeaveRequests}
          emptyMessage="No pending leave requests"
        />
      </div>
    </div>
  );
}
