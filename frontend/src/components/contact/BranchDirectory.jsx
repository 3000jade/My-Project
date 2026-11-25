import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  MessageCircle,
  Search,
  Building2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { extractBranchRegions } from '@/utils/contactHelpers';

export default function BranchDirectory({
  branches = [],
  selectedBranchId = '',
  onSelectBranch,
  isLoading = false,
}) {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const regions = useMemo(() => extractBranchRegions(branches), [branches]);
  const showSearch = branches.length > 3;

  const filteredBranches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesRegion = activeRegion === 'ALL' || branch.region === activeRegion;
      if (!matchesRegion) return false;
      if (!query) return true;
      return (
        branch.title.toLowerCase().includes(query) ||
        branch.address.toLowerCase().includes(query) ||
        branch.region.toLowerCase().includes(query)
      );
    });
  }, [branches, activeRegion, searchQuery]);

  return (
    <section aria-labelledby="office-branches-heading" className="pt-12">
      <div className="text-center max-w-2xl mx-auto mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 justify-center text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
          <Building2 className="size-4" aria-hidden="true" />
          <span>Visit or Call a Branch</span>
        </div>
        <h2
          id="office-branches-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E293B]"
        >
          Our Office Branches
        </h2>
        <p className="text-sm text-[#64748B]">
          Choose the branch closest to you to call directly, open directions, or send your message straight to that office.
        </p>
      </div>

      {!isLoading && (regions.length > 1 || showSearch) && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          {regions.length > 1 && (
            <div
              role="group"
              aria-label="Filter branches by area"
              className="flex flex-wrap items-center gap-2"
            >
              <Button
                type="button"
                variant={activeRegion === 'ALL' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveRegion('ALL')}
                className="min-h-11 rounded-full normal-case tracking-normal text-sm"
              >
                All Branches ({branches.length})
              </Button>
              {regions.map((region) => (
                <Button
                  key={region}
                  type="button"
                  variant={activeRegion === region ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setActiveRegion(region)}
                  className="min-h-11 rounded-full normal-case tracking-normal text-sm"
                >
                  {region}
                </Button>
              ))}
            </div>
          )}

          {showSearch && (
            <div className="relative w-full md:w-72">
              <Search
                className="size-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search branch or city..."
                aria-label="Search branch or city"
                className="h-11 pl-10 bg-white border-[#E2E8F0] text-[#1E293B] rounded-lg focus-visible:outline-none focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-6 flex flex-col gap-4">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <Card className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-8 text-center">
          <p className="text-sm text-[#64748B] mb-4">
            No branches match your current filter.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 normal-case tracking-normal"
            onClick={() => {
              setActiveRegion('ALL');
              setSearchQuery('');
            }}
          >
            Show All Branches
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <Card
                key={branch.id}
                className={`bg-white border rounded-xl shadow-xs flex flex-col justify-between transition-shadow hover:shadow-md ${
                  isSelected ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#E2E8F0]'
                }`}
              >
                <CardHeader className="p-6 pb-4 flex flex-col gap-4">
                  {branch.photoUrl && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#F1F5F9]">
                      <img
                        src={branch.photoUrl}
                        alt={branch.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-semibold tracking-tight text-[#1E293B]">
                      {branch.title}
                    </CardTitle>
                    {branch.isHeadquarters && (
                      <Badge className="bg-teal-50 text-[#0F766E] border border-teal-200 rounded-full shrink-0">
                        Main Office
                      </Badge>
                    )}
                  </div>
                  {branch.region && (
                    <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
                      {branch.region}
                    </span>
                  )}
                </CardHeader>

                <CardContent className="px-6 pb-4 flex flex-col gap-3 text-sm text-[#64748B]">
                  {branch.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-[#0F766E] shrink-0 mt-1" aria-hidden="true" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                      {branch.telHref ? (
                        <a
                          href={branch.telHref}
                          className="text-[#1E293B] font-medium hover:text-[#0F766E] underline-offset-4 hover:underline min-h-11 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                        >
                          {branch.phone}
                        </a>
                      ) : (
                        <span className="text-[#1E293B] font-medium">{branch.phone}</span>
                      )}
                    </div>
                  )}
                  {branch.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                      <span>{branch.hours}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-2 items-stretch">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onSelectBranch?.(branch)}
                    className="w-full min-h-11 rounded-lg normal-case tracking-normal text-sm font-semibold border-[#E2E8F0] hover:border-[#0F766E] hover:text-[#0F766E]"
                  >
                    <Send className="size-4" aria-hidden="true" />
                    <span>{isSelected ? 'Selected for Your Message' : 'Message This Branch'}</span>
                  </Button>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {branch.mapUrl && (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                      >
                        <span>View on Map</span>
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    )}
                    {branch.whatsappUrl && (
                      <a
                        href={branch.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 rounded-sm"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        <span>Branch WhatsApp</span>
                      </a>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
