import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isAdmin, isLinkedEmployee, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const displayName = user?.employeeName || user?.username || 'User';
  const avatarLetter = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="app-layout">
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <polyline points="16 11 18 13 22 9"></polyline>
          </svg>
          <span className="sidebar-logo-text">Amagen EMS</span>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <span className="nav-section-title">Administration</span>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Employees
              </NavLink>
              <NavLink to="/admin/departments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Departments
              </NavLink>
              <NavLink to="/admin/designations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Designations
              </NavLink>
              <NavLink to="/admin/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Attendance
              </NavLink>
              <NavLink to="/admin/leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Leave Requests
              </NavLink>
              <NavLink to="/admin/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Task Monitoring
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                User Accounts
              </NavLink>
              <NavLink to="/admin/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Reports
              </NavLink>

              {isLinkedEmployee && (
                <>
                  <span className="nav-section-title">My Workspace</span>
                  <NavLink to="/employee/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                    My Attendance
                  </NavLink>
                  <NavLink to="/employee/leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                    My Leaves
                  </NavLink>
                  <NavLink to="/employee/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                    My Tasks
                  </NavLink>
                </>
              )}
            </>
          ) : (
            <>
              <span className="nav-section-title">Employee Portal</span>
              <NavLink to="/employee/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Dashboard
              </NavLink>
              <NavLink to="/employee/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Attendance
              </NavLink>
              <NavLink to="/employee/leaves" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                Leave Applications
              </NavLink>
              <NavLink to="/employee/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                My Tasks
              </NavLink>
            </>
          )}

          <span className="nav-section-title">Account</span>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            Profile & Security
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          Phase 1 ERP &bull; Amagen Pharma
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
              {isAdmin ? 'Admin Console' : 'Employee Portal'}
            </span>
          </div>

          <div className="topbar-right">
            <NavLink to="/profile" className="user-badge" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="user-avatar">{avatarLetter}</div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </NavLink>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              aria-label="Log out of application"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
