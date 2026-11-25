import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Home,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ProfileCardStudio } from '@/components/profile';
import { profileService } from '@/services/profileService';
import { agentService, computeAgentCompleteness } from '@/services/agentService';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  useToast,
  Toaster,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/utils/cn';

const TRACKED_KEYS = [
  'name',
  'first_name',
  'middle_name',
  'last_name',
  'display_name',
  'avatar',
  'phone',
  'bio',
  'experience_years',
  'date_of_birth',
  'gender',
  'emergency_contact_name',
  'emergency_contact_phone',
  'prc_license_no',
  'prc_validity',
];

export default function AgentProfile() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const logout = auth?.logout;
  const [agent, setAgent] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [focusedSection, setFocusedSection] = useState(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      navigate('/login');
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      try {
        data = await agentService.getMyProfile();
      } catch {
        data = await profileService.getProfile({ role: 'agent' });
      }

      if (data) {
        const merged = {
          ...data,
          completeness: computeAgentCompleteness(data),
        };
        setAgent(merged);
        setDraft(merged);
      }
    } catch (err) {
      setError(err.message || 'Failed to load agent profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isDirty = useMemo(
    () => TRACKED_KEYS.some((k) => String(draft[k] ?? '') !== String(agent[k] ?? '')),
    [draft, agent]
  );

  const credentialsChanged = useMemo(
    () =>
      String(draft.prc_license_no ?? '') !== String(agent.prc_license_no ?? '') ||
      String(draft.prc_validity ?? '') !== String(agent.prc_validity ?? ''),
    [draft, agent]
  );

  const handleSave = async (nextDraft) => {
    setSaving(true);
    try {
      const displayName =
        nextDraft.display_name ||
        nextDraft.name ||
        [nextDraft.first_name, nextDraft.middle_name, nextDraft.last_name].filter(Boolean).join(' ').trim();
      const payload = {
        name: displayName,
        first_name: nextDraft.first_name ?? '',
        middle_name: nextDraft.middle_name ?? '',
        last_name: nextDraft.last_name ?? '',
        display_name: displayName,
        avatar: nextDraft.avatar ?? '',
        phone: nextDraft.phone ?? '',
        bio: nextDraft.bio ?? '',
        experience_years: Number(nextDraft.experience_years || 0),
        date_of_birth: nextDraft.date_of_birth || null,
        gender: nextDraft.gender || null,
        emergency_contact_name: nextDraft.emergency_contact_name || null,
        emergency_contact_phone: nextDraft.emergency_contact_phone || null,
      };

      // Only send license fields when actually edited so routine profile updates
      // do not trigger a verification reset on the backend.
      if (credentialsChanged) {
        if (nextDraft.prc_license_no) payload.prc_license_no = nextDraft.prc_license_no;
        if (nextDraft.prc_validity !== undefined) payload.prc_validity = nextDraft.prc_validity;
      }

      const targetId = agent.id || auth?.user?.id;
      const updated = targetId
        ? await agentService.updateAgentProfile(targetId, payload)
        : await profileService.updateProfile({ ...payload, fullName: payload.name }, { role: 'agent' });

      const nextState = {
        ...agent,
        ...nextDraft,
        ...updated,
      };
      nextState.completeness = computeAgentCompleteness(nextState);
      setAgent(nextState);
      setDraft(nextState);
      auth?.validateSession?.().catch(() => {});

      toast({
        title: credentialsChanged ? 'Credentials Queued for Review' : 'Profile Saved',
        description: credentialsChanged
          ? 'Your updated PRC license details were submitted for Principal Broker verification.'
          : 'Your public advisor card is now up to date.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save profile changes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistJump = (key) => {
    if (key.includes('prc') || key.includes('dhsud')) {
      setActiveTab('credentials');
      setFocusedSection('credentials');
      return;
    }
    setActiveTab('identity');
    setFocusedSection(key === 'bio' ? 'bio' : 'identity');
  };

  const completeness = computeAgentCompleteness(draft);

  const readinessChecklist = (
    <div className="flex flex-col gap-2 pt-2 border-t border-outline">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-on-surface">
          Onboarding &amp; Readiness
        </span>
        <Badge variant={completeness.isComplete ? 'success' : 'secondary'} className="font-mono text-xs">
          {completeness.percent}%
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        {(completeness.checklist || []).map((item) => (
          <Button
            key={item.key}
            type="button"
            variant="ghost"
            onClick={() => handleChecklistJump(item.key)}
            className={cn(
              'h-auto min-h-9 px-2 py-1.5 justify-start gap-2 rounded-lg text-xs font-medium text-left normal-case tracking-normal',
              item.completed
                ? 'text-on-surface-variant hover:bg-surface-variant'
                : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/70'
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="size-3.5 text-amber-600 shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  const identityExtraFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="agent-experience" className="text-sm font-medium text-on-surface">
            Years of Experience
          </FieldLabel>
          <Input
            id="agent-experience"
            type="number"
            min={0}
            max={70}
            value={draft.experience_years ?? 0}
            onChange={(e) => setDraft((prev) => ({ ...prev, experience_years: e.target.value }))}
            onFocus={() => setFocusedSection('identity')}
            onBlur={() => setFocusedSection(null)}
            className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline">
        <Field>
          <FieldLabel htmlFor="agent-dob" className="text-sm font-medium text-on-surface">
            Date of Birth (Private HR)
          </FieldLabel>
          <Input
            id="agent-dob"
            type="date"
            value={draft.date_of_birth || ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, date_of_birth: e.target.value }))}
            className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="agent-gender" className="text-sm font-medium text-on-surface">
            Gender (Private HR)
          </FieldLabel>
          <Select
            value={draft.gender || '__unspecified__'}
            onValueChange={(val) =>
              setDraft((prev) => ({ ...prev, gender: val === '__unspecified__' ? '' : val }))
            }
          >
            <SelectTrigger
              id="agent-gender"
              aria-label="Gender"
              className="h-11 data-[size=default]:h-11 w-full px-3 rounded-lg bg-surface border border-outline text-sm text-on-surface focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) bg-surface border border-outline">
              <SelectGroup>
                <SelectItem value="__unspecified__">Not specified</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="agent-emergency-name" className="text-sm font-medium text-on-surface">
            Emergency Contact Name (Private)
          </FieldLabel>
          <Input
            id="agent-emergency-name"
            type="text"
            placeholder="e.g. Maria Rossi (Spouse)"
            value={draft.emergency_contact_name || ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
            className="h-11 bg-surface border-outline text-on-surface rounded-lg"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="agent-emergency-phone" className="text-sm font-medium text-on-surface">
            Emergency Contact Phone (Private)
          </FieldLabel>
          <Input
            id="agent-emergency-phone"
            type="tel"
            placeholder="+63 917 000 0000"
            value={draft.emergency_contact_phone || ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
            className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
          />
        </Field>
      </div>
    </div>
  );

  const extraTabs = useMemo(
    () => [
      {
        id: 'credentials',
        label: 'PRC License',
        icon: Award,
        content: (
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="p-5 pb-4 border-b border-outline">
              <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                PRC Salesperson License
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Your PRC license stays verified by your Principal Broker. Expiry dates are never shown on your public card.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              <AnimatePresence>
                {credentialsChanged && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  >
                    <Alert variant="warning">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Broker Review Will Be Queued</AlertTitle>
                      <AlertDescription>
                        Saving changes to your PRC license sends them to your Principal Broker for verification while keeping your current card live.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <FieldGroup className="gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="agent-prc-no" className="text-sm font-medium text-on-surface">
                      PRC License Number
                    </FieldLabel>
                    <Input
                      id="agent-prc-no"
                      type="text"
                      value={draft.prc_license_no || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, prc_license_no: e.target.value }))
                      }
                      onFocus={() => setFocusedSection('credentials')}
                      onBlur={() => setFocusedSection(null)}
                      placeholder="PRC-REB-0028491"
                      className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="agent-prc-validity" className="text-sm font-medium text-on-surface">
                      PRC Expiry Date
                    </FieldLabel>
                    <Input
                      id="agent-prc-validity"
                      type="date"
                      value={draft.prc_validity || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, prc_validity: e.target.value }))
                      }
                      onFocus={() => setFocusedSection('credentials')}
                      onBlur={() => setFocusedSection(null)}
                      className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        ),
      },
    ],
    [draft, credentialsChanged, prefersReducedMotion]
  );

  const securityExtraContent = (
    <Card className="bg-surface border border-outline rounded-xl shadow-xs">
      <CardHeader className="p-5 pb-4 border-b border-outline">
        <CardTitle className="text-base font-semibold text-on-surface">
          Quick Navigation &amp; Session
        </CardTitle>
        <CardDescription className="text-xs text-on-surface-variant">
          Jump to public or agent views, or sign out of this session.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-3">
        <Link
          to="/"
          className="h-11 px-4 rounded-lg bg-background hover:bg-surface-variant text-on-surface text-xs font-medium flex items-center justify-between border border-outline transition-colors"
        >
          <span className="flex items-center gap-2">
            <Home className="size-4 text-primary" />
            Public Home Page
          </span>
          <ArrowRight className="size-4 text-on-surface-variant" />
        </Link>

        <Link
          to="/agent/dashboard"
          className="h-11 px-4 rounded-lg bg-background hover:bg-surface-variant text-on-surface text-xs font-medium flex items-center justify-between border border-outline transition-colors"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-primary" />
            Agent Dashboard
          </span>
          <ArrowRight className="size-4 text-on-surface-variant" />
        </Link>

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full h-11 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 normal-case"
        >
          <LogOut data-icon="inline-start" className="text-rose-600" />
          {loggingOut ? 'Signing out...' : 'Sign Out of Session'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div data-testid="agent-profile-portal" className="w-full min-w-0">
      <Toaster />
      <ProfileCardStudio
        layout="master-detail"
        role="agent"
        title="Agent Profile & Public Card Studio"
        subtitle="Edit your advisor profile, PRC license, and preview your public card in real time."
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Profile' },
        ]}
        headerActions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
            >
              <Link to="/" title="Return to Public Site">
                <Home data-icon="inline-start" className="text-on-surface-variant" />
                Home Page
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-11 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 normal-case"
            >
              <LogOut data-icon="inline-start" className="text-rose-600" />
              {loggingOut ? 'Signing out...' : 'Logout'}
            </Button>
          </>
        }
        profile={agent}
        draft={draft}
        onDraftChange={setDraft}
        onSave={handleSave}
        onDiscard={() => setDraft(agent)}
        onRefresh={loadProfile}
        loading={loading}
        saving={saving}
        error={error}
        isDirty={isDirty}
        credentialsPendingReview={credentialsChanged || agent.onboarding_status === 'pending_review'}
        identityCardExtra={readinessChecklist}
        identityExtraFields={identityExtraFields}
        extraTabs={extraTabs}
        securityExtraContent={securityExtraContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        focusedSection={focusedSection}
        onFocusSection={setFocusedSection}
        testId="agent-profile-studio"
      />
    </div>
  );
}
