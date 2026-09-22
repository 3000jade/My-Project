import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { QuerySaleInput, CreateSaleInput, UpdateSaleInput } from '../schemas/sale.schema';

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
  notes: string;
  created_at: string;
}

const initialSales: SaleItem[] = [
  {
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
    notes: "Full deed of absolute sale executed. Verified by legal department.",
    created_at: "2026-08-25T10:00:00Z"
  },
  {
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
    notes: "Earnest deposit received. Awaiting bank mortgage release letter.",
    created_at: "2026-09-02T14:30:00Z"
  },
  {
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
    notes: "Offer to purchase draft currently under family council review.",
    created_at: "2026-09-04T11:00:00Z"
  },
  {
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
    notes: "Foreign executive inward investment remitted via accredited escrow.",
    created_at: "2026-08-15T09:00:00Z"
  },
  {
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
    notes: "Direct transfer of title to family holding corporation.",
    created_at: "2026-07-20T16:00:00Z"
  },
  {
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
    notes: "Cancelled during initial escrow negotiation due to foreign equity structure issues.",
    created_at: "2026-07-02T13:15:00Z"
  }
];

let inMemorySales: SaleItem[] = [...initialSales];

export class SaleService {
  /**
   * List sales with optional status, agent, keyword filtering and role scoping
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
          let results = data.map(item => ({
            id: item.id,
            property_id: item.property_id,
            property_title: item.property_title,
            property_location: item.property_location,
            client_name: item.client_name,
            agent_id: item.agent_id,
            agent_name: item.agent_name,
            sale_date: item.sale_date,
            property_value: Number(item.property_value),
            status: item.status,
            notes: item.notes || '',
            created_at: item.created_at,
          }));

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

    let results = [...inMemorySales];

    if (effectiveAgentId && effectiveAgentId !== 'ALL') {
      results = results.filter(s => s.agent_id === effectiveAgentId);
    }

    if (query?.status && query.status !== 'ALL') {
      results = results.filter(s => s.status === query.status);
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
          return {
            id: data.id,
            property_id: data.property_id,
            property_title: data.property_title,
            property_location: data.property_location,
            client_name: data.client_name,
            agent_id: data.agent_id,
            agent_name: data.agent_name,
            sale_date: data.sale_date,
            property_value: Number(data.property_value),
            status: data.status,
            notes: data.notes || '',
            created_at: data.created_at,
          };
        }
      } catch (err: any) {
        logger.warn(`Supabase getSaleById(${id}) error:`, err.message);
      }
    }

    const found = inMemorySales.find(s => s.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Record a new sale transaction
   */
  public static async createSale(data: CreateSaleInput): Promise<SaleItem> {
    const newSale: SaleItem = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      property_id: data.property_id,
      property_title: data.property_title,
      property_location: data.property_location,
      client_name: data.client_name,
      agent_id: data.agent_id,
      agent_name: data.agent_name,
      sale_date: data.sale_date,
      property_value: data.property_value,
      status: data.status || 'PENDING',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: created, error } = await supabaseAdmin
          .from('sales')
          .insert([newSale])
          .select()
          .single();

        if (!error && created) {
          return {
            id: created.id,
            property_id: created.property_id,
            property_title: created.property_title,
            property_location: created.property_location,
            client_name: created.client_name,
            agent_id: created.agent_id,
            agent_name: created.agent_name,
            sale_date: created.sale_date,
            property_value: Number(created.property_value),
            status: created.status,
            notes: created.notes || '',
            created_at: created.created_at,
          };
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
          return {
            id: data.id,
            property_id: data.property_id,
            property_title: data.property_title,
            property_location: data.property_location,
            client_name: data.client_name,
            agent_id: data.agent_id,
            agent_name: data.agent_name,
            sale_date: data.sale_date,
            property_value: Number(data.property_value),
            status: data.status,
            notes: data.notes || '',
            created_at: data.created_at,
          };
        }
      } catch (err: any) {
        logger.warn(`Supabase updateSale(${id}) error:`, err.message);
      }
    }

    const index = inMemorySales.findIndex(s => s.id === id);
    if (index === -1) return null;

    inMemorySales[index] = {
      ...inMemorySales[index],
      ...updates,
    };

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
