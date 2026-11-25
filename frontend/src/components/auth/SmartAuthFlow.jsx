import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import sessionCoordinator from '@/services/sessionCoordinator';
import AuthShowcasePanel from './smart-auth/AuthShowcasePanel';
import GoogleAuthButton from './smart-auth/GoogleAuthButton';
import {
  classifyLoginError,
  clearRememberedEmail,
  getRememberedEmail,
  saveRememberedEmail,
  suggestEmailCorrection,
} from './smart-auth/smartAuthHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

const ALERT_ANIMATION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.15, ease: 'easeOut' },
};

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' },
};

const PRIMARY_BUTTON_CLASS =
  'w-full h-12 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-base normal-case tracking-normal gap-2';

const INPUT_CLASS =
  'h-12 px-4 rounded-lg border-outline bg-surface text-base text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';

const INPUT_ERROR_CLASS =
  'border-red-600 focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/20';

const INPUT_GROUP_CLASS =
  'h-12 rounded-lg border border-outline bg-surface shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20';

const INPUT_GROUP_ERROR_CLASS =
  'h-12 rounded-lg border border-red-600 bg-surface shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-red-600 has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-red-600/20';

const LOCKOUT_STORAGE_KEY = 'hs_login_lockout_until';

function getRemainingLockoutSeconds() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
    const until = Number(raw);
    if (!until) return 0;
    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining <= 0) {
      window.sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
      return 0;
    }
    return remaining;
  } catch {
    return 0;
  }
}

function persistLockoutSeconds(seconds) {
  if (typeof window === 'undefined') return;
  try {
    if (seconds > 0) {
      window.sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(Date.now() + seconds * 1000));
    } else {
      window.sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export default function SmartAuthFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();

  const [emailInput, setEmailInput] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(() => getRemainingLockoutSeconds());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [authFeedback, setAuthFeedback] = useState(() =>
    getRemainingLockoutSeconds() > 0
      ? {
          kind: 'locked',
          variant: 'destructive',
          title: 'Sign-in paused',
          message: 'Please wait before trying again, or reset your password.',
          showResetLink: true,
        }
      : null
  );

  useEffect(() => {
    if (lockoutTimer <= 0) return undefined;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  useEffect(() => {
    if (lockoutTimer === 0 && authFeedback?.kind === 'locked') {
      persistLockoutSeconds(0);
      setFailedAttempts(0);
      setAuthFeedback(null);
    }
  }, [lockoutTimer, authFeedback]);

  const contextNotice = useMemo(() => {
    const rawSearch =
      location.search || (typeof window !== 'undefined' ? window.location.search : '');
    const searchParams = new URLSearchParams(rawSearch);
    const reason = searchParams.get('reason') || location.state?.reason;
    const returnUrlParam = searchParams.get('returnUrl') || location.state?.from?.pathname;

    if (reason === 'session_expired') {
      return {
        title: 'Session ended',
        message: 'Your session ended. Sign in again to continue.',
      };
    }

    const validReturn = returnUrlParam
      ? sessionCoordinator.validateReturnTo(decodeURIComponent(returnUrlParam))
      : null;

    if (
      validReturn &&
      validReturn !== '/' &&
      validReturn !== '/login' &&
      validReturn !== '/register'
    ) {
      return {
        title: 'Sign in required',
        message: 'Sign in to open that page.',
      };
    }

    return null;
  }, [location.search, location.state]);

  const emailSuggestion = useMemo(() => suggestEmailCorrection(emailInput), [emailInput]);

  const handleCapsLockCheck = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const completeAuthRedirect = (role, targetEmail) => {
    const rawSearch =
      location.search || (typeof window !== 'undefined' ? window.location.search : '');
    const searchParams = new URLSearchParams(rawSearch);
    const returnUrlParam = searchParams.get('returnUrl') || location.state?.from?.pathname;
    const validReturn = returnUrlParam
      ? sessionCoordinator.validateReturnTo(decodeURIComponent(returnUrlParam))
      : null;

    const userRole =
      role ||
      (targetEmail?.toLowerCase().includes('agent')
        ? 'agent'
        : targetEmail?.toLowerCase().includes('broker')
        ? 'broker'
        : 'client');

    if (
      validReturn &&
      validReturn !== '/' &&
      validReturn !== '/login' &&
      validReturn !== '/register'
    ) {
      const isRoleAllowed =
        userRole === 'admin' ||
        (userRole === 'agent' && validReturn.startsWith('/agent')) ||
        (userRole === 'broker' && validReturn.startsWith('/broker')) ||
        (userRole === 'client' && validReturn.startsWith('/client'));

      if (isRoleAllowed) {
        navigate(validReturn);
        return;
      }
    }

    if (userRole === 'admin') {
      navigate('/admin/cms');
    } else if (userRole === 'agent') {
      navigate('/agent/dashboard');
    } else if (userRole === 'broker') {
      navigate('/broker/dashboard');
    } else {
      navigate('/client/dashboard');
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (lockoutTimer > 0) {
      setAuthFeedback({
        kind: 'locked',
        variant: 'destructive',
        title: 'Sign-in paused',
        message: `Please wait ${lockoutTimer}s before trying again, or reset your password.`,
        showResetLink: true,
      });
      return;
    }

    const targetEmail = String(emailInput || '').trim();
    const nextFieldErrors = { email: '', password: '' };

    if (!targetEmail) {
      nextFieldErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      nextFieldErrors.email = 'Enter a valid email address (for example, name@example.com).';
    }

    if (!password) {
      nextFieldErrors.password = 'Please enter your password.';
    }

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setAuthFeedback({
        kind: 'validation',
        variant: 'destructive',
        title: 'Check your details',
        message: nextFieldErrors.email || nextFieldErrors.password,
      });
      return;
    }

    setFieldErrors({ email: '', password: '' });
    setAuthFeedback(null);
    setIsSubmitting(true);

    try {
      const authData = await login(targetEmail, password, rememberMe);
      persistLockoutSeconds(0);
      setFailedAttempts(0);
      setLoginSuccess(true);
      setAuthFeedback({
        kind: 'success',
        variant: 'teal',
        title: 'Signed in',
        message: 'Opening your dashboard...',
      });

      if (rememberMe) {
        saveRememberedEmail(targetEmail);
      } else {
        clearRememberedEmail();
      }

      completeAuthRedirect(authData?.user?.role, targetEmail);
    } catch (err) {
      const classified = classifyLoginError(err);

      if (classified.countsTowardLockout) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= 3) {
          persistLockoutSeconds(30);
          setLockoutTimer(30);
          setAuthFeedback({
            kind: 'locked',
            variant: 'destructive',
            title: 'Sign-in paused',
            message: 'Please wait 30 seconds or reset your password.',
            showResetLink: true,
          });
        } else {
          const remaining = 3 - nextFailed;
          setAuthFeedback({
            kind: 'error',
            variant: 'destructive',
            title: classified.title,
            message: `${classified.message} (${remaining} ${remaining === 1 ? 'try' : 'tries'} left before a 30-second pause.)`,
            showResetLink: true,
          });
        }
      } else {
        setAuthFeedback({
          kind: 'error',
          variant: 'destructive',
          title: classified.title,
          message: classified.message,
          showResetLink: false,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setAuthFeedback({
        kind: 'error',
        variant: 'destructive',
        title: 'Google sign-in incomplete',
        message: 'Google did not return sign-in details. Please try again.',
      });
      return;
    }

    setFieldErrors({ email: '', password: '' });
    setAuthFeedback(null);
    setIsSubmitting(true);
    try {
      const authData = await googleLogin(credentialResponse.credential, 'client');
      setFailedAttempts(0);
      setLoginSuccess(true);
      setAuthFeedback({
        kind: 'success',
        variant: 'teal',
        title: 'Signed in',
        message: 'Opening your dashboard...',
      });
      if (authData?.user?.email) {
        saveRememberedEmail(authData.user.email);
      }
      completeAuthRedirect(authData?.user?.role || 'client', authData?.user?.email);
    } catch (err) {
      setAuthFeedback({
        kind: 'error',
        variant: 'destructive',
        title: 'Google sign-in failed',
        message: err?.message || 'Google sign-in did not go through. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setAuthFeedback({
      kind: 'error',
      variant: 'destructive',
      title: 'Google sign-in cancelled',
      message: 'Google sign-in was cancelled. You can try again or use your email.',
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen w-full bg-background text-on-surface font-sans flex flex-col lg:flex-row">
        <AuthShowcasePanel />

        <section className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-background">
          <div className="w-full max-w-lg mx-auto flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="h-11 px-2 text-on-surface-variant hover:text-on-surface normal-case tracking-normal font-medium text-sm gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>Back to home</span>
            </Button>
          </div>

          {/* Symmetrically Centered Fixed-Height Sign-In Card */}
          <div className="w-full max-w-lg mx-auto my-auto py-4">
            <motion.div {...CARD_ANIMATION}>
              <Card className="bg-surface border border-outline rounded-xl shadow-xs">
                <CardHeader className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8 sm:pb-2 flex flex-col gap-4">
                  <Link
                    to="/"
                    aria-label="Human Shelter Realty"
                    className="inline-flex items-center self-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <img
                      src="/images/human-shelter-logo.webp"
                      alt="Human Shelter Realty"
                      className="h-12 w-auto object-contain"
                    />
                  </Link>

                  <div className="flex flex-col">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-2xl sm:text-[28px] font-bold tracking-tight text-on-surface">
                        Sign in to Human Shelter
                      </CardTitle>
                      <CardDescription className="text-base text-on-surface-variant">
                        Enter your email and password to open your account.
                      </CardDescription>
                    </div>

                    <AnimatePresence initial={false}>
                      {authFeedback ? (
                        <motion.div
                          key={`${authFeedback.kind}-${authFeedback.title}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <Alert
                              variant={authFeedback.variant}
                              aria-live={authFeedback.variant === 'teal' ? 'polite' : 'assertive'}
                              className="rounded-lg py-2 px-4 [&>svg]:top-2"
                            >
                              {authFeedback.variant === 'teal' ? (
                                <CheckCircle2 className="size-4" />
                              ) : (
                                <AlertCircle className="size-4" />
                              )}
                              <AlertTitle className="text-sm font-semibold">
                                {authFeedback.title}
                              </AlertTitle>
                              <AlertDescription className="text-xs leading-snug">
                                {authFeedback.kind === 'locked' && lockoutTimer > 0
                                  ? `Too many wrong passwords. Try again in ${lockoutTimer}s, or reset your password.`
                                  : authFeedback.message}
                                {authFeedback.showResetLink && (
                                  <>
                                    {' '}
                                    <Link
                                      to="/forgot-password"
                                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                                    >
                                      Reset password
                                    </Link>
                                  </>
                                )}
                              </AlertDescription>
                            </Alert>
                          </div>
                        </motion.div>
                      ) : contextNotice ? (
                        <motion.div
                          key="context-notice"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <Alert variant="teal" aria-live="polite" className="rounded-lg py-2 px-4 [&>svg]:top-2">
                              <Info className="size-4" />
                              <AlertTitle className="text-sm font-semibold">
                                {contextNotice.title}
                              </AlertTitle>
                              <AlertDescription className="text-xs leading-snug">
                                {contextNotice.message}
                              </AlertDescription>
                            </Alert>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-2 flex flex-col gap-4">
                  <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
                    <FieldGroup className="gap-4">
                      <Field className="gap-2 relative" data-invalid={Boolean(fieldErrors.email)}>
                        <FieldLabel
                          htmlFor="login-email"
                          className="text-base font-medium text-on-surface"
                        >
                          Email address
                        </FieldLabel>
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="username"
                          autoFocus
                          disabled={isSubmitting || loginSuccess}
                          aria-invalid={Boolean(fieldErrors.email)}
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({ ...prev, email: '' }));
                            }
                            if (authFeedback && authFeedback.kind !== 'locked') {
                              setAuthFeedback(null);
                            }
                          }}
                          placeholder="you@example.com"
                          className={`${INPUT_CLASS} ${fieldErrors.email ? INPUT_ERROR_CLASS : ''}`}
                          required
                        />

                        <AnimatePresence>
                          {emailSuggestion && (
                            <motion.div
                              key="email-suggestion"
                              {...ALERT_ANIMATION}
                              className="absolute top-full left-0 right-0 mt-1 z-20"
                            >
                              <div className="flex items-center justify-between gap-2 py-2 px-4 rounded-lg bg-surface border border-primary/30 shadow-md text-sm text-on-surface">
                                <span className="inline-flex items-center gap-2 min-w-0 truncate">
                                  <Sparkles className="size-4 text-primary shrink-0" />
                                  <span className="truncate">
                                    Did you mean <strong className="font-semibold">{emailSuggestion}</strong>?
                                  </span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEmailInput(emailSuggestion)}
                                  className="h-8 px-2 text-sm font-semibold text-primary hover:text-primary-hover normal-case tracking-normal shrink-0"
                                >
                                  Use this
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Field>

                      <Field className="gap-2" data-invalid={Boolean(fieldErrors.password)}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FieldLabel
                              htmlFor="login-password"
                              className="text-base font-medium text-on-surface"
                            >
                              Password
                            </FieldLabel>
                            <AnimatePresence>
                              {capsLockOn && (
                                <motion.span
                                  key="caps-lock"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm"
                                >
                                  Caps Lock on
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>

                        <InputGroup
                          className={
                            fieldErrors.password ? INPUT_GROUP_ERROR_CLASS : INPUT_GROUP_CLASS
                          }
                        >
                          <InputGroupInput
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            disabled={isSubmitting || loginSuccess}
                            aria-invalid={Boolean(fieldErrors.password)}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (fieldErrors.password) {
                                setFieldErrors((prev) => ({ ...prev, password: '' }));
                              }
                              if (authFeedback && authFeedback.kind !== 'locked') {
                                setAuthFeedback(null);
                              }
                            }}
                            onKeyUp={handleCapsLockCheck}
                            placeholder="Enter your password"
                            className="h-12 px-4 text-base text-on-surface placeholder:text-on-surface-variant"
                            required
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              size="icon-sm"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="size-10 rounded-lg text-on-surface-variant hover:text-on-surface"
                            >
                              {showPassword ? (
                                <EyeOff className="size-5" />
                              ) : (
                                <Eye className="size-5" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </Field>
                    </FieldGroup>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        disabled={isSubmitting || loginSuccess}
                        onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      />
                      <Label
                        htmlFor="remember-me"
                        className="text-sm font-normal text-on-surface-variant cursor-pointer"
                      >
                        Keep me signed in
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || lockoutTimer > 0 || loginSuccess}
                      className={PRIMARY_BUTTON_CLASS}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="text-white" />
                          <span>Signing in...</span>
                        </>
                      ) : loginSuccess ? (
                        <>
                          <CheckCircle2 className="size-5" />
                          <span>Signed in</span>
                        </>
                      ) : lockoutTimer > 0 ? (
                        <span>Try again in {lockoutTimer}s</span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-sm text-on-surface-variant whitespace-nowrap">
                      or continue with
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isSubmitting || loginSuccess}
                    text="continue_with"
                    onFallbackClick={
                      import.meta.env.DEV
                        ? () => handleGoogleSuccess({ credential: 'mock-google-token-client' })
                        : undefined
                    }
                  />

                  <p className="pt-4 border-t border-outline text-center text-sm text-on-surface-variant">
                    New to Human Shelter?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-primary hover:text-primary-hover hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <p className="text-center text-sm text-on-surface-variant max-w-lg mx-auto">
            Need help signing in?{' '}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </section>
      </main>
    </MotionConfig>
  );
}
