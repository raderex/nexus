
import React, { useState, useEffect, useRef } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { trackingAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

export default function Tracking() {
  const [tab, setTab] = useState('Timer');
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskDesc, setTaskDesc] = useState('');
  const timerRef = useRef(null);

  const { data: runningLog, refetch: refetchRunning } = useApi(trackingAPI.runningTimer, [], { initial: null });
  const { data: mySummary, refetch: refetchSummary } = useApi(trackingAPI.mySummary, [], { initial: {} });
  const { data: teamReport } = useApi(trackingAPI.teamReport, [], { initial: [] });
  const { data: timeLogs, refetch: refetchLogs } = useApi(() => trackingAPI.timeLogs({}), [], { initial: { results: [] } });
  const { data: approvals, refetch: refetchApprovals } = useApi(() => trackingAPI.approvals({}), [], { initial: { results: [] } });
  const { data: productivity } = useApi(trackingAPI.teamSummary, [], { initial: {} });
  const { data: leaderboard } = useApi(trackingAPI.leaderboard, [], { initial: [] });

  const { mutate: startTimer } = useMutation(trackingAPI.startTimer);
  const { mutate: stopTimer } = useMutation(trackingAPI.stopTimer);
  const { mutate: approveLog } = useMutation(trackingAPI.approveTimeLog);
  const { mutate: rejectLog } = useMutation(trackingAPI.rejectTimeLog);

  const logList = timeLogs?.results || timeLogs || [];
  const approvalList = approvals?.results || approvals || [];

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
      await stopTimer(runningLog.id);
      setIsRunning(false); setElapsed(0);
      refetchRunning(); refetchSummary(); refetchLogs();
    } else {
      const log = await startTimer({ description: taskDesc });
      setIsRunning(true);
      refetchRunning(); refetchSummary();
    }
  }

  const hh = String(Math.floor(elapsed/3600)).padStart(2,'0');
  const mm = String(Math.floor((elapsed%3600)/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Track time, monitor productivity, approve timesheets</p>
        </div>
      </div>

      {/* My Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Today', value: fmt.hours((mySummary?.today_hours || 0) * 3600) },
          { label: 'This Week', value: fmt.hours((mySummary?.week_hours || 0) * 3600) },
          { label: 'This Month', value: fmt.hours((mySummary?.month_hours || 0) * 3600) },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['Timer','My Logs','Approvals','Team Report','Productivity'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Timer ── */}
      {tab === 'Timer' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-8">
          <div className={`text-7xl font-mono font-bold tabular-nums tracking-wider ${isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
            {hh}:{mm}:{ss}
          </div>
          <input className="input text-center text-sm w-80" placeholder="What are you working on?"
            value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          <button onClick={handleStartStop}
            className={`px-12 py-4 rounded-full text-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 ${
              isRunning ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
            {isRunning ? '⏹ Stop' : '▶ Start'}
          </button>
          {isRunning && runningLog && (
            <div className="text-sm text-gray-500 text-center">
              <div>Tracking: <span className="font-medium">{runningLog.description || 'No description'}</span></div>
              <div>Started: {fmt.datetime(runningLog.started_at)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── My Logs ── */}
      {tab === 'My Logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">Time Logs</h2>
            <button className="btn-secondary text-sm">+ Manual Entry</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Description','Project','Task','Started','Duration','Billable','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logList.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.project_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.task_title || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.datetime(log.started_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {log.is_running ? <span className="text-green-500 animate-pulse">● Running</span> : fmt.hours(log.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-sm">{log.is_billable ? '💰' : '—'}</td>
                    <td className="px-4 py-3">
                      {log.approval ? <span className={badge(log.approval.status)}>{log.approval.status}</span>
                        : <span className="text-xs text-gray-400">Not submitted</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logList.length === 0 && <div className="p-8 text-center text-gray-400">No time logs yet. Start the timer!</div>}
          </div>
        </div>
      )}

      {/* ── Approvals ── */}
      {tab === 'Approvals' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Time Approval Queue</h2>
            <span className="text-sm text-gray-500">{approvalList.filter(a => a.status === 'pending').length} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Employee','Description','Hours','Submitted','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {approvalList.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{a.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.log_description || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{a.log_hours}h</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.timeAgo(a.submitted_at)}</td>
                    <td className="px-4 py-3"><span className={badge(a.status)}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      {a.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={async () => { await approveLog(a.id); refetchApprovals(); }}
                            className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium">✓ Approve</button>
                          <button onClick={async () => { await rejectLog(a.id); refetchApprovals(); }}
                            className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium">✗ Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {approvalList.length === 0 && <div className="p-8 text-center text-gray-400">No pending approvals</div>}
          </div>
        </div>
      )}

      {/* ── Team Report ── */}
      {tab === 'Team Report' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Team This Week</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Employee','Hours This Week','Tasks Worked','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(teamReport || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 w-24">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (row.hours_this_week / 40) * 100)}%` }}/>
                        </div>
                        <span className="text-sm font-medium">{row.hours_this_week}h</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{row.tasks_worked}</td>
                    <td className="px-4 py-3">
                      {row.is_running
                        ? <span className="text-xs text-green-500 font-medium animate-pulse">● Tracking now</span>
                        : <span className="text-xs text-gray-400">Idle</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!teamReport || teamReport.length === 0) && <div className="p-8 text-center text-gray-400">No data</div>}
          </div>
        </div>
      )}

      {/* ── Productivity ── */}
      {tab === 'Productivity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Overall Score', value: `${(productivity?.avg_overall || 0).toFixed(1)}%` },
              { label: 'Avg Efficiency', value: `${(productivity?.avg_efficiency || 0).toFixed(1)}%` },
              { label: 'Avg Focus', value: `${(productivity?.avg_focus || 0).toFixed(1)}%` },
              { label: 'Tasks Completed', value: productivity?.total_tasks || 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">🏆 Leaderboard — This Month</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {(leaderboard || []).map((row, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-lg font-bold w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{row.employee__user__first_name} {row.employee__user__last_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${row.avg_score || 0}%` }}/>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{(row.avg_score || 0).toFixed(0)}%</span>
                  </div>
                  <span className="text-xs text-gray-500">{(row.total_hours || 0).toFixed(0)}h</span>
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && <div className="p-8 text-center text-gray-400">No data yet</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
