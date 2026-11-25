import { Home } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Reusable empty-state placeholder for missing or broken property images/videos.
 * Built with DESIGN.md semantic tokens and lucide-react Home icon.
 */
export default function NoImagePlaceholder({
  label = 'No image available',
  variant = 'light',
  compact = false,
  className,
}) {
  const isDark = variant === 'dark';

  return (
    <div
      role="img"
      aria-label={label}
      data-testid="no-image-placeholder"
      className={cn(
        'flex flex-col items-center justify-center gap-2 select-none',
        isDark
          ? 'bg-slate-800 text-slate-300'
          : 'bg-surface-variant text-on-surface-variant',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full border',
          compact ? 'size-10' : 'size-12',
          isDark
            ? 'bg-slate-700/80 border-slate-600 text-slate-200'
            : 'bg-surface border-outline text-on-surface-variant'
        )}
      >
        <Home className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </div>
      {!compact && label && (
        <span
          className={cn(
            'text-xs font-medium tracking-wide',
            isDark ? 'text-slate-300' : 'text-on-surface-variant'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
