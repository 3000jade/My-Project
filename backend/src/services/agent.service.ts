import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export interface AgentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  prc_license_no: string;
  prc_validity: string;
  dhsud_accreditation_no: string;
  dhsud_validity: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  experience_years: number;
  bio: string;
  assigned_properties_count: number;
  active_inquiries_count: number;
  upcoming_appointments_count: number;
  recorded_sales_count: number;
  total_sales_value: number;
}

export interface AgentFilterQuery {
  status?: string;
  search?: string;
}

const initialAgents: AgentItem[] = [
  {
    id: "agent-1",
    name: "Elena Rossi",
    email: "agent@pt.com",
    phone: "+63 917 555 0192",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0028491",
    prc_validity: "2027-08-15",
    dhsud_accreditation_no: "DHSUD-NCR-AA-2023-0182",
    dhsud_validity: "2026-12-31",
    verification_status: "VERIFIED",
    experience_years: 6,
    bio: "Senior Luxury Property Consultant specializing in exclusive enclaves across Makati, Bonifacio Global City, and Ayala Alabang. Consistent top producer with high client satisfaction.",
    assigned_properties_count: 8,
    active_inquiries_count: 14,
    upcoming_appointments_count: 5,
    recorded_sales_count: 12,
    total_sales_value: 485000000
  },
  {
    id: "agent-2",
    name: "Alexander Sterling",
    email: "sterling@pt.com",
    phone: "+63 918 555 0244",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0019582",
    prc_validity: "2028-03-20",
    dhsud_accreditation_no: "DHSUD-NCR-AA-2022-0941",
    dhsud_validity: "2027-04-30",
    verification_status: "VERIFIED",
    experience_years: 10,
    bio: "Founding Partner and Prime Portfolio Director. Advises high-net-worth individuals and corporate developers on strategic asset acquisition.",
    assigned_properties_count: 11,
    active_inquiries_count: 18,
    upcoming_appointments_count: 6,
    recorded_sales_count: 22,
    total_sales_value: 920000000
  },
  {
    id: "agent-3",
    name: "Marcus Aurelius Tan",
    email: "mtan@pt.com",
    phone: "+63 920 555 0781",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0034120",
    prc_validity: "2026-11-10",
    dhsud_accreditation_no: "DHSUD-R4A-AA-2024-0311",
    dhsud_validity: "2026-10-15",
    verification_status: "PENDING",
    experience_years: 3,
    bio: "Residential specialist focusing on gated communities in Nuvali, Santa Rosa, and Tagaytay highlands. Pending document verification for Metro Manila expansion.",
    assigned_properties_count: 4,
    active_inquiries_count: 7,
    upcoming_appointments_count: 2,
    recorded_sales_count: 5,
    total_sales_value: 125000000
  },
  {
    id: "agent-4",
    name: "Camille Del Rosario",
    email: "cdelrosario@pt.com",
    phone: "+63 917 555 0899",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0022904",
    prc_validity: "2027-01-18",
    dhsud_accreditation_no: "DHSUD-NCR-AA-2023-0442",
    dhsud_validity: "2026-12-31",
    verification_status: "VERIFIED",
    experience_years: 7,
    bio: "Condominium and penthouse asset management professional. Strong relationships with regional expatriate executives.",
    assigned_properties_count: 6,
    active_inquiries_count: 9,
    upcoming_appointments_count: 4,
    recorded_sales_count: 9,
    total_sales_value: 340000000
  },
  {
    id: "agent-5",
    name: "Rafael Mendoza",
    email: "rmendoza@pt.com",
    phone: "+63 928 555 0341",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0041098",
    prc_validity: "2025-05-12",
    dhsud_accreditation_no: "DHSUD-NCR-AA-2022-0199",
    dhsud_validity: "2025-06-30",
    verification_status: "SUSPENDED",
    experience_years: 4,
    bio: "Account currently suspended pending annual DHSUD CPD compliance renewal certificates.",
    assigned_properties_count: 2,
    active_inquiries_count: 1,
    upcoming_appointments_count: 0,
    recorded_sales_count: 3,
    total_sales_value: 62000000
  },
  {
    id: "agent-6",
    name: "Sophia Kimberly Lim",
    email: "slim@pt.com",
    phone: "+63 917 555 0912",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    prc_license_no: "PRC-REB-0049201",
    prc_validity: "2028-09-14",
    dhsud_accreditation_no: "DHSUD-NCR-AA-2024-0802",
    dhsud_validity: "2027-08-31",
    verification_status: "PENDING",
    experience_years: 2,
    bio: "Commercial retail and luxury residential specialist. Applied for broker verification on September 1, 2026.",
    assigned_properties_count: 3,
    active_inquiries_count: 5,
    upcoming_appointments_count: 3,
    recorded_sales_count: 2,
    total_sales_value: 48000000
  }
];

const localAgentsState: AgentItem[] = [...initialAgents];

export class AgentService {
  /**
   * List agents with filtering
   */
  public static async listAgents(query?: AgentFilterQuery): Promise<AgentItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('role', 'agent');

        if (data && !error && data.length > 0) {
          // Merge database profiles with credential metadata from state
          data.forEach((p: any) => {
            const existing = localAgentsState.find((a) => a.id === p.id || a.email === p.email);
            if (!existing) {
              localAgentsState.push({
                id: p.id,
                name: p.full_name || 'Licensed Consultant',
                email: p.email,
                phone: p.phone || '+63 917 000 0000',
                avatar: p.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                prc_license_no: 'PRC-REB-PENDING',
                prc_validity: '2027-12-31',
                dhsud_accreditation_no: 'DHSUD-NCR-AA-PENDING',
                dhsud_validity: '2026-12-31',
                verification_status: 'PENDING',
                experience_years: 3,
                bio: 'Newly registered consultant under supervisory broker review.',
                assigned_properties_count: 0,
                active_inquiries_count: 0,
                upcoming_appointments_count: 0,
                recorded_sales_count: 0,
                total_sales_value: 0,
              });
            }
          });
        }
      } catch (err: any) {
        logger.warn('[AgentService] Supabase profile fetch failed, using local seed:', err.message);
      }
    }

    let results = [...localAgentsState];

    if (query?.status && query.status !== 'ALL') {
      results = results.filter(
        (a) => a.verification_status.toUpperCase() === query.status?.toUpperCase()
      );
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.prc_license_no.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Get single agent by ID
   */
  public static async getAgentById(id: string): Promise<AgentItem | null> {
    const found = localAgentsState.find((a) => a.id === id);
    if (found) return found;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          const item: AgentItem = {
            id: data.id,
            name: data.full_name || 'Consultant',
            email: data.email,
            phone: data.phone || '+63 900 000 0000',
            avatar: data.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
            prc_license_no: 'PRC-REB-PENDING',
            prc_validity: '2027-12-31',
            dhsud_accreditation_no: 'DHSUD-NCR-AA-PENDING',
            dhsud_validity: '2026-12-31',
            verification_status: 'PENDING',
            experience_years: 2,
            bio: 'Registered real estate consultant profile.',
            assigned_properties_count: 0,
            active_inquiries_count: 0,
            upcoming_appointments_count: 0,
            recorded_sales_count: 0,
            total_sales_value: 0,
          };
          localAgentsState.push(item);
          return item;
        }
      } catch (err: any) {
        logger.warn(`[AgentService] Supabase profile ${id} lookup failed:`, err.message);
      }
    }

    return null;
  }

  /**
   * Update agent verification status
   */
  public static async updateAgentStatus(
    id: string,
    status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
  ): Promise<AgentItem | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    agent.verification_status = status;
    return agent;
  }
}

export default AgentService;
