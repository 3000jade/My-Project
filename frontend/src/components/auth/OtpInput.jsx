import React, { useRef, useEffect } from 'react';

/**
 * Modern SaaS 6-Digit OtpInput
 * Supports auto-focus advance, backspace navigation, paste handling, and keyboard controls.
 */
export default function OtpInput({
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  error = false,
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

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-3 w-full max-w-sm mx-auto"
      onPaste={handlePaste}
      role="group"
      aria-label="One-Time Password 6-Digit Code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of 6`}
          data-testid={`otp-input-${index}`}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 outline-none select-all ${
            disabled
              ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed'
              : error
              ? 'border-red-400 bg-red-50/30 text-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-500'
              : digit
              ? 'border-[#0F766E] bg-white text-[#1E293B] shadow-sm ring-1 ring-[#0F766E]/10'
              : 'border-[#CBD5E1] bg-white text-[#1E293B] hover:border-[#94A3B8] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20'
          }`}
        />
      ))}
    </div>
  );
}
