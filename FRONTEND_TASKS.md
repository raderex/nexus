# Frontend Tasks — Agent Instructions

## Critical Priority — WHY the App Feels Broken

**Problem 1: Sidebar navigation doesn't work**
The app uses `DashboardLayout` from `@kaushalparajuli/react-crud-ui` which doesn't properly pass `onNavigate` to sidebar items. Clicking nav items does nothing.

**Fix:** Replace `DashboardLayout` with a custom `Layout` component in `components/Layout.js`. Build the sidebar + header yourself using Tailwind CSS. This is the single most important fix.

**Problem 2: Can't create/edit/delete anything**
All module pages only read data (GET) but have no working create/edit/delete forms/modals. Users see buttons like "+ Invoice" but clicking them does nothing.

**Fix:** Add modal forms for CRUD operations on every module page.

**Problem 3: Static, not dynamic**
No loading skeletons, no toast notifications on success/error, no optimistic updates, no confirmation dialogs.

**Fix:** Wire up `react-hot-toast` (already installed), add loading states, add confirm dialogs for deletes.

---

## Step 1 — Rewrite Layout.js (HIGHEST PRIORITY)

Current `Layout.js` uses:
```jsx
<DashboardLayout sidebarProps={{ items: NAV, onNavigate: (href) => navigate(href) }}>
  <Outlet />
</DashboardLayout>
```

This is broken. Build a custom Layout instead:

```jsx
// components/Layout.js — rewrite from scratch
export default function Layout() {
  const { user, org, logout, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — fixed left panel */}
      <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">N</div>
            <span className="font-semibold text-gray-900 dark:text-white">Nexus</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer — theme toggle, settings, logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings size={16} /> Settings
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top header bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.first_name || user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600">
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content via Outlet */}
        <Outlet />
      </main>
    </div>
  );
}
```

Replace the import in `App.js`: remove `Layout` import of old, keep the same name.

---

## Step 2 — Premium UI Design Guidelines

Study these patterns before coding. Nexus should look like **Trevo Cloud** (trevocloud.com), **Sociair** (sociair.com), or top Dribbble dashboards.

### Premium UI Rules:
1. **Background:** `bg-gray-50 dark:bg-gray-950` for page, white cards on top
2. **Cards:** `bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800 shadow-sm`
3. **Tables:** Used shared `DataTable` component — subtle hover, clean typography
4. **Buttons:** `btn-primary` (indigo gradient) for primary actions, `btn-secondary` for secondary
5. **Icons:** lucide-react everywhere — NO emoji icons
6. **Spacing:** Consistent `p-6` or `p-8`, `gap-4` between cards
7. **Typography:** text-gray-900 for headings, text-gray-500 for secondary, text-xs uppercase for table headers
8. **Dark mode:** Every element needs `dark:` variant

### Color Palette:
- Primary: `#6366f1` (indigo-500) → buttons, links, active states
- Success: `#10b981` (emerald-500) → revenue, hired, completed
- Warning: `#f59e0b` (amber-500) → pending, in progress
- Danger: `#ef4444` (red-500) → expenses, rejected, deleted
- Info: `#3b82f6` (blue-500) → sent, scheduled
- Cards bg: `bg-emerald-50 dark:bg-emerald-500/10` for each color variant

---

## Step 3 — Add CRUD Modals to Every Module Page

Each module needs these components. Create a `modals/` folder:

### Pattern for every page:
```jsx
// Each page gets: list view + create modal + edit modal + delete confirm

// 1. Create Modal — opens on "+" button click
function CreateInvoiceModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({...});
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await erpAPI.createInvoice(form);
      toast.success('Invoice created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create');
    }
    setLoading(false);
  }
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields with input className */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. Delete Confirm — reusable component called on delete click
function ConfirmDelete({ open, onClose, onConfirm, title = 'Delete this item' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}
```

### Pages needing CRUD modals:

| Module | Create | Edit | Delete | Special Modals |
|--------|--------|------|--------|----------------|
| **ERP** | Invoice, Expense, Income forms | Same as create pre-filled | ConfirmDelete | Mark Paid, Approve Expense |
| **CRM** | Contact, Deal, Activity forms | Same | ConfirmDelete | Move Deal Stage, Mark Activity Complete |
| **HRM** | Employee, Department, Payroll, Leave Request forms | Same | ConfirmDelete | Approve/Reject Leave, Assign Asset |
| **ATS** | Job Posting, Applicant, Interview, Offer forms | Same | ConfirmDelete | Move Applicant Stage, Send Offer, Publish Job |
| **PM** | Project, Task, Sprint, Milestone forms | Same | ConfirmDelete | Update Task Status, Add Comment, Log Time |
| **Tracking** | Manual Time Log form | Same | ConfirmDelete | Start/Stop Timer, Approve/Reject Time Log |
| **Social** | Post, Campaign forms | Same | ConfirmDelete | Schedule Post, Generate AI, Reply to Message |

---

## Step 4 — Wire Up Interactivity

### Toast Notifications (react-hot-toast)
```jsx
// index.js — add Toaster
import { Toaster } from 'react-hot-toast';

root.render(
  <>
    <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px' } }} />
    <App />
  </>
);

// In any page:
import toast from 'react-hot-toast';
toast.success('Invoice created!');
toast.error('Failed to save');
```

### Loading Skeletons
```jsx
// components/Skeleton.js
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({length: cols}).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Empty States with CTA
```jsx
// components/EmptyState.js  
export default function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        {icon || <Inbox size={32} className="text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {actionLabel && (
        <button onClick={onAction} className="btn-primary">{actionLabel}</button>
      )}
    </div>
  );
}
```

### Search + Filters
Every list page should have:
```jsx
// Top of each tab
<div className="flex items-center gap-3">
  <div className="relative flex-1 max-w-sm">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      className="input pl-9"
      placeholder="Search..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <select className="input w-auto">
    <option>All statuses</option>
    ...
  </select>
</div>
```

### Pagination
```jsx
// components/Pagination.js
export default function Pagination({ count, page, pageSize = 20, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-gray-500">{count} total</span>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-secondary px-3 py-1">Prev</button>
        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-secondary px-3 py-1">Next</button>
      </div>
    </div>
  );
}
```

---

## Step 5 — Module-by-Module Refactor

### Agent 1: CRM.js, HRM.js, ATS.js
For each page:
1. Wrap in `<ModulePage>` with proper icon + tabs
2. Use `<StatCard>` for metrics
3. Use `<DataTable>` for all table views
4. Add Create/Edit modals for every entity
5. Add search, filter, pagination
6. Wire toasts on mutations
7. Remove any `@kaushalparajuli/react-crud-ui` imports

### Agent 2: PM.js, Tracking.js, Social.js
Same as above but also:
- PM: Keep the Kanban board interactive (drag to move tasks if possible)
- Tracking: The timer needs to work end-to-end (start → stop → submit for approval)
- Social: The Compose/Inbox views need to work with real API data

---

## Step 6 — Orphaned Pages

These files in `pages/` aren't routed in `App.js`:
- `Analytics.js`, `Calendar.js`, `Composer.js`, `Inbox.js`, `Team.js`

Either:
- Integrate them into the right module (e.g., Composer → Social tab, Inbox → Social tab)
- Or add them as new routes in `App.js` with proper sidebar nav items
- Or delete them if they're stale

---

## File Reference

```
frontend/src/
├── App.js                     → routes (update if adding pages)
├── store.js                   → zustand auth + org state
├── index.css                  → global styles + component classes
├── services/api.js            → all API methods
├── hooks/useApi.js            → useApi + useMutation hooks
├── components/
│   ├── Layout.js              → REWRITE THIS (sidebar + header)
│   ├── ModulePage.js          → page wrapper (already done)
│   ├── DataTable.js           → table (already done)
│   ├── StatCard.js            → metric card (already done)
│   ├── ConfirmDelete.js       → create this
│   ├── Pagination.js          → create this
│   ├── EmptyState.js          → create this
│   └── Skeleton.js            → create this
└── pages/
    ├── Login.js               → already modernized
    ├── Dashboard.js           → already working
    ├── ERP.js                 → already refactored (reference)
    ├── CRM.js                 → needs modals + refactor
    ├── HRM.js                 → needs modals + refactor
    ├── ATS.js                 → needs modals + refactor
    ├── PM.js                  → needs modals + refactor
    ├── Tracking.js            → needs modals + refactor
    └── Social.js              → needs modals + refactor
```

Build, test, repeat: `npm run build` (must pass with no errors).
