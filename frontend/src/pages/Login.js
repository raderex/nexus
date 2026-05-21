
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authAPI, orgAPI } from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', org_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, setOrg } = useStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const { data } = await authAPI.login({ username: form.username, password: form.password });
        setAuth(data.access, data.refresh, null);
        const me = await authAPI.me();
        setAuth(data.access, data.refresh, me.data);
        const orgs = await orgAPI.list();
        const orgList = orgs.data?.results || orgs.data || [];
        if (orgList.length) setOrg(orgList[0]);
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
    } finally { setLoading(false); }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-2xl font-bold mb-4">N</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nexus</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All-in-one business platform</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  mode === m ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{m}</button>
            ))}
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${error.includes('created') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">First Name</label><input className="input" placeholder="John" {...f('first_name')} required /></div>
                  <div><label className="label">Last Name</label><input className="input" placeholder="Doe" {...f('last_name')} /></div>
                </div>
                <div><label className="label">Email</label><input className="input" type="email" placeholder="john@company.com" {...f('email')} required /></div>
                <div><label className="label">Organization Name</label><input className="input" placeholder="Acme Inc." {...f('org_name')} required /></div>
              </>
            )}
            <div><label className="label">Username</label><input className="input" placeholder="admin" {...f('username')} required autoComplete="username" /></div>
            <div><label className="label">Password</label><input className="input" type="password" placeholder="••••••••" {...f('password')} required autoComplete="current-password" /></div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 text-base font-semibold">
              {loading ? '⏳ Please wait…' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
              Demo: <code className="font-mono">admin</code> / <code className="font-mono">nexus123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
