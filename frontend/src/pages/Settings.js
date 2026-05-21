
import React, { useState } from 'react';
import { useStore } from '../store';
import { authAPI } from '../services/api';
import { useMutation } from '../hooks/useApi';

export default function Settings() {
  const { user, org, setUser } = useStore();
  const [tab, setTab] = useState('Profile');
  const [profile, setProfile] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [saved, setSaved] = useState('');
  const { mutate: updateMe } = useMutation(authAPI.updateMe);
  const { mutate: changePassword } = useMutation(authAPI.changePassword);

  async function saveProfile() {
    const updated = await updateMe(profile);
    setUser(updated); setSaved('Profile saved!');
    setTimeout(() => setSaved(''), 2000);
  }

  async function savePw() {
    await changePassword(pwForm);
    setPwForm({ old_password: '', new_password: '' });
    setSaved('Password changed!');
    setTimeout(() => setSaved(''), 2000);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {['Profile','Organization','Security','Integrations'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{saved}</div>}

      {tab === 'Profile' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name</label><input className="input" value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} /></div>
            <div><label className="label">Last Name</label><input className="input" value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} /></div>
          </div>
          <div><label className="label">Phone</label><input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><label className="label">Username</label><input className="input" value={user?.username || ''} disabled className="input bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed" /></div>
          <div><label className="label">Email</label><input className="input" value={user?.email || ''} disabled className="input bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed" /></div>
          <div><label className="label">Role</label><input className="input" value={user?.role || ''} disabled className="input bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed" /></div>
          <button onClick={saveProfile} className="btn-primary">Save Profile</button>
        </div>
      )}

      {tab === 'Organization' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Organization</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Name</span><span className="font-medium text-gray-900 dark:text-white">{org?.name || '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Email</span><span className="text-gray-700 dark:text-gray-300">{org?.email || '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-gray-500">Currency</span><span className="text-gray-700 dark:text-gray-300">{org?.currency || 'USD'}</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-500">Timezone</span><span className="text-gray-700 dark:text-gray-300">{org?.timezone || 'UTC'}</span></div>
          </div>
        </div>
      )}

      {tab === 'Security' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 max-w-lg">
          <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
          <div><label className="label">Current Password</label><input className="input" type="password" value={pwForm.old_password} onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))} /></div>
          <div><label className="label">New Password</label><input className="input" type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} /></div>
          <button onClick={savePw} className="btn-primary">Update Password</button>
        </div>
      )}

      {tab === 'Integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Facebook', icon: '🔵', desc: 'Connect Facebook pages and Instagram', connected: false },
            { name: 'Twitter / X', icon: '🐦', desc: 'Post and monitor Twitter activity', connected: false },
            { name: 'LinkedIn', icon: '💼', desc: 'Share content to LinkedIn', connected: false },
            { name: 'Slack', icon: '💬', desc: 'Send notifications to Slack channels', connected: false },
            { name: 'Google Calendar', icon: '📅', desc: 'Sync interviews and meetings', connected: false },
            { name: 'Stripe', icon: '💳', desc: 'Payment processing for invoices', connected: false },
            { name: 'Zapier', icon: '⚡', desc: 'Connect to 5000+ apps via webhooks', connected: false },
            { name: 'N8N / Make', icon: '🔄', desc: 'Advanced workflow automation', connected: false },
          ].map(i => (
            <div key={i.name} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{i.icon}</span>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{i.name}</div>
                  <div className="text-xs text-gray-500">{i.desc}</div>
                </div>
              </div>
              <button className={`text-xs px-3 py-1.5 rounded-lg font-medium ${i.connected ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                {i.connected ? '✓ Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
