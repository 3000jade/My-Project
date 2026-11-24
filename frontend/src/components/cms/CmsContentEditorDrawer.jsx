import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CmsMediaField from '@/components/cms/CmsMediaField';
import {
  STAFF_DEPARTMENTS,
  getTabById,
  getContentTypeLabel,
  toSlug,
} from '@/components/cms/cmsConfig';

const CUSTOM_DEPARTMENT_VALUE = '__custom__';

const SELECT_CLASSES =
  'h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm text-[#1E293B] focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20';

const TITLE_FIELD_META = {
  banner: { label: 'Headline', placeholder: 'e.g. Open House Weekend in BGC' },
  page: { label: 'Page Title', placeholder: 'e.g. About Human Shelter Realty' },
  office: { label: 'Branch Name', placeholder: 'e.g. BGC Main Office' },
  staff: { label: 'Full Name', placeholder: 'e.g. Maria Clara Santos' },
  partner: { label: 'Organization Name', placeholder: 'e.g. Ayala Land' },
  award: { label: 'Award Title', placeholder: 'e.g. Top Real Estate Brokerage' },
  article: { label: 'Guide Title', placeholder: 'e.g. First-Time Home Buyer Guide' },
  faq: { label: 'Question', placeholder: 'e.g. How do I schedule a property tour?' },
};

export default function CmsContentEditorDrawer({
  isOpen,
  onClose,
  tabId = 'banners',
  initialItem = null,
  onSave,
  isSaving = false,
}) {
  const tab = getTabById(tabId);
  const [activeType, setActiveType] = useState(
    initialItem ? initialItem.content_type : tab.defaultType
  );

  // Common fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [sortOrder, setSortOrder] = useState(0);

  // Banner fields
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // Page contact channel fields
  const [includeContactLinks, setIncludeContactLinks] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [eyebrow, setEyebrow] = useState('');

  // Office fields
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // Staff fields
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState(STAFF_DEPARTMENTS[0]);
  const [customDepartment, setCustomDepartment] = useState('');

  // Partner fields
  const [partnerType, setPartnerType] = useState('developer');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Award fields
  const [year, setYear] = useState('');
  const [organization, setOrganization] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [featured, setFeatured] = useState(false);

  // Article & FAQ fields
  const [category, setCategory] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const currentTab = getTabById(tabId);
    const nextType = initialItem ? initialItem.content_type : currentTab.defaultType;
    setActiveType(nextType);

    if (initialItem) {
      const payload = initialItem.payload || {};
      setTitle(initialItem.title || '');
      setSlug(initialItem.slug || '');
      setSlugTouched(true);
      setSummary(initialItem.summary || '');
      setBody(initialItem.body || '');
      setMediaUrl(initialItem.media_url || '');
      setStatus(initialItem.status || 'DRAFT');
      setSortOrder(initialItem.sort_order ?? 0);

      setCtaLabel(payload.cta_label || '');
      setCtaUrl(payload.cta_url || '');

      const hasContactChannels = Boolean(
        payload.whatsapp_url ||
          payload.calendly_url ||
          payload.contact_email ||
          payload.eyebrow ||
          initialItem.slug === 'contact-us'
      );
      setIncludeContactLinks(hasContactChannels);
      setWhatsappUrl(payload.whatsapp_url || '');
      setCalendlyUrl(payload.calendly_url || '');
      setContactEmail(payload.contact_email || '');
      setEyebrow(payload.eyebrow || '');

      setAddress(payload.address || '');
      setPhone(payload.phone || '');
      setHours(payload.hours || '');
      setMapUrl(payload.map_url || '');

      setRole(payload.role || '');
      const existingDept = String(payload.department || '').trim();
      if (!existingDept) {
        setDepartment(STAFF_DEPARTMENTS[0]);
        setCustomDepartment('');
      } else if (STAFF_DEPARTMENTS.includes(existingDept)) {
        setDepartment(existingDept);
        setCustomDepartment('');
      } else {
        setDepartment(CUSTOM_DEPARTMENT_VALUE);
        setCustomDepartment(existingDept);
      }

      setPartnerType(payload.partner_type === 'bank' ? 'bank' : 'developer');
      setWebsiteUrl(payload.website_url || '');

      setYear(payload.year != null ? String(payload.year) : '');
      setOrganization(payload.organization || '');
      setMediaType(payload.media_type === 'video' ? 'video' : 'image');
      setFeatured(Boolean(payload.featured));

      setCategory(payload.category || '');
    } else {
      setTitle('');
      setSlug('');
      setSlugTouched(false);
      setSummary('');
      setBody('');
      setMediaUrl('');
      setStatus('DRAFT');
      setSortOrder(0);

      setCtaLabel('');
      setCtaUrl('');

      setIncludeContactLinks(false);
      setWhatsappUrl('');
      setCalendlyUrl('');
      setContactEmail('');
      setEyebrow('');

      setAddress('');
      setPhone('');
      setHours('');
      setMapUrl('');

      setRole('');
      setDepartment(STAFF_DEPARTMENTS[0]);
      setCustomDepartment('');

      setPartnerType('developer');
      setWebsiteUrl('');

      setYear('');
      setOrganization('');
      setMediaType('image');
      setFeatured(false);

      setCategory('');
    }
  }, [isOpen, initialItem, tabId]);

  const titleMeta = TITLE_FIELD_META[activeType] || {
    label: 'Title',
    placeholder: 'Enter title...',
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!initialItem && !slugTouched && (activeType === 'page' || activeType === 'article')) {
      setSlug(toSlug(val));
    }
  };

  const handleSelectSubType = (nextType) => {
    setActiveType(nextType);
    setError('');
    if (!initialItem && !slugTouched && (nextType === 'page' || nextType === 'article')) {
      setSlug(toSlug(title));
    }
  };

  const resolvedDepartment =
    department === CUSTOM_DEPARTMENT_VALUE
      ? customDepartment.trim()
      : department.trim();

  const showContactChannels =
    activeType === 'page' &&
    (toSlug(slug) === 'contact-us' || includeContactLinks);

  const validateForm = () => {
    if (title.trim().length < 2) {
      return `${titleMeta.label} is required (at least 2 characters).`;
    }

    if (activeType === 'page' || activeType === 'article') {
      const cleanedSlug = toSlug(slug);
      if (cleanedSlug.length < 2) {
        return 'Web Address is required and must contain at least 2 letters or numbers.';
      }
    }

    if (activeType === 'office' && !address.trim()) {
      return 'Full Address is required for an office branch.';
    }

    if (activeType === 'staff') {
      if (!role.trim()) {
        return 'Job Role is required for a staff member.';
      }
      if (!resolvedDepartment) {
        return 'Department is required for a staff member.';
      }
    }

    if (activeType === 'partner') {
      if (partnerType !== 'developer' && partnerType !== 'bank') {
        return 'Partner Category must be Accredited Developer or Partner Bank.';
      }
    }

    if (activeType === 'award') {
      if (!String(year).trim()) {
        return 'Year is required for an award.';
      }
      if (!organization.trim()) {
        return 'Awarding Organization is required for an award.';
      }
    }

    return '';
  };

  const buildPayload = () => {
    const payload = {};

    if (activeType === 'banner') {
      if (ctaLabel.trim()) payload.cta_label = ctaLabel.trim();
      if (ctaUrl.trim()) payload.cta_url = ctaUrl.trim();
    } else if (activeType === 'page') {
      if (showContactChannels) {
        if (whatsappUrl.trim()) payload.whatsapp_url = whatsappUrl.trim();
        if (calendlyUrl.trim()) payload.calendly_url = calendlyUrl.trim();
        if (contactEmail.trim()) payload.contact_email = contactEmail.trim();
        if (eyebrow.trim()) payload.eyebrow = eyebrow.trim();
      }
    } else if (activeType === 'office') {
      payload.address = address.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (hours.trim()) payload.hours = hours.trim();
      if (mapUrl.trim()) payload.map_url = mapUrl.trim();
    } else if (activeType === 'staff') {
      payload.role = role.trim();
      payload.department = resolvedDepartment;
    } else if (activeType === 'partner') {
      payload.partner_type = partnerType;
      if (websiteUrl.trim()) payload.website_url = websiteUrl.trim();
    } else if (activeType === 'award') {
      payload.year = String(year).trim();
      payload.organization = organization.trim();
      payload.media_type = mediaType === 'video' ? 'video' : 'image';
      payload.featured = Boolean(featured);
    } else if (activeType === 'article' || activeType === 'faq') {
      if (category.trim()) payload.category = category.trim();
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    const payload = buildPayload();

    const requestBody = {
      content_type: activeType,
      title: title.trim(),
      payload,
      status,
      sort_order: Math.min(9999, Math.max(0, Math.trunc(Number(sortOrder) || 0))),
    };

    if (activeType === 'page' || activeType === 'article') {
      requestBody.slug = toSlug(slug);
    } else if (initialItem?.slug) {
      requestBody.slug = initialItem.slug;
    }

    if (
      activeType === 'banner' ||
      activeType === 'page' ||
      activeType === 'award' ||
      activeType === 'article'
    ) {
      requestBody.summary = summary.trim() || null;
    }

    if (activeType === 'page' || activeType === 'article' || activeType === 'faq') {
      requestBody.body = body.trim() || null;
    }

    if (activeType !== 'faq') {
      requestBody.media_url = mediaUrl.trim() || null;
    }

    try {
      await onSave(requestBody);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.data?.error ||
          err?.message ||
          'Failed to save content. Please review your entries and try again.'
      );
    }
  };

  const typeLabel = getContentTypeLabel(activeType);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          onClose();
        }
      }}
    >
      <DrawerContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white border-l border-[#E2E8F0]"
      >
        <DrawerHeader className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <DrawerTitle className="text-xl font-semibold text-[#1E293B]">
            {initialItem ? `Edit ${typeLabel}` : `New ${typeLabel}`}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-[#64748B]">
            Save as Draft to keep it private, or switch to Published to show it on the public website.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
            data-lenis-prevent="true"
          >
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!initialItem && Array.isArray(tab.subTypes) && tab.subTypes.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label>Item Type</Label>
                <div
                  role="group"
                  aria-label="Content type"
                  className="grid grid-cols-2 gap-2"
                >
                  {tab.subTypes.map((subType) => {
                    const isSelected = activeType === subType.value;
                    return (
                      <Button
                        key={subType.value}
                        type="button"
                        variant="outline"
                        aria-pressed={isSelected}
                        onClick={() => handleSelectSubType(subType.value)}
                        className={
                          isSelected
                            ? 'h-10 border-[#0F766E] bg-[#CCFBF1] text-[#0F766E] hover:bg-[#CCFBF1] hover:text-[#0F766E]'
                            : 'h-10 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                        }
                      >
                        {subType.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="cms-title">{titleMeta.label}</Label>
              <Input
                id="cms-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={titleMeta.placeholder}
                required
              />
            </div>

            {(activeType === 'page' || activeType === 'article') && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cms-slug">Web Address</Label>
                <Input
                  id="cms-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder={activeType === 'page' ? 'about-us' : 'first-time-buyer-guide'}
                  required
                />
                <p className="text-xs text-[#64748B]">
                  Letters, numbers, and hyphens only (for example: /{toSlug(slug) || 'about-us'}).
                </p>
              </div>
            )}

            {activeType === 'banner' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-summary">Short Summary</Label>
                  <Input
                    id="cms-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="One-sentence highlight shown under the headline"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-cta-label">Button Text</Label>
                    <Input
                      id="cms-cta-label"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="Explore Listings"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-cta-url">Button Link</Label>
                    <Input
                      id="cms-cta-url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="/properties"
                    />
                  </div>
                </div>
                <CmsMediaField
                  id="cms-banner-image"
                  label="Optional Banner Image"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />
              </>
            )}

            {activeType === 'page' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-summary">Short Summary</Label>
                  <Input
                    id="cms-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short overview shown at the top of the page"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-body">Main Content</Label>
                  <Textarea
                    id="cms-body"
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write clear, helpful copy for this page..."
                  />
                </div>
                <CmsMediaField
                  id="cms-page-image"
                  label="Optional Cover Image"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />

                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cms-include-contact-links"
                      checked={showContactChannels}
                      disabled={toSlug(slug) === 'contact-us'}
                      onCheckedChange={(checked) =>
                        setIncludeContactLinks(Boolean(checked))
                      }
                    />
                    <Label
                      htmlFor="cms-include-contact-links"
                      className="cursor-pointer font-medium text-[#1E293B]"
                    >
                      Include Contact Page Links
                    </Label>
                  </div>

                  {showContactChannels && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="cms-whatsapp-url">WhatsApp Link</Label>
                        <Input
                          id="cms-whatsapp-url"
                          value={whatsappUrl}
                          onChange={(e) => setWhatsappUrl(e.target.value)}
                          placeholder="https://wa.me/639..."
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="cms-calendly-url">Calendly Link</Label>
                        <Input
                          id="cms-calendly-url"
                          value={calendlyUrl}
                          onChange={(e) => setCalendlyUrl(e.target.value)}
                          placeholder="https://calendly.com/..."
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="cms-contact-email">Contact Email</Label>
                        <Input
                          id="cms-contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="hello@humanshelterrealty.com"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="cms-eyebrow">Section Eyebrow</Label>
                        <Input
                          id="cms-eyebrow"
                          value={eyebrow}
                          onChange={(e) => setEyebrow(e.target.value)}
                          placeholder="Get in Touch"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeType === 'office' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-office-address">Full Address</Label>
                  <Textarea
                    id="cms-office-address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Unit, Building, Street, City"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-office-phone">Phone Number</Label>
                    <Input
                      id="cms-office-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 2 8123 4567"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-office-hours">Office Hours</Label>
                    <Input
                      id="cms-office-hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="Mon–Sat, 9:00 AM – 6:00 PM"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-office-map">Optional Map Link</Label>
                  <Input
                    id="cms-office-map"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <CmsMediaField
                  id="cms-office-image"
                  label="Optional Branch Photo"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />
              </>
            )}

            {activeType === 'staff' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-staff-role">Job Role</Label>
                  <Input
                    id="cms-staff-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Property Specialist"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-staff-department">Department</Label>
                  <select
                    id="cms-staff-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    {STAFF_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value={CUSTOM_DEPARTMENT_VALUE}>Custom</option>
                  </select>
                </div>
                {department === CUSTOM_DEPARTMENT_VALUE && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-staff-custom-department">
                      Custom Department
                    </Label>
                    <Input
                      id="cms-staff-custom-department"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Enter department name"
                      required
                    />
                  </div>
                )}
                <CmsMediaField
                  id="cms-staff-image"
                  label="Portrait Photo"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />
              </>
            )}

            {activeType === 'partner' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-partner-type">Partner Category</Label>
                  <select
                    id="cms-partner-type"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    <option value="developer">Accredited Developer</option>
                    <option value="bank">Partner Bank</option>
                  </select>
                </div>
                <CmsMediaField
                  id="cms-partner-logo"
                  label="Logo Image"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-partner-website">
                    Optional Website Link
                  </Label>
                  <Input
                    id="cms-partner-website"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {activeType === 'award' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-award-year">Year</Label>
                    <Input
                      id="cms-award-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2025"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-award-org">Awarding Organization</Label>
                    <Input
                      id="cms-award-org"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Lamudi Outlook"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-award-summary">Short Description</Label>
                  <Input
                    id="cms-award-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief recognition summary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-award-media-type">Media Type</Label>
                  <select
                    id="cms-award-media-type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                {mediaType === 'video' ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cms-award-video-url">Video URL</Label>
                    <Input
                      id="cms-award-video-url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <CmsMediaField
                    id="cms-award-media"
                    label="Award Image"
                    value={mediaUrl}
                    onChange={setMediaUrl}
                  />
                )}
                <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <Checkbox
                    id="cms-award-featured"
                    checked={featured}
                    onCheckedChange={(checked) => setFeatured(Boolean(checked))}
                  />
                  <Label
                    htmlFor="cms-award-featured"
                    className="cursor-pointer font-medium text-[#1E293B]"
                  >
                    Show in Homepage Featured Slider
                  </Label>
                </div>
              </>
            )}

            {activeType === 'article' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-guide-category">Category</Label>
                  <Input
                    id="cms-guide-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. First-Time Buyers, Financing, Market Tips"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-summary">Short Summary</Label>
                  <Input
                    id="cms-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short overview shown on guide cards"
                  />
                </div>
                <CmsMediaField
                  id="cms-guide-image"
                  label="Cover Image"
                  value={mediaUrl}
                  onChange={setMediaUrl}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-body">Main Content</Label>
                  <Textarea
                    id="cms-body"
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write the full home-buying guide here..."
                  />
                </div>
              </>
            )}

            {activeType === 'faq' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-faq-category">Category</Label>
                  <Input
                    id="cms-faq-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Buying, Renting, Property Tours"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cms-body">Answer</Label>
                  <Textarea
                    id="cms-body"
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write a clear, helpful answer..."
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cms-status">Visibility Status</Label>
                <select
                  id="cms-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={SELECT_CLASSES}
                >
                  <option value="DRAFT">Draft (Hidden)</option>
                  <option value="PUBLISHED">Published (Live)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cms-order">Display Order (0 = First)</Label>
                <Input
                  id="cms-order"
                  type="number"
                  min={0}
                  max={9999}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-row justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#0F766E] hover:bg-[#115E59] text-white h-10 px-4"
            >
              {isSaving && (
                <Loader2
                  className="size-4 animate-spin motion-reduce:animate-none"
                  data-icon="inline-start"
                />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Content'}</span>
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
