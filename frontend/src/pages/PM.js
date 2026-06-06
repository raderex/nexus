import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { pmAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { LayoutGrid, Columns, List, Plus, Edit3, Briefcase, CheckCircle2, Clock, Calendar, AlertTriangle, User, Flag, ArrowRight, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const TASK_STATUSES = ['backlog','todo','in_progress','review','done'];
const STATUS_LABELS = { backlog:'Backlog', todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };

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

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ProjectForm({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Name">
          <input className="input" value={form.name || ''} onChange={e => setForm(s => ({...s, name: e.target.value}))} required />
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={3} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
      <FormField label="Status">
        <select className="input" value={form.status || 'planning'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </FormField>
      <FormField label="Priority">
        <select className="input" value={form.priority || 'medium'} onChange={e => setForm(s => ({...s, priority: e.target.value}))}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </FormField>
      <FormField label="Start Date">
        <input className="input" type="date" value={form.start_date || ''} onChange={e => setForm(s => ({...s, start_date: e.target.value}))} />
      </FormField>
      <FormField label="End Date">
        <input className="input" type="date" value={form.end_date || ''} onChange={e => setForm(s => ({...s, end_date: e.target.value}))} />
      </FormField>
      <FormField label="Budget">
        <input className="input" type="number" step="0.01" value={form.budget || ''} onChange={e => setForm(s => ({...s, budget: e.target.value}))} />
      </FormField>
      <FormField label="Color">
        <input className="input" type="color" value={form.color || '#6366f1'} onChange={e => setForm(s => ({...s, color: e.target.value}))} />
      </FormField>
    </div>
  );
}

function TaskForm({ form, setForm, projects }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Title">
          <input className="input" value={form.title || ''} onChange={e => setForm(s => ({...s, title: e.target.value}))} required />
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={3} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
      <FormField label="Project">
        <select className="input" value={form.project || ''} onChange={e => setForm(s => ({...s, project: e.target.value}))} required>
          <option value="">Select project</option>
          {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'backlog'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </FormField>
      <FormField label="Priority">
        <select className="input" value={form.priority || 'medium'} onChange={e => setForm(s => ({...s, priority: e.target.value}))}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </FormField>
      <FormField label="Assignee">
        <input className="input" value={form.assignee || ''} onChange={e => setForm(s => ({...s, assignee: e.target.value}))} placeholder="User ID" />
      </FormField>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
      <FormField label="Estimated Hours">
        <input className="input" type="number" step="0.5" value={form.estimated_hours || ''} onChange={e => setForm(s => ({...s, estimated_hours: e.target.value}))} />
      </FormField>
      <FormField label="Sprint">
        <input className="input" value={form.sprint || ''} onChange={e => setForm(s => ({...s, sprint: e.target.value}))} placeholder="Sprint ID" />
      </FormField>
    </div>
  );
}

function SprintForm({ form, setForm, projects }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Name">
          <input className="input" value={form.name || ''} onChange={e => setForm(s => ({...s, name: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Project">
        <select className="input" value={form.project || ''} onChange={e => setForm(s => ({...s, project: e.target.value}))} required>
          <option value="">Select project</option>
          {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'planning'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </FormField>
      <FormField label="Start Date">
        <input className="input" type="date" value={form.start_date || ''} onChange={e => setForm(s => ({...s, start_date: e.target.value}))} />
      </FormField>
      <FormField label="End Date">
        <input className="input" type="date" value={form.end_date || ''} onChange={e => setForm(s => ({...s, end_date: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Goal">
          <textarea className="input" rows={2} value={form.goal || ''} onChange={e => setForm(s => ({...s, goal: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function MilestoneForm({ form, setForm, projects }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Name">
          <input className="input" value={form.name || ''} onChange={e => setForm(s => ({...s, name: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Project">
        <select className="input" value={form.project || ''} onChange={e => setForm(s => ({...s, project: e.target.value}))} required>
          <option value="">Select project</option>
          {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'pending'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </FormField>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
      <FormField label="Due Date">
        <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm(s => ({...s, due_date: e.target.value}))} />
      </FormField>
    </div>
  );
}

export default function PM() {
  const [view, setView] = useState('projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [board, setBoard] = useState(null);
  const [page, setPage] = useState(1);

  const { data: projects, loading, refetch: refetchProjects } = useApi(() => pmAPI.projects({ page, page_size: 20 }), [page], { initial: { results: [] } });
  const { data: tasks, refetch: refetchTasks } = useApi(
    () => pmAPI.tasks({ project: selectedProject }),
    [selectedProject], { initial: { results: [] } }
  );
  const { data: sprints, refetch: refetchSprints } = useApi(
    () => selectedProject ? pmAPI.sprints({ project: selectedProject }) : Promise.resolve({ data: { results: [] } }),
    [selectedProject], { initial: { results: [] } }
  );
  const { data: milestones, refetch: refetchMilestones } = useApi(
    () => selectedProject ? pmAPI.milestones({ project: selectedProject }) : Promise.resolve({ data: { results: [] } }),
    [selectedProject], { initial: { results: [] } }
  );
  const { data: stats } = useApi(
    () => selectedProject ? pmAPI.projectStats(selectedProject) : Promise.resolve({ data: {} }),
    [selectedProject], { initial: {} }
  );

  const { mutate: updateTaskStatus } = useMutation(pmAPI.updateTaskStatus);
  const { mutate: addComment } = useMutation(pmAPI.addComment);
  const { mutate: addMember } = useMutation(pmAPI.addMember);
  const { mutate: logTime } = useMutation(pmAPI.logTime);

  const projectList = projects?.results || projects || [];
  const taskList = tasks?.results || tasks || [];
  const sprintList = sprints?.results || sprints || [];
  const milestoneList = milestones?.results || milestones || [];
  const projectCount = projects?.count || projectList.length;

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

  async function openBoard(projectId) {
    setSelectedProject(projectId);
    const res = await pmAPI.getProjectBoard(projectId);
    setBoard(res.data);
    setView('board');
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success(`Task moved to ${STATUS_LABELS[newStatus]}`);
      if (board) {
        const res = await pmAPI.getProjectBoard(selectedProject);
        setBoard(res.data);
      }
      refetchTasks();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (modal === 'project') {
        if (editItem) {
          await pmAPI.updateProject(editItem.id, form);
          toast.success('Project updated');
        } else {
          await pmAPI.createProject(form);
          toast.success('Project created');
        }
        refetchProjects();
      } else if (modal === 'task') {
        if (editItem) {
          await pmAPI.updateTask(editItem.id, form);
          toast.success('Task updated');
        } else {
          await pmAPI.createTask(form);
          toast.success('Task created');
        }
        refetchTasks();
      } else if (modal === 'sprint') {
        await pmAPI.createSprint(form);
        toast.success('Sprint created');
        refetchSprints();
      } else if (modal === 'milestone') {
        await pmAPI.createMilestone(form);
        toast.success('Milestone created');
        refetchMilestones();
      }
      setModal(null);
      setEditItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setFormLoading(false);
  }

  async function handleStartSprint(sprintId) {
    try {
      await pmAPI.startSprint(sprintId);
      toast.success('Sprint started');
      refetchSprints();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to start sprint');
    }
  }

  async function handleCompleteSprint(sprintId) {
    try {
      await pmAPI.completeSprint(sprintId);
      toast.success('Sprint completed');
      refetchSprints();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to complete sprint');
    }
  }

  const actions = (
    <>
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button onClick={() => setView('projects')}
          className={`p-2 transition-colors ${view === 'projects' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <LayoutGrid size={16} />
        </button>
        <button onClick={() => setView('board')}
          className={`p-2 transition-colors ${view === 'board' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <Columns size={16} />
        </button>
        <button onClick={() => setView('list')}
          className={`p-2 transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <List size={16} />
        </button>
      </div>
      <button onClick={() => openCreate('project')} className="btn-primary flex items-center gap-1.5 text-sm">
        <Plus size={16} />
        <span>New Project</span>
      </button>
    </>
  );

  return (
    <ModulePage
      title="Project Management"
      subtitle={`${projectCount} projects`}
      icon={<Briefcase size={20} />}
      actions={actions}
    >
      {/* Projects Grid */}
      {view === 'projects' && (
        <>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : (
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
                    <span className="flex items-center gap-1"><User size={12} />{proj.manager_name || 'No manager'}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} />{proj.completed_tasks}/{proj.task_count} tasks</span>
                    {proj.end_date && <span className="flex items-center gap-1"><Calendar size={12} />{fmt.dateShort(proj.end_date)}</span>}
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
                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={e => { e.stopPropagation(); openEdit(proj, 'project'); }} className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-indigo-600 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <Edit3 size={12} />Edit
                    </button>
                    <button onClick={e => { e.stopPropagation(); openBoard(proj.id); }} className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-indigo-600 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <ArrowRight size={12} />Open
                    </button>
                  </div>
                </div>
              ))}
              {projectList.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400">
                  <Briefcase size={40} className="mb-3 opacity-50" />
                  <p className="text-sm">No projects yet. Create one to get started.</p>
                </div>
              )}
            </div>
          )}
          <Pagination count={projectCount} page={page} pageSize={20} onPageChange={setPage} />
        </>
      )}

      {/* Kanban Board */}
      {view === 'board' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button onClick={() => setView('projects')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <ArrowRight size={14} className="rotate-180" /> Projects
            </button>
            {sprintList.length > 0 && (
              <select className="input text-sm w-auto">
                {sprintList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
              </select>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={() => openCreate('task')} className="btn-primary text-sm flex items-center gap-1">
                <Plus size={14} />Add Task
              </button>
              <button onClick={() => openCreate('sprint')} className="btn-secondary text-sm flex items-center gap-1">
                <Plus size={14} />Sprint
              </button>
              <button onClick={() => openCreate('milestone')} className="btn-secondary text-sm flex items-center gap-1">
                <Flag size={14} />Milestone
              </button>
            </div>
          </div>

          {/* Sprint Controls */}
          {sprintList.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {sprintList.filter(s => s.status === 'planning').map(s => (
                <button key={s.id} onClick={() => handleStartSprint(s.id)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  <Play size={12} />Start {s.name}
                </button>
              ))}
              {sprintList.filter(s => s.status === 'active').map(s => (
                <button key={s.id} onClick={() => handleCompleteSprint(s.id)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <Square size={12} />Complete {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Board Columns */}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {TASK_STATUSES.map(status => {
              const col = board?.[status] || taskList.filter(t => t.status === status);
              return (
                <div key={status} className="flex-shrink-0 w-60">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{STATUS_LABELS[status]}</span>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs px-2 py-0.5">{col.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {col.map(task => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{task.title}</span>
                          <span className={badge(task.priority)}>{task.priority?.[0]?.toUpperCase()}</span>
                        </div>
                        {task.assignee_name && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <User size={11} />{task.assignee_name}
                          </div>
                        )}
                        {task.due_date && (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${task.is_overdue ? 'text-red-500' : 'text-gray-400'}`}>
                            {task.is_overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}{fmt.dateShort(task.due_date)}
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={11} />{task.estimated_hours}h est.
                          </div>
                        )}
                        <div className="mt-2 flex gap-1 flex-wrap items-center justify-between">
                          <div className="flex gap-1">
                            {status !== 'done' && (
                              <button onClick={() => handleStatusChange(task.id, status === 'backlog' ? 'todo' : status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'review' : 'done')}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5">
                                Move <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                          <button onClick={e => { e.stopPropagation(); openEdit(task, 'task'); }}
                            className="text-xs text-gray-400 hover:text-indigo-600">
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestones */}
          {milestoneList.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <Flag size={14} />Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {milestoneList.map(m => (
                  <div key={m.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                      <span className={badge(m.status)}>{m.status?.replace('_',' ')}</span>
                    </div>
                    {m.description && <p className="text-xs text-gray-500 mb-2">{m.description}</p>}
                    {m.due_date && <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />{fmt.date(m.due_date)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      {view === 'list' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select className="input text-sm" value={selectedProject || ''} onChange={e => { setSelectedProject(e.target.value || null); setPage(1); }}>
              <option value="">All Projects</option>
              {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => openCreate('task')} className="btn-primary text-sm flex items-center gap-1">
              <Plus size={14} />Add Task
            </button>
            <button onClick={() => openCreate('sprint')} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={14} />Sprint
            </button>
            <button onClick={() => openCreate('milestone')} className="btn-secondary text-sm flex items-center gap-1">
              <Flag size={14} />Milestone
            </button>
          </div>
          <DataTable
            columns={[
              { label: 'Task', render: r => (
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</div>
                  {r.subtask_count > 0 && <div className="text-xs text-gray-400">{r.subtask_count} subtasks</div>}
                </div>
              )},
              { label: 'Project', render: r => (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: r.project_color || '#6366f1' }}/>
                  <span className="text-sm text-gray-500">{r.project_name}</span>
                </div>
              )},
              { label: 'Assignee', render: r => <span className="text-sm text-gray-600 dark:text-gray-300">{r.assignee_name || '—'}</span> },
              { label: 'Priority', render: r => <span className={badge(r.priority)}>{r.priority}</span> },
              { label: 'Status', render: r => <span className={badge(r.status)}>{r.status?.replace('_',' ')}</span> },
              { label: 'Due Date', render: r => <span className="text-sm text-gray-500">{r.due_date ? fmt.dateShort(r.due_date) : '—'}</span> },
              { label: 'Hours', render: r => <span className="text-sm text-gray-500">{r.actual_hours}h / {r.estimated_hours || '—'}h</span> },
              { label: '', render: r => (
                <button onClick={() => openEdit(r, 'task')} className="text-gray-400 hover:text-indigo-600">
                  <Edit3 size={14} />
                </button>
              )},
            ]}
            data={taskList}
            loading={false}
            emptyMessage="No tasks found"
          />
        </>
      )}

      {/* Modals */}
      <CrudModal
        open={modal === 'project'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Project' : 'Create Project'}
        onSubmit={handleSubmit}
        loading={formLoading}
        edit={!!editItem}
      >
        <ProjectForm form={form} setForm={setForm} />
      </CrudModal>

      <CrudModal
        open={modal === 'task'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Task' : 'Create Task'}
        onSubmit={handleSubmit}
        loading={formLoading}
        edit={!!editItem}
      >
        <TaskForm form={form} setForm={setForm} projects={projectList} />
      </CrudModal>

      <CrudModal
        open={modal === 'sprint'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Sprint"
        onSubmit={handleSubmit}
        loading={formLoading}
      >
        <SprintForm form={form} setForm={setForm} projects={projectList} />
      </CrudModal>

      <CrudModal
        open={modal === 'milestone'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Milestone"
        onSubmit={handleSubmit}
        loading={formLoading}
      >
        <MilestoneForm form={form} setForm={setForm} projects={projectList} />
      </CrudModal>
    </ModulePage>
  );
}
