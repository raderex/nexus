import React from 'react';

export default function Pagination({ count, page, pageSize = 20, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-gray-500">{count} total</span>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm">Prev</button>
        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-secondary px-3 py-1 text-sm">Next</button>
      </div>
    </div>
  );
}
