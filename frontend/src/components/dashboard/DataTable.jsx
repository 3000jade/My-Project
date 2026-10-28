import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

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
  onToggleSelectAll,
  stickyFirstColumn = false
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  const isAllSelected = currentData.length > 0 && currentData.every(row => selectedKeys.has(row[keyField]));
  const isSomeSelected = currentData.some(row => selectedKeys.has(row[keyField])) && !isAllSelected;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="bg-white dark:bg-[#0B131F] rounded-lg border border-[#E2E8F0] dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <Table className="w-full text-left border-collapse">
          <TableHeader>
            <TableRow className="bg-[#F8FAFC] dark:bg-[#0B131F] border-b border-[#E2E8F0] dark:border-slate-800">
              {selectable && (
                <TableHead className={cn(
                  "w-10 px-3 py-3.5 text-center shrink-0",
                  stickyFirstColumn && "sticky left-0 z-20 bg-[#F8FAFC] dark:bg-[#0B131F]"
                )}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={() => onToggleSelectAll && onToggleSelectAll(currentData.map(r => r[keyField]))}
                    className="w-4 h-4 rounded border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                  />
                </TableHead>
              )}
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={cn(
                    "px-3 py-3.5 text-xs font-semibold text-[#1E293B] dark:text-slate-400 tracking-wider uppercase",
                    stickyFirstColumn && idx === 0 && cn(
                      selectable ? "sticky left-10 z-20 bg-[#F8FAFC] dark:bg-[#0B131F]" : "sticky left-0 z-20 bg-[#F8FAFC] dark:bg-[#0B131F]",
                      "shadow-[1px_0_0_#E2E8F0] dark:shadow-[1px_0_0_#1E293B]"
                    ),
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#E2E8F0] dark:divide-slate-800/80 text-xs">
            {currentData.length > 0 ? (
              currentData.map((row, rowIdx) => {
                const rowKey = row[keyField] || rowIdx;
                const isSelected = selectedKeys.has(rowKey);

                return (
                  <TableRow
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "group transition-colors",
                      isSelected ? "bg-[#0F766E]/5 dark:bg-teal-950/20" : "hover:bg-[#F8FAFC]/80 dark:hover:bg-slate-800/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <TableCell 
                        className={cn(
                          "w-10 px-3 py-3.5 text-center shrink-0",
                          stickyFirstColumn && cn(
                            "sticky left-0 z-10",
                            isSelected ? "bg-[#F3F8F8] dark:bg-teal-950/20" : "bg-white dark:bg-[#0B131F] group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800/40"
                          )
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect && onToggleSelect(rowKey)}
                          className="w-4 h-4 rounded border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                        />
                      </TableCell>
                    )}
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className={cn(
                          "px-3 py-3.5 text-[#1E293B] dark:text-slate-200 align-middle",
                          stickyFirstColumn && colIdx === 0 && cn(
                            selectable ? "sticky left-10 z-10" : "sticky left-0 z-10",
                            "shadow-[1px_0_0_#E2E8F0] dark:shadow-[1px_0_0_#1E293B]",
                            isSelected ? "bg-[#F3F8F8] dark:bg-teal-950/20" : "bg-white dark:bg-[#0B131F] group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800/40"
                          ),
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : row[col.accessor]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                    <p className="text-xs font-medium">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Numbered Pagination Controls Matching Mockup */}
      <div className="px-4 py-3.5 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B131F] flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-[#1E293B]">{data.length > 0 ? startIndex + 1 : 0}</span> to{" "}
          <span className="font-semibold text-[#1E293B]">
            {Math.min(startIndex + pageSize, data.length)}
          </span>{" "}
          of <span className="font-semibold text-[#1E293B]">{data.length}</span> results
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-slate-500 cursor-pointer shadow-2xs"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {getPageNumbers().map((num, i) =>
              num === '...' ? (
                <span key={`dots-${i}`} className="w-7 h-7 flex items-center justify-center text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${num}`}
                  onClick={() => setCurrentPage(num)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors cursor-pointer",
                    currentPage === num
                      ? "bg-[#0F766E] text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                  aria-label={`Page ${num}`}
                >
                  {num}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-slate-500 cursor-pointer shadow-2xs"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
