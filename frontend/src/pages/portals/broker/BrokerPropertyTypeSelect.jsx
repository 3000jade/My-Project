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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../components/ui/card';

export const PRIMARY_PROPERTY_TYPES = [
  {
    id: 'residentialLot',
    name: 'Subdivision Lot',
    icon: MapPin,
  },
  {
    id: 'houseAndLot',
    name: 'House and Lot',
    icon: Home,
  },
  {
    id: 'condominium',
    name: 'Condominium',
    icon: Building2,
  },
];

export const SECONDARY_PROPERTY_TYPES = [
  { id: 'townhouse', name: 'Townhouse', icon: Building },
  { id: 'commercial', name: 'Commercial', icon: Store },
  { id: 'apartment', name: 'Apartment', icon: Layers },
  { id: 'villa', name: 'Villa', icon: Palmtree },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse },
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

      {/* Main Container Card using shadcn */}
      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <CardHeader className="text-center max-w-2xl mx-auto flex flex-col gap-2 pt-8 pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#1E293B] dark:text-slate-100 font-display">
            What type of property are you listing?
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {COMMON_PROPERTY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  role="button"
                  tabIndex={0}
                  aria-label={type.name}
                  data-testid={`property-type-option-${type.id}`}
                  onClick={() => handleSelectType(type.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectType(type.id);
                    }
                  }}
                  className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0F766E] hover:shadow-md transition-all duration-200 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                >
                  <div className="size-16 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 flex items-center justify-center text-[#0F766E] dark:text-teal-400 group-hover:bg-[#0F766E] group-hover:text-white group-hover:border-[#0F766E] transition-all duration-200 mb-3.5 shadow-2xs">
                    <Icon className="size-8" />
                  </div>
                  <CardTitle className="text-sm sm:text-base font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#0F766E] dark:group-hover:text-teal-400 transition-colors">
                    {type.name}
                  </CardTitle>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
