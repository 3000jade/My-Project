const REMEMBERED_EMAIL_KEY = 'hs_last_auth_email';

const COMMON_DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

/**
 * Extracts an invitation token from either a pasted URL or a raw token string.
 */
export function extractInviteToken(rawInput) {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';
  try {
    if (trimmed.includes('token=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
      return url.searchParams.get('token')?.trim() || '';
    }
  } catch {
    const match = trimmed.match(/token=([^&\s]+)/i);
    if (match?.[1]) return match[1].trim();
  }
  return trimmed;
}

/**
 * Suggests a corrected email address if the user typed a common domain typo.
 */
export function suggestEmailCorrection(rawEmail) {
  const cleaned = String(rawEmail || '').trim().toLowerCase();
  const atIndex = cleaned.indexOf('@');
  if (atIndex <= 0 || atIndex === cleaned.length - 1) return null;

  const localPart = cleaned.slice(0, atIndex);
  const domainPart = cleaned.slice(atIndex + 1);
  const correctedDomain = COMMON_DOMAIN_TYPOS[domainPart];

  if (!correctedDomain) return null;
  return `${localPart}@${correctedDomain}`;
}

/**
 * Evaluates password rules aligned with backend Zod validation and returns a strength summary.
 */
export function evaluatePasswordStrength(password = '') {
  const rules = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: '1 uppercase letter', met: /[A-Z]/.test(password) },
    { id: 'number', label: '1 number', met: /\d/.test(password) },
    { id: 'symbol', label: '1 special symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = rules.filter((rule) => rule.met).length;
  const score = Math.round((metCount / rules.length) * 100);

  let label = 'Weak';
  let tone = 'text-red-600';

  if (metCount === 4) {
    label = 'Strong';
    tone = 'text-emerald-700';
  } else if (metCount === 3) {
    label = 'Good';
    tone = 'text-primary';
  } else if (metCount === 2) {
    label = 'Fair';
    tone = 'text-amber-700';
  }

  return {
    rules,
    metCount,
    score,
    label,
    tone,
    allMet: metCount === rules.length,
  };
}

/**
 * Safely reads the last remembered email from localStorage.
 */
export function getRememberedEmail() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Safely saves the user's email for one-tap return on the same device.
 */
export function saveRememberedEmail(email) {
  if (typeof window === 'undefined') return;
  const cleaned = String(email || '').trim().toLowerCase();
  if (!cleaned) return;
  try {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, cleaned);
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

/**
 * Clears the remembered email from localStorage.
 */
export function clearRememberedEmail() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Classifies login errors into plain-English user context and lockout eligibility.
 */
export function classifyLoginError(err) {
  const status = err?.status;
  const rawMessage = String(err?.message || '').toLowerCase();

  if (
    !status &&
    (rawMessage.includes('network') ||
      rawMessage.includes('timeout') ||
      rawMessage.includes('failed to fetch'))
  ) {
    return {
      kind: 'network',
      title: "Can't reach the server",
      message: 'Check your internet connection and try again.',
      countsTowardLockout: false,
    };
  }

  if (status === 429 || rawMessage.includes('too many')) {
    return {
      kind: 'rate_limit',
      title: 'Too many sign-in requests',
      message: 'Please wait a moment before trying again.',
      countsTowardLockout: false,
    };
  }

  if (rawMessage.includes('confirm') || rawMessage.includes('verify')) {
    return {
      kind: 'unverified',
      title: 'Email not verified yet',
      message: 'Check your inbox for a verification link, or contact support.',
      countsTowardLockout: false,
    };
  }

  if (status >= 500) {
    return {
      kind: 'server',
      title: 'Sign-in is temporarily unavailable',
      message: 'Our server ran into a problem. Please try again in a moment.',
      countsTowardLockout: false,
    };
  }

  return {
    kind: 'credentials',
    title: 'Incorrect sign-in details',
    message: "That email or password didn't match. Try again or reset your password.",
    countsTowardLockout: true,
  };
}
