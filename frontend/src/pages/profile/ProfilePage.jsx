import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { employeesApi } from '../../api/employees';
import PageHeader from '../../components/PageHeader';
import Field from '../../components/Field';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';

export default function ProfilePage() {
  const { user, isLinkedEmployee } = useAuth();
  const { showToast } = useToast();

  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isLinkedEmployee) {
      setLoadingEmp(true);
      employeesApi.getMe()
        .then((data) => setEmployeeDetails(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingEmp(false));
    }
  }, [isLinkedEmployee]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8 || newPassword.length > 64) {
      errors.newPassword = 'Password must be between 8 and 64 characters';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one letter and one digit';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setFormErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile & Security"
        subtitle="Manage your credentials and view account information"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Account Details Card */}
        <div className="card">
          <h2 className="card-title">User Account Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Username / Email: </span>
              <strong>{user?.username}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Role: </span>
              <StatusBadge status={user?.role} />
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Account Status: </span>
              <StatusBadge status={user?.enabled ? 'ACTIVE' : 'INACTIVE'} />
            </div>
          </div>

          {isLinkedEmployee && employeeDetails && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Employment Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Employee Code: </span>
                  <strong>{employeeDetails.employeeCode}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name: </span>
                  <strong>{employeeDetails.firstName} {employeeDetails.lastName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Department: </span>
                  <span>{employeeDetails.departmentName || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Designation: </span>
                  <span>{employeeDetails.designationTitle || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                  <span>{employeeDetails.phone}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Joining Date: </span>
                  <span>{formatDate(employeeDetails.joiningDate)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Address: </span>
                  <span>{employeeDetails.address || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 className="card-title">Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <Field label="Current Password" required error={formErrors.currentPassword}>
              <input
                type="password"
                className={`form-input ${formErrors.currentPassword ? 'has-error' : ''}`}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </Field>

            <div style={{ marginTop: '1rem' }}>
              <Field
                label="New Password"
                required
                error={formErrors.newPassword}
                hint="8-64 characters with at least one letter and one number"
              >
                <input
                  type="password"
                  className={`form-input ${formErrors.newPassword ? 'has-error' : ''}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </Field>
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
              <Field label="Confirm New Password" required error={formErrors.confirmPassword}>
                <input
                  type="password"
                  className={`form-input ${formErrors.confirmPassword ? 'has-error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </Field>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
