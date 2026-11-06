import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import { employeesApi } from '../../api/employees';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import ConfirmButton from '../../components/ConfirmButton';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function AdminTasksPage() {
  const [searchParams] = useSearchParams();
  const initialAssignee = searchParams.get('assignedTo') || '';

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [assignedTo, setAssignedTo] = useState(initialAssignee);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [overdue, setOverdue] = useState(false);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modalAssignee, setModalAssignee] = useState('');
  const [modalPriority, setModalPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [modalStatus, setModalStatus] = useState('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useToast();

  useEffect(() => {
    employeesApi.getAllActive().then(setEmployees).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getTasksAdmin({
        assignedTo,
        status,
        priority,
        search: debouncedSearch,
        overdue: overdue || undefined,
        page,
        size: 10
      });
      setTasks(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [assignedTo, status, priority, debouncedSearch, overdue, page, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setModalAssignee(assignedTo || (employees[0]?.id || ''));
    setModalPriority('MEDIUM');
    setDueDate('');
    setModalStatus('PENDING');
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setModalAssignee(task.assignedTo);
    setModalPriority(task.priority);
    setDueDate(task.dueDate || '');
    setModalStatus(task.status);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!modalAssignee) newErrors.assignedTo = 'Assignee is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingTask) {
        await tasksApi.updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          assignedTo: modalAssignee,
          priority: modalPriority,
          dueDate,
          status: modalStatus
        });
        showToast('Task updated successfully', 'success');
      } else {
        await tasksApi.createTask({
          title: title.trim(),
          description: description.trim() || null,
          assignedTo: modalAssignee,
          priority: modalPriority,
          dueDate,
          status: modalStatus
        });
        showToast('Task assigned successfully', 'success');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save task';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    try {
      await tasksApi.deleteTask(task.id);
      showToast('Task deleted successfully', 'success');
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete task';
      showToast(msg, 'error');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      showToast('Status updated', 'success');
      fetchTasks();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const columns = [
    {
      header: 'Task Title',
      key: 'title',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {val}
            {row.overdue && (
              <span className="badge badge-overdue" style={{ fontSize: '0.65rem' }}>
                OVERDUE
              </span>
            )}
          </div>
          {row.description && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Assignee',
      key: 'assigneeName',
      render: (val, row) => (
        <div>
          <strong>{val || '—'}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.assigneeCode}</div>
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
      header: 'Status',
      key: 'status',
      render: (val, row) => (
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          value={val}
          onChange={(e) => handleStatusChange(row, e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(row)}>
            Edit
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
        title="Task Monitoring"
        subtitle="Assign tasks, set priorities, and track execution across projects"
        actions={
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Assign Task
          </button>
        }
      />

      <div className="filters-bar">
        <input
          type="text"
          className="form-input filter-input"
          placeholder="Search task title, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={assignedTo}
          onChange={(e) => {
            setAssignedTo(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Assignees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.employeeCode})
            </option>
          ))}
        </select>

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
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '130px' }}
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => {
              setOverdue(e.target.checked);
              setPage(0);
            }}
          />
          <span>Overdue Only</span>
        </label>
      </div>

      {loading ? (
        <Loader message="Loading tasks..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={tasks}
            emptyMessage="No tasks found matching current filters."
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Assign New Task'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Assign Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Task Title" required error={errors.title}>
            <input
              type="text"
              className={`form-input ${errors.title ? 'has-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inspect Batch QC Samples"
              autoFocus
            />
          </Field>

          <Field label="Assign To (Active Employee)" required error={errors.assignedTo}>
            <select
              className={`form-select ${errors.assignedTo ? 'has-error' : ''}`}
              value={modalAssignee}
              onChange={(e) => setModalAssignee(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Priority" required>
              <select
                className="form-select"
                value={modalPriority}
                onChange={(e) => setModalPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </Field>

            <Field label="Due Date" required error={errors.dueDate}>
              <input
                type="date"
                className={`form-input ${errors.dueDate ? 'has-error' : ''}`}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          {editingTask && (
            <Field label="Status" required>
              <select
                className="form-select"
                value={modalStatus}
                onChange={(e) => setModalStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </Field>
          )}

          <Field label="Description" error={errors.description}>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions, scope, or guidelines..."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
