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
} from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui';

export const COMMON_PROPERTY_TYPES = [
  { id: 'House & Lot', name: 'House & Lot', icon: Home },
  { id: 'Condominium', name: 'Condominium', icon: Building2 },
  { id: 'Townhouse', name: 'Townhouse', icon: Building },
  { id: 'Lot / Land', name: 'Lot / Land', icon: MapPin },
  { id: 'Commercial', name: 'Commercial', icon: Store },
  { id: 'Apartment', name: 'Apartment', icon: Layers },
  { id: 'Villa', name: 'Villa', icon: Palmtree },
  { id: 'Warehouse', name: 'Warehouse', icon: Warehouse },
];

export default function BrokerPropertyTypeSelect() {
  const navigate = useNavigate();

  const handleSelectType = (typeName) => {
    navigate(`/broker/properties/create?type=${encodeURIComponent(typeName)}`);
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16 font-sans" data-testid="broker-property-type-select">
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
            <ArrowLeft className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
            <span>Back to Properties</span>
          </Link>
        }
      />

      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-lg mx-auto mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] dark:text-slate-100 tracking-tight font-display">
            What type of property are you listing?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1.5">
            Select an asset type to tailor the specifications, room arrangements, and cadastral requirements.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {COMMON_PROPERTY_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                role="button"
                aria-label={type.name}
                onClick={() => handleSelectType(type.name)}
                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-[#0F766E] hover:shadow-md transition-all duration-200 cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 shadow-2xs flex items-center justify-center text-[#0F766E] dark:text-teal-400 group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-[#0F766E] transition-all duration-200 mb-4">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="text-sm sm:text-base font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#0F766E] dark:group-hover:text-teal-400 transition-colors">
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
