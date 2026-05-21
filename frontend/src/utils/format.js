export const fmt = {
  currency: (v, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v || 0),
  number: (v) => new Intl.NumberFormat('en-US').format(v || 0),
  date: (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  dateShort: (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
  datetime: (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
  timeAgo: (d) => {
    if (!d) return '—';
    const diff = Date.now() - new Date(d);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  },
  hours: (secs) => {
    const h = Math.floor((secs || 0) / 3600);
    const m = Math.floor(((secs || 0) % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },
  percent: (v) => `${Math.round(v || 0)}%`,
  initials: (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
  shortNum: (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n || 0),
};

export const BADGE_COLOR = {
  active:'green',inactive:'gray',pending:'yellow',draft:'gray',
  approved:'green',rejected:'red',cancelled:'red',completed:'blue',
  todo:'gray',in_progress:'blue',review:'purple',done:'green',backlog:'slate',
  new:'blue',screening:'yellow',interview:'purple',assessment:'orange',
  offer:'cyan',hired:'green',withdrawn:'gray',
  published:'green',scheduled:'blue',failed:'red',publishing:'yellow',
  low:'green',medium:'yellow',high:'orange',urgent:'red',critical:'red',
  present:'green',absent:'red',late:'yellow',on_leave:'blue',half_day:'orange',
  open:'blue',won:'green',lost:'red',sent:'blue',paid:'green',overdue:'red',
  planning:'purple',on_hold:'gray',
};

const CLS = {
  green:'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  blue:'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  yellow:'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  red:'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  purple:'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  orange:'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  cyan:'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  gray:'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  slate:'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
};

export function badge(status) {
  const c = BADGE_COLOR[status] || 'gray';
  return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CLS[c] || CLS.gray}`;
}
