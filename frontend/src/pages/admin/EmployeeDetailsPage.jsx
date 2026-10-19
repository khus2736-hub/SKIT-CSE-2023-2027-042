import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { employeesApi } from '../../api/employees';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeesApi.getById(id)
      .then(setEmployee)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loader message="Loading employee profile..." />;
  }

  if (!employee) {
    return <div className="card">Employee not found.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={`Employee Code: ${employee.employeeCode}`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/employees" className="btn btn-secondary">
              Back to List
            </Link>
            <Link to={`/admin/employees/${id}/edit`} className="btn btn-primary">
              Edit Profile
            </Link>
          </div>
        }
      />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Personal & Employment Information</h2>
          <StatusBadge status={employee.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Email Address</div>
            <strong>{employee.email}</strong>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Phone Number</div>
            <strong>{employee.phone}</strong>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Department</div>
            <strong>{employee.departmentName || '—'}</strong>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Designation</div>
            <strong>{employee.designationTitle || '—'}</strong>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Joining Date</div>
            <strong>{formatDate(employee.joiningDate)}</strong>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Residential Address</div>
            <strong>{employee.address || '—'}</strong>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="card">
        <h2 className="card-title">Employee Activity & Records</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link
            to={`/admin/attendance?employeeId=${id}`}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
          >
            <strong>View Attendance</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inspect daily check-ins & hours</span>
          </Link>

          <Link
            to={`/admin/leaves?employeeId=${id}`}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
          >
            <strong>View Leave Requests</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage applied leave history</span>
          </Link>

          <Link
            to={`/admin/tasks?assignedTo=${id}`}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
          >
            <strong>View Assigned Tasks</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Track progress and deadlines</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
