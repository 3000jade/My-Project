import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function DataTable({
  columns = [],
  data = [],
  keyField = "id",
  pageSize = 10,
  emptyMessage = "No records found.",
  onRowClick,
  selectable = false,
  selectedKeys = new Set(),
  onToggleSelect,
  onToggleSelectAll
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  const isAllSelected = currentData.length > 0 && currentData.every(row => selectedKeys.has(row[keyField]));
  const isSomeSelected = currentData.some(row => selectedKeys.has(row[keyField])) && !isAllSelected;

  return (
    <div className="bg-white rounded-xl border border-[#E5EBEB] shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FBFBF9] border-b border-[#E5EBEB]">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={() => onToggleSelectAll && onToggleSelectAll(currentData.map(r => r[keyField]))}
                    className="w-4 h-4 rounded border-[#D8DFDF] text-[#0D4446] focus:ring-[#0D4446] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-slate-700",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EBEB] text-xs">
            {currentData.length > 0 ? (
              currentData.map((row, rowIdx) => {
                const rowKey = row[keyField] || rowIdx;
                const isSelected = selectedKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-[#0D4446]/5" : "hover:bg-[#FBFBF9]",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <td 
                        className="w-10 px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect && onToggleSelect(rowKey)}
                          className="w-4 h-4 rounded border-[#D8DFDF] text-[#0D4446] focus:ring-[#0D4446] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={cn("px-4 py-3 text-slate-600 align-middle", col.className)}
                      >
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-[#E5EBEB] bg-[#FBFBF9]/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-[#0F172A]">{startIndex + 1}</span> to{" "}
            <span className="font-semibold text-[#0F172A]">
              {Math.min(startIndex + pageSize, data.length)}
            </span>{" "}
            of <span className="font-semibold text-[#0F172A]">{data.length}</span> results
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-[#D8DFDF] bg-white hover:bg-[#F4F5F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-[#D8DFDF] bg-white hover:bg-[#F4F5F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
