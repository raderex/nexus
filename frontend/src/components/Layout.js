import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Sun, Moon, LogOut, Settings, LayoutDashboard, DollarSign, UserCheck, Users, Target, ClipboardList, Clock, Share2, BarChart3, CalendarDays, UsersRound } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/erp', icon: DollarSign, label: 'Finance / ERP' },
  { href: '/crm', icon: UserCheck, label: 'CRM' },
  { href: '/hrm', icon: Users, label: 'HR Management' },
  { href: '/ats', icon: Target, label: 'Recruiting' },
  { href: '/projects', icon: ClipboardList, label: 'Projects' },
  { href: '/tracking', icon: Clock, label: 'Time Tracking' },
  { href: '/social', icon: Share2, label: 'Social / CMS' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/team', icon: UsersRound, label: 'Team' },
];

export default function Layout() {
  const { user, org, logout, toggleTheme, theme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
            <span className="font-semibold text-gray-900 dark:text-white">Nexus</span>
            {org && <span className="text-xs text-gray-400 ml-auto">{org.name}</span>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Settings size={16} /> Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.first_name || user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600">
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
