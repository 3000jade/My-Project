import React from 'react';
import { IconLoader2 } from '@tabler/icons-react';

/**
 * Modern SaaS AuthSubmitButton
 * Accessible submit CTA with loading spinner, standard 8px radius,
 * and high-contrast Teal styling.
 */
export default function AuthSubmitButton({
  children,
  loading = false,
  loadingText = 'Processing...',
  disabled = false,
  variant = 'primary',
  type = 'submit',
  className = '',
  ...props
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full h-[48px] rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
        isPrimary
          ? 'bg-[#0F766E] hover:bg-[#115E59] text-white shadow-sm hover:shadow'
          : 'bg-[#FF6B6B] hover:bg-[#EE5A5A] text-white shadow-sm'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <IconLoader2 className="w-4 h-4 animate-spin text-white" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
