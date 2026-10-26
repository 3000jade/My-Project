import React, { useState } from 'react';
import { IconEye, IconEyeOff, IconLock, IconCheck } from '@tabler/icons-react';

/**
 * Modern SaaS PasswordField
 * Accessible password input with visibility toggle, optional strength score checklist,
 * and standard 8px radius.
 */
export default function PasswordField({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'current-password',
  error,
  showStrengthMeter = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Strength rules
  const rules = [
    { id: 'length', label: '8+ Characters', met: value.length >= 8 },
    { id: 'case', label: 'Uppercase & Lowercase', met: /[A-Z]/.test(value) && /[a-z]/.test(value) },
    { id: 'number', label: 'At least 1 Number', met: /\d/.test(value) },
    { id: 'symbol', label: 'Special Symbol', met: /[!@#$%^&*(),.?":{}|<>]/.test(value) },
  ];

  const metCount = rules.filter((r) => r.met).length;
  const strengthLabels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-600'];

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
        <div className="pl-3.5 text-[#64748B] flex items-center pointer-events-none">
          <IconLock className="w-4 h-4" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full h-[48px] px-2.5 bg-transparent text-sm text-[#1E293B] placeholder-[#94A3B8] outline-none font-sans"
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="px-3.5 text-[#64748B] hover:text-[#0F766E] focus:outline-none transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-[#DC2626] font-medium">
          {error}
        </p>
      )}

      {showStrengthMeter && value.length > 0 && (
        <div className="pt-1.5 space-y-2">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  metCount >= step ? strengthColors[metCount] : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
            <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] ml-1">
              {strengthLabels[metCount]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 ${
                  rule.met ? 'text-[#10B981] font-medium' : 'text-[#94A3B8]'
                }`}
              >
                {rule.met ? (
                  <IconCheck className="w-3.5 h-3.5 text-[#10B981]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                )}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
