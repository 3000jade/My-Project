import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  Eye,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/utils/cn';

function getInitials(name, fallback = 'HS') {
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

function spotlightClass(focusedSection, sectionKey) {
  return cn(
    'rounded-lg transition-all duration-200',
    focusedSection === sectionKey && 'ring-2 ring-primary/35 bg-tertiary-container/20'
  );
}

/**
 * LivePublicCardPreview
 * Renders a real-time, privacy-safe preview of how the user's profile appears
 * to public visitors (Agent/Broker) or assigned agents (Client).
 */
export default function LivePublicCardPreview({
  role = 'agent',
  profile = {},
  isDirty = false,
  focusedSection = null,
  credentialsPendingReview = false,
  className = '',
}) {
  const [viewMode, setViewMode] = useState('full');

  const displayName =
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    (role === 'broker'
      ? 'Principal Broker'
      : role === 'client'
        ? 'Registered Client'
        : 'Real Estate Advisor');

  const initials = getInitials(
    displayName,
    role === 'broker' ? 'PB' : role === 'client' ? 'CL' : 'AG'
  );

  const isAvailable = (profile.routing_availability || 'available') === 'available';
  const hasPrc = Boolean(String(profile.prc_license_no || '').trim());
  const hasDhsud = Boolean(String(profile.dhsud_accreditation_no || '').trim());

  const cardSubtitle =
    role === 'client'
      ? 'What your assigned agent sees on inquiries'
      : role === 'broker'
        ? 'Public brokerage leadership card'
        : 'Public advisor card on property listings';

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn('flex flex-col gap-3 w-full min-w-0', className)} data-testid="live-public-card-preview">
        {/* Preview Controls Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="size-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-on-surface truncate">
              Live Card Preview
            </span>
            <AnimatePresence initial={false}>
              {isDirty ? (
                <motion.span
                  key="draft"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge variant="warning" className="text-xs">
                    Unsaved Draft
                  </Badge>
                </motion.span>
              ) : (
                <motion.span
                  key="synced"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge variant="success" className="text-xs">
                    Synced
                  </Badge>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <ToggleGroup
            value={[viewMode]}
            onValueChange={(vals) => {
              const next = Array.isArray(vals) ? vals[vals.length - 1] : vals;
              if (next) setViewMode(next);
            }}
            variant="outline"
            size="sm"
            aria-label="Card preview density"
          >
            <ToggleGroupItem value="full" className="min-h-11 px-3 text-xs font-semibold">
              Full Card
            </ToggleGroupItem>
            <ToggleGroupItem value="compact" className="min-h-11 px-3 text-xs font-semibold">
              Compact
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <p className="text-xs text-on-surface-variant">{cardSubtitle}</p>

        {/* Live Card Surface */}
        <AnimatePresence mode="wait">
          {viewMode === 'compact' ? (
            <motion.div
              key="compact-card"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Card className="bg-surface border border-outline rounded-xl shadow-xs">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="size-14 shrink-0 border border-outline">
                    <AvatarImage src={profile.avatar} alt={displayName} />
                    <AvatarFallback className="bg-tertiary-container text-primary font-semibold text-base">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-on-surface truncate">
                        {displayName}
                      </p>
                      <Badge variant="success" className="text-xs">
                        <ShieldCheck className="size-3.5" />
                        {role === 'client' ? 'Verified Client' : 'Verified'}
                      </Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {role === 'broker'
                        ? profile.firm_name || 'Human Shelter Realty'
                        : role === 'client'
                          ? profile.preferredLocation || 'Preferred area not set'
                          : `${profile.brokerage_name || 'Human Shelter Realty'}${profile.location_branch ? ` • ${profile.location_branch}` : ''}`}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {role !== 'client' && hasPrc && (
                        <Badge variant="default" className="text-xs">
                          PRC Verified
                        </Badge>
                      )}
                      {role !== 'client' && hasDhsud && (
                        <Badge variant="secondary" className="text-xs">
                          DHSUD Accredited
                        </Badge>
                      )}
                      {role === 'client' && profile.investmentBudget && (
                        <Badge variant="default" className="text-xs font-mono">
                          {profile.investmentBudget}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="full-card"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Card className="bg-surface border border-outline rounded-xl shadow-xs overflow-hidden">
                {/* Identity Header */}
                <CardHeader
                  className={cn(
                    'bg-background border-b border-outline p-6',
                    spotlightClass(focusedSection, 'identity')
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="size-16 shrink-0 border-2 border-primary/25">
                      <AvatarImage src={profile.avatar} alt={displayName} />
                      <AvatarFallback className="bg-tertiary-container text-primary font-bold text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-xl font-semibold text-on-surface tracking-tight truncate">
                          {displayName}
                        </CardTitle>
                        {credentialsPendingReview ? (
                          <Badge variant="warning" className="text-xs">
                            <Clock className="size-3.5" />
                            Review Queued
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">
                            <ShieldCheck className="size-3.5" />
                            {role === 'broker'
                              ? 'Verified Principal'
                              : role === 'client'
                                ? 'Verified Client'
                                : 'Verified Advisor'}
                          </Badge>
                        )}
                      </div>

                      {role === 'broker' && (
                        <CardDescription className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            {profile.firm_name || 'Human Shelter Realty'}
                          </span>
                        </CardDescription>
                      )}

                      {role === 'agent' && (
                        <>
                          <CardDescription className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                            <Building2 className="size-3.5 text-primary shrink-0" />
                            <span>{profile.brokerage_name || 'Human Shelter Realty'}</span>
                            {profile.team_name && (
                              <span className="text-primary font-semibold">
                                • {profile.team_name}
                              </span>
                            )}
                          </CardDescription>
                          {profile.location_branch && (
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">{profile.location_branch}</span>
                            </p>
                          )}
                        </>
                      )}

                      {role === 'client' && (
                        <CardDescription className="text-xs text-on-surface-variant flex items-center gap-1.5">
                          <UserCheck className="size-3.5 text-primary shrink-0" />
                          <span>
                            Member since {profile.memberSince || 'March 2026'}
                          </span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 flex flex-col gap-5">
                  {/* Agent & Broker: Privacy-Safe Regulatory Badges */}
                  {role !== 'client' && (
                    <div
                      className={cn(
                        'flex flex-col gap-2 p-1 -m-1',
                        spotlightClass(focusedSection, 'credentials')
                      )}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-background border border-outline flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-tertiary-container text-primary flex items-center justify-center shrink-0">
                            <Award className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-on-surface">
                              {role === 'broker' ? 'PRC Principal' : 'PRC Verified'}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {hasPrc ? 'Active License' : 'Broker Supervised'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-background border border-outline flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-on-surface">
                              DHSUD Accredited
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {hasDhsud ? 'Active Standing' : 'Firm Covered'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Public-safe view: license expiry dates stay private.
                      </p>
                    </div>
                  )}

                  {/* Agent: Portfolio Metrics */}
                  {role === 'agent' && (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg border border-outline bg-surface">
                        <p className="text-base font-bold font-mono tabular-nums text-on-surface">
                          {profile.experience_years ?? 0}+ yrs
                        </p>
                        <p className="text-xs text-on-surface-variant">Experience</p>
                      </div>
                      <div className="p-3 rounded-lg border border-outline bg-surface">
                        <p className="text-base font-bold font-mono tabular-nums text-primary">
                          {profile.assigned_properties_count ?? 0}
                        </p>
                        <p className="text-xs text-on-surface-variant">Listings</p>
                      </div>
                      <div className="p-3 rounded-lg border border-outline bg-surface">
                        <p className="text-base font-bold font-mono tabular-nums text-on-surface">
                          {profile.recorded_sales_count ?? 0}
                        </p>
                        <p className="text-xs text-on-surface-variant">Closed</p>
                      </div>
                    </div>
                  )}

                  {/* Broker: Practice Experience Strip */}
                  {role === 'broker' && (
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 rounded-lg border border-outline bg-surface">
                        <p className="text-base font-bold font-mono tabular-nums text-primary">
                          {profile.experience_years ?? 0}+ yrs
                        </p>
                        <p className="text-xs text-on-surface-variant">Industry Leadership</p>
                      </div>
                      <div className="p-3 rounded-lg border border-outline bg-surface">
                        <p className="text-base font-bold text-on-surface">
                          Principal
                        </p>
                        <p className="text-xs text-on-surface-variant">Managing Broker</p>
                      </div>
                    </div>
                  )}

                  {/* Client: Target Location & Budget */}
                  {role === 'client' && (
                    <div
                      className={cn(
                        'grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 -m-1',
                        spotlightClass(focusedSection, 'preferences')
                      )}
                    >
                      <div className="p-3 rounded-lg bg-background border border-outline flex flex-col gap-1">
                        <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          Preferred Area
                        </span>
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {profile.preferredLocation || 'Not specified'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-outline flex flex-col gap-1">
                        <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                          <DollarSign className="size-3.5 text-primary shrink-0" />
                          Target Budget
                        </span>
                        <p className="text-sm font-semibold font-mono tabular-nums text-on-surface truncate">
                          {profile.investmentBudget || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bio / Notes */}
                  <div
                    className={cn(
                      'flex flex-col gap-1.5 p-2 -m-2',
                      spotlightClass(focusedSection, 'bio')
                    )}
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {role === 'client'
                        ? 'Acquisition Notes'
                        : role === 'broker'
                          ? 'Executive Overview'
                          : 'Advisory Specialization'}
                    </h4>
                    <p className="text-sm text-on-surface leading-relaxed break-words">
                      {profile.bio?.trim()
                        ? profile.bio
                        : 'Add a short introduction so visitors know how you work.'}
                    </p>
                  </div>

                  {/* Contact & Availability Strip */}
                  <div
                    className={cn(
                      'p-4 rounded-lg bg-background border border-outline flex flex-col gap-3',
                      spotlightClass(focusedSection, 'contact')
                    )}
                  >
                    {role === 'agent' && (
                      <>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-on-surface flex items-center gap-1.5">
                            <Clock className="size-3.5 text-primary" />
                            Consultation Status
                          </span>
                          <Badge variant={isAvailable ? 'success' : 'warning'} className="text-xs">
                            {isAvailable ? 'Available Directly' : 'Team Assisted'}
                          </Badge>
                        </div>
                        <Separator className="bg-outline" />
                      </>
                    )}

                    <div className="flex flex-col gap-2 text-xs text-on-surface">
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{profile.phone || 'No phone added'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{profile.email || 'No email added'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Preview-only Footer Actions (Outline/Non-competing per DESIGN.md 6.6) */}
                {role !== 'client' && (
                  <CardFooter className="px-6 py-4 bg-background border-t border-outline flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="h-11 flex-1 normal-case text-xs font-semibold opacity-90"
                    >
                      <Calendar data-icon="inline-start" />
                      Book Viewing
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="h-11 flex-1 border-accent/50 bg-accent/15 text-on-accent normal-case text-xs font-semibold opacity-90"
                    >
                      <MessageSquare data-icon="inline-start" />
                      Send Inquiry
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
