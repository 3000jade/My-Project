import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * ViewPropertyButton
 * 
 * Signature Modern SaaS Contrast Capsule Action Button:
 * - Architectural Teal (#0F766E) pill container
 * - Modern SaaS Coral (#FF6B6B) circular badge with white diagonal up-right arrow (↗)
 * - Micro-interaction hover motion (badge translates diagonally)
 * - Flexible rendering as <button>, <Link>, or <a>
 */
export default function ViewPropertyButton({
  label = 'View property',
  to,
  href,
  onClick,
  size = 'default',
  className = '',
  title,
  target,
  rel,
  'aria-label': ariaLabel,
  ...props
}) {
  const sizeClasses = {
    sm: {
      container: 'pl-3 pr-1 py-1 text-[11px] gap-2',
      badge: 'w-5 h-5',
      icon: 'w-3 h-3',
    },
    default: {
      container: 'pl-4 pr-1.5 py-1.5 text-xs gap-2.5',
      badge: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      container: 'pl-5 pr-2 py-2 text-sm gap-3',
      badge: 'w-7 h-7',
      icon: 'w-4 h-4',
    },
  }[size] || sizeClasses.default;

  const baseClasses = cn(
    'inline-flex items-center rounded-full bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A]',
    'text-white font-semibold shadow-xs transition-colors duration-150',
    'cursor-pointer group/btn select-none shrink-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-1',
    sizeClasses.container,
    className
  );

  const innerContent = (
    <>
      <span className="tracking-tight">{label}</span>
      <div
        className={cn(
          'rounded-full bg-[#FF6B6B] text-white flex items-center justify-center shrink-0 shadow-2xs',
          'transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5',
          sizeClasses.badge
        )}
        data-testid="coral-arrow-badge"
      >
        <ArrowUpRight
          className={cn('stroke-[2.5]', sizeClasses.icon)}
          aria-hidden="true"
        />
      </div>
    </>
  );

  const destination = to || href;

  if (destination) {
    const isExternal = destination.startsWith('http') || target === '_blank';
    if (isExternal) {
      return (
        <a
          href={destination}
          target={target || '_blank'}
          rel={rel || 'noopener noreferrer'}
          className={baseClasses}
          title={title || label}
          aria-label={ariaLabel || label}
          onClick={onClick}
          {...props}
        >
          {innerContent}
        </a>
      );
    }
    return (
      <Link
        to={destination}
        className={baseClasses}
        title={title || label}
        aria-label={ariaLabel || label}
        onClick={onClick}
        {...props}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseClasses}
      title={title || label}
      aria-label={ariaLabel || label}
      {...props}
    >
      {innerContent}
    </button>
  );
}
