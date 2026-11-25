import React, { useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

/**
 * Modern SaaS 6-Digit OtpInput
 * Supports auto-focus advance, backspace navigation, paste handling, and keyboard controls.
 * Strictly aligned with DESIGN.md semantic tokens and 8px spacing grid.
 */
export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  error = false,
  size = 'default',
}) {
  const inputRefs = useRef([]);

  // Ensure digits array is always length 6
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const updateDigit = (index, char) => {
    const chars = digits.slice();
    chars[index] = char;
    const nextVal = chars.join('').slice(0, 6);
    onChange(nextVal);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (nextVal.length === 6 && onComplete) {
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      } else {
        updateDigit(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index, e) => {
    const raw = e.target.value;
    const onlyDigits = raw.replace(/\D/g, '');
    if (!onlyDigits) {
      updateDigit(index, '');
      return;
    }
    const lastChar = onlyDigits.slice(-1);
    updateDigit(index, lastChar);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6 && onComplete) {
      onComplete(pasted);
    }
  };

  const isLg = size === 'lg';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 w-full mx-auto',
        isLg ? 'max-w-lg' : 'max-w-sm'
      )}
      onPaste={handlePaste}
      role="group"
      aria-label="One-Time Password 6-Digit Code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={digit}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of 6`}
          data-testid={`otp-input-${index}`}
          className={cn(
            'text-center font-sans tabular-nums font-bold rounded-xl border transition-colors select-all focus-visible:outline-none',
            isLg
              ? 'size-12 sm:size-16 text-2xl sm:text-3xl'
              : 'size-11 sm:size-12 text-xl sm:text-2xl',
            disabled
              ? 'bg-surface-variant text-on-surface-variant border-outline cursor-not-allowed opacity-50'
              : error
              ? 'border-red-600 bg-red-50 text-red-600 focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/20'
              : digit
              ? 'border-primary bg-surface text-on-surface shadow-xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
              : 'border-outline-variant bg-surface text-on-surface hover:border-primary/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'
          )}
        />
      ))}
    </div>
  );
}
