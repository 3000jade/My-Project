import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  FileCheck2,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import FormSelect from './FormSelect';

const PROJECT_CLASSIFICATIONS = [
  'Open Market',
  'Economic Housing',
  'Socialized Housing',
  'Mid-Cost',
  'High-End Luxury',
];

const TITLE_STATUSES = [
  'Clean Title',
  'Mortgaged',
  'Under Extrajudicial Settlement',
  'Tax Declaration',
  'For Transfer',
];

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
        prcLicenseNo: user?.prc_license || user?.prcLicense || credentials.prcLicenseNo || '',
        contactNumber: user?.phone || user?.contact_number || credentials.contactNumber || '',
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
        prcLicenseNo: found?.prc_license || found?.prcLicense || prev.credentials?.prcLicenseNo || '',
        contactNumber: found?.phone || prev.credentials?.contactNumber || '',
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

          <Field>
            <FieldLabel htmlFor="brokerage-name" className="text-sm font-semibold text-[#1E293B]">
              Brokerage
            </FieldLabel>
            <Input
              id="brokerage-name"
              type="text"
              maxLength={80}
              placeholder="e.g. Human Shelter Realty"
              value={credentials.brokerage || ''}
              onChange={(e) => updateCredentials({ brokerage: e.target.value })}
              className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
            />
          </Field>

          <Field>
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

          <Field>
            <FieldLabel htmlFor="project-classification" className="text-sm font-semibold text-[#1E293B]">
              Project Classification
            </FieldLabel>
            <FormSelect
              id="project-classification"
              value={credentials.projectClassification || ''}
              icon={Layers}
              options={PROJECT_CLASSIFICATIONS}
              placeholder="Select classification"
              allowClear
              onValueChange={(val) => updateCredentials({ projectClassification: val })}
            />
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="title-status" className="text-sm font-semibold text-[#1E293B]">
              Title Status
            </FieldLabel>
            <FormSelect
              id="title-status"
              value={credentials.titleStatus || ''}
              icon={FileCheck2}
              options={TITLE_STATUSES}
              placeholder="Select title status (e.g. Clean Title)"
              allowClear
              onValueChange={(val) => updateCredentials({ titleStatus: val })}
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

            <Button
              type="button"
              variant="outline"
              onClick={handleUseMyProfile}
              className="min-h-11 px-3 border-[#E2E8F0] text-[#0F766E] font-semibold rounded-lg cursor-pointer"
            >
              <Sparkles data-icon="inline-start" />
              Use My Profile
            </Button>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="assigned-agent-select" className="text-sm font-semibold text-[#1E293B]">
                Assigned Handler
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

            <Field className="md:col-span-2">
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
    </div>
  );
}
