import React, { useState, useEffect, useCallback } from 'react';
import { departmentsApi } from '../../api/departments';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import ConfirmButton from '../../components/ConfirmButton';
import Loader from '../../components/Loader';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('');

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useToast();

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterActive !== '') params.active = filterActive === 'true';
      const data = await departmentsApi.getDepartments(params);
      setDepartments(data);
    } catch (err) {
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterActive, showToast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Department name is required';
    if (!code.trim()) {
      newErrors.code = 'Department code is required';
    } else if (!/^[A-Za-z0-9]+$/.test(code.trim())) {
      newErrors.code = 'Code must be alphanumeric';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        await departmentsApi.updateDepartment(editingDept.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null
        });
        showToast('Department updated successfully', 'success');
      } else {
        await departmentsApi.createDepartment({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null
        });
        showToast('Department created successfully', 'success');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save department';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await departmentsApi.setStatus(dept.id, !dept.active);
      showToast(`Department ${!dept.active ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (dept) => {
    try {
      await departmentsApi.deleteDepartment(dept.id);
      showToast('Department deleted successfully', 'success');
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete department';
      showToast(msg, 'error');
    }
  };

  const columns = [
    {
      header: 'Code',
      key: 'code',
      render: (val) => <strong>{val}</strong>
    },
    {
      header: 'Department Name',
      key: 'name'
    },
    {
      header: 'Description',
      key: 'description',
      render: (val) => val || '—'
    },
    {
      header: 'Active Staff',
      key: 'employeeCount',
      render: (val) => <span>{val} employees</span>
    },
    {
      header: 'Status',
      key: 'active',
      render: (val) => <StatusBadge status={val ? 'ACTIVE' : 'INACTIVE'} />
    },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(row)}>
            Edit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleToggleStatus(row)}
          >
            {row.active ? 'Disable' : 'Enable'}
          </button>
          <ConfirmButton
            onConfirm={() => handleDelete(row)}
            confirmText="Delete?"
            className="btn btn-outline-danger btn-sm"
          >
            Delete
          </ConfirmButton>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage organizational departments and operational units"
        actions={
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Department
          </button>
        }
      />

      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Disabled Only</option>
        </select>
      </div>

      {loading ? (
        <Loader message="Loading departments..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={departments}
            emptyMessage="No departments configured"
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : editingDept ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Department Name" required error={errors.name}>
            <input
              type="text"
              className={`form-input ${errors.name ? 'has-error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quality Control"
              autoFocus
            />
          </Field>

          <Field label="Department Code" required error={errors.code} hint="Alphanumeric identifier (stored uppercase)">
            <input
              type="text"
              className={`form-input ${errors.code ? 'has-error' : ''}`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. QC"
            />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe department function..."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
