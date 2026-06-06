import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { atsAPI } from '../services/api';
import { fmt, badge } from '../utils/format';
import ModulePage from '../components/ModulePage';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import ConfirmDelete from '../components/ConfirmDelete';
import Pagination from '../components/Pagination';
import { Briefcase, Users, Calendar, Star, Plus, Edit3, Send, ArrowRight, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'Pipeline', label: 'Pipeline' },
  { key: 'Jobs', label: 'Jobs' },
  { key: 'Interviews', label: 'Interviews' },
  { key: 'Offers', label: 'Offers' },
];

const STAGE_ORDER = ['new','screening','interview','assessment','offer','hired','rejected'];

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function JobForm({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="Title">
          <input className="input" value={form.title || ''} onChange={e => setForm(s => ({...s, title: e.target.value}))} required />
        </FormField>
      </div>
      <FormField label="Department">
        <input className="input" value={form.department || ''} onChange={e => setForm(s => ({...s, department: e.target.value}))} />
      </FormField>
      <FormField label="Location">
        <input className="input" value={form.location || ''} onChange={e => setForm(s => ({...s, location: e.target.value}))} />
      </FormField>
      <FormField label="Employment Type">
        <select className="input" value={form.employment_type || 'full_time'} onChange={e => setForm(s => ({...s, employment_type: e.target.value}))}>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
      </FormField>
      <FormField label="Status">
        <select className="input" value={form.status || 'draft'} onChange={e => setForm(s => ({...s, status: e.target.value}))}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </FormField>
      <FormField label="Min Salary">
        <input className="input" type="number" value={form.salary_min || ''} onChange={e => setForm(s => ({...s, salary_min: e.target.value}))} />
      </FormField>
      <FormField label="Max Salary">
        <input className="input" type="number" value={form.salary_max || ''} onChange={e => setForm(s => ({...s, salary_max: e.target.value}))} />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <div className="col-span-2">
        <FormField label="Description">
          <textarea className="input" rows={3} value={form.description || ''} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function ApplicantForm({ form, setForm, jobs }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Full Name">
          <input className="input" value={form.full_name || ''} onChange={e => setForm(s => ({...s, full_name: e.target.value}))} required />
        </FormField>
        <FormField label="Email">
          <input className="input" type="email" value={form.email || ''} onChange={e => setForm(s => ({...s, email: e.target.value}))} />
        </FormField>
        <FormField label="Phone">
          <input className="input" value={form.phone || ''} onChange={e => setForm(s => ({...s, phone: e.target.value}))} />
        </FormField>
        <FormField label="Job">
          <select className="input" value={form.job || ''} onChange={e => setForm(s => ({...s, job: e.target.value}))}>
            <option value="">Select job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Resume URL / Notes">
        <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
      </FormField>
    </div>
  );
}

function InterviewForm({ form, setForm, applicants, jobs }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Applicant">
        <select className="input" value={form.applicant || ''} onChange={e => setForm(s => ({...s, applicant: e.target.value}))} required>
          <option value="">Select applicant...</option>
          {applicants.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
      </FormField>
      <FormField label="Job">
        <select className="input" value={form.job || ''} onChange={e => setForm(s => ({...s, job: e.target.value}))}>
          <option value="">Select job...</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </FormField>
      <FormField label="Interview Type">
        <select className="input" value={form.interview_type || 'phone'} onChange={e => setForm(s => ({...s, interview_type: e.target.value}))}>
          <option value="phone">Phone</option>
          <option value="video">Video</option>
          <option value="onsite">On-site</option>
          <option value="technical">Technical</option>
          <option value="final">Final</option>
        </select>
      </FormField>
      <FormField label="Interviewer">
        <input className="input" value={form.interviewer || ''} onChange={e => setForm(s => ({...s, interviewer: e.target.value}))} />
      </FormField>
      <div className="col-span-2">
        <FormField label="Scheduled At">
          <input className="input" type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm(s => ({...s, scheduled_at: e.target.value}))} required />
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Notes">
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(s => ({...s, notes: e.target.value}))} />
        </FormField>
      </div>
    </div>
  );
}

function OfferForm({ form, setForm, applicants, jobs }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Applicant">
        <select className="input" value={form.applicant || ''} onChange={e => setForm(s => ({...s, applicant: e.target.value}))} required>
          <option value="">Select applicant...</option>
          {applicants.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </select>
      </FormField>
      <FormField label="Job">
        <select className="input" value={form.job || ''} onChange={e => setForm(s => ({...s, job: e.target.value}))}>
          <option value="">Select job...</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </FormField>
      <FormField label="Salary">
        <input className="input" type="number" value={form.salary || ''} onChange={e => setForm(s => ({...s, salary: e.target.value}))} required />
      </FormField>
      <FormField label="Currency">
        <select className="input" value={form.currency || 'USD'} onChange={e => setForm(s => ({...s, currency: e.target.value}))}>
          {['USD','EUR','GBP','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Start Date">
        <input className="input" type="date" value={form.start_date || ''} onChange={e => setForm(s => ({...s, start_date: e.target.value}))} />
      </FormField>
      <FormField label="Expires At">
        <input className="input" type="date" value={form.expires_at || ''} onChange={e => setForm(s => ({...s, expires_at: e.target.value}))} />
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

export default function ATS() {
  const [tab, setTab] = useState('Pipeline');
  const [selectedJob, setSelectedJob] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: jobsData, loading: jobsLoading, refetch: refetchJobs } = useApi(() => atsAPI.jobs({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: applicants, refetch: refetchApps } = useApi(
    () => atsAPI.applicants(selectedJob ? { job: selectedJob, page_size: 100 } : { page_size: 100 }),
    [selectedJob], { initial: { results: [] } }
  );
  const { data: interviewsData, loading: intvLoading, refetch: refetchIntv } = useApi(() => atsAPI.interviews({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: offersData, loading: offerLoading, refetch: refetchOffers } = useApi(() => atsAPI.offers({ page, page_size: pageSize }), [page], { initial: { results: [] } });
  const { data: stats } = useApi(atsAPI.pipelineStats, [], { initial: {} });

  const { mutate: moveStage } = useMutation(atsAPI.moveApplicant);
  const { mutate: publishJob } = useMutation(atsAPI.publishJob);
  const { mutate: sendOffer } = useMutation(atsAPI.sendOffer);

  const jobList = jobsData?.results || jobsData || [];
  const appList = applicants?.results || applicants || [];
  const intvList = interviewsData?.results || interviewsData || [];
  const offerList = offersData?.results || offersData || [];

  const jobCount = jobsData?.count || jobList.length;
  const intvCount = interviewsData?.count || intvList.length;
  const offerCount = offersData?.count || offerList.length;

  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleTabChange(t) {
    setTab(t);
    setPage(1);
  }

  function openCreate(type) {
    setEditItem(null);
    setForm({});
    setModal(type);
  }

  function openEdit(item, type) {
    setEditItem(item);
    setForm({ ...item });
    setModal(type);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (modal === 'job') {
        if (editItem) {
          await atsAPI.updateJob(editItem.id, form);
          toast.success('Job updated');
        } else {
          await atsAPI.createJob(form);
          toast.success('Job created');
        }
        refetchJobs();
      } else if (modal === 'applicant') {
        await atsAPI.createApplicant(form);
        toast.success('Applicant added');
        refetchApps();
      } else if (modal === 'interview') {
        await atsAPI.createInterview(form);
        toast.success('Interview scheduled');
        refetchIntv();
      } else if (modal === 'offer') {
        await atsAPI.createOffer(form);
        toast.success('Offer created');
        refetchOffers();
      }
      setModal(null);
      setEditItem(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    }
    setFormLoading(false);
  }

  async function handlePublishJob(job) {
    try {
      await publishJob(job.id);
      toast.success('Job published');
      refetchJobs();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to publish');
    }
  }

  async function handleSendOffer(offer) {
    try {
      await sendOffer(offer.id);
      toast.success('Offer sent');
      refetchOffers();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to send offer');
    }
  }

  async function handleMoveStage(applicant, currentStage) {
    const idx = STAGE_ORDER.indexOf(currentStage);
    if (idx < STAGE_ORDER.length - 2) {
      try {
        await moveStage(applicant.id, STAGE_ORDER[idx + 1]);
        toast.success(`${applicant.full_name} moved to ${STAGE_ORDER[idx + 1]}`);
        refetchApps();
      } catch (err) {
        toast.error(err?.response?.data?.detail || 'Failed to move applicant');
      }
    }
  }

  const byStage = (stage) => appList.filter(a => a.stage === stage);

  const jobColumns = [
    { label: 'Title', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.title}</span> },
    { label: 'Department', render: r => r.department_name || r.department || '—' },
    { label: 'Location', render: r => r.location || '—' },
    { label: 'Applicants', render: r => r.applicant_count || 0 },
    { label: 'Salary', render: r => r.salary_min ? `${fmt.currency(r.salary_min, r.currency)} – ${fmt.currency(r.salary_max, r.currency)}` : '—' },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r, 'job')} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit3 size={14} /></button>
        {r.status === 'draft' && (
          <button onClick={() => handlePublishJob(r)} className="p-1 text-gray-400 hover:text-emerald-600 transition-colors" title="Publish"><Send size={14} /></button>
        )}
        <button onClick={() => { setSelectedJob(r.id); setTab('Pipeline'); setPage(1); }} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="View Pipeline"><Users size={14} /></button>
      </div>
    )},
  ];

  const intvColumns = [
    { label: 'Candidate', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.applicant_name}</span> },
    { label: 'Position', render: r => r.job_title || '—' },
    { label: 'Type', render: r => <span className={badge(r.interview_type)}>{r.interview_type?.replace('_', ' ')}</span> },
    { label: 'Interviewer', render: r => r.interviewer_name || '—' },
    { label: 'Date & Time', render: r => fmt.datetime(r.scheduled_at) },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
  ];

  const offerColumns = [
    { label: 'Candidate', render: r => <span className="font-medium text-gray-900 dark:text-white">{r.applicant_name}</span> },
    { label: 'Position', render: r => r.job_title || '—' },
    { label: 'Salary', render: r => <span className="font-semibold text-indigo-600">{fmt.currency(r.salary, r.currency)}</span> },
    { label: 'Start Date', render: r => fmt.date(r.start_date) },
    { label: 'Expires', render: r => fmt.date(r.expires_at) },
    { label: 'Status', render: r => <span className={badge(r.status)}>{r.status}</span> },
    { label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'draft' && (
          <button onClick={() => handleSendOffer(r)} className="p-1 text-gray-400 hover:text-emerald-600 transition-colors" title="Send Offer"><Send size={14} /></button>
        )}
      </div>
    )},
  ];

  const totalApplicants = stats?.total_applicants || 0;

  return (
    <>
      <ModulePage
        title="Applicant Tracking"
        subtitle={`${stats?.open_jobs || 0} open jobs · ${totalApplicants} total applicants`}
        icon={<Briefcase size={20} />}
        tabs={TABS}
        activeTab={tab}
        onTabChange={handleTabChange}
        actions={
          <>
            <button className="btn-secondary" onClick={() => openCreate('applicant')}><UserPlus size={14} /> Applicant</button>
            <button className="btn-primary" onClick={() => openCreate('job')}><Plus size={14} /> Job</button>
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open Jobs" value={stats?.open_jobs || 0} icon={<Briefcase size={20} />} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-500/10" />
          <StatCard label="Total Applicants" value={totalApplicants} icon={<Users size={20} />} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-500/10" />
          <StatCard label="Scheduled Interviews" value={stats?.interviews_scheduled || 0} icon={<Calendar size={20} />} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-500/10" />
          <StatCard label="Offers Sent" value={stats?.offers_sent || 0} icon={<Star size={20} />} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-500/10" />
        </div>

        {tab === 'Pipeline' && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <select className="input text-sm" value={selectedJob || ''} onChange={e => { setSelectedJob(e.target.value || null); setPage(1); }}>
                <option value="">All Jobs</option>
                {jobList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <button className="btn-secondary text-sm" onClick={() => openCreate('applicant')}><Plus size={14} /> Add Applicant</button>
              <button className="btn-secondary text-sm" onClick={() => openCreate('interview')}><Calendar size={14} /> Schedule Interview</button>
              <button className="btn-secondary text-sm" onClick={() => openCreate('offer')}><Star size={14} /> Create Offer</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STAGE_ORDER.map(stage => (
                <div key={stage} className="flex-shrink-0 w-56">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{stage.replace('_', ' ')}</span>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs px-2 py-0.5">{byStage(stage).length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {byStage(stage).map(app => (
                      <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{app.full_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{app.job_title}</div>
                        {app.rating && (
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <span key={n} className={`text-xs ${n <= app.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          {stage !== 'hired' && stage !== 'rejected' && (
                            <button onClick={() => handleMoveStage(app, stage)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                              Move <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Jobs' && (
          <>
            <DataTable columns={jobColumns} data={jobList} loading={jobsLoading} emptyMessage="No job postings yet" />
            <Pagination count={jobCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'Interviews' && (
          <>
            <DataTable columns={intvColumns} data={intvList} loading={intvLoading} emptyMessage="No interviews scheduled" />
            <Pagination count={intvCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}

        {tab === 'Offers' && (
          <>
            <DataTable columns={offerColumns} data={offerList} loading={offerLoading} emptyMessage="No offer letters" />
            <Pagination count={offerCount} page={page} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </ModulePage>

      <CrudModal
        open={modal === 'job'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title={editItem ? 'Edit Job' : 'Create Job'}
        onSubmit={handleCreate}
        loading={formLoading}
        edit={!!editItem}
      >
        <JobForm form={form} setForm={setForm} />
      </CrudModal>

      <CrudModal
        open={modal === 'applicant'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Add Applicant"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <ApplicantForm form={form} setForm={setForm} jobs={jobList} />
      </CrudModal>

      <CrudModal
        open={modal === 'interview'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Schedule Interview"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <InterviewForm form={form} setForm={setForm} applicants={appList} jobs={jobList} />
      </CrudModal>

      <CrudModal
        open={modal === 'offer'}
        onClose={() => { setModal(null); setEditItem(null); }}
        title="Create Offer"
        onSubmit={handleCreate}
        loading={formLoading}
        edit={false}
      >
        <OfferForm form={form} setForm={setForm} applicants={appList} jobs={jobList} />
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
