import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ConfirmDelete({ open, onClose, onConfirm, title = 'Delete this item', loading }) {
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
          <button onClick={onClose} disabled={loading} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
