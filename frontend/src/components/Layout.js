
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useApi } from '../hooks/useApi';
import { socialAPI } from '../services/api';

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/erp', icon: '💰', label: 'Finance / ERP' },
  { to: '/crm', icon: '🤝', label: 'CRM' },
  { to: '/hrm', icon: '👥', label: 'HR Management' },
  { to: '/ats', icon: '🎯', label: 'Recruiting' },
  { to: '/projects', icon: '📋', label: 'Projects' },
  { to: '/tracking', icon: '⏱', label: 'Time Tracking' },
  { to: '/social', icon: '📱', label: 'Social / CMS' },
];

export default function Layout() {
  const { user, org, logout, toggleTheme, theme, sidebarOpen, toggleSidebar } = useStore();
  const navigate = useNavigate();
  const { data: unread } = useApi(socialAPI.unreadCount, [], { initial: { unread: 0 } });

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
          {sidebarOpen && <span className="font-bold text-gray-900 dark:text-white">Nexus</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors relative ${
                  isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
              <span className="text-base flex-shrink-0">{n.icon}</span>
              {sidebarOpen && <span>{n.label}</span>}
              {n.to === '/social' && unread?.unread > 0 && (
                <span className={`${sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1'} bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center`}>{unread.unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
          <NavLink to="/settings" className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <span>⚙️</span>{sidebarOpen && <span>Settings</span>}
          </NavLink>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>{sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {sidebarOpen && user && (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.first_name} {user.last_name}</div>
                <div className="text-xs text-gray-400 truncate">{user.role}</div>
              </div>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500" title="Logout">⬡</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-lg">☰</button>
          {org && <span className="text-sm text-gray-500 dark:text-gray-400">{org.name}</span>}
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
