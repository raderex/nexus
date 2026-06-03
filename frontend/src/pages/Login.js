import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authAPI, orgAPI } from '../services/api';
import { LogIn, User, Lock, Mail, Building2, UserPlus, Eye, EyeOff } from 'lucide-react';

function Input({ icon: Icon, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === 'password';
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input
        {...props}
        type={isPassword && show ? 'text' : props.type}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-${isPassword ? 10 : 3} py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', org_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, setOrg } = useStore();
  const navigate = useNavigate();

  function f(k) {
    return {
      value: form[k],
      onChange: e => setForm(p => ({ ...p, [k]: e.target.value })),
    };
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { data } = await authAPI.login({ username: form.username, password: form.password });
        setAuth(data.access, data.refresh, null);
        try { const me = await authAPI.me(); setAuth(data.access, data.refresh, me.data); } catch {}
        try { const orgs = await orgAPI.list(); const o = orgs.data?.results || orgs.data || []; if (o.length) setOrg(o[0]); } catch {}
        navigate('/dashboard');
      } else {
        await authAPI.register({
          username: form.username, email: form.email, password: form.password,
          first_name: form.first_name, last_name: form.last_name,
          organization: { name: form.org_name },
        });
        setMode('login');
        setError('Account created! Please log in.');
      }
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.detail || d?.username?.[0] || d?.password?.[0] || Object.values(d || {})?.[0]?.[0] || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25 mb-4">
            N
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Nexus</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className={`p-3 rounded-xl text-sm font-medium ${error.includes('created') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">First name</label>
                <Input placeholder="John" {...f('first_name')} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Last name</label>
                <Input placeholder="Doe" {...f('last_name')} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Username</label>
            <Input icon={User} placeholder="admin" {...f('username')} required autoComplete="username" />
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                <Input icon={Mail} type="email" placeholder="john@company.com" {...f('email')} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization</label>
                <Input icon={Building2} placeholder="Acme Inc." {...f('org_name')} required />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
            <Input icon={Lock} type="password" placeholder="Enter your password" {...f('password')} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : mode === 'login' ? (
              <><LogIn size={16} /> Sign in</>
            ) : (
              <><UserPlus size={16} /> Create account</>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{mode === 'login' ? 'Register' : 'Sign in'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
