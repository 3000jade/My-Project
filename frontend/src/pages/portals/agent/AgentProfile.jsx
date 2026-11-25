import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
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
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/utils/cn';

const TRACKED_KEYS = [
  'name',
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
  'dhsud_accreditation_no',
  'dhsud_validity',
];

export default function AgentProfile() {
  const { toast } = useToast();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const [agent, setAgent] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('identity');
  const [focusedSection, setFocusedSection] = useState(null);

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
      String(draft.prc_validity ?? '') !== String(agent.prc_validity ?? '') ||
      String(draft.dhsud_accreditation_no ?? '') !== String(agent.dhsud_accreditation_no ?? '') ||
      String(draft.dhsud_validity ?? '') !== String(agent.dhsud_validity ?? ''),
    [draft, agent]
  );

  const handleSave = async (nextDraft) => {
    setSaving(true);
    try {
      const payload = {
        name: nextDraft.name,
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
        if (nextDraft.dhsud_accreditation_no) payload.dhsud_accreditation_no = nextDraft.dhsud_accreditation_no;
        if (nextDraft.dhsud_validity !== undefined) payload.dhsud_validity = nextDraft.dhsud_validity;
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
          ? 'Your updated PRC/DHSUD details were submitted for Principal Broker verification.'
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

  const topBanner = (
    <Card className="bg-surface border border-outline rounded-xl shadow-xs">
      <CardHeader className="pb-4 border-b border-outline">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold text-on-surface">
              Onboarding &amp; Readiness
            </CardTitle>
            <Badge variant="default" className="font-mono text-xs">
              {completeness.percent}% Complete
            </Badge>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <Badge variant="success" className="text-xs">
              {(draft.membership_status || 'active').toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Routing: {(draft.routing_availability || 'available').toUpperCase()}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs text-on-surface-variant">
          {completeness.isComplete
            ? 'All required profile and regulatory items are complete.'
            : `Complete ${completeness.missingFields.length} remaining item(s) to stay fully eligible.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(completeness.checklist || []).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleChecklistJump(item.key)}
              className={cn(
                'min-h-11 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 text-left transition-colors cursor-pointer',
                item.completed
                  ? 'bg-background border-outline text-on-surface hover:bg-surface-variant'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="size-4 text-amber-600 shrink-0" />
              )}
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
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

        <Field>
          <FieldLabel className="text-sm font-medium text-on-surface">
            Branch Office
          </FieldLabel>
          <div className="h-11 px-3 rounded-lg bg-surface-variant border border-outline flex items-center gap-2 text-sm text-on-surface-variant">
            <Building2 className="size-4 text-primary shrink-0" />
            <span className="truncate">
              {draft.location_branch || 'Metro Manila — Makati HQ'}
            </span>
          </div>
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
          <select
            id="agent-gender"
            value={draft.gender || ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, gender: e.target.value }))}
            className="h-11 w-full px-3 rounded-lg bg-surface border border-outline text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Not specified</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
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
        label: 'PRC & DHSUD',
        icon: Award,
        content: (
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="pb-4 border-b border-outline">
              <CardTitle className="text-xl font-semibold text-on-surface">
                Philippine Regulatory Licenses
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Your license numbers stay verified by your Principal Broker. Expiry dates are never shown on your public card.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-5">
              <AnimatePresence>
                {credentialsChanged && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="warning">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Broker Review Will Be Queued</AlertTitle>
                      <AlertDescription>
                        Saving changes to PRC or DHSUD numbers sends them to your Principal Broker for verification while keeping your current card live.
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

                  <Field>
                    <FieldLabel htmlFor="agent-dhsud-no" className="text-sm font-medium text-on-surface">
                      DHSUD Accreditation No.
                    </FieldLabel>
                    <Input
                      id="agent-dhsud-no"
                      type="text"
                      value={draft.dhsud_accreditation_no || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, dhsud_accreditation_no: e.target.value }))
                      }
                      onFocus={() => setFocusedSection('credentials')}
                      onBlur={() => setFocusedSection(null)}
                      placeholder="DHSUD-NCR-AA-2023-0182"
                      className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="agent-dhsud-validity" className="text-sm font-medium text-on-surface">
                      DHSUD Expiry Date
                    </FieldLabel>
                    <Input
                      id="agent-dhsud-validity"
                      type="date"
                      value={draft.dhsud_validity || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, dhsud_validity: e.target.value }))
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
    [draft, credentialsChanged]
  );

  return (
    <>
      <Toaster />
      <ProfileCardStudio
        role="agent"
        title="Agent Profile & Public Card Studio"
        subtitle="Edit your advisor profile, PRC/DHSUD licenses, and preview your public card in real time."
        breadcrumbs={[
          { label: 'Dashboard', to: '/agent/dashboard' },
          { label: 'Profile' },
        ]}
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
        topBanner={topBanner}
        identityExtraFields={identityExtraFields}
        extraTabs={extraTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        focusedSection={focusedSection}
        onFocusSection={setFocusedSection}
        testId="agent-profile-studio"
      />
    </>
  );
}
