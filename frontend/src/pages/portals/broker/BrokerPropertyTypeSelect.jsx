import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Building2,
  Building,
  MapPin,
  Store,
  Layers,
  Palmtree,
  Warehouse,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export const PRIMARY_PROPERTY_TYPES = [
  {
    id: 'residentialLot',
    name: 'Subdivision Lot',
    badge: 'Vacant Land',
    badgeVariant: 'default',
    tagline: 'Vacant residential plot, phase cut, or corner lot in a master-planned community.',
    specs: ['Lot Area (sqm)', 'Road Frontage', 'Cadastral Lot Ref', 'Clean Title (TCT)'],
    icon: MapPin,
  },
  {
    id: 'houseAndLot',
    name: 'House and Lot',
    badge: 'Single-Family',
    badgeVariant: 'coral',
    tagline: 'Single-family home, luxury villa, or multi-storey detached residential home.',
    specs: ['Dual Area (Lot + Floor)', 'Bedrooms & Baths', 'Carport & Yard', 'Staff Quarters'],
    icon: Home,
  },
  {
    id: 'condominium',
    name: 'Condominium',
    badge: 'Vertical Strata',
    badgeVariant: 'outline',
    tagline: 'High-rise residential suite, studio, or penthouse within a strata building.',
    specs: ['Usable Floor Area', 'Tower & Floor Level', 'Balcony & View', 'Strata Title (CCT)'],
    icon: Building2,
  },
];

export const SECONDARY_PROPERTY_TYPES = [
  { id: 'townhouse', name: 'Townhouse', icon: Building, badge: 'Attached Home' },
  { id: 'commercial', name: 'Commercial', icon: Store, badge: 'Retail / Office' },
  { id: 'apartment', name: 'Apartment', icon: Layers, badge: 'Multi-Unit' },
  { id: 'villa', name: 'Villa', icon: Palmtree, badge: 'Resort / Estate' },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, badge: 'Industrial' },
];

export const COMMON_PROPERTY_TYPES = [
  ...PRIMARY_PROPERTY_TYPES,
  ...SECONDARY_PROPERTY_TYPES,
];

export default function BrokerPropertyTypeSelect() {
  const navigate = useNavigate();

  const handleSelectType = (typeId) => {
    navigate(`/broker/properties/create?type=${encodeURIComponent(typeId)}`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto pb-16 font-sans" data-testid="broker-property-type-select">
      <PageHeader
        title="Select Property Type"
        subtitle="Choose the category of property you want to list. You can refine specific architectural details in the intake studio."
        breadcrumbs={[
          { label: 'Properties', to: '/broker/properties' },
          { label: 'Select Type' },
        ]}
        actions={
          <Link
            to="/broker/properties"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-[#1E293B] dark:text-slate-100 shadow-2xs transition-colors"
          >
            <ArrowLeft className="size-4 text-[#64748B] dark:text-slate-400" />
            <span>Back to Properties</span>
          </Link>
        }
      />

      {/* Main Container Card using shadcn composition */}
      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <CardHeader className="text-center max-w-2xl mx-auto flex flex-col gap-2 pb-8">
          <div className="inline-flex items-center justify-center gap-1.5 mx-auto">
            <Badge variant="coral">
              <Sparkles className="size-3" />
              <span>Tailored Intake Studio</span>
            </Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#1E293B] dark:text-slate-100 font-display">
            What type of property are you listing?
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Selecting a property type activates tailored specifications, legal title requirements, and cadastral mapping fields.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          {/* Section: Primary Residential Assets */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
                  Primary Philippine Asset Classes
                </span>
                <Badge variant="secondary">Schema v1.0 Tailored</Badge>
              </div>
              <span className="text-xs text-[#64748B]">3 Core Layouts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRIMARY_PROPERTY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className="relative group border-[#E2E8F0] dark:border-slate-800 hover:border-[#0F766E] dark:hover:border-teal-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <CardHeader className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="size-14 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 flex items-center justify-center text-[#0F766E] dark:text-teal-400 group-hover:bg-[#0F766E] group-hover:text-white transition-all duration-200">
                          <Icon className="size-7" />
                        </div>
                        <Badge variant={type.badgeVariant}>{type.badge}</Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#0F766E] dark:group-hover:text-teal-400 transition-colors">
                        {type.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                        {type.tagline}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-2 pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {type.specs.map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 border-t border-[#F1F5F9] dark:border-slate-800/60">
                      <Button
                        type="button"
                        variant="default"
                        className="w-full justify-between"
                        onClick={() => handleSelectType(type.id)}
                        aria-label={`Select ${type.name}`}
                      >
                        <span>Select {type.name}</span>
                        <ChevronRight className="size-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section: Commercial & Other Asset Classes */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Commercial & Other Asset Classes
              </span>
              <span className="text-xs text-[#64748B]">Standard Layout</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {SECONDARY_PROPERTY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    role="button"
                    aria-label={type.name}
                    onClick={() => handleSelectType(type.id)}
                    className="group relative flex flex-col items-center justify-center p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-[#0F766E] hover:shadow-xs transition-all duration-200 cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                  >
                    <div className="size-12 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 shadow-2xs flex items-center justify-center text-[#0F766E] dark:text-teal-400 group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-[#0F766E] transition-all duration-200 mb-3">
                      <Icon className="size-6" />
                    </div>
                    <span className="text-sm font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#0F766E] dark:group-hover:text-teal-400 transition-colors">
                      {type.name}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
                      {type.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
