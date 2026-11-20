import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from 'cn';
import {
  Tag,
  KeyRound,
  Landmark,
  Banknote,
  ChevronDown,
  Calculator,
  Sparkles,
  Home,
  Building2,
  Trees,
  Factory,
  Clock,
  CheckCircle2,
  Hammer,
  Repeat,
  BadgeCheck,
  Upload,
  Trash2,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { COMMON_PROPERTY_TYPES } from './propertyTypeConfig';
import FormSelect from './FormSelect';
import PartneredBankMultiSelect from './PartneredBankMultiSelect';

const TITLE_MAX = 120;

const TRANSACTION_TYPES = [
  { value: 'For Sale', label: 'For Sale', icon: Tag },
  { value: 'For Rent', label: 'For Rent', icon: KeyRound },
  { value: 'Foreclosure', label: 'Foreclosure', icon: Landmark },
];

const PROPERTY_CATEGORIES = [
  { value: 'Residential', label: 'Residential', icon: Home },
  { value: 'Commercial', label: 'Commercial', icon: Building2 },
  { value: 'Land', label: 'Land', icon: Trees },
  { value: 'Industrial', label: 'Industrial', icon: Factory },
];

const CATEGORY_TO_TYPES = {
  Residential: [
    'House & Lot',
    'Condominium',
    'Townhouse',
    'Apartment',
    'Duplex',
    'Studio',
    'Penthouse',
    'Villa',
  ],
  Commercial: [
    'Commercial Space',
    'Office Space',
    'Retail Space',
    'Building',
    'Shophouse',
  ],
  Land: [
    'Vacant Lot',
    'Residential Lot',
    'Commercial Lot',
    'Agricultural Lot',
    'Beach Lot',
  ],
  Industrial: ['Warehouse', 'Factory', 'Industrial Lot'],
};

const PROPERTY_STATUSES = [
  { value: 'Pre-Selling', label: 'Pre-Selling', icon: Clock },
  { value: 'Ready for Occupancy', label: 'Ready for Occupancy', icon: CheckCircle2 },
  { value: 'Under Construction', label: 'Under Construction', icon: Hammer },
  { value: 'Resale', label: 'Resale', icon: Repeat },
  { value: 'Sold', label: 'Sold', icon: BadgeCheck },
];

const DOWNPAYMENT_TERM_OPTIONS = [
  'Spot Cash',
  '6 Months',
  '12 Months',
  '18 Months',
  '24 Months',
  '36 Months',
];

const LOAN_TERM_OPTIONS = ['5 Years', '10 Years', '15 Years', '20 Years', '25 Years'];

const Req = () => <span className="text-[#FF6B6B]" aria-hidden="true">*</span>;

/**
 * Step 1: Basic Details & Pricing
 */
export default function ListingStepIdentityPricing({
  formData,
  setFormData,
  setIsDirty,
  propertyTypes = [],
  onPriceChange,
  onPriceFocus,
  onPriceBlur,
  onUploadBankLogo,
}) {
  const [showBreakdown, setShowBreakdown] = useState(
    Boolean(
      formData.paymentBreakdown?.reservationFee ||
        formData.paymentBreakdown?.downpayment ||
        formData.association_fee
    )
  );

  const updateField = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const updateBreakdown = (patch) => {
    setIsDirty?.(true);
    setFormData((prev) => ({
      ...prev,
      paymentBreakdown: {
        ...(prev.paymentBreakdown || {}),
        ...patch,
      },
    }));
  };

  const selectedCategory = formData.propertyCategory || 'Residential';

  const filteredPropertyTypes = useMemo(() => {
    const categoryDefaults = CATEGORY_TO_TYPES[selectedCategory] || [];
    const apiNames = Array.isArray(propertyTypes)
      ? propertyTypes.map((pt) => pt.name || pt.property_type).filter(Boolean)
      : [];
    const commonNames = Array.isArray(COMMON_PROPERTY_TYPES)
      ? COMMON_PROPERTY_TYPES.map((pt) =>
          typeof pt === 'string' ? pt : pt.label || pt.value
        ).filter(Boolean)
      : [];

    const merged = Array.from(new Set([...categoryDefaults, ...apiNames, ...commonNames]));
    if (selectedCategory === 'Land') {
      return merged.filter((name) => /lot|land|farm|beach/i.test(name));
    }
    if (selectedCategory === 'Commercial') {
      return merged.filter((name) => /commercial|office|retail|building|shop/i.test(name));
    }
    if (selectedCategory === 'Industrial') {
      return merged.filter((name) => /warehouse|factory|industrial/i.test(name));
    }
    return categoryDefaults.length > 0 ? categoryDefaults : merged;
  }, [selectedCategory, propertyTypes]);

  const isRental = formData.transaction_type === 'For Rent';
  const numericPrice = Number(String(formData.price || '').replace(/[^0-9.]/g, '')) || 0;

  const estimatedMonthlyAmort = useMemo(() => {
    if (!numericPrice || isRental) return 0;
    const dpRaw = String(formData.paymentBreakdown?.downpayment || '20').replace(/[^0-9.]/g, '');
    const dpValue = Number(dpRaw) || 20;
    const principal =
      dpValue <= 100
        ? numericPrice * (1 - dpValue / 100)
        : Math.max(0, numericPrice - dpValue);
    const years =
      Number(String(formData.paymentBreakdown?.loanTerm || '15').replace(/[^0-9]/g, '')) || 15;
    const monthlyRate = 0.075 / 12;
    const months = years * 12;
    if (!principal || !months) return 0;
    const factor = Math.pow(1 + monthlyRate, months);
    return Math.round((principal * monthlyRate * factor) / (factor - 1));
  }, [
    numericPrice,
    isRental,
    formData.paymentBreakdown?.downpayment,
    formData.paymentBreakdown?.loanTerm,
  ]);

  const partneredBanks = Array.isArray(formData.partneredBanks)
    ? formData.partneredBanks
    : [];

  const handleTogglePartneredBank = (bankName) => {
    if (!bankName) return;
    const alreadyAdded = partneredBanks.some((b) => b.bankName === bankName);
    if (alreadyAdded) {
      updateField({
        partneredBanks: partneredBanks.filter((b) => b.bankName !== bankName),
      });
    } else {
      updateField({
        partneredBanks: [
          ...partneredBanks,
          {
            bankName,
            logoUrl: '',
          },
        ],
      });
    }
  };

  const handleClearAllPartneredBanks = () => {
    updateField({ partneredBanks: [] });
  };

  const handleRemovePartneredBank = (bankName) => {
    updateField({
      partneredBanks: partneredBanks.filter((b) => b.bankName !== bankName),
    });
  };

  const titleValue = formData.title || '';
  const titleNearLimit = titleValue.length >= Math.floor(TITLE_MAX * 0.9);
  const activeCategoryMeta = PROPERTY_CATEGORIES.find((c) => c.value === selectedCategory);
  const activeStatusMeta = PROPERTY_STATUSES.find(
    (s) => s.value === (formData.propertyStatus || 'Ready for Occupancy')
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Basic Details */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
              <Tag className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1E293B]">
                Basic Details
              </CardTitle>
              <CardDescription className="text-sm text-[#64748B]">
                Give your listing a clear title, category, and current availability.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            {/* Reference Code & Listing Title */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="reference-code" className="text-sm font-semibold text-[#1E293B]">
                  Reference Code
                </FieldLabel>
                <div
                  id="reference-code"
                  className="h-11 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="size-4 text-[#64748B] shrink-0" />
                    <span
                      className={cn(
                        'truncate font-medium',
                        formData.listing_id ? 'text-[#1E293B]' : 'text-[#64748B]'
                      )}
                    >
                      {formData.listing_id || 'Auto-generated on save'}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white text-[#0F766E] border-[#0F766E]/25 shrink-0"
                  >
                    Auto
                  </Badge>
                </div>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="listing-title" className="text-sm font-semibold text-[#1E293B]">
                  Listing Title <Req />
                </FieldLabel>
                <InputGroup className="h-11 bg-white border-[#E2E8F0] rounded-lg">
                  <InputGroupInput
                    id="listing-title"
                    type="text"
                    maxLength={TITLE_MAX}
                    placeholder="e.g. Modern 3-Bedroom House in Ayala Alabang"
                    value={titleValue}
                    onChange={(e) => updateField({ title: e.target.value })}
                    className="text-sm text-[#1E293B]"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText
                      className={cn(
                        'text-xs tabular-nums',
                        titleNearLimit ? 'text-[#FF6B6B] font-semibold' : 'text-[#64748B]'
                      )}
                    >
                      {titleValue.length} / {TITLE_MAX}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>

            {/* Transaction Type (For Sale, For Rent, Foreclosure) */}
            <Field>
              <FieldLabel className="text-sm font-semibold text-[#1E293B]">
                Transaction Type <Req />
              </FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                {TRANSACTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = formData.transaction_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField({ transaction_type: type.value })}
                      className={cn(
                        'relative min-h-11 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2',
                        isActive ? 'text-white' : 'text-[#475569] hover:text-[#1E293B]'
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="transaction-type-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                          className="absolute inset-0 rounded-lg bg-[#0F766E] shadow-xs"
                        />
                      )}
                      <Icon className="size-4 relative z-10 shrink-0" />
                      <span className="relative z-10">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Property Category, Property Type, Property Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="property-category" className="text-sm font-semibold text-[#1E293B]">
                  Property Category
                </FieldLabel>
                <FormSelect
                  id="property-category"
                  value={selectedCategory}
                  icon={activeCategoryMeta?.icon || Home}
                  placeholder="Select category"
                  options={PROPERTY_CATEGORIES}
                  onValueChange={(nextCat) => {
                    const firstType = (CATEGORY_TO_TYPES[nextCat] || [])[0] || 'House & Lot';
                    updateField({
                      propertyCategory: nextCat,
                      property_type: firstType,
                    });
                  }}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="property-type" className="text-sm font-semibold text-[#1E293B]">
                  Property Type <Req />
                </FieldLabel>
                <FormSelect
                  id="property-type"
                  value={formData.property_type || 'House & Lot'}
                  options={filteredPropertyTypes}
                  placeholder="Select property type"
                  onValueChange={(nextName) => {
                    const matched = propertyTypes.find(
                      (pt) => (pt.name || pt.property_type) === nextName
                    );
                    updateField({
                      property_type: nextName,
                      property_type_id: matched?.id || formData.property_type_id || 1,
                    });
                  }}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="property-status" className="text-sm font-semibold text-[#1E293B]">
                  Property Status
                </FieldLabel>
                <FormSelect
                  id="property-status"
                  value={formData.propertyStatus || 'Ready for Occupancy'}
                  icon={activeStatusMeta?.icon || CheckCircle2}
                  placeholder="Select availability status"
                  options={PROPERTY_STATUSES}
                  onValueChange={(nextStatus) =>
                    updateField({
                      propertyStatus: nextStatus,
                      property_condition: nextStatus,
                    })
                  }
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2: Pricing & Partnered Banks */}
      <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center">
                <Banknote className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1E293B]">
                  Pricing & Partnered Banks
                </CardTitle>
                <CardDescription className="text-sm text-[#64748B]">
                  Set the price and add any partnered banks or housing lenders.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-[#E2E8F0]" />

        <CardContent className="pt-5">
          <FieldGroup className="gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="listing-price" className="text-sm font-semibold text-[#1E293B]">
                  {isRental ? 'Monthly Rent' : 'Selling Price'} (PHP) <Req />
                </FieldLabel>
                <Input
                  id="listing-price"
                  type="text"
                  inputMode="decimal"
                  maxLength={18}
                  placeholder={isRental ? 'e.g. 45,000' : 'e.g. 12,500,000'}
                  value={formData.price || ''}
                  onChange={onPriceChange}
                  onFocus={onPriceFocus}
                  onBlur={onPriceBlur}
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-base font-semibold text-[#1E293B]"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="price-per-sqm" className="text-sm font-semibold text-[#1E293B]">
                  Price per Sqm (PHP)
                </FieldLabel>
                <Input
                  id="price-per-sqm"
                  type="text"
                  inputMode="decimal"
                  maxLength={18}
                  placeholder="e.g. 185,000"
                  value={formData.pricePerSqm || ''}
                  onChange={(e) =>
                    updateField({ pricePerSqm: e.target.value.replace(/[^0-9.,]/g, '') })
                  }
                  className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1E293B]"
                />
              </Field>
            </div>

            {/* Partnered Banks Selector + Logo Cards */}
            <Field>
              <FieldLabel htmlFor="partnered-bank-picker" className="text-sm font-semibold text-[#1E293B]">
                Partnered Banks
              </FieldLabel>
              <PartneredBankMultiSelect
                id="partnered-bank-picker"
                selectedBankNames={partneredBanks.map((b) => b.bankName)}
                onToggleBank={handleTogglePartneredBank}
                onClearAll={handleClearAllPartneredBanks}
              />

              {partneredBanks.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  <AnimatePresence initial={false}>
                    {partneredBanks.map((bank) => (
                      <motion.div
                        key={bank.bankName}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="p-2.5 px-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center gap-3"
                      >
                        {bank.logoUrl ? (
                          <div className="size-10 rounded-lg border border-[#E2E8F0] bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={bank.logoUrl}
                              alt={`${bank.bankName} logo`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="size-10 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center shrink-0 text-[#64748B]"
                            title="No bank logo uploaded"
                          >
                            <Landmark className="size-4 text-[#0F766E]" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-[#1E293B] truncate block">
                            {bank.bankName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label
                            className="min-h-9 px-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#0F766E] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Upload bank logo"
                          >
                            <Upload className="size-3.5" />
                            <span>{bank.logoUrl ? 'Change' : 'Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUploadBankLogo?.(bank.bankName, file);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${bank.bankName}`}
                            onClick={() => handleRemovePartneredBank(bank.bankName)}
                            className="size-9 text-[#64748B] hover:text-[#FF6B6B] cursor-pointer"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Field>

            {/* Collapsible Payment Breakdown */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setShowBreakdown((prev) => !prev)}
                className="w-full min-h-11 px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="size-4 text-[#0F766E]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      Payment Breakdown
                    </p>
                    <p className="text-xs text-[#64748B]">
                      Reservation fee, downpayment, monthly estimate, and dues
                    </p>
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: showBreakdown ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="size-4 text-[#475569]" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {showBreakdown && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <Separator className="bg-[#E2E8F0]" />
                    <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="reservation-fee" className="text-sm font-semibold text-[#1E293B]">
                          Reservation Fee (PHP)
                        </FieldLabel>
                        <Input
                          id="reservation-fee"
                          type="text"
                          maxLength={18}
                          placeholder="e.g. 50,000"
                          value={formData.paymentBreakdown?.reservationFee || ''}
                          onChange={(e) => updateBreakdown({ reservationFee: e.target.value })}
                          className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="downpayment" className="text-sm font-semibold text-[#1E293B]">
                          Downpayment (% or PHP)
                        </FieldLabel>
                        <Input
                          id="downpayment"
                          type="text"
                          maxLength={18}
                          placeholder="e.g. 20%"
                          value={formData.paymentBreakdown?.downpayment || ''}
                          onChange={(e) => updateBreakdown({ downpayment: e.target.value })}
                          className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="downpayment-term" className="text-sm font-semibold text-[#1E293B]">
                          Downpayment Term
                        </FieldLabel>
                        <FormSelect
                          id="downpayment-term"
                          value={formData.paymentBreakdown?.downpaymentTerm || ''}
                          options={DOWNPAYMENT_TERM_OPTIONS}
                          placeholder="Select downpayment term"
                          allowClear
                          onValueChange={(val) => updateBreakdown({ downpaymentTerm: val })}
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="loan-term" className="text-sm font-semibold text-[#1E293B]">
                          Loan Term
                        </FieldLabel>
                        <FormSelect
                          id="loan-term"
                          value={formData.paymentBreakdown?.loanTerm || '15 Years'}
                          options={LOAN_TERM_OPTIONS}
                          placeholder="Select loan term"
                          onValueChange={(val) => updateBreakdown({ loanTerm: val })}
                        />
                      </Field>

                      <Field>
                        <div className="flex items-center justify-between gap-2">
                          <FieldLabel htmlFor="monthly-amortization" className="text-sm font-semibold text-[#1E293B]">
                            Monthly Amortization (PHP)
                          </FieldLabel>
                          {estimatedMonthlyAmort > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateBreakdown({
                                  monthlyAmortization: estimatedMonthlyAmort.toLocaleString(),
                                })
                              }
                              className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="size-3" />
                              Use ~₱{estimatedMonthlyAmort.toLocaleString()}
                            </button>
                          )}
                        </div>
                        <Input
                          id="monthly-amortization"
                          type="text"
                          maxLength={18}
                          placeholder={
                            estimatedMonthlyAmort > 0
                              ? `Estimated: ₱${estimatedMonthlyAmort.toLocaleString()}`
                              : 'e.g. 72,500'
                          }
                          value={formData.paymentBreakdown?.monthlyAmortization || ''}
                          onChange={(e) => updateBreakdown({ monthlyAmortization: e.target.value })}
                          className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="hoa-fees" className="text-sm font-semibold text-[#1E293B]">
                          HOA Fees (Monthly PHP)
                        </FieldLabel>
                        <Input
                          id="hoa-fees"
                          type="text"
                          maxLength={18}
                          placeholder="e.g. 3,500"
                          value={formData.association_fee || ''}
                          onChange={(e) =>
                            updateField({
                              association_fee: e.target.value,
                              associationFee: e.target.value,
                            })
                          }
                          className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                        />
                      </Field>

                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="move-in-fees" className="text-sm font-semibold text-[#1E293B]">
                          Move-in Fees (PHP)
                        </FieldLabel>
                        <Input
                          id="move-in-fees"
                          type="text"
                          maxLength={18}
                          placeholder="e.g. 25,000"
                          value={formData.paymentBreakdown?.moveInFees || ''}
                          onChange={(e) => updateBreakdown({ moveInFees: e.target.value })}
                          className="h-11 bg-white border-[#E2E8F0] rounded-lg text-sm"
                        />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
