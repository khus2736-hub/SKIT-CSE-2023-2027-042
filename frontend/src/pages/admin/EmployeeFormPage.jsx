import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { designationsApi } from '../../api/designations';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Field from '../../components/Field';
import Loader from '../../components/Loader';

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [allDesignations, setAllDesignations] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    departmentId: '',
    designationId: '',
    joiningDate: '',
    role: 'EMPLOYEE',
    password: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load active departments and designations
    Promise.all([
      departmentsApi.getDepartments({ active: true }),
      designationsApi.getDesignations({ active: true })
    ])
      .then(([depts, desigs]) => {
        setDepartments(depts);
        setAllDesignations(desigs);
      })
      .catch(console.error);

    if (isEdit) {
      employeesApi.getById(id)
        .then((emp) => {
          setFormData({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            address: emp.address || '',
            departmentId: emp.departmentId || '',
            designationId: emp.designationId || '',
            joiningDate: emp.joiningDate || '',
            role: 'EMPLOYEE',
            password: ''
          });
        })
        .catch((err) => {
          showToast('Failed to load employee details', 'error');
          navigate('/admin/employees');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate, showToast]);

  // Filter designations based on selected department (department specific + shared)
  const filteredDesignations = allDesignations.filter((d) => {
    if (!formData.departmentId) return !d.departmentId; // only shared if no dept selected
    return !d.departmentId || d.departmentId === formData.departmentId;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // If department changed, reset designation if it doesn't belong to the new department
      if (name === 'departmentId') {
        const currentDesig = allDesignations.find((d) => d.id === prev.designationId);
        if (currentDesig && currentDesig.departmentId && currentDesig.departmentId !== value) {
          next.designationId = '';
        }
      }
      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Must be a well-formed email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone must be a 10-digit number';
    }

    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.designationId) newErrors.designationId = 'Designation is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8 || formData.password.length > 64) {
        newErrors.password = 'Password must be between 8 and 64 characters';
      } else if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one letter and one digit';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await employeesApi.updateEmployee(id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address ? formData.address.trim() : null,
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          joiningDate: formData.joiningDate
        });
        showToast('Employee updated successfully', 'success');
      } else {
        await employeesApi.createEmployee({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address ? formData.address.trim() : null,
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          joiningDate: formData.joiningDate,
          role: formData.role,
          password: formData.password
        });
        showToast('Employee and user account created successfully', 'success');
      }
      navigate('/admin/employees');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save employee';
      showToast(msg, 'error');
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading employee form..." />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'Create New Employee'}
        subtitle={isEdit ? 'Update employee records and department assignments' : 'Add a new team member and automatically provision system access'}
        actions={
          <Link to="/admin/employees" className="btn btn-secondary">
            Cancel
          </Link>
        }
      />

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="First Name" required error={errors.firstName}>
              <input
                type="text"
                name="firstName"
                className={`form-input ${errors.firstName ? 'has-error' : ''}`}
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Khushal"
              />
            </Field>

            <Field label="Last Name" required error={errors.lastName}>
              <input
                type="text"
                name="lastName"
                className={`form-input ${errors.lastName ? 'has-error' : ''}`}
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Parewa"
              />
            </Field>

            <Field label="Email Address" required error={errors.email} hint="Used as login username">
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'has-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="khushal@amagen.com"
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone} hint="10-digit mobile number">
              <input
                type="text"
                name="phone"
                maxLength={10}
                className={`form-input ${errors.phone ? 'has-error' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
            </Field>

            <Field label="Department" required error={errors.departmentId}>
              <select
                name="departmentId"
                className={`form-select ${errors.departmentId ? 'has-error' : ''}`}
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </Field>

            <Field label="Designation" required error={errors.designationId}>
              <select
                name="designationId"
                className={`form-select ${errors.designationId ? 'has-error' : ''}`}
                value={formData.designationId}
                onChange={handleChange}
              >
                <option value="">Select Designation</option>
                {filteredDesignations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} {d.departmentId ? '' : '(Shared)'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Joining Date" required error={errors.joiningDate}>
              <input
                type="date"
                name="joiningDate"
                className={`form-input ${errors.joiningDate ? 'has-error' : ''}`}
                value={formData.joiningDate}
                onChange={handleChange}
              />
            </Field>

            {!isEdit && (
              <>
                <Field label="System Access Role" required error={errors.role}>
                  <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </Field>

                <Field
                  label="Initial Password"
                  required
                  error={errors.password}
                  hint="At least 8 chars with 1 letter & 1 digit"
                  fullWidth
                >
                  <input
                    type="password"
                    name="password"
                    className={`form-input ${errors.password ? 'has-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </Field>
              </>
            )}

            <Field label="Address" error={errors.address} fullWidth>
              <textarea
                name="address"
                rows={2}
                className="form-textarea"
                value={formData.address}
                onChange={handleChange}
                placeholder="Residential address..."
              />
            </Field>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link to="/admin/employees" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
