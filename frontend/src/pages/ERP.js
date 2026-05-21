
import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { erpAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

export default function ERP() {
  const [tab, setTab] = useState('Overview');
  const { data: invoices } = useApi(() => erpAPI.invoices({}), [], { initial: { results: [] } });
  const { data: expenses } = useApi(() => erpAPI.expenses({}), [], { initial: { results: [] } });
  const { data: incomes } = useApi(() => erpAPI.incomes({}), [], { initial: { results: [] } });
  const { data: transactions } = useApi(() => erpAPI.transactions({}), [], { initial: { results: [] } });

  const invList = invoices?.results || invoices || [];
  const expList = expenses?.results || expenses || [];
  const incList = incomes?.results || incomes || [];
  const txList = transactions?.results || transactions || [];

  const totalRevenue = incList.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExpenses = expList.filter(e => e.status === 'approved').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const totalInvoiced = invList.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const outstanding = invList.filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + parseFloat(i.total || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance & ERP</h1>
          <p className="text-sm text-gray-500 mt-1">Invoices, expenses, income, accounting</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">+ Expense</button>
          <button className="btn-primary">+ Invoice</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt.currency(totalRevenue), icon: '📈', color: 'text-green-600' },
          { label: 'Total Expenses', value: fmt.currency(totalExpenses), icon: '📉', color: 'text-red-500' },
          { label: 'Net Profit', value: fmt.currency(totalRevenue - totalExpenses), icon: '💹', color: 'text-indigo-600' },
          { label: 'Outstanding', value: fmt.currency(outstanding), icon: '⏳', color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['Invoices','Expenses','Income','Transactions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Invoices' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>{['Invoice #','Client','Issue Date','Due Date','Total','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invList.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-600">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{inv.client_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.date(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.date(inv.due_date)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{fmt.currency(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3"><span className={badge(inv.status)}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invList.length === 0 && <div className="p-8 text-center text-gray-400">No invoices yet</div>}
          </div>
        </div>
      )}

      {tab === 'Expenses' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>{['Category','Vendor','Amount','Date','Submitted By','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expList.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">{exp.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{exp.vendor || '—'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-500">-{fmt.currency(exp.amount, exp.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.date(exp.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{exp.created_by_name || '—'}</td>
                    <td className="px-4 py-3"><span className={badge(exp.status)}>{exp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expList.length === 0 && <div className="p-8 text-center text-gray-400">No expenses recorded</div>}
          </div>
        </div>
      )}

      {tab === 'Income' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>{['Source','Amount','Date','Client','Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {incList.map(inc => (
                  <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{inc.source}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">+{fmt.currency(inc.amount, inc.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.date(inc.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inc.client_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inc.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {incList.length === 0 && <div className="p-8 text-center text-gray-400">No income recorded</div>}
          </div>
        </div>
      )}

      {tab === 'Transactions' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>{['Type','Amount','Account','Date','Description','Reference'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {txList.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3"><span className={badge(tx.transaction_type)}>{tx.transaction_type}</span></td>
                    <td className={`px-4 py-3 text-sm font-bold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.transaction_type === 'income' ? '+' : '-'}{fmt.currency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.account_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.date(tx.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.description || '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-400">{tx.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txList.length === 0 && <div className="p-8 text-center text-gray-400">No transactions</div>}
          </div>
        </div>
      )}
    </div>
  );
}
