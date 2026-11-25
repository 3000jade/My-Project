import React from 'react';
import { cn } from '@/utils/cn';

const PAGE_VARIANTS = {
  public: 'max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 min-w-0',
  portal: 'w-full min-w-0 max-w-full p-4 md:p-6 lg:p-8',
};

const STACK_GAPS = {
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

export function PageContainer({ variant = 'portal', className, children, ...props }) {
  return (
    <div className={cn(PAGE_VARIANTS[variant] ?? PAGE_VARIANTS.portal, className)} {...props}>
      {children}
    </div>
  );
}

export function SectionStack({ gap = '6', className, children, ...props }) {
  return (
    <div className={cn('flex flex-col min-w-0', STACK_GAPS[String(gap)] ?? STACK_GAPS['6'], className)} {...props}>
      {children}
    </div>
  );
}

export function BentoGrid({ className, children, ...props }) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoMain({ className, children, ...props }) {
  return (
    <div className={cn('lg:col-span-8 min-w-0', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoRail({ className, children, ...props }) {
  return (
    <div className={cn('lg:col-span-4 min-w-0 flex flex-col gap-6', className)} {...props}>
      {children}
    </div>
  );
}
