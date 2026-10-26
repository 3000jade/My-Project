import React from 'react';
import {
  IconAlertCircle,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';

/**
 * Modern SaaS AuthFeedback
 * Accessible alert banner for status, validation errors, and confirmation notices.
 */
export default function AuthFeedback({
  type = 'error',
  message,
  className = '',
}) {
  if (!message) return null;

  const config = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: <IconAlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
      role: 'alert',
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: <IconCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
      role: 'status',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <IconAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      role: 'alert',
    },
    info: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      icon: <IconInfoCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />,
      role: 'status',
    },
  }[type] || config.error;

  return (
    <div
      role={config.role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`p-3.5 rounded-lg border text-xs sm:text-sm font-sans flex items-start gap-2.5 ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      {config.icon}
      <span className="leading-snug">{message}</span>
    </div>
  );
}
