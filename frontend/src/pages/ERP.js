import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { erpAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { DollarSign, TrendingDown, TrendingUp, Clock, FileText, Plus, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'Invoices', label: 'Invoices' },
  { key: 'Expenses', label: 'Expenses' },
  { key: 'Income', label: 'Income' },
  { key: 'Transactions', label: 'Transactions' },
];

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function InvoiceForm({ form, setForm, loading }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Client Name">
        <input className="input" value={form.client_name || ''} onChange={e => setForm(s => ({...s, client_name: e.target.value}))} required />
      </FormField>
      <FormField label="Client Email">
        <input className="input" type="email" value={form.client_email || ''} onChange={e => setForm(s => ({...s, client_email: e.target.value}))} />
      </FormField>
      <FormField label="Total">
        <input className="input" type="number" step="0.01" value={form.total || ''} onChange={e => setForm(s => ({...s, total: e.target.value}))} required />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Issue Date">
        <input className="input" type="date" value={form.issue_date || ''} onChange={e => setForm(s => ({...s, issue_date: e.target.value}))} />
      </FormField>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Notes">
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function ExpenseForm({ form, setForm, loading }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Category">
        <input className="input" value={form.category || ''} onChange={e => setForm(s => ({...s, category: e.target.value}))} required />
      </FormField>
      <FormField label="Vendor">
        <input className="input" value={form.vendor || ''} onChange={e => setForm(s => ({...s, vendor: e.target.value}))} />
      </FormField>
      <FormField label="Amount">
        <input className="input" type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(s => ({...s, amount: e.target.value}))} required />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Date">
        <input className="input" type="date" value={form.date || ''} onChange={e => setForm(s => ({...s, date: e.target.value}))} />
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'pending'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </FormField>
      <div className="col-span-2">
        <FormField label="Notes">
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function IncomeForm({ form, setForm, loading }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Source">
        <input className="input" value={form.source || ''} onChange={e => setForm(s => ({...s, source: e.target.value}))} required />
      </FormField>
      <FormField label="Amount">
        <input className="input" type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(s => ({...s, amount: e.target.value}))} required />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Client Name">
        <input className="input" value={form.client_name || ''} onChange={e => setForm(s => ({...s, client_name: e.target.value}))} />
      </FormField>
      <FormField label="Date">
        <input className="input" type="date" value={form.date || ''} onChange={e => setForm(s => ({...s, date: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Notes">
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
        </FormField>
      </div>
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

export default function ERP() {
  const [tab, setTab] = useState('Invoices');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: invoices, loading: invLoading, refetch: refetchInvoices } = useApi(() => erpAPI.invoices({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: expenses, loading: expLoading, refetch: refetchExpenses } = useApi(() => erpAPI.expenses({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: incomes, loading: incLoading, refetch: refetchIncomes } = useApi(() => erpAPI.incomes({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: transactions, loading: txLoading } = useApi(() => erpAPI.transactions({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: summary, refetch: refetchSummary } = useApi(erpAPI.financialSummary, [], { initial: {} });

  const invList = invoices?.results || invoices || [];
  const expList = expenses?.results || expenses || [];
  const incList = incomes?.results || incomes || [];
  const txList = transactions?.results || transactions || [];

  const invCount = invoices?.count || invList.length;
  const expCount = expenses?.count || expList.length;
  const incCount = incomes?.count || incList.length;

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
      if (modal === 'invoice') {
        if (editItem) {
          await erpAPI.updateInvoice(editItem.id, form);
          toast.success('Invoice updated');
        } else {
          await erpAPI.createInvoice(form);
          toast.success('Invoice created');
        }
        refetchInvoices();
      } else if (modal === 'expense') {
        if (editItem) {
          await erpAPI.updateExpense(editItem.id, form);
          toast.success('Expense updated');
        } else {
          await erpAPI.createExpense(form);
          toast.success('Expense created');
        }
        refetchExpenses();
      } else if (modal === 'income') {
        if (editItem) {
          toast.success('Income updated');
        } else {
          await erpAPI.createIncome(form);
          toast.success('Income created');
        }
        refetchIncomes();
      }
      refetchSummary();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setFormLoading(false);
  }

  async function handleMarkPaid(invoice) {
    try {
      await erpAPI.markPaid(invoice.id);
      toast.success('Invoice marked as paid');
      refetchInvoices();
      refetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to mark paid');
    }
  }

  const invColumns = [
    { label: 'Invoice #', render: r => <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{r.invoice_number}</span> },
    { label: 'Client', render: r => r.client_name || '—' },
    { label: 'Issue Date', render: r => fmt.date(r.issue_date) },
    { label: 'Due Date', render: r => fmt.date(r.due_date) },
    { label: 'Total', render: r => <span className="font-semibold">{fmt.currency(r.total, r.currency)}</span> },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'invoice')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
        {r.status === 'sent' && (
          <button onClick={() => handleMarkPaid(r)} className="p-1 text-gray-400 hover:text-emerald-600 transition-colors" title="Mark Paid"><CheckCircle size={14} /></button>
        )}
      </div>
    )},
  ];

  const expColumns = [
    { label: 'Category', render: r => <span className="font-medium capitalize">{r.category}</span> },
    { label: 'Vendor', render: r => r.vendor || '—' },
    { label: 'Amount', render: r => <span className="font-semibold text-red-500">-{fmt.currency(r.amount, r.currency)}</span> },
    { label: 'Date', render: r => fmt.date(r.date) },
    { label: 'Submitted By', render: r => r.created_by_name || '—' },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'expense')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
      </div>
    )},
  ];

  const incColumns = [
    { label: 'Source', render: r => <span className="font-medium">{r.source}</span> },
    { label: 'Amount', render: r => <span className="font-semibold text-emerald-600">+{fmt.currency(r.amount, r.currency)}</span> },
    { label: 'Date', render: r => fmt.date(r.date) },
    { label: 'Client', render: r => r.client_name || '—' },
    { label: 'Notes', render: r => r.notes || '—' },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'income')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
      </div>
    )},
  ];

  const txColumns = [
    { label: 'Type', render: r => <span className={badge(r.transaction_type)}>{r.transaction_type}</span> },
    { label: 'Amount', render: r => <span className={`font-semibold ${r.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
      {r.transaction_type === 'income' ? '+' : '-'}{fmt.currency(r.amount, r.currency)}
    </span> },
    { label: 'Account', render: r => r.account_name || '—' },
    { label: 'Date', render: r => fmt.date(r.date) },
    { label: 'Description', render: r => r.description || '—' },
    { label: 'Reference', render: r => <span className="font-mono text-gray-400">{r.reference || '—'}</span> },
  ];

  return (
    <>
      <ModulePage
        title="Finance & ERP"
        subtitle="Invoices, expenses, income, accounting"
        icon={<DollarSign size={20} />}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <>
            <button className="btn-secondary" onClick={() => openCreate('expense')}><Plus size={14} /> Expense</button>
            <button className="btn-primary" onClick={() => openCreate('income')}><TrendingUp size={14} /> Income</button>
            <button className="btn-primary" onClick={() => openCreate('invoice')}><FileText size={14} /> Invoice</button>
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={fmt.currency(summary?.total_revenue || 0)} icon={<TrendingUp size={20} />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-500/10" />
          <StatCard label="Total Expenses" value={fmt.currency(summary?.total_expenses || 0)} icon={<TrendingDown size={20} />} color="text-red-500" bg="bg-red-50 dark:bg-red-500/10" />
          <StatCard label="Net Profit" value={fmt.currency((summary?.total_revenue || 0) - (summary?.total_expenses || 0))} icon={<DollarSign size={20} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-500/10" />
          <StatCard label="Outstanding" value={fmt.currency(summary?.outstanding || 0)} icon={<Clock size={20} />} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-500/10" />
        </div>

        {tab === 'Invoices' && (
          <>
            <DataTable columns={invColumns} data={invList} loading={invLoading} emptyMessage="No invoices yet" />
            <Pagination count={invCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
        {tab === 'Expenses' && (
          <>
            <DataTable columns={expColumns} data={expList} loading={expLoading} emptyMessage="No expenses recorded" />
            <Pagination count={expCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
        {tab === 'Income' && (
          <>
            <DataTable columns={incColumns} data={incList} loading={incLoading} emptyMessage="No income recorded" />
            <Pagination count={incCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
        {tab === 'Transactions' && (
          <DataTable columns={txColumns} data={txList} loading={txLoading} emptyMessage="No transactions" />
        )}
      </ModulePage>

      <CrudModal
        open={modal === 'invoice'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Invoice' : 'Create Invoice'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <InvoiceForm form={form} setForm={setForm} loading={formLoading} />
      </CrudModal>

      <CrudModal
        open={modal === 'expense'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Expense' : 'Create Expense'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <ExpenseForm form={form} setForm={setForm} loading={formLoading} />
      </CrudModal>

      <CrudModal
        open={modal === 'income'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Income' : 'Record Income'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <IncomeForm form={form} setForm={setForm} loading={formLoading} />
      </CrudModal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            toast.success('Deleted');
            setDeleteTarget(null);
          } catch (err) {
            toast.error('Failed to delete');
          }
          setDeleteLoading(false);
        }}
        loading={deleteLoading}
      />
    </>
  );
}
