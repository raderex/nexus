
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { useApi } from '../hooks/useApi';
import { orgAPI } from '../services/api';
import { fmt } from '../utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '@kaushalparajuli/react-crud-ui';
import { Users, ClipboardList, HeartHandshake as HandshakeIcon, CheckSquare, DollarSign, TrendingDown, Contact, MessageSquare, Target, Clock, Smartphone, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user, org } = useStore();
  const orgId = org?.id;
  const { data: stats, loading } = useApi(
    () => orgId ? orgAPI.stats(orgId) : Promise.resolve({ data: {} }),
    [orgId], { initial: {} }
  );

  const cards = [
    { label: 'Employees', value: stats?.total_employees ?? '—', icon: <Users size={20} />, to: '/hrm', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Active Projects', value: stats?.total_projects ?? '—', icon: <ClipboardList size={20} />, to: '/projects', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Open Deals', value: stats?.total_deals ?? '—', icon: <HandshakeIcon size={20} />, to: '/crm', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Open Tasks', value: stats?.open_tasks ?? '—', icon: <CheckSquare size={20} />, to: '/projects', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Revenue', value: stats?.total_income ? fmt.currency(stats.total_income) : '—', icon: <DollarSign size={20} />, to: '/erp', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Expenses', value: stats?.total_expenses ? fmt.currency(stats.total_expenses) : '—', icon: <TrendingDown size={20} />, to: '/erp', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    { label: 'Contacts', value: stats?.total_contacts ?? '—', icon: <Contact size={20} />, to: '/crm', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Unread Messages', value: stats?.unread_messages ?? '—', icon: <MessageSquare size={20} />, to: '/social', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
  ];

  const modules = [
    { to: '/erp', icon: <DollarSign size={24} className="text-emerald-500" />, label: 'Finance & ERP', desc: 'Invoices, expenses, accounting' },
    { to: '/crm', icon: <HandshakeIcon size={24} className="text-blue-500" />, label: 'CRM', desc: 'Contacts, deals, pipeline' },
    { to: '/hrm', icon: <Users size={24} className="text-indigo-500" />, label: 'HR Management', desc: 'Employees, leave, payroll, reviews' },
    { to: '/ats', icon: <Target size={24} className="text-red-500" />, label: 'Recruiting (ATS)', desc: 'Jobs, applicants, interviews, offers' },
    { to: '/projects', icon: <ClipboardList size={24} className="text-purple-500" />, label: 'Projects & PM', desc: 'Tasks, sprints, Kanban board' },
    { to: '/tracking', icon: <Clock size={24} className="text-orange-500" />, label: 'Time Tracking', desc: 'Timer, approvals, productivity' },
    { to: '/social', icon: <Smartphone size={24} className="text-pink-500" />, label: 'Social & CMS', desc: 'Posts, inbox, campaigns, AI' },
    { to: '/settings', icon: <Settings size={24} className="text-gray-500" />, label: 'Settings', desc: 'Organization, users, integrations' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name || user?.username}
        </h1>
        <p className="text-sm text-gray-500 mt-2">{org?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="block group">
            <Card className="h-full transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg dark:hover:shadow-indigo-500/10">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>
                  {c.icon}
                </div>
                <div>
                  <div className={`text-2xl font-bold text-gray-900 dark:text-white ${loading ? 'animate-pulse' : ''}`}>
                    {c.value}
                  </div>
                  <div className="text-sm font-medium text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1">
                    {c.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map(m => (
            <Link key={m.to} to={m.to} className="block group">
              <Card className="h-full transition-all duration-200 hover:border-indigo-500/50 hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-base">
                    {m.icon}
                    <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {m.label}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{m.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
