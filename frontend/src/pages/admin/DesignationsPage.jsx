import React, { useState, useEffect, useCallback } from 'react';
import { designationsApi } from '../../api/designations';
import { departmentsApi } from '../../api/departments';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import ConfirmButton from '../../components/ConfirmButton';
import Loader from '../../components/Loader';

export default function DesignationsPage() {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useToast();

  useEffect(() => {
    departmentsApi.getDepartments({ active: true })
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterActive !== '') params.active = filterActive === 'true';
      if (filterDept) params.departmentId = filterDept;

      const data = await designationsApi.getDesignations(params);
      setDesignations(data);
    } catch (err) {
      showToast('Failed to load designations', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterActive, filterDept, showToast]);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const openCreateModal = () => {
    setEditingDesig(null);
    setTitle('');
    setDepartmentId(filterDept || '');
    setDescription('');
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (desig) => {
    setEditingDesig(desig);
    setTitle(desig.title);
    setDepartmentId(desig.departmentId || '');
    setDescription(desig.description || '');
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!title.trim()) {
      setErrors({ title: 'Designation title is required' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingDesig) {
        await designationsApi.updateDesignation(editingDesig.id, {
          title: title.trim(),
          departmentId: departmentId ? departmentId : null,
          description: description.trim() || null
        });
        showToast('Designation updated successfully', 'success');
      } else {
        await designationsApi.createDesignation({
          title: title.trim(),
          departmentId: departmentId ? departmentId : null,
          description: description.trim() || null
        });
        showToast('Designation created successfully', 'success');
      }
      setModalOpen(false);
      fetchDesignations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save designation';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (desig) => {
    try {
      await designationsApi.setStatus(desig.id, !desig.active);
      showToast(`Designation ${!desig.active ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchDesignations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (desig) => {
    try {
      await designationsApi.deleteDesignation(desig.id);
      showToast('Designation deleted successfully', 'success');
      fetchDesignations();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete designation';
      showToast(msg, 'error');
    }
  };

  const columns = [
    {
      header: 'Designation Title',
      key: 'title',
      render: (val) => <strong>{val}</strong>
    },
    {
      header: 'Department',
      key: 'departmentName',
      render: (val) => val ? val : <span style={{ color: 'var(--text-muted)' }}>Shared / Cross-dept</span>
    },
    {
      header: 'Description',
      key: 'description',
      render: (val) => val || '—'
    },
    {
      header: 'Staff Count',
      key: 'employeeCount',
      render: (val) => `${val} employees`
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
          <button className="btn btn-secondary btn-sm" onClick={() => handleToggleStatus(row)}>
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
        title="Designations"
        subtitle="Manage job titles, hierarchies, and cross-functional roles"
        actions={
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Designation
          </button>
        }
      />

      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments (Incl. Shared)</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Disabled Only</option>
        </select>
      </div>

      {loading ? (
        <Loader message="Loading designations..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={designations}
            emptyMessage="No designations configured"
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDesig ? 'Edit Designation' : 'Create Designation'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : editingDesig ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Designation Title" required error={errors.title}>
            <input
              type="text"
              className={`form-input ${errors.title ? 'has-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Quality Analyst"
              autoFocus
            />
          </Field>

          <Field label="Department" hint="Leave empty for shared designations (e.g. Manager, Executive)">
            <select
              className="form-select"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">— Shared (No specific department) —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities and expectations..."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
