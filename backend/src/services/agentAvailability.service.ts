import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type {
  AgentAvailabilityScheduleDTO,
  BlackoutDateWindow,
  DailyScheduleWindow,
  RoutingAvailability,
} from '../../../shared/types/agent';
import { DEFAULT_BROKERAGE_ID } from './agentTeam.service';

export const DEFAULT_WEEKLY_SCHEDULE: Record<string, DailyScheduleWindow> = {
  monday: { enabled: true, start: '09:00', end: '18:00' },
  tuesday: { enabled: true, start: '09:00', end: '18:00' },
  wednesday: { enabled: true, start: '09:00', end: '18:00' },
  thursday: { enabled: true, start: '09:00', end: '18:00' },
  friday: { enabled: true, start: '09:00', end: '18:00' },
  saturday: { enabled: true, start: '10:00', end: '16:00' },
  sunday: { enabled: false, start: '10:00', end: '16:00' },
};

const localAvailabilityMap = new Map<string, AgentAvailabilityScheduleDTO>();

export class AgentAvailabilityService {
  public static resetStore(): void {
    localAvailabilityMap.clear();
  }

  public static createDefaultSchedule(
    agentId: string,
    routingAvailability: RoutingAvailability = 'available',
    brokerageId: string = DEFAULT_BROKERAGE_ID
  ): AgentAvailabilityScheduleDTO {
    return {
      agent_id: agentId,
      brokerage_id: brokerageId,
      routing_availability: routingAvailability,
      timezone: 'Asia/Manila',
      weekly_schedule: JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE)),
      blackout_dates: [],
      max_active_inquiries: 25,
      auto_pause_on_capacity: true,
      away_message: null,
      updated_at: new Date().toISOString(),
    };
  }

  public static getCachedAvailability(agentId: string): AgentAvailabilityScheduleDTO | undefined {
    return localAvailabilityMap.get(agentId);
  }

  public static setCachedAvailability(schedule: AgentAvailabilityScheduleDTO): void {
    localAvailabilityMap.set(schedule.agent_id, schedule);
  }

  public static async getAvailability(agentId: string): Promise<AgentAvailabilityScheduleDTO> {
    const cached = localAvailabilityMap.get(agentId);
    if (cached) {
      return cached;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);
    if (isSupabaseConfigured && isUuid) {
      try {
        const { data, error } = await supabaseAdmin
          .from('agent_availability_schedules')
          .select('*')
          .eq('agent_id', agentId)
          .maybeSingle();

        if (!error && data) {
          const normalized: AgentAvailabilityScheduleDTO = {
            agent_id: data.agent_id,
            brokerage_id: data.brokerage_id || DEFAULT_BROKERAGE_ID,
            routing_availability: data.routing_availability || 'available',
            timezone: data.timezone || 'Asia/Manila',
            weekly_schedule: data.weekly_schedule || DEFAULT_WEEKLY_SCHEDULE,
            blackout_dates: Array.isArray(data.blackout_dates) ? data.blackout_dates : [],
            max_active_inquiries: Number(data.max_active_inquiries) || 25,
            auto_pause_on_capacity: data.auto_pause_on_capacity ?? true,
            away_message: data.away_message || null,
            updated_by: data.updated_by || null,
            updated_at: data.updated_at || new Date().toISOString(),
          };
          localAvailabilityMap.set(agentId, normalized);
          return normalized;
        }
      } catch {
        // Fallback to profile metadata envelope or local cache
      }

      // Check if availability schedule is stored in profiles.supporting_documents JSONB envelope
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, verification_status, supporting_documents')
          .eq('id', agentId)
          .maybeSingle();

        if (profile && Array.isArray(profile.supporting_documents)) {
          const metaEntry = profile.supporting_documents.find(
            (item: any) => item && item._meta_type === 'agent_v2_metadata'
          );
          if (metaEntry?.availability_schedule) {
            const restored: AgentAvailabilityScheduleDTO = {
              ...this.createDefaultSchedule(agentId, metaEntry.routing_availability || 'available'),
              ...metaEntry.availability_schedule,
              agent_id: agentId,
            };
            localAvailabilityMap.set(agentId, restored);
            return restored;
          }
        }
      } catch {
        // Ignore
      }
    }

    if (cached) {
      return cached;
    }

    const defaultSched = this.createDefaultSchedule(agentId, 'available');
    localAvailabilityMap.set(agentId, defaultSched);
    return defaultSched;
  }

  public static async updateAvailability(
    agentId: string,
    payload: Partial<{
      routing_availability: RoutingAvailability;
      timezone: string;
      weekly_schedule: Record<string, DailyScheduleWindow>;
      blackout_dates: BlackoutDateWindow[];
      max_active_inquiries: number;
      auto_pause_on_capacity: boolean;
      away_message: string | null;
    }>,
    actorId?: string
  ): Promise<AgentAvailabilityScheduleDTO> {
    const existing = await this.getAvailability(agentId);

    const updated: AgentAvailabilityScheduleDTO = {
      ...existing,
      routing_availability: payload.routing_availability ?? existing.routing_availability,
      timezone: payload.timezone ?? existing.timezone,
      weekly_schedule: payload.weekly_schedule ?? existing.weekly_schedule,
      blackout_dates: payload.blackout_dates ?? existing.blackout_dates,
      max_active_inquiries:
        payload.max_active_inquiries !== undefined
          ? Math.max(1, Number(payload.max_active_inquiries))
          : existing.max_active_inquiries,
      auto_pause_on_capacity: payload.auto_pause_on_capacity ?? existing.auto_pause_on_capacity,
      away_message: payload.away_message !== undefined ? payload.away_message : existing.away_message,
      updated_by: actorId || existing.updated_by || null,
      updated_at: new Date().toISOString(),
    };

    localAvailabilityMap.set(agentId, updated);

    // Synchronize with AgentService in-memory & Supabase profile metadata envelope
    try {
      const { AgentService } = await import('./agent.service');
      await AgentService.syncAgentAvailabilityDimension(agentId, updated, actorId);
    } catch (err: any) {
      logger.warn('[AgentAvailabilityService] Sync with AgentService warning:', err.message);
    }

    if (isSupabaseConfigured) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);
      if (isUuid) {
        try {
          await supabaseAdmin.from('agent_availability_schedules').upsert({
            agent_id: agentId,
            brokerage_id: updated.brokerage_id || DEFAULT_BROKERAGE_ID,
            routing_availability: updated.routing_availability,
            timezone: updated.timezone,
            weekly_schedule: updated.weekly_schedule,
            blackout_dates: updated.blackout_dates,
            max_active_inquiries: updated.max_active_inquiries,
            auto_pause_on_capacity: updated.auto_pause_on_capacity,
            away_message: updated.away_message,
            updated_at: updated.updated_at,
          });
        } catch {
          // Persisted via AgentService.syncAgentAvailabilityDimension JSONB envelope
        }
      }
    }

    return updated;
  }

  /**
   * Check whether an agent's schedule & blackout dates allow receiving a new lead at `now`
   */
  public static isAvailableForRoutingNow(
    schedule: AgentAvailabilityScheduleDTO,
    activeInquiriesCount: number = 0,
    now: Date = new Date()
  ): { available: boolean; reason?: 'UNAVAILABLE' | 'BLACKOUT_DATE' | 'CAPACITY_REACHED' } {
    if (schedule.routing_availability !== 'available') {
      return { available: false, reason: 'UNAVAILABLE' };
    }

    if (schedule.auto_pause_on_capacity && activeInquiriesCount >= schedule.max_active_inquiries) {
      return { available: false, reason: 'CAPACITY_REACHED' };
    }

    // Check blackout dates in Asia/Manila (UTC+8)
    const manilaIsoDate = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (Array.isArray(schedule.blackout_dates)) {
      for (const blackout of schedule.blackout_dates) {
        if (
          blackout.startDate &&
          blackout.endDate &&
          manilaIsoDate >= blackout.startDate.slice(0, 10) &&
          manilaIsoDate <= blackout.endDate.slice(0, 10)
        ) {
          return { available: false, reason: 'BLACKOUT_DATE' };
        }
      }
    }

    return { available: true };
  }
}

export default AgentAvailabilityService;
