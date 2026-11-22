import React from 'react';
import { Edit3, Globe, Archive, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

const STATUS_BADGE = {
  PUBLISHED: { label: 'Published', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  DRAFT: { label: 'Draft', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ARCHIVED: { label: 'Archived', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
};

export default function CmsContentTable({
  items = [],
  onEdit,
  onTogglePublish,
  onArchive,
  onDelete,
  emptyLabel = 'No content items yet.',
}) {
  if (!items.length) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>{emptyLabel}</EmptyTitle>
          <EmptyDescription>
            Click the create button above to add your first item.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#F1F5F9]">
          <TableRow>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Title</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Slug</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B] text-right">Order</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const st = STATUS_BADGE[item.status] || STATUS_BADGE.DRAFT;
            return (
              <TableRow key={item.id} className="hover:bg-[#F8FAFC]">
                <TableCell className="font-medium text-sm text-[#1E293B]">
                  <div>{item.title}</div>
                  {item.summary && (
                    <p className="text-xs text-[#64748B] line-clamp-1 mt-1">{item.summary}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-[#64748B]">{item.slug}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-medium ${st.bg} ${st.text}`}>
                    <span className={`size-2 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-[#64748B]">
                  {item.sort_order ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${item.title}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit3 className="size-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePublish(item)}>
                        <Globe className="size-4 mr-2" />
                        {item.status === 'PUBLISHED' ? 'Move to Draft' : 'Publish Now'}
                      </DropdownMenuItem>
                      {item.status !== 'ARCHIVED' && (
                        <DropdownMenuItem onClick={() => onArchive(item)}>
                          <Archive className="size-4 mr-2" /> Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="size-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
