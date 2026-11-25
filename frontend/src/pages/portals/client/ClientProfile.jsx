import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Home, LogOut, LayoutDashboard, ArrowRight } from 'lucide-react';
import { ProfileCardStudio } from '@/components/profile';
import { clientUserService } from '@/services/clientUserService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  useToast,
  Toaster,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FieldGroup, Field, FieldLabel, FieldContent, FieldDescription } from '@/components/ui/field';

const TRACKED_KEYS = [
  'name',
  'first_name',
  'middle_name',
  'last_name',
  'display_name',
  'avatar',
  'phone',
  'bio',
  'preferredLocation',
  'investmentBudget',
];

export default function ClientProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  let auth = null;
  try {
    auth = useAuth();
  } catch {
    // Handled gracefully when rendered in isolated test runners
  }
  const logout = auth?.logout;
  const [profile, setProfile] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [focusedSection, setFocusedSection] = useState(null);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    priceDropAlerts: true,
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientUserService.getClientProfile();
      if (data) {
        setProfile(data);
        setDraft(data);
        setNotifications({
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? true,
          priceDropAlerts: data.priceDropAlerts ?? true,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load client profile.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      const displayName =
        nextDraft.display_name ||
        nextDraft.name ||
        [nextDraft.first_name, nextDraft.middle_name, nextDraft.last_name].filter(Boolean).join(' ').trim();
      const updated = await clientUserService.updateClientProfile({
        name: displayName,
        first_name: nextDraft.first_name ?? '',
        middle_name: nextDraft.middle_name ?? '',
        last_name: nextDraft.last_name ?? '',
        display_name: displayName,
        avatar: nextDraft.avatar ?? '',
        phone: nextDraft.phone ?? '',
        bio: nextDraft.bio ?? '',
        preferredLocation: nextDraft.preferredLocation ?? '',
        investmentBudget: nextDraft.investmentBudget ?? '',
      });

      const nextState = { ...nextDraft, ...updated };
      setProfile(nextState);
      setDraft(nextState);
      auth?.validateSession?.().catch(() => {});
      toast({
        title: 'Profile Saved',
        description: 'Your buyer card and contact preferences are updated.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key, checked) => {
    const previous = notifications;
    const updated = { ...notifications, [key]: checked };
    setNotifications(updated);
    try {
      await clientUserService.updateClientProfile(updated);
      toast({
        title: 'Alert Preference Updated',
        description: 'Communication settings saved.',
        variant: 'success',
      });
    } catch (err) {
      setNotifications(previous);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not save alert preference.',
        variant: 'destructive',
      });
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
        <FieldLabel htmlFor="client-location" className="text-sm font-medium text-on-surface">
          Preferred Area / Enclave
        </FieldLabel>
        <Input
          id="client-location"
          type="text"
          value={draft.preferredLocation || ''}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, preferredLocation: e.target.value }))
          }
          onFocus={() => setFocusedSection('preferences')}
          onBlur={() => setFocusedSection(null)}
          placeholder="e.g. Bonifacio Global City, Taguig"
          className="h-11 bg-surface border-outline text-on-surface rounded-lg"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="client-budget" className="text-sm font-medium text-on-surface">
          Target Acquisition Budget
        </FieldLabel>
        <Input
          id="client-budget"
          type="text"
          value={draft.investmentBudget || ''}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, investmentBudget: e.target.value }))
          }
          onFocus={() => setFocusedSection('preferences')}
          onBlur={() => setFocusedSection(null)}
          placeholder="e.g. ₱50M - ₱120M"
          className="h-11 bg-surface border-outline text-on-surface rounded-lg font-mono"
        />
      </Field>
    </div>
  );

  const extraTabs = useMemo(
    () => [
      {
        id: 'notifications',
        label: 'Alerts',
        icon: Bell,
        content: (
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="p-5 pb-4 border-b border-outline">
              <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Communication Settings
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Choose how we notify you about tour schedules, replies, and price drops.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <FieldGroup className="gap-4">
                <Field orientation="horizontal" className="p-4 rounded-xl bg-background border border-outline justify-between">
                  <FieldContent>
                    <FieldLabel htmlFor="notif-email" className="text-sm font-semibold text-on-surface">
                      Email Notifications
                    </FieldLabel>
                    <FieldDescription className="text-xs text-on-surface-variant">
                      Tour schedules, proposals, and viewing confirmations.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="notif-email"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleToggleNotification('emailNotifications', checked)
                    }
                  />
                </Field>

                <Field orientation="horizontal" className="p-4 rounded-xl bg-background border border-outline justify-between">
                  <FieldContent>
                    <FieldLabel htmlFor="notif-sms" className="text-sm font-semibold text-on-surface">
                      SMS Priority Dispatch
                    </FieldLabel>
                    <FieldDescription className="text-xs text-on-surface-variant">
                      Instant text updates for upcoming property viewings.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="notif-sms"
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) =>
                      handleToggleNotification('smsNotifications', checked)
                    }
                  />
                </Field>

                <Field orientation="horizontal" className="p-4 rounded-xl bg-background border border-outline justify-between">
                  <FieldContent>
                    <FieldLabel htmlFor="notif-price" className="text-sm font-semibold text-on-surface">
                      Price Drop &amp; Enclave Alerts
                    </FieldLabel>
                    <FieldDescription className="text-xs text-on-surface-variant">
                      Updates when listings in your preferred area change price.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="notif-price"
                    checked={notifications.priceDropAlerts}
                    onCheckedChange={(checked) =>
                      handleToggleNotification('priceDropAlerts', checked)
                    }
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        ),
      },
    ],
    [notifications]
  );

  const securityExtraContent = (
    <Card className="bg-surface border border-outline rounded-xl shadow-xs">
      <CardHeader className="p-5 pb-4 border-b border-outline">
        <CardTitle className="text-base font-semibold text-on-surface">
          Quick Navigation &amp; Session
        </CardTitle>
        <CardDescription className="text-xs text-on-surface-variant">
          Jump to public or client views, or sign out of this session.
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
          to="/client/dashboard"
          className="h-11 px-4 rounded-lg bg-background hover:bg-surface-variant text-on-surface text-xs font-medium flex items-center justify-between border border-outline transition-colors"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-primary" />
            Client Dashboard
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
    <div data-testid="client-profile-portal" className="w-full min-w-0">
      <Toaster />
      <ProfileCardStudio
        layout="master-detail"
        role="client"
        title="My Profile & Buyer Card Studio"
        subtitle="Update your contact details, target locations, and alert settings while previewing your buyer card."
        breadcrumbs={[
          { label: 'Dashboard', to: '/client/dashboard' },
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
        error={error}
        saving={saving}
        isDirty={isDirty}
        identityExtraFields={identityExtraFields}
        extraTabs={extraTabs}
        securityExtraContent={securityExtraContent}
        focusedSection={focusedSection}
        onFocusSection={setFocusedSection}
        testId="client-profile-studio"
      />
    </div>
  );
}
