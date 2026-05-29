
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useApi } from '../hooks/useApi';
import { socialAPI } from '../services/api';
import { DashboardLayout } from '@kaushalparajuli/react-crud-ui';
import { Sun, Moon, LogOut, Settings as SettingsIcon } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/erp', icon: '💰', label: 'Finance / ERP' },
  { href: '/crm', icon: '🤝', label: 'CRM' },
  { href: '/hrm', icon: '👥', label: 'HR Management' },
  { href: '/ats', icon: '🎯', label: 'Recruiting' },
  { href: '/projects', icon: '📋', label: 'Projects' },
  { href: '/tracking', icon: '⏱', label: 'Time Tracking' },
  { href: '/social', icon: '📱', label: 'Social / CMS' },
];

export default function Layout() {
  const { user, org, logout, toggleTheme, theme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unread } = useApi(socialAPI.unreadCount, [], { initial: { unread: 0 } });

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <DashboardLayout
      sidebarProps={{
        logo: <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">N</div>,
        title: "Nexus",
        items: NAV,
        activePath: location.pathname,
        onNavigate: (href) => navigate(href),
        footerItems: [
          { href: '/settings', icon: <SettingsIcon size={18} />, label: 'Settings' },
          {
            onClick: toggleTheme,
            icon: theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />,
            label: 'Dark Mode'
          }
        ]
      }}
      headerProps={{
        title: org ? org.name : "Nexus Demo Inc.",
        rightContent: (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {user && (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{user.first_name || user.username}</div>
                  <div className="text-[10px] text-gray-500">{user.role || 'user'}</div>
                </div>
                <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        )
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
