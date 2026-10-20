import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Bell,
  User,
  Users,
  Send,
  Settings,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      {isAdmin ? (
        <>
          <div className="sidebar-heading">Admin Management</div>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/admin/customers"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Customers</span>
          </NavLink>
          <NavLink
            to="/admin/documents"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>All Documents</span>
          </NavLink>
          <NavLink
            to="/admin/reminders"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Send size={18} />
            <span>Reminder Logs</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>System Settings</span>
          </NavLink>
        </>
      ) : (
        <>
          <div className="sidebar-heading">Main Navigation</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>My Documents</span>
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <User size={18} />
            <span>Settings & Profile</span>
          </NavLink>
        </>
      )}
    </aside>
  );
};
