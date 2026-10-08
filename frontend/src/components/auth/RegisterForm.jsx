import React, { useState, useMemo } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function RegisterForm({ onSubmitRegistration }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z\d]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = useMemo(() => calculateStrength(password), [password]);

  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-[#D8DFDF]', 'bg-[#E76F51]', 'bg-[#F4A261]', 'bg-[#E9C46A]', 'bg-[#2A9D8F]'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passphrases do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitRegistration({
        fullName,
        email,
        password,
        acceptedTerms
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-[14px] font-medium rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-[14px] font-semibold font-inter text-[#141717]">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[rgba(255,255,255,0.90)] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[14px] font-semibold font-inter text-[#141717]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[rgba(255,255,255,0.90)] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 relative">
        <label htmlFor="password" className="text-[14px] font-semibold font-inter text-[#141717]">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[rgba(255,255,255,0.90)] pl-4 pr-12 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors"
            required
          />
          <button
            type="button"
            aria-label="Toggle password visibility"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E9A9B] hover:text-[#0D4446] transition-colors"
          >
            {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
          </button>
        </div>
        
        {/* Password Strength Meter */}
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex gap-1 h-1.5 w-full">
            {[1, 2, 3, 4].map((level) => (
              <div 
                key={level} 
                className={`flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-[#D8DFDF]'}`}
              />
            ))}
          </div>
          <span className={`text-[12px] font-medium transition-colors duration-300 ${strengthScore > 0 ? (strengthScore < 3 ? 'text-[#E76F51]' : 'text-[#2A9D8F]') : 'text-[#8E9A9B]'}`}>
            {password ? strengthLabels[strengthScore] : 'Enter a password'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative">
        <label htmlFor="confirmPassword" className="text-[14px] font-semibold font-inter text-[#141717]">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[rgba(255,255,255,0.90)] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors"
          required
        />
      </div>

      <div className="flex items-start gap-2 mt-2">
        <input
          id="acceptedTerms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#D8DFDF] text-[#0D4446] focus:ring-[#0D4446]"
          required
        />
        <label htmlFor="acceptedTerms" className="text-[14px] leading-tight font-medium font-inter text-[#5C6768]">
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !acceptedTerms}
        className="mt-4 h-[54px] w-full rounded-md bg-[#0D4446] text-white font-semibold font-inter text-[16px] hover:bg-[#083335] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
