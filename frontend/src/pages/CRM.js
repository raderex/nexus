
import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { crmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

const STAGES = ['new','qualified','proposal','negotiation','won','lost'];

export default function CRM() {
  const [tab, setTab] = useState('Pipeline');
  const [search, setSearch] = useState('');
  const { data: contacts, refetch: refetchContacts } = useApi(() => crmAPI.contacts({ search }), [search], { initial: { results: [] } });
  const { data: deals, refetch: refetchDeals } = useApi(() => crmAPI.deals({}), [], { initial: { results: [] } });
  const { data: activities } = useApi(() => crmAPI.activities({}), [], { initial: { results: [] } });
  const { data: pipelines } = useApi(crmAPI.pipelines, [], { initial: { results: [] } });
  const { mutate: updateDeal } = useMutation(crmAPI.updateDeal);

  const contactList = contacts?.results || contacts || [];
  const dealList = deals?.results || deals || [];
  const activityList = activities?.results || activities || [];
  const pipelineList = pipelines?.results || pipelines || [];

  const totalPipeline = dealList.filter(d => d.status === 'open').reduce((s, d) => s + parseFloat(d.value || 0), 0);
  const wonDeals = dealList.filter(d => d.status === 'won').reduce((s, d) => s + parseFloat(d.value || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
          <p className="text-sm text-gray-500 mt-1">{contactList.length} contacts · {fmt.currency(totalPipeline)} pipeline</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">+ Add Contact</button>
          <button className="btn-primary">+ Add Deal</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: contactList.length, icon: '📇' },
          { label: 'Open Pipeline', value: fmt.currency(totalPipeline), icon: '🔄' },
          { label: 'Won (total)', value: fmt.currency(wonDeals), icon: '🏆' },
          { label: 'Activities', value: activityList.length, icon: '📌' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['Pipeline','Contacts','Activities'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageDeals = dealList.filter(d => d.stage === stage);
            const stageVal = stageDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
            return (
              <div key={stage} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{stage}</span>
                  <span className="text-xs text-gray-500">{stageDeals.length} · {fmt.currency(stageVal)}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md cursor-pointer">
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">{deal.title}</div>
                      <div className="text-xs text-gray-500 mb-2">{deal.contact_name || '—'}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-600">{fmt.currency(deal.value, deal.currency)}</span>
                        <span className="text-xs text-gray-400">{deal.probability}%</span>
                      </div>
                      {deal.expected_close_date && <div className="text-xs text-gray-400 mt-1">📅 {fmt.dateShort(deal.expected_close_date)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Contacts' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input className="input w-64 text-sm" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>{['Name','Company','Email','Phone','Type','Deals','Assigned'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {contactList.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-medium text-indigo-600">{(c.first_name?.[0] || '?').toUpperCase()}</div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{c.first_name} {c.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.company || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3"><span className={badge(c.type)}>{c.type}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{dealList.filter(d => d.contact === c.id).length}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.assigned_to_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contactList.length === 0 && <div className="p-8 text-center text-gray-400">No contacts found</div>}
          </div>
        </div>
      )}

      {tab === 'Activities' && (
        <div className="space-y-2">
          {activityList.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm flex-shrink-0">
                {{ call: '📞', email: '✉️', meeting: '🤝', task: '✅', note: '📝', sms: '💬' }[a.activity_type] || '📌'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{a.subject}</span>
                  <span className={badge(a.status)}>{a.status}</span>
                </div>
                {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                <div className="text-xs text-gray-400 mt-1">{a.due_date ? fmt.datetime(a.due_date) : 'No due date'}</div>
              </div>
            </div>
          ))}
          {activityList.length === 0 && <div className="p-8 text-center text-gray-400">No activities logged yet</div>}
        </div>
      )}
    </div>
  );
}
