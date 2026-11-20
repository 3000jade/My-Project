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
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { ProfileSkeleton } from '@/components/dashboard/skeletons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import SessionManagementPanel from '@/components/auth/SessionManagementPanel';
import LivePublicCardPreview from './LivePublicCardPreview';
import { cn } from '@/utils/cn';

const BIO_MAX = 1000;

/**
 * ProfileCardStudio
 * Shared 2-column (60% editor / 40% sticky live preview) studio for Agent, Broker, and Client profiles.
 */
export default function ProfileCardStudio({
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
  const [internalTab, setInternalTab] = useState('identity');
  const [internalFocusedSection, setInternalFocusedSection] = useState(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const focusedSection = externalFocusedSection ?? internalFocusedSection;
  const setFocusedSection = onFocusSection ?? setInternalFocusedSection;

  const bioValue = draft.bio || '';
  const bioNearLimit = bioValue.length >= Math.floor(BIO_MAX * 0.9);

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

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-testid={testId}
        className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full pb-20 lg:pb-6"
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
          <ProfileSkeleton />
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

                {/* Tab 1: Common Identity & Card Fields */}
                <TabsContent value="identity" className="mt-4">
                  <Card className="bg-surface border border-outline rounded-xl shadow-xs">
                    <CardHeader className="pb-4 border-b border-outline">
                      <CardTitle className="text-xl font-semibold text-on-surface">
                        Identity &amp; Card Details
                      </CardTitle>
                      <CardDescription className="text-sm text-on-surface-variant">
                        Changes appear on your live card preview right away. Save when ready.
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
                              onChange={(e) => handleFieldChange('email', e.target.value)}
                              onFocus={() => setFocusedSection('contact')}
                              onBlur={() => setFocusedSection(null)}
                              placeholder="name@company.com"
                              required
                              className="h-11 bg-surface border-outline text-on-surface rounded-lg"
                            />
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
                    className="mt-4 data-[state=inactive]:hidden"
                  >
                    {tab.content}
                  </TabsContent>
                ))}

                {/* Security Tab */}
                <TabsContent
                  value="security"
                  forceMount
                  className="mt-4 data-[state=inactive]:hidden"
                >
                  <div className="flex flex-col gap-6">
                    {securityExtraContent}
                    <SessionManagementPanel />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Dirty-State Sticky Save Bar */}
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

        {/* Mobile Floating Preview Trigger + Sheet */}
        {!loading && (
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
      </div>
    </MotionConfig>
  );
}
