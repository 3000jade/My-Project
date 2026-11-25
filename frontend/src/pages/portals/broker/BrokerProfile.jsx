import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  LayoutDashboard,
  Type,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Award,
} from 'lucide-react';
import { ProfileCardStudio } from '@/components/profile';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  useToast,
  Toaster,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/context/AuthContext';
import { useDashboardDensity } from '@/context/DashboardThemeContext';
import { cn } from '@/utils/cn';

const TRACKED_KEYS = [
  'name',
  'avatar',
  'phone',
  'bio',
  'firm_name',
  'experience_years',
  'prc_license_no',
  'prc_validity',
  'dhsud_accreditation_no',
  'dhsud_validity',
];

export default function BrokerProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const logout = auth?.logout;
  const { density = 'standard', setDensity = () => {}, isSyncing = false, options = [] } =
    useDashboardDensity();

  const [profile, setProfile] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const [focusedSection, setFocusedSection] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile({ role: 'broker' });
      setProfile(data);
      setDraft(data);
    } catch (err) {
      const msg = err.message || 'Failed to load broker profile.';
      setError(msg);
      toast({
        title: 'Profile Error',
        description: 'Could not synchronize profile data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isDirty = useMemo(
    () => TRACKED_KEYS.some((k) => String(draft[k] ?? '') !== String(profile[k] ?? '')),
    [draft, profile]
  );

  const handleSave = async (nextDraft) => {
    setSaving(true);
    try {
      const updated = await profileService.updateProfile(
        {
          name: nextDraft.name,
          fullName: nextDraft.name,
          avatar: nextDraft.avatar ?? '',
          phone: nextDraft.phone ?? '',
          bio: nextDraft.bio ?? '',
          firm_name: nextDraft.firm_name ?? '',
          experience_years: Number(nextDraft.experience_years || 0),
          prc_license_no: nextDraft.prc_license_no ?? '',
          prc_validity: nextDraft.prc_validity ?? '',
          dhsud_accreditation_no: nextDraft.dhsud_accreditation_no ?? '',
          dhsud_validity: nextDraft.dhsud_validity ?? '',
        },
        { role: 'broker' }
      );
      const nextState = {
        ...nextDraft,
        ...updated,
        updated_at: updated?.updated_at || new Date().toISOString(),
      };
      setProfile(nextState);
      setDraft(nextState);
      auth?.validateSession?.().catch(() => {});
      toast({
        title: 'Profile Saved',
        description: 'Broker credentials and public card updated successfully.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save broker profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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

  const identityExtraFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor="broker-firm-name" className="text-sm font-medium text-on-surface">
          Operating Entity / Firm Name
        </FieldLabel>
        <Input
          id="broker-firm-name"
          type="text"
          value={draft.firm_name || ''}
          onChange={(e) => setDraft((prev) => ({ ...prev, firm_name: e.target.value }))}
          onFocus={() => setFocusedSection('identity')}
          onBlur={() => setFocusedSection(null)}
          placeholder="Precision Trust Realty Operations Inc."
          className="h-11 bg-surface border-outline text-on-surface rounded-lg"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="broker-experience" className="text-sm font-medium text-on-surface">
          Years Leading Brokerage
        </FieldLabel>
        <Input
          id="broker-experience"
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
  );

  const extraTabs = useMemo(
    () => [
      {
        id: 'credentials',
        label: 'Firm Licenses',
        icon: Award,
        content: (
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="pb-4 border-b border-outline">
              <CardTitle className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Supervising Broker Accreditations
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Principal PRC and DHSUD registrations. Only verified standing appears on your public card.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-5">
              <FieldGroup className="gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="broker-prc-no" className="text-sm font-medium text-on-surface">
                      Principal PRC Broker License
                    </FieldLabel>
                    <Input
                      id="broker-prc-no"
                      type="text"
                      value={draft.prc_license_no || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, prc_license_no: e.target.value }))
                      }
                      onFocus={() => setFocusedSection('credentials')}
                      onBlur={() => setFocusedSection(null)}
                      placeholder="PRC-REB-0019582"
                      className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="broker-prc-validity" className="text-sm font-medium text-on-surface">
                      PRC License Validity
                    </FieldLabel>
                    <Input
                      id="broker-prc-validity"
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
                    <FieldLabel htmlFor="broker-dhsud-no" className="text-sm font-medium text-on-surface">
                      DHSUD Firm Registration
                    </FieldLabel>
                    <Input
                      id="broker-dhsud-no"
                      type="text"
                      value={draft.dhsud_accreditation_no || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, dhsud_accreditation_no: e.target.value }))
                      }
                      onFocus={() => setFocusedSection('credentials')}
                      onBlur={() => setFocusedSection(null)}
                      placeholder="DHSUD-NCR-AA-2022-0941"
                      className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="broker-dhsud-validity" className="text-sm font-medium text-on-surface">
                      DHSUD Registration Validity
                    </FieldLabel>
                    <Input
                      id="broker-dhsud-validity"
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

              <div className="p-4 bg-background rounded-xl border border-outline text-xs text-on-surface-variant flex flex-col gap-1">
                <span className="font-semibold text-on-surface uppercase tracking-wider">
                  Administrative Authority
                </span>
                <p>
                  Holds full operational oversight for firm listing publications, consultant accreditation approvals, inquiry triage reassignment, and sales conveyancing audits.
                </p>
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        id: 'appearance',
        label: 'Appearance',
        icon: Type,
        content: (
          <Card
            data-testid="typography-density-card"
            className="bg-surface border border-outline rounded-xl shadow-xs"
          >
            <CardHeader className="pb-4 border-b border-outline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-semibold text-on-surface flex items-center gap-2">
                  <Type className="size-4 text-primary" />
                  Appearance &amp; Typography Density
                </CardTitle>
                <CardDescription className="text-xs text-on-surface-variant mt-1">
                  Adjust the base text scale and layout density across the broker command portal.
                </CardDescription>
              </div>
              {isSyncing ? (
                <Badge variant="default" className="text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  Syncing...
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs">
                  <CheckCircle2 className="size-3.5" />
                  Profile Synced
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(options || []).map((opt) => {
                  const isSelected = density === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDensity(opt.id)}
                      aria-pressed={isSelected}
                      data-testid={`density-option-${opt.id}`}
                      className={cn(
                        'min-h-11 p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
                        isSelected
                          ? 'border-primary bg-tertiary-container/35 ring-1 ring-primary shadow-xs'
                          : 'border-outline bg-surface hover:border-outline-variant'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-xs font-bold',
                            isSelected ? 'text-primary' : 'text-on-surface'
                          )}
                        >
                          {opt.label}
                        </span>
                        <Badge
                          variant={isSelected ? 'primary' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {opt.badge}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-on-surface-variant">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl border border-dashed border-outline bg-background flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <span>Live Density Preview</span>
                  <span className="font-mono text-primary lowercase">
                    data-dashboard-density="{density}"
                  </span>
                </div>
                <div className="pt-2 border-t border-outline flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-on-surface">
                      The Dahlia Penthouse • BGC High Street
                    </h4>
                    <Badge variant="success" className="text-xs">
                      Active Listing
                    </Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    4 Bedrooms • 480 sqm • ₱125,000,000 • Verified Luxury Asset
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ),
      },
    ],
    [draft, density, options, isSyncing, setDensity]
  );

  const securityExtraContent = (
    <Card className="bg-surface border border-outline rounded-xl shadow-xs">
      <CardHeader className="pb-4 border-b border-outline">
        <CardTitle className="text-xl font-semibold text-on-surface">
          Quick Navigation &amp; Session
        </CardTitle>
        <CardDescription className="text-xs text-on-surface-variant">
          Jump to public or executive views, or sign out of this session.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col gap-3">
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
          to="/broker/dashboard"
          className="h-11 px-4 rounded-lg bg-background hover:bg-surface-variant text-on-surface text-xs font-medium flex items-center justify-between border border-outline transition-colors"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-primary" />
            Broker Dashboard
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
    <div data-testid="broker-profile-portal" className="w-full min-w-0">
      <Toaster />
      <ProfileCardStudio
        layout="master-detail"
        role="broker"
        title="Broker Executive Profile & Settings"
        subtitle="Manage your principal credentials, firm licenses, display density, and session security."
        breadcrumbs={[
          { label: 'Dashboard', to: '/broker/dashboard' },
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
        profile={profile}
        draft={draft}
        onDraftChange={setDraft}
        onSave={handleSave}
        onDiscard={() => setDraft(profile)}
        onRefresh={loadProfile}
        loading={loading}
        saving={saving}
        error={error}
        isDirty={isDirty}
        identityExtraFields={identityExtraFields}
        extraTabs={extraTabs}
        securityExtraContent={securityExtraContent}
        focusedSection={focusedSection}
        onFocusSection={setFocusedSection}
        testId="broker-profile-studio"
      />
    </div>
  );
}
