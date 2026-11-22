import React from 'react';
import {
  User,
  Phone,
  Mail,
  ArrowUpRight,
  FileText,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated Agent & Conversion Actions Card for PropertyListingView.
 * Groups listing advisor info with Schedule Viewing and Inquire Now buttons,
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
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          <span className="w-4 h-0.5 bg-[#FF6B6B] rounded-full shrink-0" aria-hidden="true" />
          <span>Listing Advisor</span>
        </div>
        <CardTitle className="text-xl font-bold text-[#1E293B] tracking-tight">
          Property Contact<span className="text-[#FF6B6B]">.</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {agent.avatar ? (
            <img
              src={agent.avatar}
              alt={agent.name}
              referrerPolicy="no-referrer"
              className="size-12 rounded-full object-cover border border-[#E2E8F0] shrink-0"
            />
          ) : (
            <div className="size-12 rounded-full bg-[#CCFBF1] border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shrink-0">
              <User className="size-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#1E293B] truncate">{agent.name}</p>
            <p className="text-xs text-[#64748B] truncate">
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
              <p className="text-xs text-[#0F766E] truncate">{agent.license}</p>
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
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={onScheduleViewing}
            aria-label="Schedule Viewing"
            className="w-full min-h-11 rounded-full pl-4 pr-2 justify-between bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold normal-case tracking-normal"
          >
            <span>Schedule Viewing</span>
            <span className="size-7 rounded-full bg-[#FF6B6B] text-[#1E293B] flex items-center justify-center shrink-0">
              <ArrowUpRight className="size-4" />
            </span>
          </Button>

          <Button
            type="button"
            variant="coral"
            size="lg"
            onClick={onContactAgent}
            className="w-full min-h-11 rounded-full bg-[#FF6B6B] hover:bg-[#EE5A5A] text-[#1E293B] text-xs font-bold normal-case tracking-normal"
          >
            <Mail data-icon="inline-start" />
            Inquire Now
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onOpenAgentModal}
            className="w-full min-h-11 rounded-lg text-xs text-[#0F766E] normal-case tracking-normal"
          >
            <FileText data-icon="inline-start" />
            View Verified Advisor Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
