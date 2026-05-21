
import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { pmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

const TASK_STATUSES = ['backlog','todo','in_progress','review','done'];
const STATUS_LABELS = { backlog:'Backlog', todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };

export default function PM() {
  const [view, setView] = useState('projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [board, setBoard] = useState(null);

  const { data: projects, loading, refetch: refetchProjects } = useApi(pmAPI.projects, [], { initial: { results: [] } });
  const { data: tasks, refetch: refetchTasks } = useApi(
    () => pmAPI.tasks({ project: selectedProject }),
    [selectedProject], { initial: { results: [] } }
  );
  const { data: sprints } = useApi(
    () => selectedProject ? pmAPI.sprints({ project: selectedProject }) : Promise.resolve({ data: { results: [] } }),
    [selectedProject], { initial: { results: [] } }
  );

  const { mutate: updateTaskStatus } = useMutation(pmAPI.updateTaskStatus);
  const { mutate: addComment } = useMutation(pmAPI.addComment);

  const projectList = projects?.results || projects || [];
  const taskList = tasks?.results || tasks || [];
  const sprintList = sprints?.results || sprints || [];

  async function openBoard(projectId) {
    setSelectedProject(projectId);
    const res = await pmAPI.getProjectBoard(projectId);
    setBoard(res.data);
    setView('board');
  }

  async function handleStatusChange(taskId, newStatus) {
    await updateTaskStatus(taskId, newStatus);
    if (board) {
      const res = await pmAPI.getProjectBoard(selectedProject);
      setBoard(res.data);
    }
    refetchTasks();
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Management</h1>
          <p className="text-sm text-gray-500 mt-1">{projectList.length} projects</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {['projects','board','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  view === v ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                {v}
              </button>
            ))}
          </div>
          <button className="btn-primary">+ New Project</button>
        </div>
      </div>

      {/* Projects Grid */}
      {view === 'projects' && (
        loading ? <div className="p-8 text-center text-gray-400">Loading…</div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map(proj => (
            <div key={proj.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openBoard(proj.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: proj.color || '#6366f1' }}/>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{proj.name}</h3>
                </div>
                <span className={badge(proj.status)}>{proj.status?.replace('_',' ')}</span>
              </div>
              {proj.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{proj.description}</p>}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span><span>{proj.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${proj.progress}%`, background: proj.color || '#6366f1' }}/>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>👤 {proj.manager_name || 'No manager'}</span>
                <span>✅ {proj.completed_tasks}/{proj.task_count} tasks</span>
                {proj.end_date && <span>📅 {fmt.dateShort(proj.end_date)}</span>}
              </div>
              {proj.team_members?.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {proj.team_members.slice(0,5).map(m => (
                    <div key={m.id} className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-indigo-600">
                      {fmt.initials(m.first_name + ' ' + m.last_name)}
                    </div>
                  ))}
                  {proj.team_members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-gray-500">
                      +{proj.team_members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {projectList.length === 0 && <div className="col-span-3 p-8 text-center text-gray-400">No projects yet. Create one to get started.</div>}
        </div>
      )}

      {/* Kanban Board */}
      {view === 'board' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('projects')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">← Projects</button>
            {sprintList.length > 0 && (
              <select className="input text-sm">
                {sprintList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
              </select>
            )}
            <button className="btn-primary text-sm ml-auto">+ Add Task</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {TASK_STATUSES.map(status => {
              const col = board?.[status] || taskList.filter(t => t.status === status);
              return (
                <div key={status} className="flex-shrink-0 w-60">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{STATUS_LABELS[status]}</span>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs px-2 py-0.5">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md cursor-pointer">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{task.title}</span>
                          <span className={badge(task.priority)}>{task.priority?.[0]?.toUpperCase()}</span>
                        </div>
                        {task.assignee_name && <div className="text-xs text-gray-500 mt-1">👤 {task.assignee_name}</div>}
                        {task.due_date && (
                          <div className={`text-xs mt-1 ${task.is_overdue ? 'text-red-500' : 'text-gray-400'}`}>
                            {task.is_overdue ? '⚠️ ' : '📅 '}{fmt.dateShort(task.due_date)}
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="text-xs text-gray-400 mt-1">⏱ {task.estimated_hours}h est.</div>
                        )}
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {status !== 'done' && (
                            <button onClick={() => handleStatusChange(task.id, status === 'backlog' ? 'todo' : status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'review' : 'done')}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Move →</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task List */}
      {view === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
            <select className="input text-sm" value={selectedProject || ''} onChange={e => setSelectedProject(e.target.value || null)}>
              <option value="">All Projects</option>
              {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Task','Project','Assignee','Priority','Status','Due Date','Hours'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {taskList.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                      {task.subtask_count > 0 && <div className="text-xs text-gray-400">{task.subtask_count} subtasks</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: task.project_color || '#6366f1' }}/>
                        <span className="text-sm text-gray-500">{task.project_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{task.assignee_name || '—'}</td>
                    <td className="px-4 py-3"><span className={badge(task.priority)}>{task.priority}</span></td>
                    <td className="px-4 py-3"><span className={badge(task.status)}>{task.status?.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.due_date ? fmt.dateShort(task.due_date) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.actual_hours}h / {task.estimated_hours || '—'}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {taskList.length === 0 && <div className="p-8 text-center text-gray-400">No tasks found</div>}
          </div>
        </div>
      )}
    </div>
  );
}
