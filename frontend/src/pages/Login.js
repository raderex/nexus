import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authAPI, orgAPI } from '../services/api';
import { LoginPage, Card, CardHeader, CardTitle, CardContent } from '@kaushalparajuli/react-crud-ui';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', org_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth, setOrg } = useStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const { data } = await authAPI.login({ username: form.username, password: form.password });
        setAuth(data.access, data.refresh, null);
        try {
          const me = await authAPI.me();
          setAuth(data.access, data.refresh, me.data);
        } catch(e) {}
        try {
          const orgs = await orgAPI.list();
          const orgList = orgs.data?.results || orgs.data || [];
          if (orgList.length) setOrg(orgList[0]);
        } catch(e) {}
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

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
        <LoginPage
          title="Nexus"
          subtitle="All-in-one business platform"
          logo={<div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center text-white text-2xl font-bold">N</div>}
          onSubmit={async (credentials) => {
            setLoading(true); setError('');
            try {
              const usernameInput = credentials.email || credentials.username;
              const { data } = await authAPI.login({ username: usernameInput, password: credentials.password });
              setAuth(data.access, data.refresh, null);
              try { const me = await authAPI.me(); setAuth(data.access, data.refresh, me.data); } catch(e) {}
              try {
                const orgs = await orgAPI.list();
                const orgList = orgs.data?.results || orgs.data || [];
                if (orgList.length) setOrg(orgList[0]);
              } catch(e) {}
              navigate('/dashboard');
            } catch (err) {
              const d = err?.response?.data;
              setError(d?.detail || d?.username?.[0] || d?.password?.[0] || Object.values(d || {})?.[0]?.[0] || 'Invalid credentials');
            } finally { setLoading(false); }
          }}
          isLoading={loading}
          error={error}
        />
        <div className="text-center mt-4">
          <button onClick={() => setMode('register')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Don't have an account? Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Register for Nexus</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${error.includes('created') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name</label><input className="input" placeholder="John" {...f('first_name')} required /></div>
                <div><label className="label">Last Name</label><input className="input" placeholder="Doe" {...f('last_name')} /></div>
              </div>
              <div><label className="label">Email</label><input className="input" type="email" placeholder="john@company.com" {...f('email')} required /></div>
              <div><label className="label">Organization Name</label><input className="input" placeholder="Acme Inc." {...f('org_name')} required /></div>
              <div><label className="label">Username</label><input className="input" placeholder="admin" {...f('username')} required autoComplete="username" /></div>
              <div><label className="label">Password</label><input className="input" type="password" placeholder="••••••••" {...f('password')} required autoComplete="current-password" /></div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                {loading ? '⏳ Please wait…' : '→ Create Account'}
              </button>
            </form>
            <div className="text-center mt-4">
              <button onClick={() => setMode('login')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Already have an account? Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
