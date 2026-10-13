import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { designationsApi } from '../../api/designations';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmButton from '../../components/ConfirmButton';
import Loader from '../../components/Loader';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown options
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const { showToast } = useToast();

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load dropdown options
  useEffect(() => {
    departmentsApi.getDepartments().then(setDepartments).catch(console.error);
    designationsApi.getDesignations().then(setDesignations).catch(console.error);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeesApi.getEmployees({
        search: debouncedSearch,
        departmentId,
        designationId,
        status,
        page,
        size: 10
      });
      setEmployees(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, departmentId, designationId, status, page, showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggleStatus = async (employee) => {
    const isActivating = employee.status === 'INACTIVE';
    try {
      if (isActivating) {
        await employeesApi.activate(employee.id);
        showToast(`Activated ${employee.firstName} ${employee.lastName}`, 'success');
      } else {
        await employeesApi.deactivate(employee.id);
        showToast(`Deactivated ${employee.firstName} ${employee.lastName}`, 'success');
      }
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      showToast(msg, 'error');
    }
  };

  const columns = [
    {
      header: 'Code',
      key: 'employeeCode',
      render: (val, row) => (
        <Link to={`/admin/employees/${row.id}`} style={{ fontWeight: 600 }}>
          {val}
        </Link>
      )
    },
    {
      header: 'Name',
      key: 'firstName',
      render: (_, row) => (
        <div>
          <strong>{row.firstName} {row.lastName}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Department',
      key: 'departmentName',
      render: (val) => val || '—'
    },
    {
      header: 'Designation',
      key: 'designationTitle',
      render: (val) => val || '—'
    },
    {
      header: 'Phone',
      key: 'phone'
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Actions',
      key: 'id',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Link to={`/admin/employees/${row.id}`} className="btn btn-secondary btn-sm" title="View Details">
            View
          </Link>
          <Link to={`/admin/employees/${row.id}/edit`} className="btn btn-secondary btn-sm" title="Edit">
            Edit
          </Link>
          <ConfirmButton
            onConfirm={() => handleToggleStatus(row)}
            confirmText={row.status === 'ACTIVE' ? 'Deactivate?' : 'Activate?'}
            className={row.status === 'ACTIVE' ? 'btn btn-outline-danger btn-sm' : 'btn btn-secondary btn-sm'}
          >
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </ConfirmButton>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        subtitle="Manage workforce profiles, roles, and records"
        actions={
          <Link to="/admin/employees/new" className="btn btn-primary">
            + Add Employee
          </Link>
        }
      />

      {/* Filters bar */}
      <div className="filters-bar">
        <input
          type="text"
          className="form-input filter-input"
          placeholder="Search by code, name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={designationId}
          onChange={(e) => {
            setDesignationId(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Designations</option>
          {designations.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '130px' }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <Loader message="Loading employees..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={employees}
            emptyMessage="No employees found matching the filters."
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
