import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  RefreshCw,
  AlertCircle,
  Eye,
  Save,
  RotateCcw,
  User,
  Shield,
  Lock,
  Sparkles,
  Building2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { ProfileSkeleton } from '@/components/dashboard/skeletons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui';
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import SessionManagementPanel from '@/components/auth/SessionManagementPanel';
import { evaluateLicenseStatus } from '@/services/agentService';
import { clientUserService } from '@/services/clientUserService';
import ChangePasswordDialog from './ChangePasswordDialog';
import LivePublicCardPreview from './LivePublicCardPreview';
import { cn } from '@/utils/cn';

const BIO_MAX = 1000;

const LICENSE_BADGE_MAP = {
  VALID: { label: 'Valid', variant: 'success' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'warning' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  UNKNOWN: { label: 'No Expiry Date', variant: 'secondary' },
  NOT_PROVIDED: { label: 'Not Set', variant: 'secondary' },
};

function getInitials(name, fallback = 'PB') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function formatAuditDate(isoValue) {
  if (!isoValue) return 'Not recorded';
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function IdentitySummaryBanner({ role, profile, isDirty, onOpenPreview }) {
  const displayName =
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    'Principal Broker';
  const initials = getInitials(displayName, role === 'broker' ? 'PB' : 'AG');

  const prcStatus = evaluateLicenseStatus(profile.prc_license_no, profile.prc_validity);
  const dhsudStatus = evaluateLicenseStatus(
    profile.dhsud_accreditation_no,
    profile.dhsud_validity
  );
  const prcMeta = LICENSE_BADGE_MAP[prcStatus] || LICENSE_BADGE_MAP.NOT_PROVIDED;
  const dhsudMeta = LICENSE_BADGE_MAP[dhsudStatus] || LICENSE_BADGE_MAP.NOT_PROVIDED;

  return (
    <Card
      data-testid="identity-summary-banner"
      className="bg-surface border border-outline rounded-xl shadow-xs"
    >
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="size-14 shrink-0 border-2 border-primary/20">
              <AvatarImage src={profile.avatar} alt={displayName} />
              <AvatarFallback className="bg-tertiary-container text-primary font-bold text-base">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-on-surface tracking-tight truncate">
                  {displayName}
                </h2>
                <Badge variant="success" className="text-xs">
                  <ShieldCheck className="size-3.5" />
                  {role === 'broker' ? 'Verified Principal' : 'Verified'}
                </Badge>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                <Building2 className="size-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {profile.firm_name || profile.brokerage_name || 'Human Shelter Realty'}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Clock className="size-3.5 shrink-0" />
                  Last updated: {formatAuditDate(profile.updated_at)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <Badge variant={isDirty ? 'warning' : 'success'} className="text-xs">
              {isDirty ? 'Unsaved Draft' : 'Synced'}
            </Badge>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenPreview}
              className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
            >
              <Eye data-icon="inline-start" className="text-primary" />
              Preview Public Card
            </Button>
          </div>
        </div>

        {/* Private Portal Compliance & Expiration Strip */}
        {role !== 'client' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-outline">
            <div className="p-3 rounded-lg bg-background border border-outline flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-xs font-medium text-on-surface-variant">
                  PRC License &amp; Expiration
                </span>
                <span className="text-xs font-mono font-semibold text-on-surface truncate">
                  {profile.prc_license_no || 'Not set'} • Expires{' '}
                  {profile.prc_validity || '—'}
                </span>
              </div>
              <Badge variant={prcMeta.variant} className="text-xs shrink-0">
                {prcMeta.label}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-background border border-outline flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-xs font-medium text-on-surface-variant">
                  DHSUD Reg &amp; Expiration
                </span>
                <span className="text-xs font-mono font-semibold text-on-surface truncate">
                  {profile.dhsud_accreditation_no || 'Not set'} • Expires{' '}
                  {profile.dhsud_validity || '—'}
                </span>
              </div>
              <Badge variant={dhsudMeta.variant} className="text-xs shrink-0">
                {dhsudMeta.label}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ProfileCardStudio
 * Shared profile workspace supporting:
 * - layout="studio": 60/40 editor + sticky live preview (Agent & Client)
 * - layout="master-detail": Top Identity Banner + 12-col left vertical rail + focused pane (Broker)
 */
export default function ProfileCardStudio({
  layout = 'studio',
  role = 'agent',
  title,
  subtitle,
  breadcrumbs = [],
  headerActions = null,
  profile = {},
  draft = {},
  onDraftChange,
  onSave,
  onDiscard,
  onRefresh,
  loading = false,
  saving = false,
  error = null,
  isDirty = false,
  credentialsPendingReview = false,
  topBanner = null,
  identityExtraFields = null,
  extraTabs = [],
  securityExtraContent = null,
  activeTab: controlledTab,
  onTabChange,
  focusedSection: externalFocusedSection,
  onFocusSection,
  testId = 'profile-card-studio',
}) {
  const { toast } = useToast();
  const [internalTab, setInternalTab] = useState('identity');
  const [internalFocusedSection, setInternalFocusedSection] = useState(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await clientUserService.changePassword(currentPassword, newPassword);
    toast({
      title: 'Password Updated',
      description: 'Your account password was updated successfully.',
      variant: 'success',
    });
  };

  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const focusedSection = externalFocusedSection ?? internalFocusedSection;
  const setFocusedSection = onFocusSection ?? setInternalFocusedSection;

  const bioValue = draft.bio || '';
  const bioNearLimit = bioValue.length >= Math.floor(BIO_MAX * 0.9);
  const isMasterDetail = layout === 'master-detail';

  const tabs = useMemo(
    () => [
      { id: 'identity', label: 'Identity & Card', icon: User },
      ...extraTabs,
      { id: 'security', label: 'Security', icon: Shield },
    ],
    [extraTabs]
  );

  const handleFieldChange = (key, value) => {
    if (onDraftChange) {
      onDraftChange({ ...draft, [key]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave && isDirty && !saving) {
      onSave(draft);
    }
  };

  const editorPanels = (
    <>
      {/* Tab 1: Common Identity & Card Fields */}
      <TabsContent value="identity" className={isMasterDetail ? 'mt-0' : 'mt-4'}>
        <Card className="bg-surface border border-outline rounded-xl shadow-xs">
          <CardHeader className="pb-4 border-b border-outline">
            <CardTitle className="text-xl font-semibold text-on-surface">
              Identity &amp; Card Details
            </CardTitle>
            <CardDescription className="text-sm text-on-surface-variant">
              {isMasterDetail
                ? 'Update your public identity details. Use Preview Public Card anytime before saving.'
                : 'Changes appear on your live card preview right away. Save when ready.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FieldGroup className="gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="studio-name" className="text-sm font-medium text-on-surface">
                    Full Name
                  </FieldLabel>
                  <Input
                    id="studio-name"
                    type="text"
                    value={draft.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onFocus={() => setFocusedSection('identity')}
                    onBlur={() => setFocusedSection(null)}
                    placeholder="Enter your full name"
                    required
                    className="h-11 bg-surface border-outline text-on-surface rounded-lg"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="studio-avatar" className="text-sm font-medium text-on-surface">
                    Profile Photo URL
                  </FieldLabel>
                  <Input
                    id="studio-avatar"
                    type="url"
                    value={draft.avatar || ''}
                    onChange={(e) => handleFieldChange('avatar', e.target.value)}
                    onFocus={() => setFocusedSection('identity')}
                    onBlur={() => setFocusedSection(null)}
                    placeholder="https://..."
                    className="h-11 bg-surface border-outline text-on-surface rounded-lg"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="studio-email" className="text-sm font-medium text-on-surface">
                    Email Address
                  </FieldLabel>
                  <Input
                    id="studio-email"
                    type="email"
                    value={draft.email || ''}
                    readOnly
                    aria-readonly="true"
                    placeholder="name@company.com"
                    className="h-11 bg-surface-variant border-outline text-on-surface-variant rounded-lg cursor-not-allowed"
                  />
                  <FieldDescription className="text-xs text-on-surface-variant">
                    Account email is managed by authentication
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="studio-phone" className="text-sm font-medium text-on-surface">
                    Phone Number
                  </FieldLabel>
                  <Input
                    id="studio-phone"
                    type="tel"
                    value={draft.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onFocus={() => setFocusedSection('contact')}
                    onBlur={() => setFocusedSection(null)}
                    placeholder="+63 917 555 0192"
                    required
                    className="h-11 bg-surface border-outline text-on-surface rounded-lg"
                  />
                </Field>
              </div>

              {identityExtraFields}

              <Field>
                <FieldLabel htmlFor="studio-bio" className="text-sm font-medium text-on-surface">
                  {role === 'client' ? 'Acquisition Notes / Bio' : 'Professional Bio'}
                </FieldLabel>
                <InputGroup className="bg-surface border border-outline rounded-lg">
                  <InputGroupTextarea
                    id="studio-bio"
                    rows={4}
                    maxLength={BIO_MAX}
                    value={bioValue}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    onFocus={() => setFocusedSection('bio')}
                    onBlur={() => setFocusedSection(null)}
                    placeholder="Write a brief introduction for your card..."
                    className="text-sm text-on-surface"
                  />
                  <InputGroupAddon align="block-end" className="justify-between border-t border-outline/60 pt-2">
                    <FieldDescription className="text-xs text-on-surface-variant">
                      Shown on your live card
                    </FieldDescription>
                    <InputGroupText
                      data-testid="bio-char-counter"
                      className={cn(
                        'text-xs font-mono tabular-nums',
                        bioNearLimit ? 'text-accent font-semibold' : 'text-on-surface-variant'
                      )}
                    >
                      {bioValue.length} / {BIO_MAX}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Role-Specific Extra Tabs */}
      {extraTabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          forceMount
          className={cn(isMasterDetail ? 'mt-0' : 'mt-4', 'data-[state=inactive]:hidden')}
        >
          {tab.content}
        </TabsContent>
      ))}

      {/* Security Tab */}
      <TabsContent
        value="security"
        forceMount
        className={cn(isMasterDetail ? 'mt-0' : 'mt-4', 'data-[state=inactive]:hidden')}
      >
        <div className="flex flex-col gap-6">
          <Card className="bg-surface border border-outline rounded-xl shadow-xs">
            <CardHeader className="pb-4 border-b border-outline">
              <CardTitle className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Password &amp; Sign-In
              </CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Update your account password without leaving your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-on-surface">Account Password</span>
                <p className="text-xs text-on-surface-variant">
                  Use at least 8 characters to keep your account protected.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
                className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
              >
                <Lock data-icon="inline-start" className="text-primary" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          {securityExtraContent}
          <SessionManagementPanel />
        </div>
      </TabsContent>
    </>
  );

  const stickySaveBar = (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="sticky bottom-4 z-20 bg-surface border border-outline rounded-xl shadow-md p-4 flex flex-wrap items-center justify-between gap-4"
          data-testid="studio-save-bar"
        >
          <div className="flex items-center gap-2 text-sm text-on-surface">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span className="font-medium">You have unsaved profile changes</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onDiscard}
              disabled={saving}
              className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
            >
              <RotateCcw data-icon="inline-start" />
              Discard
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="h-11 px-6 bg-primary hover:bg-primary-hover text-white normal-case"
            >
              <Save data-icon="inline-start" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-testid={testId}
        className={cn(
          'flex flex-col gap-6 font-sans w-full min-w-0 max-w-full',
          !isMasterDetail && 'pb-20 lg:pb-6'
        )}
      >
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {headerActions}
              {onRefresh && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRefresh}
                  disabled={loading}
                  aria-label="Refresh Profile"
                  className="h-11 px-4 border-outline bg-surface text-on-surface normal-case"
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={loading ? 'animate-spin' : undefined}
                  />
                  Refresh
                </Button>
              )}
            </div>
          }
        />

        {error && (
          <Alert variant="destructive" className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="size-4 shrink-0" />
              <div className="min-w-0">
                <AlertTitle>Could not load profile</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </div>
            {onRefresh && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onRefresh}
                className="h-11 px-4 shrink-0 normal-case"
              >
                Retry
              </Button>
            )}
          </Alert>
        )}

        {loading ? (
          <ProfileSkeleton layout={layout} />
        ) : isMasterDetail ? (
          <div className="flex flex-col gap-6 w-full min-w-0">
            <IdentitySummaryBanner
              role={role}
              profile={draft}
              isDirty={isDirty}
              onOpenPreview={() => setPreviewDialogOpen(true)}
            />

            {topBanner}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              orientation="vertical"
              className="w-full min-w-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Vertical Rail (3 / 12 columns) */}
                <Card className="lg:col-span-3 min-w-0 lg:sticky lg:top-24 bg-surface border border-outline rounded-xl shadow-xs p-2">
                  <TabsList
                    aria-label="Profile sections"
                    className="flex flex-row lg:flex-col items-stretch justify-start w-full h-auto bg-transparent p-0 gap-1 overflow-x-auto"
                  >
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = activeTab === tab.id;
                      return (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="relative h-11 px-3 justify-start rounded-lg text-xs font-semibold normal-case tracking-normal data-[state=active]:bg-transparent data-[state=active]:shadow-none shrink-0"
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="profile-rail-indicator"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-lg bg-tertiary-container/45 border border-primary/25"
                            />
                          )}
                          <span
                            className={cn(
                              'relative z-10 flex items-center gap-2.5 w-full',
                              isSelected ? 'text-primary' : 'text-on-surface-variant'
                            )}
                          >
                            {Icon && <Icon className="size-4 shrink-0" />}
                            <span className="truncate">{tab.label}</span>
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Card>

                {/* Right Focused Settings Pane (9 / 12 columns) */}
                <form
                  onSubmit={handleSubmit}
                  className="lg:col-span-9 min-w-0 flex flex-col gap-6"
                >
                  {editorPanels}
                  {stickySaveBar}
                </form>
              </div>
            </Tabs>

            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-outline rounded-xl shadow-xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-on-surface">
                    Live Public Card Preview
                  </DialogTitle>
                  <DialogDescription className="text-xs text-on-surface-variant">
                    What visitors see on your public brokerage card. Expiry dates and audit timestamps stay private.
                  </DialogDescription>
                </DialogHeader>
                <LivePublicCardPreview
                  role={role}
                  profile={draft}
                  isDirty={isDirty}
                  focusedSection={focusedSection}
                  credentialsPendingReview={credentialsPendingReview}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left 60%: Interactive Editor */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-3 min-w-0 flex flex-col gap-6"
            >
              {topBanner}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                <TabsList className="w-full justify-start overflow-x-auto bg-surface-variant p-1 rounded-xl border border-outline h-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="relative h-11 px-4 rounded-lg text-xs font-semibold normal-case tracking-normal data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="profile-studio-tab-pill"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute inset-0 rounded-lg bg-surface border border-outline shadow-2xs"
                          />
                        )}
                        <span
                          className={cn(
                            'relative z-10 flex items-center gap-2',
                            isSelected ? 'text-primary' : 'text-on-surface-variant'
                          )}
                        >
                          {Icon && <Icon className="size-4 shrink-0" />}
                          <span>{tab.label}</span>
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {editorPanels}
              </Tabs>

              {stickySaveBar}
            </form>

            {/* Right 40%: Sticky Live Public Card Preview (Desktop) */}
            <aside className="hidden lg:block lg:col-span-2 min-w-0 lg:sticky lg:top-24">
              <LivePublicCardPreview
                role={role}
                profile={draft}
                isDirty={isDirty}
                focusedSection={focusedSection}
                credentialsPendingReview={credentialsPendingReview}
              />
            </aside>
          </div>
        )}

        {/* Mobile Floating Preview Trigger + Sheet (Studio Mode) */}
        {!loading && !isMasterDetail && (
          <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMobilePreviewOpen(true)}
              className="w-full h-11 bg-surface border-outline text-on-surface shadow-md normal-case"
            >
              <Eye data-icon="inline-start" className="text-primary" />
              Preview Live Card
            </Button>
          </div>
        )}

        {!isMasterDetail && (
          <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Live Card Preview</SheetTitle>
                <SheetDescription>
                  Real-time preview of your {role} card.
                </SheetDescription>
              </SheetHeader>
              <div className="pt-4">
                <LivePublicCardPreview
                  role={role}
                  profile={draft}
                  isDirty={isDirty}
                  focusedSection={focusedSection}
                  credentialsPendingReview={credentialsPendingReview}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
        <ChangePasswordDialog
          open={passwordModalOpen}
          onOpenChange={setPasswordModalOpen}
          onSave={handlePasswordChange}
        />
      </div>
    </MotionConfig>
  );
}
