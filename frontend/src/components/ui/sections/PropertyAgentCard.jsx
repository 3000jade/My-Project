import React from 'react';
import {
  User,
  Phone,
  Mail,
  ArrowUpRight,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated Agent & Conversion Actions Card for PropertyListingView.
 * Groups listing advisor info with inline Schedule Viewing and Inquire Now buttons,
 * strictly adhering to DESIGN.md tokens.
 */
export default function PropertyAgentCard({
  agent = {},
  onScheduleViewing,
  onContactAgent,
  onOpenAgentModal,
}) {
  return (
    <Card className="bg-white border-[#E2E8F0] rounded-xl shadow-xs">
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenAgentModal}
            aria-label={`View verified advisor profile for ${agent.name || 'Listing Advisor'}`}
            className="group flex flex-col items-center text-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] cursor-pointer"
          >
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={agent.name}
                referrerPolicy="no-referrer"
                className="size-24 rounded-full object-cover border border-[#E2E8F0] group-hover:ring-2 group-hover:ring-[#0F766E]/40 transition-all shrink-0"
              />
            ) : (
              <div className="size-24 rounded-full bg-[#CCFBF1] border border-[#E2E8F0] group-hover:ring-2 group-hover:ring-[#0F766E]/40 transition-all flex items-center justify-center text-[#0F766E] shrink-0">
                <User className="size-10" />
              </div>
            )}
            <span className="text-base font-bold text-[#1E293B] group-hover:text-[#0F766E] transition-colors">
              {agent.name}
            </span>
          </button>

          <div className="min-w-0 w-full space-y-0.5">
            <p className="text-xs text-[#64748B]">
              Assigned by{' '}
              <button
                type="button"
                onClick={onOpenAgentModal}
                data-testid="reso-list-office-name"
                className="font-semibold text-[#0F766E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-sm cursor-pointer"
              >
                {agent.brokerage}
              </button>
            </p>
            {agent.license && (
              <p className="text-xs text-[#0F766E]">{agent.license}</p>
            )}
          </div>
        </div>

        {(agent.phone || agent.email || agent.messengerUrl || agent.facebookUrl || agent.whatsapp) && (
          <div className="flex flex-col gap-2 py-2 border-y border-[#E2E8F0] text-xs">
            {agent.phone && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748B]">Contact Number</span>
                <a
                  href={`tel:${agent.phone}`}
                  className="font-semibold text-[#1E293B] hover:text-[#0F766E] inline-flex items-center gap-1"
                >
                  <Phone className="size-3.5 text-[#0F766E]" aria-hidden="true" />
                  <span>{agent.phone}</span>
                </a>
              </div>
            )}
            {agent.email && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748B]">Contact Email</span>
                <a
                  href={`mailto:${agent.email}`}
                  className="font-semibold text-[#1E293B] hover:text-[#0F766E] inline-flex items-center gap-1 truncate max-w-[190px]"
                >
                  <Mail className="size-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
                  <span className="truncate">{agent.email}</span>
                </a>
              </div>
            )}
            {(agent.messengerUrl || agent.facebookUrl || agent.whatsapp) && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {agent.messengerUrl && (
                  <a
                    href={agent.messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-[#0F766E] hover:text-[#0F766E] font-medium transition-colors"
                  >
                    <MessageCircle className="size-3 text-[#0F766E]" aria-hidden="true" />
                    Messenger
                  </a>
                )}
                {agent.facebookUrl && (
                  <a
                    href={agent.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-[#0F766E] hover:text-[#0F766E] font-medium transition-colors"
                  >
                    <Globe className="size-3 text-[#0F766E]" aria-hidden="true" />
                    Facebook
                  </a>
                )}
                {agent.whatsapp && (
                  <a
                    href={
                      /^https?:\/\//i.test(agent.whatsapp)
                        ? agent.whatsapp
                        : `https://wa.me/${String(agent.whatsapp).replace(/\D/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:border-[#0F766E] hover:text-[#0F766E] font-medium transition-colors"
                  >
                    <Phone className="size-3 text-[#0F766E]" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onScheduleViewing}
            aria-label="Schedule Viewing"
            className="w-full min-h-11 rounded-full px-3 justify-between bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold normal-case tracking-normal"
          >
            <span className="truncate">Schedule Viewing</span>
            <span className="size-6 rounded-full bg-[#FF8559] text-white flex items-center justify-center shrink-0">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onContactAgent}
            className="w-full min-h-11 rounded-full px-3 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] text-xs font-semibold normal-case tracking-normal"
          >
            <Mail data-icon="inline-start" className="text-[#FF8559]" />
            <span className="truncate">Inquire Now</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
