import React, { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function LoginForm({ onSubmitCredentials }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitCredentials({ email, password, rememberMe });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          id="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-[#D8DFDF] text-[#0D4446] focus:ring-[#0D4446]"
        />
        <label htmlFor="rememberMe" className="text-[14px] font-medium font-inter text-[#5C6768]">
          Remember me for 30 days
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-[54px] w-full rounded-md bg-[#0D4446] text-white font-semibold font-inter text-[16px] hover:bg-[#083335] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
