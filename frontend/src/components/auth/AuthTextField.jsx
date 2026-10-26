import React from 'react';

/**
 * Modern SaaS AuthTextField
 * Accessible labeled text input with 8px radius, uniform h-[48px] control height,
 * focus rings, and inline error states.
 */
export default function AuthTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-[#1E293B]">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}
      <div
        className={`relative flex items-center bg-white border rounded-lg transition-all overflow-hidden ${
          error
            ? 'border-[#DC2626] focus-within:ring-2 focus-within:ring-[#DC2626]/20'
            : 'border-[#E2E8F0] focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/15'
        } ${disabled ? 'bg-[#F8FAFC] opacity-75 cursor-not-allowed' : ''}`}
      >
        {Icon && (
          <div className="pl-3.5 text-[#64748B] flex items-center pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full h-[48px] px-3.5 bg-transparent text-sm text-[#1E293B] placeholder-[#94A3B8] outline-none font-sans ${
            Icon ? 'pl-2' : ''
          }`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-[#DC2626] font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-helper`} className="text-xs text-[#64748B]">
          {helperText}
        </p>
      )}
    </div>
  );
}
