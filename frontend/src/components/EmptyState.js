import React from 'react';
import { Inbox } from 'lucide-react';

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
