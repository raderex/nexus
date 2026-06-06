import React, { useState, useEffect, useRef } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import api, { trackingAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { Timer, Play, Square, DollarSign, Trophy, Medal, Plus, Edit3, CheckCircle, XCircle, Send, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'Timer', label: 'Timer' },
  { key: 'My Logs', label: 'My Logs' },
  { key: 'Approvals', label: 'Approvals' },
  { key: 'Team Report', label: 'Team Report' },
  { key: 'Productivity', label: 'Productivity' },
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

export default function Tracking() {
  const [tab, setTab] = useState('Timer');
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskDesc, setTaskDesc] = useState('');
  const timerRef = useRef(null);
  const [page, setPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const pageSize = 20;
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ description: '', date: '', start_time: '', end_time: '', is_billable: false });
  const [editLog, setEditLog] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: runningLog, refetch: refetchRunning } = useApi(trackingAPI.runningTimer, [], { initial: null });
  const { data: mySummary, refetch: refetchSummary } = useApi(trackingAPI.mySummary, [], { initial: {} });
  const { data: timeLogsData, loading: logsLoading, refetch: refetchLogs } = useApi(() => trackingAPI.timeLogs({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: approvalsData, loading: approvalsLoading, refetch: refetchApprovals } = useApi(() => trackingAPI.approvals({ page: approvalPage, page_size: pageSize }), [approvalPage], { initial: { results: [] } });
  const { data: teamReport } = useApi(trackingAPI.teamReport, [], { initial: [] });
  const { data: productivity } = useApi(trackingAPI.teamSummary, [], { initial: {} });
  const { data: leaderboard } = useApi(trackingAPI.leaderboard, [], { initial: [] });

  const { mutate: startTimer, loading: startLoading } = useMutation(trackingAPI.startTimer);
  const { mutate: stopTimer, loading: stopLoading } = useMutation(trackingAPI.stopTimer);
  const { mutate: approveLog } = useMutation(trackingAPI.approveTimeLog);
  const { mutate: rejectLog } = useMutation(trackingAPI.rejectTimeLog);
  const { mutate: submitApproval } = useMutation(trackingAPI.submitForApproval);
  const { mutate: createTimeLog, loading: createLoading } = useMutation((d) => api.post('/tracking/time-logs/', d));
  const { mutate: updateTimeLog, loading: updateLoading } = useMutation(({ id, ...d }) => api.patch(`/tracking/time-logs/${id}/`, d));
  const { mutate: deleteTimeLog, loading: deleteLoading } = useMutation((id) => api.delete(`/tracking/time-logs/${id}/`));

  const logList = timeLogsData?.results || timeLogsData || [];
  const logCount = timeLogsData?.count || 0;
  const approvalList = approvalsData?.results || approvalsData || [];
  const approvalCount = approvalsData?.count || 0;

  useEffect(() => {
    if (runningLog) {
      setIsRunning(true);
      const started = new Date(runningLog.started_at).getTime();
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }
  }, [runningLog]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  async function handleStartStop() {
    if (isRunning && runningLog) {
      try {
        await stopTimer(runningLog.id);
        setIsRunning(false);
        setElapsed(0);
        refetchRunning();
        refetchSummary();
        refetchLogs();
        toast.success('Timer stopped');
      } catch {
        toast.error('Failed to stop timer');
      }
    } else {
      try {
        await startTimer({ description: taskDesc });
        setIsRunning(true);
        refetchRunning();
        refetchSummary();
        toast.success('Timer started');
      } catch {
        toast.error('Failed to start timer');
      }
    }
  }

  async function handleCreateManual(e) {
    e.preventDefault();
    try {
      await createTimeLog(manualForm);
      setShowManual(false);
      setManualForm({ description: '', date: '', start_time: '', end_time: '', is_billable: false });
      refetchLogs();
      refetchSummary();
      toast.success('Time log created');
    } catch {
      toast.error('Failed to create time log');
    }
  }

  async function handleUpdateLog(e) {
    e.preventDefault();
    try {
      await updateTimeLog({ id: editLog.id, ...manualForm });
      setEditLog(null);
      setShowManual(false);
      setManualForm({ description: '', date: '', start_time: '', end_time: '', is_billable: false });
      refetchLogs();
      toast.success('Time log updated');
    } catch {
      toast.error('Failed to update time log');
    }
  }

  async function handleDelete() {
    try {
      await deleteTimeLog(deleteId);
      setDeleteId(null);
      refetchLogs();
      toast.success('Time log deleted');
    } catch {
      toast.error('Failed to delete time log');
    }
  }

  async function handleSubmitApproval(id) {
    try {
      await submitApproval(id);
      refetchLogs();
      toast.success('Submitted for approval');
    } catch {
      toast.error('Failed to submit for approval');
    }
  }

  async function handleApprove(id) {
    try {
      await approveLog(id);
      refetchApprovals();
      toast.success('Time log approved');
    } catch {
      toast.error('Failed to approve');
    }
  }

  async function handleReject(id) {
    try {
      await rejectLog(id);
      refetchApprovals();
      toast.success('Time log rejected');
    } catch {
      toast.error('Failed to reject');
    }
  }

  function openEdit(log) {
    setEditLog(log);
    setManualForm({
      description: log.description || '',
      date: log.started_at ? log.started_at.slice(0, 10) : '',
      start_time: log.started_at ? new Date(log.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      end_time: log.ended_at ? new Date(log.ended_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      is_billable: log.is_billable || false,
    });
    setShowManual(true);
  }

  function handleManualEntry() {
    setEditLog(null);
    setManualForm({ description: '', date: new Date().toISOString().slice(0, 10), start_time: '', end_time: '', is_billable: false });
    setShowManual(true);
  }

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const summaryCards = [
    { label: 'Today', value: fmt.hours((mySummary?.today_hours || 0) * 3600), icon: <Clock size={20} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'This Week', value: fmt.hours((mySummary?.week_hours || 0) * 3600), icon: <Clock size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'This Month', value: fmt.hours((mySummary?.month_hours || 0) * 3600), icon: <Clock size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  const logColumns = [
    { label: 'Description', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.description || '—'}</span> },
    { label: 'Project', render: (row) => <span className="text-gray-500">{row.project_name || '—'}</span> },
    { label: 'Task', render: (row) => <span className="text-gray-500">{row.task_title || '—'}</span> },
    { label: 'Started', render: (row) => <span className="text-gray-500">{fmt.datetime(row.started_at)}</span> },
    { label: 'Duration', render: (row) => row.is_running ? <span className="text-green-500 font-medium animate-pulse">● Running</span> : <span className="font-medium text-gray-900 dark:text-white">{fmt.hours(row.duration_seconds)}</span> },
    { label: 'Billable', render: (row) => row.is_billable ? <DollarSign size={16} className="text-green-500" /> : <span className="text-gray-300">—</span> },
    { label: 'Status', render: (row) =>
      row.approval ? (
        <span className={badge(row.approval.status)}>{row.approval.status}</span>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Draft</span>
          {!row.is_running && (
            <button onClick={() => handleSubmitApproval(row.id)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Submit for approval">
              <Send size={14} />
            </button>
          )}
        </div>
      )
    },
    { label: '', render: (row) => (
      <div className="flex items-center gap-1">
        {!row.is_running && (
          <>
            <button onClick={() => openEdit(row)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
              <Edit3 size={14} />
            </button>
            <button onClick={() => setDeleteId(row.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
              <XCircle size={14} />
            </button>
          </>
        )}
      </div>
    )},
  ];

  const approvalColumns = [
    { label: 'Employee', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.employee_name}</span> },
    { label: 'Description', render: (row) => <span className="text-gray-500">{row.log_description || '—'}</span> },
    { label: 'Hours', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.log_hours}h</span> },
    { label: 'Submitted', render: (row) => <span className="text-gray-500">{fmt.timeAgo(row.submitted_at)}</span> },
    { label: 'Status', render: (row) => <span className={badge(row.status)}>{row.status}</span> },
    { label: 'Actions', render: (row) => row.status === 'pending' ? (
      <div className="flex gap-1">
        <button onClick={() => handleApprove(row.id)} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium inline-flex items-center gap-1">
          <CheckCircle size={12} /> Approve
        </button>
        <button onClick={() => handleReject(row.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium inline-flex items-center gap-1">
          <XCircle size={12} /> Reject
        </button>
      </div>
    ) : null },
  ];

  const teamColumns = [
    { label: 'Employee', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span> },
    { label: 'Hours This Week', render: (row) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 w-24">
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (row.hours_this_week / 40) * 100)}%` }} />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{row.hours_this_week}h</span>
      </div>
    )},
    { label: 'Tasks Worked', render: (row) => <span className="text-gray-500">{row.tasks_worked}</span> },
    { label: 'Status', render: (row) => row.is_running ? <span className="text-xs text-green-500 font-medium animate-pulse">● Tracking now</span> : <span className="text-xs text-gray-400">Idle</span> },
  ];

  const productivityCards = [
    { label: 'Avg Overall Score', value: `${(productivity?.avg_overall || 0).toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Avg Efficiency', value: `${(productivity?.avg_efficiency || 0).toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Avg Focus', value: `${(productivity?.avg_focus || 0).toFixed(1)}%`, icon: <TrendingUp size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Tasks Completed', value: productivity?.total_tasks || 0, icon: <CheckCircle size={20} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  ];

  return (
    <ModulePage
      title="Time Tracking"
      subtitle="Track time, monitor productivity, approve timesheets"
      icon={<Timer size={20} />}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        tab === 'My Logs' && (
          <button onClick={handleManualEntry} className="btn-primary text-sm inline-flex items-center gap-1">
            <Plus size={16} /> Manual Entry
          </button>
        )
      }
    >
      {tab === 'Timer' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {summaryCards.map(s => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className={`text-7xl font-mono font-bold tabular-nums tracking-wider ${isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
              {hh}:{mm}:{ss}
            </div>
            <input className="input text-center text-sm w-80" placeholder="What are you working on?"
              value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
            <button onClick={handleStartStop} disabled={startLoading || stopLoading}
              className={`inline-flex items-center gap-2 px-12 py-4 rounded-full text-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 ${
                isRunning ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
              {isRunning ? <><Square size={24} /> Stop</> : <><Play size={24} /> Start</>}
            </button>
            {isRunning && runningLog && (
              <div className="text-sm text-gray-500 text-center space-y-1">
                <div>Tracking: <span className="font-medium text-gray-900 dark:text-white">{runningLog.description || 'No description'}</span></div>
                <div>Started: {fmt.datetime(runningLog.started_at)}</div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'My Logs' && (
        <>
          <DataTable columns={logColumns} data={logList} loading={logsLoading} emptyMessage="No time logs yet. Start the timer!" />
          <Pagination count={logCount} page={page} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}

      {tab === 'Approvals' && (
        <>
          <DataTable columns={approvalColumns} data={approvalList} loading={approvalsLoading} emptyMessage="No pending approvals" />
          <Pagination count={approvalCount} page={approvalPage} pageSize={pageSize} onPageChange={setApprovalPage} />
        </>
      )}

      {tab === 'Team Report' && (
        <DataTable columns={teamColumns} data={teamReport || []} emptyMessage="No team data available" />
      )}

      {tab === 'Productivity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productivityCards.map(s => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Leaderboard — This Month</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(leaderboard || []).map((row, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="w-8 text-center">
                    {i === 0 ? <Medal size={20} className="text-yellow-500" /> : i === 1 ? <Medal size={20} className="text-gray-400" /> : i === 2 ? <Medal size={20} className="text-amber-700" /> : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{row.employee__user__first_name} {row.employee__user__last_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${row.avg_score || 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{(row.avg_score || 0).toFixed(0)}%</span>
                  </div>
                  <span className="text-xs text-gray-500">{(row.total_hours || 0).toFixed(0)}h</span>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <div className="p-8 text-center text-sm text-gray-400">No leaderboard data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      <CrudModal
        open={showManual}
        onClose={() => { setShowManual(false); setEditLog(null); }}
        title={editLog ? 'Edit Time Log' : 'Manual Time Log Entry'}
        onSubmit={editLog ? handleUpdateLog : handleCreateManual}
        loading={createLoading || updateLoading}
        edit={!!editLog}
      >
        <FormField label="Description">
          <input className="input" value={manualForm.description} onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))} required />
        </FormField>
        <FormField label="Date">
          <input type="date" className="input" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} required />
        </FormField>
        <FormField label="Start Time">
          <input type="time" className="input" value={manualForm.start_time} onChange={e => setManualForm(f => ({ ...f, start_time: e.target.value }))} required />
        </FormField>
        <FormField label="End Time">
          <input type="time" className="input" value={manualForm.end_time} onChange={e => setManualForm(f => ({ ...f, end_time: e.target.value }))} required />
        </FormField>
        <FormField label="Billable">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" checked={manualForm.is_billable} onChange={e => setManualForm(f => ({ ...f, is_billable: e.target.checked }))} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Mark as billable</span>
          </label>
        </FormField>
      </CrudModal>

      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete this time log?" />
    </ModulePage>
  );
}
