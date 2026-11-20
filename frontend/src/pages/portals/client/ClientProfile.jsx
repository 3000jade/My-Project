import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Lock, Shield } from 'lucide-react';
import { ProfileCardStudio, ChangePasswordDialog } from '@/components/profile';
import { clientUserService } from '@/services/clientUserService';
import { mockDefaultProfiles } from '@/services/profileService';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  useToast,
  Toaster,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FieldGroup, Field, FieldLabel, FieldContent, FieldDescription } from '@/components/ui/field';

const TRACKED_KEYS = [
  'name',
  'avatar',
  'email',
  'phone',
  'bio',
  'preferredLocation',
  'investmentBudget',
];

export default function ClientProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(mockDefaultProfiles.client);
  const [draft, setDraft] = useState(mockDefaultProfiles.client);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [focusedSection, setFocusedSection] = useState(null);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    priceDropAlerts: true,
  });

  const loadProfile = useCallback(async () => {
    try {
      const data = await clientUserService.getClientProfile();
      if (data) {
        const merged = { ...mockDefaultProfiles.client, ...data };
        setProfile(merged);
        setDraft(merged);
        setNotifications({
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? true,
          priceDropAlerts: data.priceDropAlerts ?? true,
        });
      }
    } catch (err) {
      console.warn('[ClientProfile] Load error:', err);
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
      const parts = String(nextDraft.name || '').trim().split(/\s+/);
      const firstName = parts[0] || profile.firstName;
      const lastName = parts.slice(1).join(' ') || profile.lastName;

      const updated = await clientUserService.updateClientProfile({
        ...nextDraft,
        firstName,
        lastName,
        name: nextDraft.name,
      });

      const nextState = { ...nextDraft, ...updated };
      setProfile(nextState);
      setDraft(nextState);
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
      console.warn('Notification preference toggle failed:', err);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await clientUserService.changePassword(currentPassword, newPassword);
    toast({
      title: 'Password Updated',
      description: 'Security passphrase updated successfully.',
      variant: 'success',
    });
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
            <CardHeader className="pb-4 border-b border-outline">
              <CardTitle className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Communication Settings
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Choose how we notify you about tour schedules, replies, and price drops.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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
      <CardHeader className="pb-4 border-b border-outline">
        <CardTitle className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          Security &amp; Credentials
        </CardTitle>
        <CardDescription className="text-sm text-on-surface-variant">
          Manage your account passphrase and sign-in protection.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col gap-4">
        <div className="p-4 bg-background rounded-xl border border-outline flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-on-surface">Authentication Method</span>
            <p className="text-xs text-on-surface-variant">
              Email and Password protected with TLS 1.3 encryption.
            </p>
          </div>
          <Badge variant="success" className="text-xs shrink-0">
            Active
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-outline">
          <span className="text-sm font-semibold text-on-surface">Change Passphrase</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPasswordModalOpen(true)}
            className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
          >
            <Lock data-icon="inline-start" className="text-primary" />
            Update Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Toaster />
      <ProfileCardStudio
        role="client"
        title="My Profile & Buyer Card Studio"
        subtitle="Update your contact details, target locations, and alert settings while previewing your buyer card."
        breadcrumbs={[
          { label: 'Dashboard', to: '/client/dashboard' },
          { label: 'Profile' },
        ]}
        profile={profile}
        draft={draft}
        onDraftChange={setDraft}
        onSave={handleSave}
        onDiscard={() => setDraft(profile)}
        onRefresh={loadProfile}
        loading={false}
        saving={saving}
        isDirty={isDirty}
        identityExtraFields={identityExtraFields}
        extraTabs={extraTabs}
        securityExtraContent={securityExtraContent}
        focusedSection={focusedSection}
        onFocusSection={setFocusedSection}
        testId="client-profile-studio"
      />

      <ChangePasswordDialog
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onSave={handlePasswordChange}
      />
    </>
  );
}
