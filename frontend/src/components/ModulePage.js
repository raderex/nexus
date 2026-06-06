import React from 'react';

const tabStyles = {
  base: 'px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
  active: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700',
  inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50',
};

export default function ModulePage({ title, subtitle, icon, tabs, activeTab, onTabChange, children, actions }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {tabs && tabs.length > 0 && (
          <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={tabStyles[activeTab === tab.key ? 'active' : 'inactive']}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
