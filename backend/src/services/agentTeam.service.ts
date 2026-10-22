import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { AgentTeamDTO } from '../../../shared/types/agent';

export const DEFAULT_BROKERAGE_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_BROKERAGE_NAME = 'Human Shelter Realty';

const DEFAULT_SEEDED_TEAMS: AgentTeamDTO[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    brokerage_id: DEFAULT_BROKERAGE_ID,
    name: 'Executive Advisory Division',
    description: 'Ultra-luxury penthouses, private estates, and institutional portfolios',
    lead_agent_id: null,
    member_count: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    brokerage_id: DEFAULT_BROKERAGE_ID,
    name: 'Residential Portfolio Team',
    description: 'Prime residential condominiums and urban sanctuary residences',
    lead_agent_id: null,
    member_count: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

let localTeamsState: AgentTeamDTO[] = [...DEFAULT_SEEDED_TEAMS];

export class AgentTeamService {
  public static resetStore(): void {
    localTeamsState = DEFAULT_SEEDED_TEAMS.map((t) => ({ ...t }));
  }

  public static async listTeams(brokerageId: string = DEFAULT_BROKERAGE_ID): Promise<AgentTeamDTO[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('teams')
          .select('*')
          .eq('brokerage_id', brokerageId)
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err: any) {
        logger.warn('[AgentTeamService] Fallback to local/seeded teams store:', err.message);
      }
    }

    return localTeamsState.filter((t) => t.brokerage_id === brokerageId);
  }

  public static async getTeamById(teamId?: string | null): Promise<AgentTeamDTO | null> {
    if (!teamId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch {
        // Fallback
      }
    }

    return localTeamsState.find((t) => t.id === teamId) || null;
  }

  public static getTeamByIdSync(teamId?: string | null): AgentTeamDTO | null {
    if (!teamId) return null;
    return localTeamsState.find((t) => t.id === teamId) || null;
  }

  public static async createTeam(payload: {
    brokerage_id?: string;
    name: string;
    description?: string | null;
    lead_agent_id?: string | null;
  }): Promise<AgentTeamDTO> {
    const brokerageId = payload.brokerage_id || DEFAULT_BROKERAGE_ID;
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      throw new Error('Team name is required.');
    }

    const existing = localTeamsState.find(
      (t) => t.brokerage_id === brokerageId && t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      throw new Error(`A team named "${trimmedName}" already exists in this brokerage (409 Conflict).`);
    }

    const nowIso = new Date().toISOString();
    const newTeam: AgentTeamDTO = {
      id: crypto.randomUUID(),
      brokerage_id: brokerageId,
      name: trimmedName,
      description: payload.description || null,
      lead_agent_id: payload.lead_agent_id || null,
      member_count: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('teams')
          .insert({
            id: newTeam.id,
            brokerage_id: newTeam.brokerage_id,
            name: newTeam.name,
            description: newTeam.description,
            lead_agent_id: newTeam.lead_agent_id,
          })
          .select()
          .single();

        if (!error && data) {
          localTeamsState.push(data);
          return data;
        }
      } catch (err: any) {
        logger.warn('[AgentTeamService] Supabase insert team fallback:', err.message);
      }
    }

    localTeamsState.push(newTeam);
    return newTeam;
  }

  public static async updateTeam(
    teamId: string,
    payload: Partial<{
      name: string;
      description: string | null;
      lead_agent_id: string | null;
    }>,
    actorBrokerageId: string = DEFAULT_BROKERAGE_ID
  ): Promise<AgentTeamDTO | null> {
    const idx = localTeamsState.findIndex((t) => t.id === teamId);
    let targetTeam: AgentTeamDTO | null = idx >= 0 ? localTeamsState[idx] : null;

    if (!targetTeam && isSupabaseConfigured) {
      try {
        const { data } = await supabaseAdmin.from('teams').select('*').eq('id', teamId).maybeSingle();
        if (data) targetTeam = data;
      } catch {
        // Fallback
      }
    }

    if (!targetTeam) return null;

    // Enforce strict brokerage isolation
    if (targetTeam.brokerage_id !== actorBrokerageId) {
      return null;
    }

    const updated: AgentTeamDTO = {
      ...targetTeam,
      name: payload.name !== undefined ? payload.name.trim() : targetTeam.name,
      description: payload.description !== undefined ? payload.description : targetTeam.description,
      lead_agent_id: payload.lead_agent_id !== undefined ? payload.lead_agent_id : targetTeam.lead_agent_id,
      updated_at: new Date().toISOString(),
    };

    if (idx >= 0) {
      localTeamsState[idx] = updated;
    } else {
      localTeamsState.push(updated);
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('teams')
          .update({
            name: updated.name,
            description: updated.description,
            lead_agent_id: updated.lead_agent_id,
            updated_at: updated.updated_at,
          })
          .eq('id', teamId)
          .eq('brokerage_id', actorBrokerageId);
      } catch {
        // Fallback
      }
    }

    return updated;
  }

  public static async deleteTeam(
    teamId: string,
    actorBrokerageId: string = DEFAULT_BROKERAGE_ID
  ): Promise<boolean> {
    const idx = localTeamsState.findIndex((t) => t.id === teamId && t.brokerage_id === actorBrokerageId);
    if (idx >= 0) {
      localTeamsState.splice(idx, 1);
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('teams')
          .delete()
          .eq('id', teamId)
          .eq('brokerage_id', actorBrokerageId);
        if (!error) return true;
      } catch {
        // Fallback
      }
    }

    return idx >= 0;
  }
}

export default AgentTeamService;
