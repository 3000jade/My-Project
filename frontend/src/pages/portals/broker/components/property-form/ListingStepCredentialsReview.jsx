import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import FormSelect from './FormSelect';
import DescriptionEditorModal, { stripHtml } from './DescriptionEditorModal';

const DEV_DESCRIPTION_MAX = 2000;

const BROKER_SELF_VALUE = '__BROKER_SELF__';

/**
 * Step 5: Credentials, Broker/Agent Permissions & Publish Review
 */
export default function ListingStepCredentialsReview({
  formData,
  setFormData,
  setIsDirty,
  user,
  agents = [],
  mediaPhotosCount = 0,
  onJumpToStep,
}) {
  const credentials = formData.credentials || {};
  const [devDescEditorOpen, setDevDescEditorOpen] = useState(false);

  const agentPermissions = formData.agentPermissions || {
    canEditListing: true,
    notifyBrokerOnChange: true,
  };

  const updateCredentials = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({
      ...prev,
      credentials: {
        ...(prev.credentials || {}),
        ...patch,
      },
    }));
  };

  const updatePermission = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({
      ...prev,
      agentPermissions: {
        canEditListing: true,
        notifyBrokerOnChange: true,
        ...(prev.agentPermissions || {}),
        ...patch,
      },
    }));
  };

  const handleUseMyProfile = () => {
    setIsDirty?.(true);
    setFormData((prev) => ({
      ...prev,
      handlerMode: 'broker',
      list_agent_key: user?.id || null,
      credentials: {
        ...(prev.credentials || {}),
        assignedAgent: user?.full_name || user?.name || formData.agent_name || '',
        brokerDhsudLicenseNo:
          user?.dhsud_accreditation_no ||
          user?.dhsud_license_no ||
          user?.dhsudLicenseNo ||
          user?.dhsud_license ||
          prev.credentials?.brokerDhsudLicenseNo ||
          '',
        prcLicenseNo:
          user?.prc_license_no ||
          user?.prc_license ||
          user?.prcLicenseNo ||
          user?.prcLicense ||
          prev.credentials?.prcLicenseNo ||
          '',
        contactNumber: user?.phone || user?.contact_number || prev.credentials?.contactNumber || '',
        contactEmail: user?.email || prev.credentials?.contactEmail || '',
      },
    }));
  };

  const handleHandlerPick = (val) => {
    setIsDirty?.(true);
    if (!val) {
      setFormData((prev) => ({
        ...prev,
        handlerMode: null,
        list_agent_key: null,
      }));
      return;
    }

    if (val === BROKER_SELF_VALUE) {
      handleUseMyProfile();
      return;
    }

    const found = agents.find((a) => String(a.id) === String(val));
    setFormData((prev) => ({
      ...prev,
      handlerMode: 'agent',
      list_agent_key: val,
      agentPermissions: {
        canEditListing: prev.agentPermissions?.canEditListing ?? true,
        notifyBrokerOnChange: prev.agentPermissions?.notifyBrokerOnChange ?? true,
      },
      credentials: {
        ...(prev.credentials || {}),
        assignedAgent: found?.full_name || found?.name || prev.credentials?.assignedAgent || '',
        prcLicenseNo:
          found?.prc_license_no ||
          found?.prc_license ||
          found?.prcLicenseNo ||
          found?.prcLicense ||
          prev.credentials?.prcLicenseNo ||
          '',
        contactNumber: found?.phone || prev.credentials?.contactNumber || '',
        contactEmail: found?.email || prev.credentials?.contactEmail || '',
      },
    }));
  };

  const selectedHandlerValue =
    formData.handlerMode === 'broker' || (user?.id && formData.list_agent_key === user.id)
      ? BROKER_SELF_VALUE
      : formData.list_agent_key
        ? String(formData.list_agent_key)
        : '';

  const isTeamAgentSelected =
    Boolean(selectedHandlerValue) && selectedHandlerValue !== BROKER_SELF_VALUE;

  const uniqueAgents = Array.from(
    new Map(agents.map((ag) => [String(ag.id), ag])).values()
  );
  const nameCounts = uniqueAgents.reduce((acc, ag) => {
    const base = (ag.full_name || ag.name || ag.email || 'Team Agent').trim();
    acc[base] = (acc[base] || 0) + 1;
    return acc;
  }, {});

  const handlerOptions = [
    {
      value: BROKER_SELF_VALUE,
      label: `Myself (${user?.full_name || user?.name || 'Broker'})`,
    },
    ...uniqueAgents.map((ag) => {
      const base = (ag.full_name || ag.name || ag.email || 'Team Agent').trim();
      const disambiguator = ag.email || String(ag.id).slice(0, 6);
      return {
        value: String(ag.id),
        label: nameCounts[base] > 1 && disambiguator ? `${base} (${disambiguator})` : base,
      };
    }),
  ];

  const checks = [
    {
      label: 'Listing title & price',
      done: Boolean(
        formData.title?.trim() &&
        Number(String(formData.price || '').replace(/[^0-9.]/g, '')) > 0
      ),
      step: 1,
    },
    {
      label: 'City & street address',
      done: Boolean((formData.city || formData.location) && formData.address?.trim()),
      step: 2,
    },
    {
      label: 'Floor or lot area',
      done: Boolean(Number(formData.living_area || 0) > 0 || Number(formData.lot_size_area || 0) > 0),
      step: 3,
    },
    {
      label: 'At least 1 photo uploaded',
      done: mediaPhotosCount > 0,
      step: 4,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Legal & Developer Info */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1E293B]">
                Legal & Project Credentials
              </CardTitle>
              <CardDescription className="text-sm text-[#64748B]">
                Compliance details that build buyer trust.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="developer-name" className="text-sm font-semibold text-[#1E293B]">
              Developer
            </FieldLabel>
            <Input
              id="developer-name"
              type="text"
              maxLength={80}
              placeholder="e.g. Ayala Land Premier"
              value={credentials.developer || ''}
              onChange={(e) => updateCredentials({ developer: e.target.value })}
              className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
            />
          </Field>

          <Field className="md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel className="text-sm font-semibold text-on-surface">
                Developer Description
              </FieldLabel>
              {stripHtml(credentials.developerDescription || '') && (
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Remove developer description"
                  onClick={() => updateCredentials({ developerDescription: '' })}
                  className="min-h-11 px-3 border-outline bg-surface text-on-surface-variant hover:text-[#FF6B6B] font-semibold rounded-lg cursor-pointer"
                >
                  <Trash2 data-icon="inline-start" className="text-[#FF6B6B]" />
                  Remove
                </Button>
              )}
            </div>
            <div
              onClick={() => setDevDescEditorOpen(true)}
              role="button"
              aria-label="Edit developer description"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDevDescEditorOpen(true);
                }
              }}
              className="min-h-20 p-3.5 rounded-lg border border-outline bg-surface hover:border-outline-variant transition-colors cursor-pointer flex flex-col justify-between gap-2"
            >
              <p className="text-sm leading-relaxed whitespace-pre-line line-clamp-3 text-on-surface-variant">
                {stripHtml(credentials.developerDescription || '') ||
                  'Share developer track record, completed projects, and warranty highlights...'}
              </p>
              <span className="text-xs tabular-nums text-on-surface-variant self-end">
                {stripHtml(credentials.developerDescription || '').length} / {DEV_DESCRIPTION_MAX}
              </span>
            </div>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="dhsud-license" className="text-sm font-semibold text-[#1E293B]">
              DHSUD License No.
            </FieldLabel>
            <Input
              id="dhsud-license"
              type="text"
              maxLength={48}
              placeholder="e.g. DHSUD-NCR-LTS-12345"
              value={credentials.dhsudLicenseNo || ''}
              onChange={(e) => updateCredentials({ dhsudLicenseNo: e.target.value })}
              className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Card 2: Agent / Broker Contact & Permissions */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <UserCheck className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Listing Contact
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Choose whether you (the Broker) or a Team Agent handles this listing.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="assigned-agent-select" className="text-sm font-semibold text-[#1E293B]">
                Assign an Agent
              </FieldLabel>
              <FormSelect
                id="assigned-agent-select"
                value={selectedHandlerValue}
                icon={User}
                placeholder="Select Broker (Myself) or Team Agent"
                allowClear
                clearLabel="Unassigned"
                options={handlerOptions}
                onValueChange={handleHandlerPick}
              />
            </Field>

            {/* Agent Permission Checkboxes when an agent is selected */}
            {isTeamAgentSelected && (
              <div className="md:col-span-2 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                  Agent Permissions & Alerts
                </span>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    id="perm-can-edit"
                    checked={Boolean(agentPermissions.canEditListing)}
                    onCheckedChange={(checked) =>
                      updatePermission({ canEditListing: Boolean(checked) })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1E293B]">
                      Allow this agent to make changes
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Lets the assigned agent propose updates to details, pricing, and photos.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    id="perm-notify-broker"
                    checked={Boolean(agentPermissions.notifyBrokerOnChange)}
                    onCheckedChange={(checked) =>
                      updatePermission({ notifyBrokerOnChange: Boolean(checked) })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1E293B]">
                      Notify broker when changes are made
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Sends you an alert whenever this agent submits an edit to the listing.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="assigned-agent-name" className="text-sm font-semibold text-[#1E293B]">
                Contact Name
              </FieldLabel>
              <Input
                id="assigned-agent-name"
                type="text"
                maxLength={80}
                placeholder="e.g. Maria Santos"
                value={credentials.assignedAgent || ''}
                onChange={(e) => updateCredentials({ assignedAgent: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="prc-license" className="text-sm font-semibold text-[#1E293B]">
                PRC License No.
              </FieldLabel>
              <Input
                id="prc-license"
                type="text"
                maxLength={32}
                placeholder="e.g. 0012345"
                value={credentials.prcLicenseNo || ''}
                onChange={(e) => updateCredentials({ prcLicenseNo: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            {selectedHandlerValue === BROKER_SELF_VALUE && (
              <Field>
                <FieldLabel htmlFor="broker-dhsud-license" className="text-sm font-semibold text-[#1E293B]">
                  Broker DHSUD License No.
                </FieldLabel>
                <Input
                  id="broker-dhsud-license"
                  type="text"
                  maxLength={48}
                  placeholder="e.g. DHSUD-NCR-B-001234"
                  value={credentials.brokerDhsudLicenseNo || ''}
                  onChange={(e) => updateCredentials({ brokerDhsudLicenseNo: e.target.value })}
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="contact-number" className="text-sm font-semibold text-[#1E293B]">
                Contact Number
              </FieldLabel>
              <Input
                id="contact-number"
                type="tel"
                maxLength={24}
                placeholder="e.g. +63 917 123 4567"
                value={credentials.contactNumber || ''}
                onChange={(e) => updateCredentials({ contactNumber: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-email" className="text-sm font-semibold text-[#1E293B]">
                Contact Email
              </FieldLabel>
              <Input
                id="contact-email"
                type="email"
                maxLength={120}
                placeholder="e.g. inquiries@humanshelter.ph"
                value={credentials.contactEmail || ''}
                onChange={(e) => updateCredentials({ contactEmail: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-messenger" className="text-sm font-semibold text-[#1E293B]">
                Messenger Link
              </FieldLabel>
              <Input
                id="contact-messenger"
                type="url"
                maxLength={200}
                placeholder="e.g. https://m.me/yourpage"
                value={credentials.messengerUrl || ''}
                onChange={(e) => updateCredentials({ messengerUrl: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-facebook" className="text-sm font-semibold text-[#1E293B]">
                Facebook Link
              </FieldLabel>
              <Input
                id="contact-facebook"
                type="url"
                maxLength={200}
                placeholder="e.g. https://facebook.com/yourpage"
                value={credentials.facebookUrl || ''}
                onChange={(e) => updateCredentials({ facebookUrl: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="contact-whatsapp" className="text-sm font-semibold text-[#1E293B]">
                WhatsApp
              </FieldLabel>
              <Input
                id="contact-whatsapp"
                type="text"
                maxLength={200}
                placeholder="e.g. +63 917 123 4567 or https://wa.me/639171234567"
                value={credentials.whatsapp || ''}
                onChange={(e) => updateCredentials({ whatsapp: e.target.value })}
                className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Readiness Checklist */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1E293B]">
            Ready to Publish Checklist
          </CardTitle>
          <CardDescription className="text-sm text-[#64748B]">
            Quick check before your listing goes live.
          </CardDescription>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-4 flex flex-col gap-2.5">
          {checks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => !item.done && onJumpToStep?.(item.step)}
              className="min-h-11 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-left hover:border-slate-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-[#1E293B]">
                {item.done ? (
                  <CheckCircle2 className="size-4 text-[#0F766E] shrink-0" />
                ) : (
                  <AlertCircle className="size-4 text-[#FF6B6B] shrink-0" />
                )}
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[#0F766E]">
                {item.done ? 'Complete' : `Go to Step ${item.step}`}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <DescriptionEditorModal
        open={devDescEditorOpen}
        onOpenChange={setDevDescEditorOpen}
        title="Developer Description"
        subtitle="Share the developer's background, track record, and project credentials."
        initialValue={credentials.developerDescription || ''}
        maxLength={DEV_DESCRIPTION_MAX}
        placeholder="Describe the developer's track record and notable projects..."
        onSave={(html) => {
          updateCredentials({ developerDescription: html });
          setDevDescEditorOpen(false);
        }}
      />
    </div>
  );
}
