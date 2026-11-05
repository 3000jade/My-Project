import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import PageHeader from '../../../components/dashboard/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../components/ui/card';
import {
  PROPERTY_CATEGORIES,
  PRIMARY_PROPERTY_TYPES,
  SECONDARY_PROPERTY_TYPES,
  COMMON_PROPERTY_TYPES,
} from './components/property-form/propertyTypeConfig';

export {
  PRIMARY_PROPERTY_TYPES,
  SECONDARY_PROPERTY_TYPES,
  COMMON_PROPERTY_TYPES,
};

export default function BrokerPropertyTypeSelect() {
  const navigate = useNavigate();
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenCategoryId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectType = (typeId) => {
    setOpenCategoryId(null);
    navigate(`/broker/properties/create?type=${encodeURIComponent(typeId)}`);
  };

  const toggleCategoryDropdown = (categoryId) => {
    setOpenCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-8 max-w-[1320px] mx-auto pb-16 font-sans"
      data-testid="broker-property-type-select"
    >
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

      <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1E293B] dark:text-slate-100 font-display">
          What type of property are you listing?
        </h2>
        <p className="text-sm text-[#64748B] dark:text-slate-400">
          Select a category below to choose the specific asset type for your property listing.
        </p>
      </div>

      {/* 4-Grid Category Cards with Embedded Dropdown Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {PROPERTY_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;
          const isOpen = openCategoryId === category.id;

          return (
            <Card
              key={category.id}
              data-testid={`category-card-${category.id}`}
              className={`relative bg-white dark:bg-slate-900 border transition-all duration-200 rounded-2xl shadow-xs overflow-visible ${
                isOpen
                  ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-md'
                  : 'border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <CardHeader className="flex flex-col items-center text-center p-6 pb-4 gap-3">
                <div className="size-16 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 flex items-center justify-center text-[#0F766E] dark:text-teal-400 shadow-2xs">
                  <CategoryIcon className="size-8" />
                </div>
                <CardTitle className="text-lg font-bold text-[#1E293B] dark:text-slate-100 font-display">
                  {category.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 pt-0 pb-6">
                {/* Dropdown Box Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    data-testid={`category-dropdown-trigger-${category.id}`}
                    onClick={() => toggleCategoryDropdown(category.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-[#0F766E] text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-100 shadow-2xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                  >
                    <span className="truncate">
                      Select {category.title.split(' ')[0]} Type...
                    </span>
                    <ChevronDown
                      className={`size-4 text-[#64748B] dark:text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
                        isOpen ? 'rotate-180 text-[#0F766E]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Box Menu */}
                  {isOpen && (
                    <div
                      role="listbox"
                      data-testid={`category-dropdown-menu-${category.id}`}
                      className="absolute z-30 left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-1.5 flex flex-col gap-1 max-h-[340px] overflow-y-auto"
                    >
                      {category.types.map((type) => {
                        const ItemIcon = type.icon;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            data-testid={`property-type-option-${type.id}`}
                            onClick={() => handleSelectType(type.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectType(type.id);
                              }
                            }}
                            className="group flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-teal-50/70 dark:hover:bg-teal-950/40 transition-colors cursor-pointer w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0F766E]"
                          >
                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#64748B] dark:text-slate-400 group-hover:text-[#0F766E] group-hover:border-teal-200 shrink-0">
                              <ItemIcon className="size-4" />
                            </div>
                            <span className="text-xs font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#0F766E] transition-colors truncate">
                              {type.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
