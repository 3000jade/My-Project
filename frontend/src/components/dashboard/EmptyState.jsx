import React from 'react';

export default function EmptyState({
  icon = "folder_open",
  title = "No records found",
  description = "There are no items matching your criteria at this time.",
  action
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm my-6">
      <div className="w-16 h-16 rounded-full bg-[#266F71]/10 text-[#266F71] flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="text-lg font-display font-bold text-[#174849] mb-1">
        {title}
      </h3>
      <p className="text-sm font-sans text-gray-500 mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
