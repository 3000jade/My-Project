import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconEye, 
  IconEyeOff, 
  IconAlertCircle,
  IconRefresh
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Brute-Force Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Brute-force lockout countdown
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => setLockoutTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const completeAuthRedirect = (targetEmail) => {
    const lower = (targetEmail || identifier).toLowerCase();
    if (lower.includes('agent')) {
      navigate('/agent/dashboard');
    } else if (lower.includes('broker') || lower.includes('admin')) {
      navigate('/broker/dashboard');
    } else {
      navigate('/agent/dashboard');
    }
  };

  // Primary Login Submit
  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (lockoutTimer > 0) {
      setAuthError(`Too many failed attempts. Account cooldown active for ${lockoutTimer}s.`);
      return;
    }

    setAuthError('');
    setIsSubmitting(true);

    try {
      await login(identifier, password);
      setFailedAttempts(0);
      completeAuthRedirect(identifier);
    } catch (err) {
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);

      if (newFailed >= 3) {
        setLockoutTimer(30);
        setAuthError('Account security protocol engaged: 3 failed attempts detected. Cooling down for 30 seconds.');
      } else {
        setAuthError('Invalid email or security passphrase. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setAuthError(`Authenticating via ${provider} secure gateway...`);
    setTimeout(() => {
      setAuthError('');
      navigate('/agent/dashboard');
    }, 1200);
  };

  return (
    <>
      <main className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row m-0 p-0 overflow-x-hidden font-sans selection:bg-[#c4683c] selection:text-white bg-[#ffffff]">
        
        {/* =========================================================================
            LEFT: ARCHITECTURAL SHOWCASE (100% full bleed on wide screens, 50% width)
            ========================================================================= */}
        <section className="w-full lg:w-1/2 h-[340px] sm:h-[420px] lg:h-full relative shrink-0 bg-[#183d3b] text-white border-0 overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1800&q=88" 
            alt="Nordic Minimalist Interior Architecture" 
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05] group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#183d3b]/95 via-[#183d3b]/35 to-black/25 pointer-events-none" />

          {/* Direct positioning in left lower corner without limiting container */}
          <div className="relative z-10 w-full h-full p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-end border-0">

            {/* Bottom: Editorial Slogan & 3-Pill Carousel Indicator in Lower Left Corner */}
            <div className="max-w-[480px] space-y-4">
              <div className="space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-normal leading-[1.14] tracking-tight text-white drop-shadow-sm">
                  Quiet Precision,<br />
                  <span className="italic text-[#fcf1eb] font-light">Cadastral Clarity</span>
                </h1>
              </div>

              {/* 3-Pill Carousel Indicator */}
              <div className="flex items-center gap-2 pt-1" aria-hidden="true">
                <span className="w-9 h-1.5 rounded-full bg-white shadow-md" />
                <span className="w-2.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-2.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            RIGHT: ELEVATED DAYLIGHT AUTH CONSOLE (100% full bleed to right monitor edge)
            ========================================================================= */}
        <section className="w-full lg:w-1/2 min-h-full lg:h-full bg-[#ffffff] relative flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto border-0">
          
          {/* Back to Home Button in the Upper Left Corner of White Background (Out from the container) */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#f4f5f2] hover:bg-[#e1e5df] border border-[#e1e5df] hover:border-[#c2c9bf] rounded-full text-xs font-medium text-[#183d3b] transition-all hover:-translate-x-0.5 shadow-sm cursor-pointer"
            >
              <span>←</span>
              <span>Back to home</span>
            </button>
          </div>

          {/* Inner Form Column (Max-width 440px centered on page) */}
          <div className="w-full max-w-[440px] space-y-5 sm:space-y-6 my-auto py-2 border-0 mx-auto">

            {/* Header */}
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-[#1c2224] leading-tight">
                Welcome back
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#5f6b6f]">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  className="text-[#183d3b] hover:text-[#c4683c] font-semibold underline underline-offset-4 ml-1 cursor-pointer transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>

            {/* Inline Error Banner */}
            <AnimatePresence>
              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-[#fcf1eb] border border-[#c4683c]/30 text-[#b0572d] text-xs rounded-xl font-sans flex items-start gap-2.5 shadow-sm"
                >
                  <IconAlertCircle className="w-4 h-4 shrink-0 text-[#c4683c] mt-0.5" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                
                {/* Identifier Field with Header Label (Uniform h-[54px]) */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="login-identifier" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Email
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all overflow-hidden">
                    <input
                      id="login-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="Enter your email or username" 
                      type="text" 
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field with Header Label & Eye Toggle (Uniform h-[54px]) */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="login-password" className="block font-sans text-xs font-semibold text-[#1c2224] tracking-wide">
                    Password
                  </label>
                  <div className="relative bg-[#f4f5f2] border border-[#e1e5df] focus-within:border-[#183d3b] focus-within:ring-2 focus-within:ring-[#183d3b]/10 focus-within:bg-white rounded-xl transition-all flex items-center pr-2 overflow-hidden">
                    <input
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[54px] px-4 bg-transparent text-xs sm:text-sm text-[#1c2224] placeholder-[#7a868a] outline-none font-sans"
                      placeholder="••••••••••••" 
                      type={showPassword ? "text" : "password"} 
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#7a868a] hover:text-[#183d3b] p-2 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button"
                      onClick={() => setAuthError('Password reset instructions sent if account exists.')}
                      className="font-sans text-xs text-[#1c2224] hover:text-black hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="pt-0.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#183d3b] accent-[#183d3b] cursor-pointer shrink-0" 
                    />
                    <span className="font-sans text-xs sm:text-[13px] text-[#5f6b6f]">
                      Remember me on this browser
                    </span>
                  </label>
                </div>

                {/* Submit Button (Uniform h-[54px]) */}
                <div className="pt-1.5">
                  <motion.button 
                    whileTap={{ scale: 0.99 }}
                    type="submit" 
                    disabled={isSubmitting || lockoutTimer > 0}
                    className="w-full h-[54px] bg-[#183d3b] hover:bg-[#122e2c] text-white font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(24,61,59,0.35)] hover:shadow-[0_14px_28px_-5px_rgba(24,61,59,0.45)] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <IconRefresh className="w-4 h-4 animate-spin" />
                        <span>Authenticating...</span>
                      </span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </motion.button>
                </div>

              </form>

            {/* Perfectly Centered Divider: "Or continue with" */}
            <div className="w-full flex items-center justify-center pt-2">
              <div className="h-[1px] bg-[#e1e5df] flex-1" />
              <span className="px-4 font-sans text-xs text-[#7a868a] select-none text-center whitespace-nowrap">
                Or continue with
              </span>
              <div className="h-[1px] bg-[#e1e5df] flex-1" />
            </div>

            {/* Social SSO Button (Full width Google Button, Uniform h-[54px]) */}
            <div className="w-full pt-0.5">
              <button 
                type="button" 
                onClick={() => handleSocialLogin('Google')}
                className="w-full h-[54px] px-4 rounded-xl border border-[#e1e5df] bg-[#ffffff] hover:bg-[#f4f5f2] font-sans text-xs sm:text-sm font-semibold text-[#1c2224] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm hover:border-[#c2c9bf]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.57 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>

          </div>
        </section>

      </main>
    </>
  );
}
