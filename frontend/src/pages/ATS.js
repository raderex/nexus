
import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { atsAPI } from '../services/api';
import { fmt, badge } from '../utils/format';

const STAGE_ORDER = ['new','screening','interview','assessment','offer','hired','rejected'];

export default function ATS() {
  const [tab, setTab] = useState('Pipeline');
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: jobs, refetch: refetchJobs } = useApi(atsAPI.jobs, [], { initial: { results: [] } });
  const { data: applicants, refetch: refetchApps } = useApi(
    () => atsAPI.applicants(selectedJob ? { job: selectedJob } : {}),
    [selectedJob], { initial: { results: [] } }
  );
  const { data: interviews, refetch: refetchIntv } = useApi(() => atsAPI.interviews({}), [], { initial: { results: [] } });
  const { data: offers, refetch: refetchOffers } = useApi(() => atsAPI.offers({}), [], { initial: { results: [] } });
  const { data: stats } = useApi(atsAPI.pipelineStats, [], { initial: {} });

  const { mutate: moveStage } = useMutation(atsAPI.moveApplicant);
  const { mutate: publishJob } = useMutation(atsAPI.publishJob);
  const { mutate: sendOffer } = useMutation(atsAPI.sendOffer);

  const jobList = jobs?.results || jobs || [];
  const appList = applicants?.results || applicants || [];
  const intvList = interviews?.results || interviews || [];
  const offerList = offers?.results || offers || [];

  const byStage = (stage) => appList.filter(a => a.stage === stage);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applicant Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">{stats?.open_jobs || 0} open jobs · {stats?.total_applicants || 0} total applicants</p>
        </div>
        <button className="btn-primary">+ Post Job</button>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {STAGE_ORDER.map(s => (
          <div key={s} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stats?.by_stage?.[s] || 0}</div>
            <div className="text-xs text-gray-500 capitalize mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {['Pipeline','Jobs','Interviews','Offers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Pipeline (Kanban) ── */}
      {tab === 'Pipeline' && (
        <div>
          <div className="mb-4">
            <select className="input text-sm" value={selectedJob || ''} onChange={e => setSelectedJob(e.target.value || null)}>
              <option value="">All Jobs</option>
              {jobList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGE_ORDER.map(stage => (
              <div key={stage} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{stage.replace('_',' ')}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs px-2 py-0.5">{byStage(stage).length}</span>
                </div>
                <div className="space-y-2">
                  {byStage(stage).map(app => (
                    <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{app.full_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{app.job_title}</div>
                      {app.rating && (
                        <div className="flex mt-1">{[1,2,3,4,5].map(n => (
                          <span key={n} className={`text-xs ${n <= app.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}</div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {stage !== 'hired' && stage !== 'rejected' && (
                          <button onClick={async () => {
                            const idx = STAGE_ORDER.indexOf(stage);
                            if (idx < STAGE_ORDER.length - 2) {
                              await moveStage(app.id, STAGE_ORDER[idx + 1]);
                              refetchApps();
                            }
                          }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Move →</button>
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

      {/* ── Jobs Tab ── */}
      {tab === 'Jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobList.map(job => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{job.department_name} · {job.location}</p>
                </div>
                <span className={badge(job.status)}>{job.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span>👥 {job.applicant_count || 0} applicants</span>
                <span className={badge(job.employment_type)}>{job.employment_type?.replace('_',' ')}</span>
              </div>
              {job.salary_min && (
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {fmt.currency(job.salary_min, job.currency)} – {fmt.currency(job.salary_max, job.currency)}/yr
                </div>
              )}
              <div className="flex gap-2">
                {job.status === 'draft' && (
                  <button onClick={async () => { await publishJob(job.id); refetchJobs(); }}
                    className="btn-primary text-xs py-1">Publish</button>
                )}
                <button className="btn-secondary text-xs py-1" onClick={() => { setSelectedJob(job.id); setTab('Pipeline'); }}>
                  View Applicants
                </button>
              </div>
            </div>
          ))}
          {jobList.length === 0 && <div className="col-span-3 p-8 text-center text-gray-400">No job postings yet</div>}
        </div>
      )}

      {/* ── Interviews Tab ── */}
      {tab === 'Interviews' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Scheduled Interviews</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{['Candidate','Position','Type','Interviewer','Date & Time','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {intvList.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{i.applicant_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{i.job_title}</td>
                    <td className="px-4 py-3"><span className={badge(i.interview_type)}>{i.interview_type?.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{i.interviewer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmt.datetime(i.scheduled_at)}</td>
                    <td className="px-4 py-3"><span className={badge(i.status)}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {intvList.length === 0 && <div className="p-8 text-center text-gray-400">No interviews scheduled</div>}
          </div>
        </div>
      )}

      {/* ── Offers Tab ── */}
      {tab === 'Offers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offerList.map(o => (
            <div key={o.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{o.applicant_name}</h3>
                  <p className="text-xs text-gray-500">{o.job_title}</p>
                </div>
                <span className={badge(o.status)}>{o.status}</span>
              </div>
              <div className="text-xl font-bold text-indigo-600 mb-2">{fmt.currency(o.salary, o.currency)}/yr</div>
              <div className="text-xs text-gray-500 mb-3">Start: {fmt.date(o.start_date)} · Expires: {fmt.date(o.expires_at)}</div>
              {o.status === 'draft' && (
                <button onClick={async () => { await sendOffer(o.id); refetchOffers(); }}
                  className="btn-primary text-xs w-full">Send Offer</button>
              )}
            </div>
          ))}
          {offerList.length === 0 && <div className="col-span-3 p-8 text-center text-gray-400">No offer letters</div>}
        </div>
      )}
    </div>
  );
}
