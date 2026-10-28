import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { QuerySaleInput, CreateSaleInput, UpdateSaleInput, DealStage, PayoutStatus } from '../schemas/sale.schema';

export interface SaleItem {
  id: string;
  property_id: string;
  property_title: string;
  property_location: string;
  client_name: string;
  agent_id: string;
  agent_name: string;
  sale_date: string;
  property_value: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  deal_stage: 'IN_NEGOTIATION' | 'UNDER_CONTRACT' | 'CONVEYANCE' | 'COMPLETED';
  commission_rate: number;
  gross_commission: number;
  agent_split_percentage: number;
  agent_net_commission: number;
  payout_status: 'UNPAID' | 'PARTIALLY_RELEASED' | 'PAID';
  notes: string;
  created_at: string;
}

export interface SalesPipelineMetrics {
  totalDeals: number;
  activePipelineCount: number;
  activePipelineValue: number;
  closedDealsCount: number;
  closedSalesVolume: number;
  estimatedNetCommission: number;
}

function normalizeSaleRecord(raw: any): SaleItem {
  const property_value = Number(raw.property_value || 0);
  const commission_rate = Number(raw.commission_rate ?? 5.0);
  const agent_split_percentage = Number(raw.agent_split_percentage ?? 60.0);
  const gross_commission = Number(
    raw.gross_commission ?? ((property_value * commission_rate) / 100)
  );
  const agent_net_commission = Number(
    raw.agent_net_commission ?? ((gross_commission * agent_split_percentage) / 100)
  );

  let deal_stage: DealStage = raw.deal_stage;
  if (!deal_stage) {
    if (raw.status === 'COMPLETED') {
      deal_stage = 'COMPLETED';
    } else if (raw.status === 'CANCELLED') {
      deal_stage = 'IN_NEGOTIATION';
    } else {
      deal_stage = 'UNDER_CONTRACT';
    }
  }

  let payout_status: PayoutStatus = raw.payout_status;
  if (!payout_status) {
    payout_status = raw.status === 'COMPLETED' ? 'PAID' : 'UNPAID';
  }

  return {
    id: String(raw.id),
    property_id: String(raw.property_id),
    property_title: raw.property_title || 'Untitled Property',
    property_location: raw.property_location || 'Metro Manila',
    client_name: raw.client_name || 'Anonymous Client',
    agent_id: String(raw.agent_id),
    agent_name: raw.agent_name || 'Assigned Consultant',
    sale_date: raw.sale_date || new Date().toISOString().split('T')[0],
    property_value,
    status: raw.status || 'PENDING',
    deal_stage,
    commission_rate,
    gross_commission,
    agent_split_percentage,
    agent_net_commission,
    payout_status,
    notes: raw.notes || '',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

const initialSales: SaleItem[] = [
  normalizeSaleRecord({
    id: "sale-301",
    property_id: "4",
    property_title: "One Serendra Garden Villa",
    property_location: "BGC, Taguig City",
    client_name: "Patricia Sy-Cojuangco",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    sale_date: "2026-08-25",
    property_value: 68000000,
    status: "COMPLETED",
    deal_stage: "COMPLETED",
    commission_rate: 5.0,
    agent_split_percentage: 65.0,
    payout_status: "PAID",
    notes: "Full deed of absolute sale executed. Verified by legal department.",
    created_at: "2026-08-25T10:00:00Z"
  }),
  normalizeSaleRecord({
    id: "sale-302",
    property_id: "2",
    property_title: "The Proscenium Penthouse",
    property_location: "Rockwell Center, Makati",
    client_name: "Dr. Beatrice Ramos-Tan",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    sale_date: "2026-09-02",
    property_value: 85500000,
    status: "PENDING",
    deal_stage: "CONVEYANCE",
    commission_rate: 5.0,
    agent_split_percentage: 60.0,
    payout_status: "UNPAID",
    notes: "Earnest deposit received. Awaiting bank mortgage release letter.",
    created_at: "2026-09-02T14:30:00Z"
  }),
  normalizeSaleRecord({
    id: "sale-303",
    property_id: "1",
    property_title: "Ayala Alabang Estate",
    property_location: "Muntinlupa City, Metro Manila",
    client_name: "Atty. Fernando Zobel",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    sale_date: "2026-09-04",
    property_value: 185000000,
    status: "PENDING",
    deal_stage: "IN_NEGOTIATION",
    commission_rate: 4.5,
    agent_split_percentage: 60.0,
    payout_status: "UNPAID",
    notes: "Offer to purchase draft currently under family council review.",
    created_at: "2026-09-04T11:00:00Z"
  }),
  normalizeSaleRecord({
    id: "sale-304",
    property_id: "6",
    property_title: "Aurelia Residences Horizon Suite",
    property_location: "BGC, Taguig City",
    client_name: "Michael Anthony Cruz",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    sale_date: "2026-08-15",
    property_value: 145000000,
    status: "COMPLETED",
    deal_stage: "COMPLETED",
    commission_rate: 5.0,
    agent_split_percentage: 70.0,
    payout_status: "PAID",
    notes: "Foreign executive inward investment remitted via accredited escrow.",
    created_at: "2026-08-15T09:00:00Z"
  }),
  normalizeSaleRecord({
    id: "sale-305",
    property_id: "7",
    property_title: "Greenhills West Contemporary Villa",
    property_location: "San Juan City, Metro Manila",
    client_name: "Corazon Aquino-Dee",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    sale_date: "2026-07-20",
    property_value: 210000000,
    status: "COMPLETED",
    deal_stage: "COMPLETED",
    commission_rate: 5.0,
    agent_split_percentage: 70.0,
    payout_status: "PAID",
    notes: "Direct transfer of title to family holding corporation.",
    created_at: "2026-07-20T16:00:00Z"
  }),
  normalizeSaleRecord({
    id: "sale-306",
    property_id: "3",
    property_title: "Forbes Park Modern Residence",
    property_location: "Makati City, Metro Manila",
    client_name: "Engr. Mateo Villanueva",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    sale_date: "2026-07-02",
    property_value: 420000000,
    status: "CANCELLED",
    deal_stage: "IN_NEGOTIATION",
    commission_rate: 4.0,
    agent_split_percentage: 60.0,
    payout_status: "UNPAID",
    notes: "Cancelled during initial escrow negotiation due to foreign equity structure issues.",
    created_at: "2026-07-02T13:15:00Z"
  })
];

let inMemorySales: SaleItem[] = [...initialSales];

export class SaleService {
  /**
   * List sales with optional status, deal stage, agent, keyword filtering and role scoping
   */
  public static async listSales(
    query?: QuerySaleInput,
    userRole?: string,
    userId?: string
  ): Promise<SaleItem[]> {
    const isAgentScoped = userRole === 'agent';
    const effectiveAgentId = isAgentScoped ? (userId || 'agent-1') : query?.agentId;

    if (isSupabaseConfigured) {
      try {
        let builder = supabaseAdmin
          .from('sales')
          .select('*')
          .order('sale_date', { ascending: false });

        if (query?.status && query.status !== 'ALL') {
          builder = builder.eq('status', query.status);
        }

        if (query?.dealStage && query.dealStage !== 'ALL') {
          builder = builder.eq('deal_stage', query.dealStage);
        }

        if (effectiveAgentId && effectiveAgentId !== 'ALL') {
          builder = builder.eq('agent_id', effectiveAgentId);
        }

        if (query?.propertyId) {
          builder = builder.eq('property_id', query.propertyId);
        }

        if (query?.limit) {
          builder = builder.limit(query.limit);
        }

        const { data, error } = await builder;

        if (!error && Array.isArray(data) && data.length > 0) {
          let results = data.map(item => normalizeSaleRecord(item));

          if (query?.dealStage && query.dealStage !== 'ALL') {
            results = results.filter(s => s.deal_stage === query.dealStage);
          }

          if (query?.search) {
            const term = query.search.toLowerCase();
            results = results.filter(s =>
              s.property_title.toLowerCase().includes(term) ||
              s.client_name.toLowerCase().includes(term) ||
              s.property_location.toLowerCase().includes(term)
            );
          }

          return results;
        }
      } catch (err: any) {
        logger.warn('Supabase sales query failed, using in-memory store:', err.message);
      }
    }

    let results = inMemorySales.map(item => normalizeSaleRecord(item));

    if (effectiveAgentId && effectiveAgentId !== 'ALL') {
      const agentScoped = results.filter(s => s.agent_id === effectiveAgentId);
      results = agentScoped.length > 0 ? agentScoped : results;
    }

    if (query?.status && query.status !== 'ALL') {
      results = results.filter(s => s.status === query.status);
    }

    if (query?.dealStage && query.dealStage !== 'ALL') {
      results = results.filter(s => s.deal_stage === query.dealStage);
    }

    if (query?.propertyId) {
      results = results.filter(s => s.property_id === query.propertyId);
    }

    if (query?.search) {
      const term = query.search.toLowerCase();
      results = results.filter(s =>
        s.property_title.toLowerCase().includes(term) ||
        s.client_name.toLowerCase().includes(term) ||
        s.property_location.toLowerCase().includes(term)
      );
    }

    if (query?.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Calculates comprehensive pipeline and commission metrics for an agent
   */
  public static async getAgentSalesPipelineMetrics(agentId: string): Promise<SalesPipelineMetrics> {
    const sales = await this.listSales({ agentId }, 'agent', agentId);
    let activePipelineCount = 0;
    let activePipelineValue = 0;
    let closedDealsCount = 0;
    let closedSalesVolume = 0;
    let estimatedNetCommission = 0;

    for (const sale of sales) {
      if (sale.deal_stage === 'COMPLETED' || sale.status === 'COMPLETED') {
        closedDealsCount++;
        closedSalesVolume += sale.property_value;
        estimatedNetCommission += sale.agent_net_commission;
      } else if (sale.status !== 'CANCELLED') {
        activePipelineCount++;
        activePipelineValue += sale.property_value;
        // Include earned/projected net commission
        estimatedNetCommission += sale.agent_net_commission;
      }
    }

    return {
      totalDeals: sales.length,
      activePipelineCount,
      activePipelineValue,
      closedDealsCount,
      closedSalesVolume,
      estimatedNetCommission,
    };
  }

  /**
   * Get single sale conveyance record by ID
   */
  public static async getSaleById(id: string): Promise<SaleItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('sales')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return normalizeSaleRecord(data);
        }
      } catch (err: any) {
        logger.warn(`Supabase getSaleById(${id}) error:`, err.message);
      }
    }

    const found = inMemorySales.find(s => s.id === id);
    return found ? normalizeSaleRecord(found) : null;
  }

  /**
   * Record a new sale transaction
   */
  public static async createSale(data: CreateSaleInput): Promise<SaleItem> {
    const newSale = normalizeSaleRecord({
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      created_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured) {
      try {
        const { data: created, error } = await supabaseAdmin
          .from('sales')
          .insert([newSale])
          .select()
          .single();

        if (!error && created) {
          return normalizeSaleRecord(created);
        }
      } catch (err: any) {
        logger.warn('Supabase createSale error, using fallback:', err.message);
      }
    }

    inMemorySales.unshift(newSale);
    return newSale;
  }

  /**
   * Update sale conveyance record
   */
  public static async updateSale(id: string, updates: UpdateSaleInput): Promise<SaleItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('sales')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return normalizeSaleRecord(data);
        }
      } catch (err: any) {
        logger.warn(`Supabase updateSale(${id}) error:`, err.message);
      }
    }

    const index = inMemorySales.findIndex(s => s.id === id);
    if (index === -1) return null;

    inMemorySales[index] = normalizeSaleRecord({
      ...inMemorySales[index],
      ...updates,
    });

    return { ...inMemorySales[index] };
  }

  /**
   * Delete sale record
   */
  public static async deleteSale(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('sales')
          .delete()
          .eq('id', id);

        if (!error) return true;
      } catch (err: any) {
        logger.warn(`Supabase deleteSale(${id}) error:`, err.message);
      }
    }

    const index = inMemorySales.findIndex(s => s.id === id);
    if (index === -1) return false;

    inMemorySales.splice(index, 1);
    return true;
  }
}

export default SaleService;
