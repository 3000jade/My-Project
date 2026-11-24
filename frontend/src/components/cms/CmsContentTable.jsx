import React from 'react';
import {
  Edit3,
  Globe,
  Archive,
  Trash2,
  MoreHorizontal,
  Award,
  Building2,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { getContentTypeLabel } from '@/components/cms/cmsConfig';

const STATUS_BADGE = {
  PUBLISHED: {
    label: 'Published',
    dot: 'bg-emerald-500',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  DRAFT: {
    label: 'Draft',
    dot: 'bg-amber-500',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ARCHIVED: {
    label: 'Archived',
    dot: 'bg-slate-400',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatBannerCta(payload = {}) {
  const label = String(payload?.cta_label || '').trim();
  const url = String(payload?.cta_url || '').trim();
  if (label && url) return `${label} → ${url}`;
  if (label) return label;
  if (url) return url;
  return '—';
}

function renderTabHeaders(tabId) {
  const headerClass =
    'text-xs font-semibold uppercase tracking-wider text-[#64748B]';

  switch (tabId) {
    case 'staff':
      return (
        <>
          <TableHead className={headerClass}>Member</TableHead>
          <TableHead className={headerClass}>Role</TableHead>
          <TableHead className={headerClass}>Department</TableHead>
        </>
      );
    case 'partners-awards':
      return (
        <>
          <TableHead className={headerClass}>Partner / Award</TableHead>
          <TableHead className={headerClass}>Kind</TableHead>
          <TableHead className={headerClass}>Details</TableHead>
        </>
      );
    case 'company':
      return (
        <>
          <TableHead className={headerClass}>Title</TableHead>
          <TableHead className={headerClass}>Kind</TableHead>
          <TableHead className={headerClass}>Details</TableHead>
        </>
      );
    case 'guides':
      return (
        <>
          <TableHead className={headerClass}>Title</TableHead>
          <TableHead className={headerClass}>Category</TableHead>
          <TableHead className={headerClass}>Web Address</TableHead>
        </>
      );
    case 'faqs':
      return (
        <>
          <TableHead className={headerClass}>Question</TableHead>
          <TableHead className={headerClass}>Category</TableHead>
        </>
      );
    case 'banners':
    default:
      return (
        <>
          <TableHead className={headerClass}>Headline</TableHead>
          <TableHead className={headerClass}>Button CTA</TableHead>
        </>
      );
  }
}

function renderTabCells(tabId, item) {
  const payload = item.payload || {};

  switch (tabId) {
    case 'staff':
      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div className="flex items-center gap-4 min-w-0">
              {item.media_url ? (
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="size-10 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] object-cover shrink-0"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="size-10 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-semibold flex items-center justify-center shrink-0"
                >
                  {getInitials(item.title)}
                </div>
              )}
              <span className="truncate font-medium text-[#1E293B]">
                {item.title}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-sm text-[#1E293B]">
            {payload.role || '—'}
          </TableCell>
          <TableCell className="text-sm text-[#64748B]">
            {payload.department || '—'}
          </TableCell>
        </>
      );

    case 'partners-awards': {
      const isAward = item.content_type === 'award';
      const showImage =
        Boolean(item.media_url) && (!isAward || payload.media_type !== 'video');
      const detailsText = isAward
        ? [payload.year, payload.organization].filter(Boolean).join(' · ') || '—'
        : payload.website_url || '—';

      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div className="flex items-center gap-4 min-w-0">
              {showImage ? (
                <img
                  src={item.media_url}
                  alt={item.title}
                  className={
                    isAward
                      ? 'size-10 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] object-cover shrink-0'
                      : 'size-10 rounded-lg border border-[#E2E8F0] bg-white object-contain p-1 shrink-0'
                  }
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="size-10 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] flex items-center justify-center shrink-0"
                >
                  {isAward ? (
                    <Award className="size-4" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium text-[#1E293B]">
                  {item.title}
                </div>
                {item.summary && (
                  <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                    {item.summary}
                  </p>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={isAward ? 'default' : 'secondary'}>
              {getContentTypeLabel(item.content_type, payload)}
            </Badge>
          </TableCell>
          <TableCell className="text-xs text-[#64748B] max-w-xs truncate">
            {detailsText}
          </TableCell>
        </>
      );
    }

    case 'company': {
      const isOffice = item.content_type === 'office';
      const detailsText = isOffice
        ? payload.address || '—'
        : item.slug
          ? `/${item.slug}`
          : '—';

      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div>{item.title}</div>
            {item.summary && (
              <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                {item.summary}
              </p>
            )}
          </TableCell>
          <TableCell>
            <Badge variant={isOffice ? 'default' : 'secondary'}>
              {getContentTypeLabel(item.content_type, payload)}
            </Badge>
          </TableCell>
          <TableCell className="text-xs text-[#64748B] max-w-xs truncate">
            {detailsText}
          </TableCell>
        </>
      );
    }

    case 'guides':
      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div>{item.title}</div>
            {item.summary && (
              <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                {item.summary}
              </p>
            )}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{payload.category || 'Guide'}</Badge>
          </TableCell>
          <TableCell className="text-xs text-[#64748B]">
            {item.slug ? `/${item.slug}` : '—'}
          </TableCell>
        </>
      );

    case 'faqs': {
      const preview = item.body || item.summary || '';
      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div>{item.title}</div>
            {preview && (
              <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                {preview}
              </p>
            )}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{payload.category || 'General'}</Badge>
          </TableCell>
        </>
      );
    }

    case 'banners':
    default:
      return (
        <>
          <TableCell className="font-medium text-sm text-[#1E293B]">
            <div>{item.title}</div>
            {item.summary && (
              <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                {item.summary}
              </p>
            )}
          </TableCell>
          <TableCell className="text-xs text-[#64748B]">
            {formatBannerCta(payload)}
          </TableCell>
        </>
      );
  }
}

export default function CmsContentTable({
  tabId = 'banners',
  items = [],
  onEdit,
  onTogglePublish,
  onArchive,
  onRequestDelete,
  emptyLabel = 'No content items yet.',
}) {
  if (!items.length) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyTitle>{emptyLabel}</EmptyTitle>
          <EmptyDescription>
            Use the button at the top right to create a new item in this section.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-[#E2E8F0] overflow-x-auto">
      <Table>
        <TableHeader className="bg-[#F1F5F9]">
          <TableRow>
            {renderTabHeaders(tabId)}
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B] text-right">
              Order
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#64748B] text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const st = STATUS_BADGE[item.status] || STATUS_BADGE.DRAFT;
            return (
              <TableRow key={item.id} className="hover:bg-[#F8FAFC]">
                {renderTabCells(tabId, item)}
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-medium ${st.classes}`}
                  >
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        aria-label={`Actions for ${item.title}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(item)}>
                        <Edit3 className="size-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePublish?.(item)}>
                        <Globe className="size-4 mr-2" />
                        {item.status === 'PUBLISHED'
                          ? 'Move to Draft'
                          : 'Publish Now'}
                      </DropdownMenuItem>
                      {item.status !== 'ARCHIVED' && (
                        <DropdownMenuItem onClick={() => onArchive?.(item)}>
                          <Archive className="size-4 mr-2" /> Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onRequestDelete?.(item)}
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
