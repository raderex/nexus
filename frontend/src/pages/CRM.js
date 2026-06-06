import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { crmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { Users, DollarSign, Trophy, CalendarCheck, Phone, Mail, HeartHandshake, CheckCheck, FileText, MessageSquare, Plus, Edit3, Trash2, Calendar, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = ['new','qualified','proposal','negotiation','won','lost'];

const TABS = [
  { key: 'Pipeline', label: 'Pipeline' },
  { key: 'Contacts', label: 'Contacts' },
  { key: 'Activities', label: 'Activities' },
];

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function CrudModal({ open, onClose, title, children, onSubmit, loading, edit }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : (edit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactForm({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="First Name">
        <input className="input" value={form.first_name || ''} onChange={e => setForm(s => ({...s, first_name: e.target.value}))} required />
      </FormField>
      <FormField label="Last Name">
        <input className="input" value={form.last_name || ''} onChange={e => setForm(s => ({...s, last_name: e.target.value}))} required />
      </FormField>
      <FormField label="Company">
        <input className="input" value={form.company || ''} onChange={e => setForm(s => ({...s, company: e.target.value}))} />
      </FormField>
      <FormField label="Email">
        <input className="input" type="email" value={form.email || ''} onChange={e => setForm(s => ({...s, email: e.target.value}))} />
      </FormField>
      <FormField label="Phone">
        <input className="input" value={form.phone || ''} onChange={e => setForm(s => ({...s, phone: e.target.value}))} />
      </FormField>
      <FormField label="Type">
        <select className="input" value={form.type || 'lead'} onChange={e => setForm(s => ({...s, type: e.target.value}))}>
          <option value="lead">Lead</option>
          <option value="customer">Customer</option>
          <option value="partner">Partner</option>
          <option value="vendor">Vendor</option>
        </select>
      </FormField>
    </div>
  );
}

function DealForm({ form, setForm, contacts }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Title">
          <input className="input" value={form.title || ''} onChange={e => setForm(s => ({...s, title: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Value">
        <input className="input" type="number" step="0.01" value={form.value || ''} onChange={e => setForm(s => ({...s, value: e.target.value}))} required />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Probability (%)">
        <input className="input" type="number" min="0" max="100" value={form.probability ?? 50} onChange={e => setForm(s => ({...s, probability: +e.target.value}))} />
      </FormField>
      <FormField label="Stage">
        <select className="input" value={form.stage || 'new'} onChange={e => setForm(s => ({...s, stage: e.target.value}))}>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Contact">
        <select className="input" value={form.contact || ''} onChange={e => setForm(s => ({...s, contact: e.target.value}))}>
          <option value="">None</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      </FormField>
      <FormField label="Expected Close">
        <input className="input" type="date" value={form.expected_close_date || ''} onChange={e => setForm(s => ({...s, expected_close_date: e.target.value}))} />
      </FormField>
    </div>
  );
}

function ActivityForm({ form, setForm, contacts, deals }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Subject">
          <input className="input" value={form.subject || ''} onChange={e => setForm(s => ({...s, subject: e.target.value}))} required />
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
      <FormField label="Type">
        <select className="input" value={form.activity_type || 'task'} onChange={e => setForm(s => ({...s, activity_type: e.target.value}))}>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="task">Task</option>
          <option value="note">Note</option>
          <option value="sms">SMS</option>
        </select>
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'todo'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </FormField>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
      <FormField label="Contact">
        <select className="input" value={form.contact || ''} onChange={e => setForm(s => ({...s, contact: e.target.value}))}>
          <option value="">None</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      </FormField>
      <FormField label="Deal">
        <select className="input" value={form.deal || ''} onChange={e => setForm(s => ({...s, deal: e.target.value}))}>
          <option value="">None</option>
          {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      </FormField>
    </div>
  );
}

export default function CRM() {
  const [tab, setTab] = useState('Pipeline');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: contacts, loading: contactsLoading, refetch: refetchContacts } = useApi(() => crmAPI.contacts({ search, page, page_size: pageSize }), [search, page], { initial: { results: [] } });
  const { data: deals, loading: dealsLoading, refetch: refetchDeals } = useApi(() => crmAPI.deals({}), [], { initial: { results: [] } });
  const { data: activities, loading: activitiesLoading, refetch: refetchActivities } = useApi(() => crmAPI.activities({}), [], { initial: { results: [] } });
  const { data: pipelines } = useApi(crmAPI.pipelines, [], { initial: { results: [] } });

  const { mutate: updateDeal } = useMutation(crmAPI.updateDeal);

  const contactList = contacts?.results || contacts || [];
  const dealList = deals?.results || deals || [];
  const activityList = activities?.results || activities || [];
  const pipelineList = pipelines?.results || pipelines || [];

  const contactCount = contacts?.count || contactList.length;

  const totalPipeline = dealList.reduce((s, d) => s + parseFloat(d.value || 0), 0);
  const wonDeals = dealList.filter(d => d.stage === 'won').reduce((s, d) => s + parseFloat(d.value || 0), 0);

  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate(type) {
    setEditItem(null);
    setForm({});
    setModal(type);
  }

  function openEdit(item, type) {
    setEditItem(item);
    setForm({...item});
    setModal(type);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (modal === 'contact') {
        if (editItem) {
          await crmAPI.updateContact(editItem.id, form);
          toast.success('Contact updated');
        } else {
          await crmAPI.createContact(form);
          toast.success('Contact created');
        }
        refetchContacts();
      } else if (modal === 'deal') {
        await crmAPI.createDeal(form);
        toast.success('Deal created');
        refetchDeals();
      } else if (modal === 'activity') {
        await crmAPI.createActivity(form);
        toast.success('Activity created');
        refetchActivities();
      }
      setModal(null);
      setEditItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setFormLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await crmAPI.deleteContact(deleteTarget.id);
      toast.success('Contact deleted');
      setDeleteTarget(null);
      refetchContacts();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to delete');
    }
    setDeleteLoading(false);
  }

  const activityIcons = {
    call: <Phone size={16} />,
    email: <Mail size={16} />,
    meeting: <HeartHandshake size={16} />,
    task: <CheckCheck size={16} />,
    note: <FileText size={16} />,
    sms: <MessageSquare size={16} />,
  };

  const contactColumns = [
    { label: 'Name', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-medium text-indigo-600">
          {(r.first_name?.[0] || '?').toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{r.first_name} {r.last_name}</span>
      </div>
    )},
    { label: 'Company', render: r => <span className="text-sm text-gray-500">{r.company || '—'}</span> },
    { label: 'Email', render: r => <span className="text-sm text-gray-500">{r.email || '—'}</span> },
    { label: 'Phone', render: r => <span className="text-sm text-gray-500">{r.phone || '—'}</span> },
    { label: 'Type', render: r => <span className={badge(r.type)}>{r.type}</span> },
    { label: 'Deals', render: r => <span className="text-sm text-gray-500">{dealList.filter(d => d.contact === r.id).length}</span> },
    { label: 'Assigned', render: r => <span className="text-sm text-gray-500">{r.assigned_to_name || '—'}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'contact')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <ModulePage
        title="CRM"
        subtitle={`${contactList.length} contacts · ${fmt.currency(totalPipeline)} pipeline`}
        icon={<Target size={20} />}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <>
            <button className="btn-secondary" onClick={() => openCreate('activity')}><Plus size={14} /> Activity</button>
            <button className="btn-secondary" onClick={() => openCreate('deal')}><DollarSign size={14} /> Deal</button>
            <button className="btn-primary" onClick={() => openCreate('contact')}><Plus size={14} /> Contact</button>
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Contacts" value={contactList.length} icon={<Users size={20} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-500/10" />
          <StatCard label="Open Pipeline" value={fmt.currency(totalPipeline)} icon={<DollarSign size={20} />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-500/10" />
          <StatCard label="Won (total)" value={fmt.currency(wonDeals)} icon={<Trophy size={20} />} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-500/10" />
          <StatCard label="Activities" value={activityList.length} icon={<CalendarCheck size={20} />} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
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
                        {deal.expected_close_date && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={12} /> {fmt.dateShort(deal.expected_close_date)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'Contacts' && (
          <>
            <div className="flex items-center gap-3">
              <input className="input w-64 text-sm" placeholder="Search contacts…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <DataTable columns={contactColumns} data={contactList} loading={contactsLoading} emptyMessage="No contacts found" />
            <Pagination count={contactCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'Activities' && (
          <div className="space-y-2">
            {activitiesLoading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : activityList.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <CalendarCheck className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No activities logged yet</p>
              </div>
            ) : (
              activityList.map(a => (
                <div key={a.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm flex-shrink-0 text-indigo-600">
                    {activityIcons[a.activity_type] || <FileText size={16} />}
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
              ))
            )}
          </div>
        )}
      </ModulePage>

      <CrudModal
        open={modal === 'contact'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Contact' : 'Create Contact'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <ContactForm form={form} setForm={setForm} />
      </CrudModal>

      <CrudModal
        open={modal === 'deal'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Deal"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <DealForm form={form} setForm={setForm} contacts={contactList} />
      </CrudModal>

      <CrudModal
        open={modal === 'activity'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Log Activity"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <ActivityForm form={form} setForm={setForm} contacts={contactList} deals={dealList} />
      </CrudModal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={deleteTarget ? `Delete ${deleteTarget.first_name} ${deleteTarget.last_name}` : 'Delete this contact'}
      />
    </>
  );
}
