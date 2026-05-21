
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

api.interceptors.request.use(cfg => {
  try {
    const s = JSON.parse(localStorage.getItem('nexus-auth') || '{}');
    if (s.token) cfg.headers.Authorization = `Bearer ${s.token}`;
  } catch {}
  return cfg;
});

api.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    try {
      const s = JSON.parse(localStorage.getItem('nexus-auth') || '{}');
      const { data } = await axios.post(`${BASE}/auth/token/refresh/`, { refresh: s.refreshToken });
      localStorage.setItem('nexus-auth', JSON.stringify({ ...s, token: data.access }));
      orig.headers.Authorization = `Bearer ${data.access}`;
      return api(orig);
    } catch { localStorage.removeItem('nexus-auth'); window.location.href = '/login'; }
  }
  return Promise.reject(err);
});

export default api;

export const authAPI = {
  login: d => api.post('/auth/token/', d),
  register: d => api.post('/auth/register/', d),
  refresh: r => api.post('/auth/token/refresh/', { refresh: r }),
  me: () => api.get('/users/me/'),
  updateMe: d => api.patch('/users/me/', d),
  changePassword: d => api.post('/users/change_password/', d),
};

export const orgAPI = {
  list: () => api.get('/organizations/'),
  get: id => api.get(`/organizations/${id}/`),
  create: d => api.post('/organizations/', d),
  update: (id, d) => api.patch(`/organizations/${id}/`, d),
  stats: id => api.get(`/organizations/${id}/dashboard_stats/`),
  members: id => api.get(`/organizations/${id}/members/`),
  invite: (id, d) => api.post(`/organizations/${id}/invite_member/`, d),
};

export const erpAPI = {
  accounts: p => api.get('/erp/accounts/', { params: p }),
  invoices: p => api.get('/erp/invoices/', { params: p }),
  getInvoice: id => api.get(`/erp/invoices/${id}/`),
  createInvoice: d => api.post('/erp/invoices/', d),
  updateInvoice: (id, d) => api.patch(`/erp/invoices/${id}/`, d),
  markPaid: id => api.post(`/erp/invoices/${id}/mark_paid/`),
  expenses: p => api.get('/erp/expenses/', { params: p }),
  createExpense: d => api.post('/erp/expenses/', d),
  updateExpense: (id, d) => api.patch(`/erp/expenses/${id}/`, d),
  incomes: p => api.get('/erp/incomes/', { params: p }),
  createIncome: d => api.post('/erp/incomes/', d),
  transactions: p => api.get('/erp/transactions/', { params: p }),
  financialSummary: () => api.get('/erp/invoices/summary/'),
};

export const crmAPI = {
  contacts: p => api.get('/crm/contacts/', { params: p }),
  getContact: id => api.get(`/crm/contacts/${id}/`),
  createContact: d => api.post('/crm/contacts/', d),
  updateContact: (id, d) => api.patch(`/crm/contacts/${id}/`, d),
  deleteContact: id => api.delete(`/crm/contacts/${id}/`),
  deals: p => api.get('/crm/deals/', { params: p }),
  getDeal: id => api.get(`/crm/deals/${id}/`),
  createDeal: d => api.post('/crm/deals/', d),
  updateDeal: (id, d) => api.patch(`/crm/deals/${id}/`, d),
  pipelines: () => api.get('/crm/pipelines/'),
  pipelineSummary: () => api.get('/crm/deals/pipeline_summary/'),
  activities: p => api.get('/crm/activities/', { params: p }),
  createActivity: d => api.post('/crm/activities/', d),
};

export const hrmAPI = {
  departments: () => api.get('/hrm/departments/'),
  createDepartment: d => api.post('/hrm/departments/', d),
  employees: p => api.get('/hrm/employees/', { params: p }),
  getEmployee: id => api.get(`/hrm/employees/${id}/`),
  createEmployee: d => api.post('/hrm/employees/', d),
  updateEmployee: (id, d) => api.patch(`/hrm/employees/${id}/`, d),
  attendanceSummary: () => api.get('/hrm/attendances/today_summary/'),
  payrolls: p => api.get('/hrm/payrolls/', { params: p }),
  payrollSummary: () => api.get('/hrm/payrolls/summary/'),
  createPayroll: d => api.post('/hrm/payrolls/', d),
  attendances: p => api.get('/hrm/attendances/', { params: p }),
  createAttendance: d => api.post('/hrm/attendances/', d),
  leaveTypes: () => api.get('/hrm/leave-types/'),
  leaveRequests: p => api.get('/hrm/leave-requests/', { params: p }),
  createLeaveRequest: d => api.post('/hrm/leave-requests/', d),
  approveLeave: id => api.post(`/hrm/leave-requests/${id}/approve/`),
  rejectLeave: (id, d) => api.post(`/hrm/leave-requests/${id}/reject/`, d),
  goals: p => api.get('/hrm/goals/', { params: p }),
  createGoal: d => api.post('/hrm/goals/', d),
  updateGoal: (id, d) => api.patch(`/hrm/goals/${id}/`, d),
  reviews: p => api.get('/hrm/reviews/', { params: p }),
  createReview: d => api.post('/hrm/reviews/', d),
  updateReview: (id, d) => api.patch(`/hrm/reviews/${id}/`, d),
  completeReview: id => api.post(`/hrm/reviews/${id}/complete/`),
  assets: p => api.get('/hrm/assets/', { params: p }),
  createAsset: d => api.post('/hrm/assets/', d),
  assignAsset: (id, d) => api.post(`/hrm/assets/${id}/assign/`, d),
  unassignAsset: id => api.post(`/hrm/assets/${id}/unassign/`),
};

export const atsAPI = {
  jobs: p => api.get('/ats/jobs/', { params: p }),
  getJob: id => api.get(`/ats/jobs/${id}/`),
  createJob: d => api.post('/ats/jobs/', d),
  updateJob: (id, d) => api.patch(`/ats/jobs/${id}/`, d),
  publishJob: id => api.post(`/ats/jobs/${id}/publish/`),
  closeJob: id => api.post(`/ats/jobs/${id}/close/`),
  pipelineStats: () => api.get('/ats/jobs/pipeline_stats/'),
  applicants: p => api.get('/ats/applicants/', { params: p }),
  getApplicant: id => api.get(`/ats/applicants/${id}/`),
  createApplicant: d => api.post('/ats/applicants/', d),
  moveApplicant: (id, stage) => api.post(`/ats/applicants/${id}/move_stage/`, { stage }),
  rateApplicant: (id, d) => api.post(`/ats/applicants/${id}/rate/`, d),
  interviews: p => api.get('/ats/interviews/', { params: p }),
  createInterview: d => api.post('/ats/interviews/', d),
  completeInterview: (id, d) => api.post(`/ats/interviews/${id}/complete/`, d),
  offers: p => api.get('/ats/offers/', { params: p }),
  createOffer: d => api.post('/ats/offers/', d),
  sendOffer: id => api.post(`/ats/offers/${id}/send/`),
  acceptOffer: id => api.post(`/ats/offers/${id}/accept/`),
  rejectOffer: (id, d) => api.post(`/ats/offers/${id}/reject/`, d),
  scorecards: p => api.get('/ats/scorecards/', { params: p }),
  createScorecard: d => api.post('/ats/scorecards/', d),
};

export const pmAPI = {
  projects: p => api.get('/pm/projects/', { params: p }),
  getProject: id => api.get(`/pm/projects/${id}/`),
  createProject: d => api.post('/pm/projects/', d),
  updateProject: (id, d) => api.patch(`/pm/projects/${id}/`, d),
  getProjectBoard: id => api.get(`/pm/projects/${id}/task_board/`),
  projectStats: id => api.get(`/pm/projects/${id}/stats/`),
  addMember: (id, d) => api.post(`/pm/projects/${id}/add_member/`, d),
  sprints: p => api.get('/pm/sprints/', { params: p }),
  createSprint: d => api.post('/pm/sprints/', d),
  startSprint: id => api.post(`/pm/sprints/${id}/start/`),
  completeSprint: id => api.post(`/pm/sprints/${id}/complete/`),
  burndown: id => api.get(`/pm/sprints/${id}/burndown/`),
  milestones: p => api.get('/pm/milestones/', { params: p }),
  createMilestone: d => api.post('/pm/milestones/', d),
  tasks: p => api.get('/pm/tasks/', { params: p }),
  getTask: id => api.get(`/pm/tasks/${id}/`),
  createTask: d => api.post('/pm/tasks/', d),
  updateTask: (id, d) => api.patch(`/pm/tasks/${id}/`, d),
  updateTaskStatus: (id, status) => api.post(`/pm/tasks/${id}/update_status/`, { status }),
  addComment: (id, content) => api.post(`/pm/tasks/${id}/add_comment/`, { content }),
  logTime: (id, hours) => api.post(`/pm/tasks/${id}/log_time/`, { hours }),
};

export const trackingAPI = {
  timeLogs: p => api.get('/tracking/time-logs/', { params: p }),
  startTimer: d => api.post('/tracking/time-logs/start_timer/', d),
  stopTimer: id => api.post(`/tracking/time-logs/${id}/stop_timer/`),
  runningTimer: () => api.get('/tracking/time-logs/running/'),
  mySummary: () => api.get('/tracking/time-logs/my_summary/'),
  teamReport: () => api.get('/tracking/time-logs/team_report/'),
  submitForApproval: id => api.post(`/tracking/time-logs/${id}/submit_for_approval/`),
  approvals: p => api.get('/tracking/approvals/', { params: p }),
  approveTimeLog: id => api.post(`/tracking/approvals/${id}/approve/`),
  rejectTimeLog: id => api.post(`/tracking/approvals/${id}/reject/`),
  activityLogs: p => api.get('/tracking/activity/', { params: p }),
  screenshots: p => api.get('/tracking/screenshots/', { params: p }),
  productivity: p => api.get('/tracking/productivity/', { params: p }),
  teamSummary: () => api.get('/tracking/productivity/team_summary/'),
  leaderboard: () => api.get('/tracking/productivity/leaderboard/'),
};

export const socialAPI = {
  accounts: () => api.get('/social/accounts/'),
  accountOverview: () => api.get('/social/accounts/overview/'),
  connectAccount: d => api.post('/social/accounts/', d),
  syncAccount: id => api.post(`/social/accounts/${id}/sync/`),
  posts: p => api.get('/social/posts/', { params: p }),
  getPost: id => api.get(`/social/posts/${id}/`),
  createPost: d => api.post('/social/posts/', d),
  schedulePost: d => api.post('/social/posts/schedule/', d),
  updatePost: (id, d) => api.patch(`/social/posts/${id}/`, d),
  deletePost: id => api.delete(`/social/posts/${id}/`),
  calendarPosts: p => api.get('/social/posts/calendar/', { params: p }),
  generateAI: d => api.post('/social/posts/generate_ai/', d),
  analyticsSummary: () => api.get('/social/posts/analytics_summary/'),
  messages: p => api.get('/social/messages/', { params: p }),
  unreadCount: () => api.get('/social/messages/unread_count/'),
  markRead: id => api.patch(`/social/messages/${id}/`, { is_read: true }),
  markAllRead: () => api.post('/social/messages/mark_all_read/'),
  reply: (id, d) => api.post(`/social/messages/${id}/reply/`, d),
  campaigns: p => api.get('/social/campaigns/', { params: p }),
  createCampaign: d => api.post('/social/campaigns/', d),
  updateCampaign: (id, d) => api.patch(`/social/campaigns/${id}/`, d),
  activateCampaign: id => api.post(`/social/campaigns/${id}/activate/`),
  campaignPerformance: id => api.get(`/social/campaigns/${id}/performance/`),
  media: p => api.get('/social/media/', { params: p }),
  uploadMedia: d => api.post('/social/media/', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  hashtags: p => api.get('/social/hashtags/', { params: p }),
  suggestHashtags: p => api.get('/social/hashtags/suggest/', { params: p }),
  queue: p => api.get('/social/queue/', { params: p }),
};
