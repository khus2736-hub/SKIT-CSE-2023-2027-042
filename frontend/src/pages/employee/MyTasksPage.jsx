import React, { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import { formatDate } from '../../utils/formatters';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { showToast } = useToast();

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getMyTasks({
        status,
        priority,
        page,
        size: 10
      });
      setTasks(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load your tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, priority, page, showToast]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      showToast('Task status updated successfully', 'success');
      fetchMyTasks();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update task status';
      showToast(msg, 'error');
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
            {row.overdue && <span className="badge badge-overdue" style={{ fontSize: '0.65rem' }}>OVERDUE</span>}
          </div>
          {row.description && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {row.description}
            </div>
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
      header: 'Assigned By',
      key: 'assignerName',
      render: (val) => val || 'Management'
    },
    {
      header: 'My Status Update',
      key: 'status',
      render: (val, row) => (
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '130px', fontSize: '0.8125rem' }}
          value={val}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
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
        title="My Assigned Tasks"
        subtitle="Manage your daily assignments, update milestones, and track deadlines"
      />

      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
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
          style={{ width: 'auto', minWidth: '140px' }}
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

        {(status || priority) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setStatus('');
              setPriority('');
              setPage(0);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading assigned tasks..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={tasks}
            emptyMessage="No tasks found matching your filter selection."
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
