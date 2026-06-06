import React from 'react';

export default function StatCard({ label, value, icon, color = 'text-indigo-500', bg = 'bg-indigo-50 dark:bg-indigo-500/10' }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
          {icon}
        </div>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}
