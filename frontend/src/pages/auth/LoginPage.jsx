import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconEye, 
  IconEyeOff, 
  IconAlertCircle,
  IconRefresh
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin, useGoogleOAuth } from '@react-oauth/google';

function GoogleOAuthSafe({ onSuccess, onError, fallback }) {
  try {
    const context = useGoogleOAuth();
    if (!context || !context.clientId) {
      return fallback;
    }
    return (
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        theme="outline"
        size="large"
        width="440"
      />
    );
  } catch {
    return fallback;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

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
    } else if (lower.includes('client')) {
      navigate('/client/dashboard');
    } else {
      navigate('/client/dashboard');
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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setAuthError('Google login did not provide credentials.');
      return;
    }
    
    setAuthError('');
    setIsSubmitting(true);
    try {
      const authData = await googleLogin(credentialResponse.credential, 'client');
      setFailedAttempts(0);
      const userRole = authData?.user?.role || 'client';
      if (userRole === 'agent') {
        navigate('/agent/dashboard');
      } else if (userRole === 'broker' || userRole === 'admin') {
        navigate('/broker/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setAuthError('Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setAuthError('Google authentication was cancelled or failed.');
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
                    <Link 
                      to="/forgot-password"
                      role="button"
                      className="font-sans text-xs text-[#1c2224] hover:text-[#0F766E] hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </Link>
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

            {/* Social SSO Button (Full width Google Button) */}
            <div className="w-full pt-0.5 flex justify-center overflow-hidden rounded-xl border border-[#e1e5df] hover:border-[#c2c9bf] transition-colors">
              <GoogleOAuthSafe
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                fallback={
                  <button
                    type="button"
                    onClick={() => handleGoogleSuccess({ credential: 'mock-google-token-client' })}
                    className="w-full h-[54px] bg-white hover:bg-[#f6f8f6] border border-[#e1e5df] hover:border-[#c2c9bf] text-[#183d3b] font-sans text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                }
              />
            </div>

          </div>
        </section>

      </main>
    </>
  );
}
