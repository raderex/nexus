
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { useApi } from '../hooks/useApi';
import { orgAPI } from '../services/api';
import { fmt } from '../utils/format';

export default function Dashboard() {
  const { user, org } = useStore();
  const orgId = org?.id;
  const { data: stats, loading } = useApi(
    () => orgId ? orgAPI.stats(orgId) : Promise.resolve({ data: {} }),
    [orgId], { initial: {} }
  );

  const cards = [
    { label: 'Employees', value: stats?.total_employees ?? '—', icon: '👥', to: '/hrm', color: 'indigo' },
    { label: 'Active Projects', value: stats?.total_projects ?? '—', icon: '📋', to: '/projects', color: 'blue' },
    { label: 'Open Deals', value: stats?.total_deals ?? '—', icon: '🤝', to: '/crm', color: 'green' },
    { label: 'Open Tasks', value: stats?.open_tasks ?? '—', icon: '✅', to: '/projects', color: 'purple' },
    { label: 'Revenue', value: stats?.total_income ? fmt.currency(stats.total_income) : '—', icon: '💰', to: '/erp', color: 'emerald' },
    { label: 'Expenses', value: stats?.total_expenses ? fmt.currency(stats.total_expenses) : '—', icon: '📉', to: '/erp', color: 'red' },
    { label: 'Contacts', value: stats?.total_contacts ?? '—', icon: '📇', to: '/crm', color: 'orange' },
    { label: 'Unread Messages', value: stats?.unread_messages ?? '—', icon: '💬', to: '/social', color: 'pink' },
  ];

  const COLOR = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  };

  const modules = [
    { to: '/erp', icon: '💰', label: 'Finance & ERP', desc: 'Invoices, expenses, accounting' },
    { to: '/crm', icon: '🤝', label: 'CRM', desc: 'Contacts, deals, pipeline' },
    { to: '/hrm', icon: '👥', label: 'HR Management', desc: 'Employees, leave, payroll, reviews' },
    { to: '/ats', icon: '🎯', label: 'Recruiting (ATS)', desc: 'Jobs, applicants, interviews, offers' },
    { to: '/projects', icon: '📋', label: 'Projects & PM', desc: 'Tasks, sprints, Kanban board' },
    { to: '/tracking', icon: '⏱', label: 'Time Tracking', desc: 'Timer, approvals, productivity' },
    { to: '/social', icon: '📱', label: 'Social & CMS', desc: 'Posts, inbox, campaigns, AI' },
    { to: '/settings', icon: '⚙️', label: 'Settings', desc: 'Organization, users, integrations' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name || user?.username} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">{org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${COLOR[c.color]}`}>{c.icon}</div>
            <div className={`text-2xl font-bold text-gray-900 dark:text-white ${loading ? 'animate-pulse' : ''}`}>{c.value}</div>
            <div className="text-sm text-gray-500 mt-0.5 group-hover:text-indigo-600 transition-colors">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">All Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map(m => (
            <Link key={m.to} to={m.to}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group">
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
