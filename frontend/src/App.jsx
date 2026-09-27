import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ForbiddenPage from './pages/ForbiddenPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import EmployeeFormPage from './pages/admin/EmployeeFormPage';
import EmployeeDetailsPage from './pages/admin/EmployeeDetailsPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import DesignationsPage from './pages/admin/DesignationsPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import AdminLeavesPage from './pages/admin/AdminLeavesPage';
import AdminTasksPage from './pages/admin/AdminTasksPage';
import UsersPage from './pages/admin/UsersPage';
import ReportsPage from './pages/admin/ReportsPage';

// Employee Pages
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';
import MyAttendancePage from './pages/employee/MyAttendancePage';
import MyLeavesPage from './pages/employee/MyLeavesPage';
import MyTasksPage from './pages/employee/MyTasksPage';

function RootRedirect() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Error Pages */}
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Protected App Routes under Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Profile - accessible by any authenticated user */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* ADMIN Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <EmployeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/new"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <EmployeeFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/:id"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <EmployeeDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees/:id/edit"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <EmployeeFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/designations"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <DesignationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leaves"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminLeavesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* EMPLOYEE Routes (and linked admins for my workspace) */}
              <Route
                path="/employee/dashboard"
                element={
                  <ProtectedRoute roles={['EMPLOYEE']} requireEmployee={true}>
                    <EmployeeDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/attendance"
                element={
                  <ProtectedRoute requireEmployee={true}>
                    <MyAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/leaves"
                element={
                  <ProtectedRoute requireEmployee={true}>
                    <MyLeavesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/tasks"
                element={
                  <ProtectedRoute requireEmployee={true}>
                    <MyTasksPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
