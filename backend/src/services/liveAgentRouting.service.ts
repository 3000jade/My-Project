import { AgentEligibilityService, type EligibilityResult } from './agentEligibility.service';
import { AgentPresenceService } from './agentPresence.service';
import { AgentService } from './agent.service';
import { PropertyService } from './property.service';
import { InquiryService } from './inquiry.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { publishInquiryEvent } from '../utils/inquiryStream';
import logger from '../utils/logger';

export const LIVE_AUTO_PASS_TIMEOUT_MS = 120_000;

export interface LiveAgentCardDTO {
  id: string;
  name: string;
  avatar: string | null;
  verified: true;
  online: true;
  matchReason: string;
  areas: string[];
  specialties: string[];
  isListingAgent: boolean;
  activeChats: number;
}

export interface LiveAgentRoutingContext {
  propertyId?: string;
  listingAgentId?: string;
  city?: string;
  district?: string;
  propertyType?: string;
  excludeAgentIds?: string[];
  limit?: number;
}

export interface ScoredLiveAgentCandidate {
  agent: LiveAgentCardDTO;
  score: number;
  matchReason: string;
}

interface PendingAutoPassEntry {
  timer: ReturnType<typeof setTimeout>;
  triedAgentIds: string[];
  context: LiveAgentRoutingContext;
}

const pendingAutoPassMap = new Map<string, PendingAutoPassEntry>();

function normalizeText(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function listMatchesTarget(items: string[], target: string): boolean {
  if (!target) return false;
  return items.some((entry) => {
    const clean = normalizeText(entry);
    return Boolean(clean && (clean.includes(target) || target.includes(clean)));
  });
}

export function scoreLiveAgentCandidate(
  candidate: {
    id: string;
    name: string;
    avatar?: string | null;
    areas?: string[];
    specialties?: string[];
    activeChats?: number;
  },
  context: LiveAgentRoutingContext
): ScoredLiveAgentCandidate {
  const areas = Array.isArray(candidate.areas) ? candidate.areas.filter(Boolean) : [];
  const specialties = Array.isArray(candidate.specialties) ? candidate.specialties.filter(Boolean) : [];
  const isListingAgent = Boolean(context.listingAgentId && candidate.id === context.listingAgentId);

  let score = 0;
  const matchedLabels: string[] = [];

  if (isListingAgent) {
    score += 100;
  }

  const targetCity = normalizeText(context.city);
  const targetDistrict = normalizeText(context.district);
  const areaMatched =
    (targetCity && listMatchesTarget(areas, targetCity)) ||
    (targetDistrict && listMatchesTarget(areas, targetDistrict));

  if (areaMatched) {
    score += 50;
    matchedLabels.push((context.city || context.district || areas[0] || '').trim());
  }

  const targetType = normalizeText(context.propertyType);
  if (targetType && listMatchesTarget(specialties, targetType)) {
    score += 30;
    matchedLabels.push((context.propertyType || specialties[0] || '').trim());
  }

  const matchReason = isListingAgent
    ? 'Listing Agent'
    : matchedLabels.filter(Boolean).join(' · ') || 'Available Specialist';

  return {
    agent: {
      id: candidate.id,
      name: candidate.name || 'Licensed Agent',
      avatar: candidate.avatar || null,
      verified: true,
      online: true,
      matchReason,
      areas,
      specialties,
      isListingAgent,
      activeChats: Number(candidate.activeChats) || 0,
    },
    score,
    matchReason,
  };
}

export class LiveAgentRoutingService {
  public static compareScoredCandidates(
    a: ScoredLiveAgentCandidate,
    b: ScoredLiveAgentCandidate
  ): number {
    if (b.score !== a.score) return b.score - a.score;
    if (a.agent.activeChats !== b.agent.activeChats) {
      return a.agent.activeChats - b.agent.activeChats;
    }
    return a.agent.id.localeCompare(b.agent.id);
  }

  public static async rankCandidates(
    rawAgents: any[],
    context: LiveAgentRoutingContext,
    deps?: {
      checkEligibility?: (agentId: string) => Promise<EligibilityResult>;
      isOnline?: (agentId: string) => boolean;
    }
  ): Promise<{ agents: LiveAgentCardDTO[]; onlineCount: number }> {
    const excludeSet = new Set((context.excludeAgentIds || []).map(String));
    const checkEligibility =
      deps?.checkEligibility ||
      ((id: string) => AgentEligibilityService.evaluate(id, 'receive_lead'));
    const isOnline = deps?.isOnline || ((id: string) => AgentPresenceService.isOnline(id));

    const onlineAgents = rawAgents.filter(
      (agent) => agent?.id && !excludeSet.has(String(agent.id)) && isOnline(String(agent.id))
    );

    const eligibleScored: ScoredLiveAgentCandidate[] = [];

    for (const agent of onlineAgents) {
      const eligibility = await checkEligibility(String(agent.id));
      if (!eligibility.allowed) continue;

      const meta = Array.isArray(agent.supporting_documents)
        ? agent.supporting_documents.find((d: any) => d && d._meta_type === 'agent_v2_metadata')
        : undefined;

      const areas = Array.from(
        new Set(
          [
            ...(Array.isArray(agent.service_areas) ? agent.service_areas : []),
            ...(Array.isArray(meta?.service_areas) ? meta.service_areas : []),
            ...(Array.isArray(agent.derivedAreas) ? agent.derivedAreas : []),
          ]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map((v) => v.trim())
        )
      );

      const specialties = Array.from(
        new Set(
          [
            ...(Array.isArray(agent.property_specialties) ? agent.property_specialties : []),
            ...(Array.isArray(meta?.property_specialties) ? meta.property_specialties : []),
            ...(Array.isArray(agent.derivedSpecialties) ? agent.derivedSpecialties : []),
          ]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map((v) => v.trim())
        )
      );

      eligibleScored.push(
        scoreLiveAgentCandidate(
          {
            id: String(agent.id),
            name: agent.name,
            avatar: agent.avatar || null,
            areas,
            specialties,
            activeChats: Number(agent.active_inquiries_count) || 0,
          },
          context
        )
      );
    }

    eligibleScored.sort(LiveAgentRoutingService.compareScoredCandidates);
    const limit = Math.max(1, context.limit || 5);
    return {
      agents: eligibleScored.slice(0, limit).map((item) => item.agent),
      onlineCount: eligibleScored.length,
    };
  }

  public static async getRecommendedLiveAgents(
    context: LiveAgentRoutingContext = {}
  ): Promise<{ agents: LiveAgentCardDTO[]; onlineCount: number }> {
    const resolvedContext: LiveAgentRoutingContext = { ...context };

    if (resolvedContext.propertyId && (!resolvedContext.listingAgentId || !resolvedContext.city || !resolvedContext.propertyType)) {
      try {
        const property = await PropertyService.findPropertyById(resolvedContext.propertyId, undefined, 'client');
        if (property) {
          resolvedContext.listingAgentId =
            resolvedContext.listingAgentId || property.agentId || property.listAgentKey || undefined;
          resolvedContext.city = resolvedContext.city || property.location?.city || undefined;
          resolvedContext.district =
            resolvedContext.district || property.location?.barangay || property.location?.subdivisionName || undefined;
          resolvedContext.propertyType =
            resolvedContext.propertyType || property.specs?.propertyType || undefined;
        }
      } catch {
        // Proceed gracefully with provided context
      }
    }

    const agents = await AgentService.listAgents({});

    // Enrich agents without explicit tags using their assigned published properties
    try {
      const { properties } = await PropertyService.listProperties({ standardStatus: 'Active', limit: 250 }, 'client');
      const propMap = new Map<string, { areas: Set<string>; types: Set<string> }>();
      for (const prop of properties) {
        const ownerId = prop.agentId || prop.listAgentKey;
        if (!ownerId) continue;
        if (!propMap.has(ownerId)) {
          propMap.set(ownerId, { areas: new Set(), types: new Set() });
        }
        const entry = propMap.get(ownerId)!;
        if (prop.location?.city) entry.areas.add(prop.location.city);
        if (prop.location?.barangay) entry.areas.add(prop.location.barangay);
        if (prop.specs?.propertyType) {
          entry.types.add(prop.specs.propertyType);
        }
      }
      for (const agent of agents) {
        const derived = propMap.get(agent.id);
        if (derived) {
          (agent as any).derivedAreas = Array.from(derived.areas);
          (agent as any).derivedSpecialties = Array.from(derived.types);
        }
      }
    } catch {
      // Non-fatal: branch and profile tags still work
    }

    return this.rankCandidates(agents, resolvedContext);
  }

  public static cancelAutoPass(inquiryId: string): void {
    const existing = pendingAutoPassMap.get(inquiryId);
    if (existing) {
      clearTimeout(existing.timer);
      pendingAutoPassMap.delete(inquiryId);
    }
  }

  public static scheduleAutoPass(
    inquiryId: string,
    initialAgentId: string,
    context: LiveAgentRoutingContext,
    timeoutMs: number = LIVE_AUTO_PASS_TIMEOUT_MS
  ): void {
    this.cancelAutoPass(inquiryId);
    const triedAgentIds = [initialAgentId];
    const timer = setTimeout(() => {
      void this.evaluateAutoPass(inquiryId, triedAgentIds, context, timeoutMs);
    }, timeoutMs);
    if (typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
    pendingAutoPassMap.set(inquiryId, { timer, triedAgentIds, context });
  }

  public static async evaluateAutoPass(
    inquiryId: string,
    triedAgentIds: string[] = [],
    context: LiveAgentRoutingContext = {},
    timeoutMs: number = LIVE_AUTO_PASS_TIMEOUT_MS
  ): Promise<{ action: 'already_answered' | 'reassigned' | 'fallback_offline'; newAgent?: LiveAgentCardDTO }> {
    const inquiry = await InquiryService.getInquiryById(inquiryId, 'admin');
    if (!inquiry || inquiry.firstHumanResponseAt || (inquiry.businessStatus || 'active') !== 'active') {
      this.cancelAutoPass(inquiryId);
      return { action: 'already_answered' };
    }

    const { agents } = await this.getRecommendedLiveAgents({
      ...context,
      propertyId: context.propertyId || inquiry.propertyId || inquiry.property_id,
      excludeAgentIds: triedAgentIds,
      limit: 1,
    });

    const nextAgent = agents[0];
    if (nextAgent) {
      try {
        await InquiryService.assignAgent(
          inquiryId,
          nextAgent.id,
          'system',
          'Live Routing',
          'Auto-passed after 2 minutes without agent reply.'
        );
      } catch (err: any) {
        logger.warn(`[LiveAgentRoutingService] Auto-pass assignAgent warning: ${err.message}`);
      }

      publishInquiryEvent('agent_reassigned', {
        inquiryId,
        agentId: nextAgent.id,
        agent: nextAgent,
        message: `Connecting you with ${nextAgent.name}...`,
      });

      await AuditService.recordEvent({
        eventType: 'inquiry.live_auto_passed',
        actorType: 'system',
        inquiryId,
        targetType: 'inquiry',
        targetId: inquiryId,
        outcome: 'success',
        reason: 'Previous live agent did not respond within 2 minutes.',
        newValues: { newAgentId: nextAgent.id, newAgentName: nextAgent.name },
      });

      this.scheduleAutoPass(inquiryId, nextAgent.id, context, timeoutMs);
      const entry = pendingAutoPassMap.get(inquiryId);
      if (entry) {
        entry.triedAgentIds = [...triedAgentIds, nextAgent.id];
      }

      return { action: 'reassigned', newAgent: nextAgent };
    }

    this.cancelAutoPass(inquiryId);
    inquiry.operationalStatus = 'unassigned';
    inquiry.agentId = undefined;
    inquiry.agent_id = undefined;

    publishInquiryEvent('fallback_offline', {
      inquiryId,
      referenceCode: inquiry.referenceCode,
      message: `Our agents are currently assisting other clients. Your conversation is saved (Ref: ${inquiry.referenceCode || inquiry.id}) and an agent will reach out shortly.`,
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `inquiry.live_fallback:${inquiryId}`,
      eventType: 'inquiry.escalated',
      inquiryId,
      recipientId: 'brokerage-unassigned-queue',
      recipientRole: 'broker',
      title: 'Live Chat Fallback to Unassigned Queue',
      message: `Live chat ${inquiry.referenceCode || inquiryId} had no available online agents after auto-pass.`,
      channels: ['system', 'email'],
    });

    return { action: 'fallback_offline' };
  }
}

export default LiveAgentRoutingService;
