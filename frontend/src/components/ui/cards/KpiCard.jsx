import React, { useId } from 'react';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '../badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../card';
import { Skeleton } from '../skeleton';

const TREND_BADGE_VARIANT = {
  up: 'success',
  down: 'destructive',
  neutral: 'secondary',
};

const SEGMENT_COLOR_CLASS = {
  primary: 'bg-[#0F766E]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
  coral: 'bg-[#FF6B6B]',
};

/**
 * Builds SVG polyline and area paths from an array of numeric values.
 */
function buildSparklinePaths(values, width = 112, height = 48, pad = 4) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * innerW;
    const y = pad + innerH - ((v - min) / span) * innerH;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });

  const linePath = points
    .map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x} ${y}`)
    .join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L${last[0]} ${height} L${first[0]} ${height} Z`;

  return { linePath, areaPath, lastPoint: last };
}

function SparklineGraphic({ data }) {
  const gradientId = useId();
  const paths = buildSparklinePaths(data);
  if (!paths) return null;

  return (
    <svg
      className="h-12 w-28 shrink-0 overflow-visible"
      viewBox="0 0 112 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.areaPath} fill={`url(#${gradientId})`} />
      <path
        d={paths.linePath}
        stroke="#0F766E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={paths.lastPoint[0]} cy={paths.lastPoint[1]} r="3" fill="#0F766E" />
    </svg>
  );
}

function TrendBadge({ trend, trendDirection = 'up' }) {
  if (!trend) return null;
  const variant = TREND_BADGE_VARIANT[trendDirection] || 'secondary';

  return (
    <Badge variant={variant} className="tabular-nums normal-case tracking-normal">
      {trendDirection === 'up' && <TrendingUp className="size-3" />}
      {trendDirection === 'down' && <TrendingDown className="size-3" />}
      <span>{trend}</span>
    </Badge>
  );
}

function ProgressBody({ progress = 0, targetLabel, helperText }) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className="flex flex-col gap-2">
      {targetLabel && (
        <span className="text-xs text-slate-500 tabular-nums">{targetLabel}</span>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#0F766E] transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

function BreakdownBody({ segments = [] }) {
  const total = segments.reduce((sum, seg) => sum + (Number(seg.value) || 0), 0) || 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {segments.map((seg) => {
          const pct = Math.max(0, ((Number(seg.value) || 0) / total) * 100);
          const colorClass = SEGMENT_COLOR_CLASS[seg.color] || SEGMENT_COLOR_CLASS.primary;
          return (
            <div
              key={seg.label}
              className={cn('h-full', colorClass)}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        {segments.map((seg) => {
          const colorClass = SEGMENT_COLOR_CLASS[seg.color] || SEGMENT_COLOR_CLASS.primary;
          return (
            <span key={seg.label} className="inline-flex items-center gap-1.5 tabular-nums">
              <span className={cn('size-2 rounded-full', colorClass)} />
              <span>
                {seg.value} {seg.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Reusable KPI Card supporting 5 approved dashboard styles and 3 size densities:
 * - size: "default" | "md" (standard minimal) | "sm" (compact)
 * - variant: "trend" | "sparkline" | "progress" | "breakdown" | "action"
 */
export default function KpiCard({
  size = 'default',
  variant = 'trend',
  title,
  description,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up',
  sparklineData,
  progress,
  targetLabel,
  helperText,
  segments,
  statusLabel,
  statusVariant = 'warning',
  footerText,
  actionLabel,
  onAction,
  actionSlot,
  loading = false,
  className,
  ...rest
}) {
  if (loading) {
    return (
      <Card
        className={cn(
          'flex flex-col justify-between rounded-xl',
          size === 'default' && 'h-full min-h-[160px]',
          className
        )}
        {...rest}
      >
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-8 w-24" />
          {size === 'default' && <Skeleton className="h-3 w-full" />}
        </CardContent>
        {size === 'default' && (
          <CardFooter className="border-t border-[#E2E8F0] pt-3 pb-4">
            <Skeleton className="h-3 w-32" />
          </CardFooter>
        )}
      </Card>
    );
  }

  if (size === 'sm') {
    return (
      <Card
        className={cn('flex flex-col justify-between rounded-xl p-4 gap-1', className)}
        {...rest}
      >
        <span className="text-xs font-medium text-slate-500 truncate">{title}</span>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold font-mono tracking-tight text-[#1E293B] tabular-nums">
            {value}
          </span>
          {statusLabel && <Badge variant={statusVariant}>{statusLabel}</Badge>}
        </div>
      </Card>
    );
  }

  if (size === 'md') {
    return (
      <Card
        className={cn(
          'flex flex-row items-center justify-between gap-4 rounded-xl p-5',
          className
        )}
        {...rest}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-[#1E293B] tabular-nums">
            {value}
          </span>
        </div>

        <div className="flex items-center shrink-0">
          {statusLabel ? (
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          ) : trend ? (
            <TrendBadge trend={trend} trendDirection={trendDirection} />
          ) : Icon ? (
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full min-h-[160px] flex-col justify-between rounded-xl', className)} {...rest}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="flex flex-col gap-1 min-w-0">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        {variant === 'trend' && Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E]">
            <Icon className="size-4" />
          </div>
        )}

        {variant === 'sparkline' && (
          <TrendBadge trend={trend} trendDirection={trendDirection} />
        )}

        {variant === 'progress' && typeof progress === 'number' && (
          <span className="font-mono text-xs font-semibold text-[#0F766E] tabular-nums">
            {Math.round(progress)}%
          </span>
        )}

        {variant === 'action' && statusLabel && (
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B] tabular-nums">
              {value}
            </span>
            {variant === 'trend' && (
              <TrendBadge trend={trend} trendDirection={trendDirection} />
            )}
            {variant === 'action' && helperText && (
              <span className="text-xs font-medium text-amber-700">{helperText}</span>
            )}
          </div>

          {variant === 'sparkline' && <SparklineGraphic data={sparklineData} />}
        </div>

        {variant === 'progress' && (
          <ProgressBody
            progress={progress}
            targetLabel={targetLabel}
            helperText={helperText}
          />
        )}

        {variant === 'breakdown' && <BreakdownBody segments={segments} />}
      </CardContent>

      {(footerText || actionSlot || (variant === 'action' && actionLabel)) && (
        <CardFooter className="flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 pb-4 text-xs text-slate-500">
          <span className="truncate">{footerText}</span>
          {actionSlot}
          {!actionSlot && variant === 'action' && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#0F766E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
