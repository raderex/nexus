import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { hrmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { Users, Building2, DollarSign, Clock, Plus, Edit3, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'employees', label: 'Employees' },
  { key: 'departments', label: 'Departments' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
  { key: 'goals', label: 'Goals' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'assets', label: 'Assets' },
];

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function EmployeeForm({ form, setForm, employees, departments }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="User">
        <input className="input" value={form.user || ''} onChange={e => setForm(s => ({...s, user: e.target.value}))} placeholder="User ID" />
      </FormField>
      <FormField label="Department">
        <select className="input" value={form.department || ''} onChange={e => setForm(s => ({...s, department: e.target.value}))}>
          <option value="">Select department</option>
          {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </FormField>
      <FormField label="Job Title">
        <input className="input" value={form.job_title || ''} onChange={e => setForm(s => ({...s, job_title: e.target.value}))} required />
      </FormField>
      <FormField label="Salary">
        <input className="input" type="number" step="0.01" value={form.salary || ''} onChange={e => setForm(s => ({...s, salary: e.target.value}))} />
      </FormField>
      <FormField label="Hire Date">
        <input className="input" type="date" value={form.hire_date || ''} onChange={e => setForm(s => ({...s, hire_date: e.target.value}))} />
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'active'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>
    </div>
  );
}

function DepartmentForm({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Name">
          <input className="input" value={form.name || ''} onChange={e => setForm(s => ({...s, name: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Manager">
        <input className="input" value={form.manager || ''} onChange={e => setForm(s => ({...s, manager: e.target.value}))} placeholder="User ID" />
      </FormField>
      <FormField label="Budget">
        <input className="input" type="number" step="0.01" value={form.budget || ''} onChange={e => setForm(s => ({...s, budget: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function PayrollForm({ form, setForm, employees }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Employee">
        <select className="input" value={form.employee || ''} onChange={e => setForm(s => ({...s, employee: e.target.value}))} required>
          <option value="">Select employee</option>
          {(employees || []).map(e => <option key={e.id} value={e.id}>{e.user?.username || e.user?.first_name || e.id}</option>)}
        </select>
      </FormField>
      <FormField label="Base Salary">
        <input className="input" type="number" step="0.01" value={form.base_salary || ''} onChange={e => setForm(s => ({...s, base_salary: e.target.value}))} required />
      </FormField>
      <FormField label="Bonus">
        <input className="input" type="number" step="0.01" value={form.bonus || ''} onChange={e => setForm(s => ({...s, bonus: e.target.value}))} />
      </FormField>
      <FormField label="Deductions">
        <input className="input" type="number" step="0.01" value={form.deductions || ''} onChange={e => setForm(s => ({...s, deductions: e.target.value}))} />
      </FormField>
      <FormField label="Pay Period Start">
        <input className="input" type="date" value={form.pay_period_start || ''} onChange={e => setForm(s => ({...s, pay_period_start: e.target.value}))} />
      </FormField>
      <FormField label="Pay Period End">
        <input className="input" type="date" value={form.pay_period_end || ''} onChange={e => setForm(s => ({...s, pay_period_end: e.target.value}))} />
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'pending'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
        </select>
      </FormField>
    </div>
  );
}

function LeaveRequestForm({ form, setForm, leaveTypes }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Leave Type">
          <select className="input" value={form.leave_type || ''} onChange={e => setForm(s => ({...s, leave_type: e.target.value}))} required>
            <option value="">Select type</option>
            {(leaveTypes || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Start Date">
        <input className="input" type="date" value={form.start_date || ''} onChange={e => setForm(s => ({...s, start_date: e.target.value}))} required />
      </FormField>
      <FormField label="End Date">
        <input className="input" type="date" value={form.end_date || ''} onChange={e => setForm(s => ({...s, end_date: e.target.value}))} required />
      </FormField>
      <div className="col-span-2">
        <FormField label="Reason">
          <textarea className="input" rows={2} value={form.reason || ''} onChange={e => setForm(s => ({...s, reason: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function GoalForm({ form, setForm, employees }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Title">
          <input className="input" value={form.title || ''} onChange={e => setForm(s => ({...s, title: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Employee">
        <input className="input" value={form.employee || ''} onChange={e => setForm(s => ({...s, employee: e.target.value}))} placeholder="Employee ID" />
      </FormField>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'todo'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </FormField>
      <FormField label="Progress (%)">
        <input className="input" type="number" min="0" max="100" value={form.progress || ''} onChange={e => setForm(s => ({...s, progress: e.target.value}))} />
      </FormField>
    </div>
  );
}

function ReviewForm({ form, setForm, employees }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Employee">
        <input className="input" value={form.employee || ''} onChange={e => setForm(s => ({...s, employee: e.target.value}))} placeholder="Employee ID" required />
      </FormField>
      <FormField label="Reviewer">
        <input className="input" value={form.reviewer || ''} onChange={e => setForm(s => ({...s, reviewer: e.target.value}))} placeholder="Reviewer ID" />
      </FormField>
      <FormField label="Review Period">
        <input className="input" value={form.review_period || ''} onChange={e => setForm(s => ({...s, review_period: e.target.value}))} placeholder="e.g. Q1 2026" />
      </FormField>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
      <FormField label="Rating (1-5)">
        <input className="input" type="number" min="1" max="5" step="0.1" value={form.rating || ''} onChange={e => setForm(s => ({...s, rating: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Notes">
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function AssetForm({ form, setForm, employees }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Name">
        <input className="input" value={form.name || ''} onChange={e => setForm(s => ({...s, name: e.target.value}))} required />
      </FormField>
      <FormField label="Asset Type">
        <input className="input" value={form.asset_type || ''} onChange={e => setForm(s => ({...s, asset_type: e.target.value}))} placeholder="e.g. Laptop, Monitor" />
      </FormField>
      <FormField label="Serial Number">
        <input className="input" value={form.serial_number || ''} onChange={e => setForm(s => ({...s, serial_number: e.target.value}))} />
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'available'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </FormField>
      <div className="col-span-2">
        <FormField label="Assigned To">
          <input className="input" value={form.assigned_to || ''} onChange={e => setForm(s => ({...s, assigned_to: e.target.value}))} placeholder="Employee ID" />
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

export default function HRM() {
  const [tab, setTab] = useState('employees');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const { data: employeesData, loading: empLoading, refetch: refetchEmployees } = useApi(() => hrmAPI.employees({ search, page, page_size: pageSize }), [search, page], { initial: { results: [] } });
  const { data: departmentsData, loading: deptLoading, refetch: refetchDepartments } = useApi(() => hrmAPI.departments(), [page], { initial: { results: [] } });
  const { data: payrollsData, loading: payLoading, refetch: refetchPayrolls } = useApi(() => hrmAPI.payrolls({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: attendanceData, loading: attLoading, refetch: refetchAttendance } = useApi(() => hrmAPI.attendances({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: leavesData, loading: leaveLoading, refetch: refetchLeaves } = useApi(() => hrmAPI.leaveRequests({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: leaveTypesData } = useApi(() => hrmAPI.leaveTypes(), [], { initial: [] });
  const { data: goalsData, loading: goalLoading, refetch: refetchGoals } = useApi(() => hrmAPI.goals({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: reviewsData, loading: revLoading, refetch: refetchReviews } = useApi(() => hrmAPI.reviews({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: assetsData, loading: assetLoading, refetch: refetchAssets } = useApi(() => hrmAPI.assets({ page, page_size: pageSize }), [page], { initial: { results: [] } });

  const employees = employeesData?.results || employeesData || [];
  const departments = departmentsData?.results || Array.isArray(departmentsData) ? (departmentsData || []) : [];
  const deptList = Array.isArray(departmentsData) ? departmentsData : (departmentsData?.results || []);
  const payrolls = payrollsData?.results || payrollsData || [];
  const attendances = attendanceData?.results || attendanceData || [];
  const leaves = leavesData?.results || leavesData || [];
  const leaveTypes = Array.isArray(leaveTypesData) ? leaveTypesData : (leaveTypesData?.results || []);
  const goals = goalsData?.results || goalsData || [];
  const reviews = reviewsData?.results || reviewsData || [];
  const assets = assetsData?.results || assetsData || [];

  const empCount = employeesData?.count || employees.length;
  const payCount = payrollsData?.count || payrolls.length;
  const leaveCount = leavesData?.count || leaves.length;
  const goalCount = goalsData?.count || goals.length;
  const revCount = reviewsData?.count || reviews.length;
  const assetCount = assetsData?.count || assets.length;

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
      if (modal === 'employee') {
        if (editItem) {
          await hrmAPI.updateEmployee(editItem.id, form);
          toast.success('Employee updated');
        } else {
          await hrmAPI.createEmployee(form);
          toast.success('Employee created');
        }
        refetchEmployees();
      } else if (modal === 'department') {
        await hrmAPI.createDepartment(form);
        toast.success('Department created');
        refetchDepartments();
      } else if (modal === 'payroll') {
        await hrmAPI.createPayroll(form);
        toast.success('Payroll created');
        refetchPayrolls();
      } else if (modal === 'leave') {
        await hrmAPI.createLeaveRequest(form);
        toast.success('Leave request created');
        refetchLeaves();
      } else if (modal === 'goal') {
        await hrmAPI.createGoal(form);
        toast.success('Goal created');
        refetchGoals();
      } else if (modal === 'review') {
        await hrmAPI.createReview(form);
        toast.success('Review created');
        refetchReviews();
      } else if (modal === 'asset') {
        await hrmAPI.createAsset(form);
        toast.success('Asset created');
        refetchAssets();
      }
      setModal(null);
      setEditItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setFormLoading(false);
  }

  async function handleApproveLeave(leave) {
    try {
      await hrmAPI.approveLeave(leave.id);
      toast.success('Leave approved');
      refetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to approve');
    }
  }

  async function handleRejectLeave(leave) {
    try {
      await hrmAPI.rejectLeave(leave.id, {});
      toast.success('Leave rejected');
      refetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to reject');
    }
  }

  async function handleCompleteReview(review) {
    try {
      await hrmAPI.completeReview(review.id);
      toast.success('Review completed');
      refetchReviews();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to complete review');
    }
  }

  async function handleAssignAsset(asset) {
    try {
      await hrmAPI.assignAsset(asset.id, {});
      toast.success('Asset assigned');
      refetchAssets();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to assign asset');
    }
  }

  const empColumns = [
    { label: 'Employee', render: r => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {r.user?.first_name?.[0] || r.user?.username?.[0] || 'E'}
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{r.user?.first_name} {r.user?.last_name}</div>
          <div className="text-xs text-gray-500">{r.user?.username}</div>
        </div>
      </div>
    )},
    { label: 'Department', render: r => r.department?.name || '—' },
    { label: 'Job Title', render: r => r.job_title || '—' },
    { label: 'Salary', render: r => <span className="font-medium">{fmt.currency(r.salary)}</span> },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'employee')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
      </div>
    )},
  ];

  const deptColumns = [
    { label: 'Name', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span> },
    { label: 'Manager', render: r => r.manager?.username || r.manager_name || '—' },
    { label: 'Budget', render: r => fmt.currency(r.budget) },
    { label: 'Description', render: r => r.description || '—' },
  ];

  const payColumns = [
    { label: 'Employee', render: r => r.employee?.user?.username || r.employee_name || '—' },
    { label: 'Base Salary', render: r => fmt.currency(r.base_salary) },
    { label: 'Bonus', render: r => <span className="text-emerald-600 dark:text-emerald-400">{fmt.currency(r.bonus)}</span> },
    { label: 'Deductions', render: r => <span className="text-red-500">-{fmt.currency(r.deductions)}</span> },
    { label: 'Net Pay', render: r => <span className="font-bold text-gray-900 dark:text-white">{fmt.currency(r.net_pay)}</span> },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
  ];

  const attColumns = [
    { label: 'Employee', render: r => r.employee?.user?.username || '—' },
    { label: 'Date', render: r => fmt.date(r.date) },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: 'Check In', render: r => r.check_in ? fmt.datetime(r.check_in) : '—' },
    { label: 'Check Out', render: r => r.check_out ? fmt.datetime(r.check_out) : '—' },
  ];

  const leaveColumns = [
    { label: 'Employee', render: r => r.employee?.user?.username || '—' },
    { label: 'Type', render: r => r.leave_type_name || r.leave_type || '—' },
    { label: 'Start', render: r => fmt.date(r.start_date) },
    { label: 'End', render: r => fmt.date(r.end_date) },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'pending' && (
          <>
            <button onClick={() => handleApproveLeave(r)} className="p-1 text-gray-400 hover:text-emerald-600 transition-colors" title="Approve"><CheckCircle size={14} /></button>
            <button onClick={() => handleRejectLeave(r)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Reject"><XCircle size={14} /></button>
          </>
        )}
      </div>
    )},
  ];

  const goalColumns = [
    { label: 'Title', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.title}</span> },
    { label: 'Employee', render: r => r.employee?.user?.username || '—' },
    { label: 'Due Date', render: r => fmt.date(r.due_date) },
    { label: 'Progress', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${r.progress || 0}%` }} />
        </div>
        <span className="text-xs text-gray-500">{r.progress || 0}%</span>
      </div>
    )},
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
  ];

  const revColumns = [
    { label: 'Employee', render: r => r.employee?.user?.username || '—' },
    { label: 'Reviewer', render: r => r.reviewer_name || '—' },
    { label: 'Period', render: r => r.review_period || '—' },
    { label: 'Rating', render: r => r.rating ? <span className="font-semibold">{r.rating}/5</span> : '—' },
    { label: 'Due Date', render: r => fmt.date(r.due_date) },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'in_progress' && (
          <button onClick={() => handleCompleteReview(r)} className="p-1 text-gray-400 hover:text-emerald-600 transition-colors" title="Complete"><CheckCircle size={14} /></button>
        )}
        <button onClick={() => openEdit(r, 'review')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
      </div>
    )},
  ];

  const assetColumns = [
    { label: 'Name', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span> },
    { label: 'Type', render: r => r.asset_type || '—' },
    { label: 'Serial No', render: r => <span className="font-mono text-xs">{r.serial_number || '—'}</span> },
    { label: 'Assigned To', render: r => r.assigned_to_name || r.assigned_to?.user?.username || '—' },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'available' && (
          <button onClick={() => handleAssignAsset(r)} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Assign"><UserCheck size={14} /></button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <ModulePage
        title="HRM"
        subtitle="Human Resource Management"
        icon={<Users size={20} />}
        tabs={TABS}
        activeTab={tab}
        onTabChange={(t) => { setTab(t); setPage(1); }}
        actions={
          <>
            {tab === 'departments' && <button className="btn-primary" onClick={() => openCreate('department')}><Plus size={14} /> Department</button>}
            {tab === 'employees' && <button className="btn-primary" onClick={() => openCreate('employee')}><Plus size={14} /> Employee</button>}
            {tab === 'payroll' && <button className="btn-primary" onClick={() => openCreate('payroll')}><Plus size={14} /> Payroll</button>}
            {tab === 'leave' && <button className="btn-primary" onClick={() => openCreate('leave')}><Plus size={14} /> Leave</button>}
            {tab === 'goals' && <button className="btn-primary" onClick={() => openCreate('goal')}><Plus size={14} /> Goal</button>}
            {tab === 'reviews' && <button className="btn-primary" onClick={() => openCreate('review')}><Plus size={14} /> Review</button>}
            {tab === 'assets' && <button className="btn-primary" onClick={() => openCreate('asset')}><Plus size={14} /> Asset</button>}
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={fmt.number(employees.length)} icon={<Users size={20} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-500/10" />
          <StatCard label="Departments" value={fmt.number(deptList.length)} icon={<Building2 size={20} />} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
          <StatCard label="Monthly Payroll" value={fmt.currency(payrolls.reduce((s, p) => s + (p.net_pay || 0), 0))} icon={<DollarSign size={20} />} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-500/10" />
          <StatCard label="Pending Leaves" value={fmt.number(leaves.filter(l => l.status === 'pending').length)} icon={<Clock size={20} />} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-500/10" />
        </div>

        {tab === 'employees' && (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <DataTable columns={empColumns} data={employees} loading={empLoading} emptyMessage="No employees found" />
            <Pagination count={empCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'departments' && (
          <>
            <DataTable columns={deptColumns} data={deptList} loading={deptLoading} emptyMessage="No departments" />
          </>
        )}

        {tab === 'payroll' && (
          <>
            <DataTable columns={payColumns} data={payrolls} loading={payLoading} emptyMessage="No payroll records" />
            <Pagination count={payCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'attendance' && (
          <>
            <DataTable columns={attColumns} data={attendances} loading={attLoading} emptyMessage="No attendance records" />
            <Pagination count={attendanceData?.count || attendances.length} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'leave' && (
          <>
            <DataTable columns={leaveColumns} data={leaves} loading={leaveLoading} emptyMessage="No leave requests" />
            <Pagination count={leaveCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'goals' && (
          <>
            <DataTable columns={goalColumns} data={goals} loading={goalLoading} emptyMessage="No goals" />
            <Pagination count={goalCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'reviews' && (
          <>
            <DataTable columns={revColumns} data={reviews} loading={revLoading} emptyMessage="No reviews" />
            <Pagination count={revCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'assets' && (
          <>
            <DataTable columns={assetColumns} data={assets} loading={assetLoading} emptyMessage="No assets" />
            <Pagination count={assetCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </ModulePage>

      <CrudModal
        open={modal === 'employee'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Employee' : 'Create Employee'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <EmployeeForm form={form} setForm={setForm} employees={employees} departments={deptList} />
      </CrudModal>

      <CrudModal
        open={modal === 'department'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Department"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <DepartmentForm form={form} setForm={setForm} />
      </CrudModal>

      <CrudModal
        open={modal === 'payroll'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Payroll"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <PayrollForm form={form} setForm={setForm} employees={employees} />
      </CrudModal>

      <CrudModal
        open={modal === 'leave'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Leave Request"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <LeaveRequestForm form={form} setForm={setForm} leaveTypes={leaveTypes} />
      </CrudModal>

      <CrudModal
        open={modal === 'goal'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Goal"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <GoalForm form={form} setForm={setForm} employees={employees} />
      </CrudModal>

      <CrudModal
        open={modal === 'review'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Review' : 'Create Review'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <ReviewForm form={form} setForm={setForm} employees={employees} />
      </CrudModal>

      <CrudModal
        open={modal === 'asset'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Asset"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <AssetForm form={form} setForm={setForm} employees={employees} />
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
