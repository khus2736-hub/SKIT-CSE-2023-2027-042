import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import Loader from '../../components/Loader';
import { formatDateTime } from '../../utils/formatters';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Role Change Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Password Reset Modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getUsers({
        role,
        search: debouncedSearch,
        page,
        size: 10
      });
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, debouncedSearch, page, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.id === currentUser?.id) {
      showToast('You cannot change your own role', 'error');
      return;
    }

    setRoleSubmitting(true);
    try {
      await usersApi.changeRole(selectedUser.id, newRole);
      showToast('User role updated successfully', 'success');
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change role';
      showToast(msg, 'error');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const openPasswordModal = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setPwdError('');
    setPwdModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (!newPassword) {
      setPwdError('Password is required');
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
      setPwdError('Password must be between 8 and 64 characters');
      return;
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(newPassword)) {
      setPwdError('Password must contain at least one letter and one number');
      return;
    }

    setPwdSubmitting(true);
    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      showToast(`Password reset for ${selectedUser.username}`, 'success');
      setPwdModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setPwdError(msg);
      showToast(msg, 'error');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Username / Email',
      key: 'username',
      render: (val, row) => (
        <div>
          <strong>{val}</strong>
          {row.id === currentUser?.id && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
              (Current You)
            </span>
          )}
        </div>
      )
    },
    {
      header: 'System Role',
      key: 'role',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Linked Employee',
      key: 'employeeName',
      render: (val, row) => (
        val ? (
          <span>{val}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unlinked Account</span>
        )
      )
    },
    {
      header: 'Status',
      key: 'enabled',
      render: (val) => <StatusBadge status={val ? 'ACTIVE' : 'INACTIVE'} />
    },
    {
      header: 'Created On',
      key: 'createdAt',
      render: (val) => formatDateTime(val)
    },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openRoleModal(row)}
            disabled={row.id === currentUser?.id}
            title={row.id === currentUser?.id ? 'Cannot change your own role' : 'Change role'}
          >
            Role
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openPasswordModal(row)}
          >
            Reset Pwd
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="User Accounts & Access"
        subtitle="Manage login credentials, authorization roles, and account security"
      />

      <div className="filters-bar">
        <input
          type="text"
          className="form-input filter-input"
          placeholder="Search by email / username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </select>
      </div>

      {loading ? (
        <Loader message="Loading user accounts..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={users}
            emptyMessage="No user accounts found."
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

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role: ${selectedUser?.username}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleRoleSubmit} disabled={roleSubmitting}>
              {roleSubmitting ? 'Updating...' : 'Save Role'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <form onSubmit={handleRoleSubmit}>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Note: An unlinked account cannot be assigned the EMPLOYEE role.
            </p>

            <Field label="System Role" required>
              <select
                className="form-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title={`Reset Password: ${selectedUser?.username}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPwdModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handlePasswordSubmit} disabled={pwdSubmitting}>
              {pwdSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <form onSubmit={handlePasswordSubmit}>
            <Field
              label="New Temporary Password"
              required
              error={pwdError}
              hint="Must be 8-64 chars with at least one letter and one number"
            >
              <input
                type="password"
                className={`form-input ${pwdError ? 'has-error' : ''}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  );
}
