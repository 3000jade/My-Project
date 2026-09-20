import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export interface InquiryMessage {
  id: string;
  sender: 'client' | 'agent' | 'system';
  sender_name: string;
  timestamp: string;
  content: string;
}

export interface InquiryItem {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredDate?: string;
  type: 'general' | 'tour' | 'offer';
  status: 'new' | 'contacted' | 'scheduled' | 'closed' | 'assigned' | 'resolved' | 'reopened';
  agentId?: string;
  agentName?: string;
  aiSummary?: string;
  messages?: InquiryMessage[];
  createdAt: string;
}

export interface InquiryFilterQuery {
  status?: string;
  agentId?: string;
  type?: string;
}

const seedInquiries: InquiryItem[] = [
  {
    id: 'inq-101',
    propertyId: 'a1111111-1111-1111-1111-111111111111',
    propertyTitle: 'Ayala Alabang Modern Pavilion',
    propertyPrice: '₱185,000,000',
    name: 'Atty. Fernando Zobel',
    email: 'fzobel@ayala.ph',
    phone: '+63 917 888 1234',
    message: 'Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?',
    preferredDate: '2026-09-26',
    type: 'tour',
    status: 'new',
    agentId: 'agent-1',
    agentName: 'Elena Rossi',
    aiSummary: 'High-intent buyer inquiring about Ayala Alabang Estate. Requesting Saturday site inspection. Priority VIP lead.',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        sender_name: 'Atty. Fernando Zobel',
        timestamp: '2026-09-04 14:20',
        content: 'Good afternoon. We are reviewing options for our family residence. Could we arrange a site visit this coming Saturday?',
      },
    ],
    createdAt: '2026-09-04T14:20:00.000Z',
  },
  {
    id: 'inq-102',
    propertyId: 'b2222222-2222-2222-2222-222222222222',
    propertyTitle: 'Forbes Park Contemporary Villa',
    propertyPrice: '₱420,000,000',
    name: 'Dr. Beatrice Ramos-Tan',
    email: 'b.ramos@medclinic.ph',
    phone: '+63 920 901 4455',
    message: 'Thank you for confirming the parking allocation. We will prepare the letter of intent by Tuesday.',
    type: 'general',
    status: 'assigned',
    agentId: 'agent-1',
    agentName: 'Elena Rossi',
    aiSummary: 'Buyer previously asked about 2 deeded parking slots and dues. Buyer moving forward to LOI preparation.',
    messages: [
      {
        id: 'msg-2',
        sender: 'client',
        sender_name: 'Dr. Beatrice Ramos-Tan',
        timestamp: '2026-09-02 09:15',
        content: 'Hello Elena, does the Proscenium Penthouse come with 2 contiguous basement parking slots?',
      },
      {
        id: 'msg-3',
        sender: 'agent',
        sender_name: 'Elena Rossi',
        timestamp: '2026-09-02 10:05',
        content: 'Good morning Dr. Beatrice! Yes, the penthouse includes two deeded contiguous parking slots on Basement 2.',
      },
    ],
    createdAt: '2026-09-02T09:15:00.000Z',
  },
  {
    id: 'inq-103',
    propertyId: 'c3333333-3333-3333-3333-333333333333',
    propertyTitle: 'Dasmarinas Village Sanctuary',
    propertyPrice: '₱295,000,000',
    name: 'Engr. Mateo Villanueva',
    email: 'mvillanueva@buildcon.ph',
    phone: '+63 918 333 7654',
    message: 'Elena, our financial board has approved the second review. Can we reopen discussion regarding the property boundaries?',
    type: 'general',
    status: 'reopened',
    agentId: 'agent-1',
    agentName: 'Elena Rossi',
    aiSummary: 'Inquiry reopened after financial review. Client wants clarification on property boundaries.',
    messages: [
      {
        id: 'msg-4',
        sender: 'client',
        sender_name: 'Engr. Mateo Villanueva',
        timestamp: '2026-08-28 16:45',
        content: 'Elena, our financial board has approved the second review. Can we reopen discussion regarding the property boundaries?',
      },
    ],
    createdAt: '2026-08-28T16:45:00.000Z',
  },
  {
    id: 'inq-104',
    propertyId: 'd4444444-4444-4444-4444-444444444444',
    propertyTitle: 'BGC Sky Penthouse',
    propertyPrice: '₱145,000,000',
    name: 'Michael Anthony Cruz',
    email: 'mcruz@globalcap.sg',
    phone: '+65 9123 4567',
    message: 'I am an overseas Filipino executive currently in Singapore. Can we arrange a video walkthrough consultation next week?',
    preferredDate: '2026-09-28',
    type: 'tour',
    status: 'new',
    agentId: 'agent-2',
    agentName: 'Alexander Sterling',
    aiSummary: 'Singapore-based executive seeking online video walkthrough for Sky Penthouse.',
    messages: [
      {
        id: 'msg-5',
        sender: 'client',
        sender_name: 'Michael Anthony Cruz',
        timestamp: '2026-09-05 08:30',
        content: 'I am an overseas Filipino executive currently in Singapore. Can we arrange a video walkthrough consultation next week?',
      },
    ],
    createdAt: '2026-09-05T08:30:00.000Z',
  },
];

const localInquiriesState: InquiryItem[] = [...seedInquiries];

export class InquiryService {
  /**
   * Submit an inquiry or tour schedule request
   */
  public static async createInquiry(data: Partial<InquiryItem>): Promise<InquiryItem> {
    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle || 'Premier Estate Portfolio',
      propertyPrice: data.propertyPrice,
      name: data.name || 'Anonymous Client',
      email: data.email || '',
      phone: data.phone,
      message: data.message || '',
      preferredDate: data.preferredDate,
      type: data.type || 'general',
      status: 'new',
      agentId: data.agentId || 'agent-1',
      agentName: data.agentName || 'Elena Rossi',
      aiSummary: `Inquiry from ${data.name || 'prospective client'}: "${data.message?.slice(0, 100) || 'General enquiry'}". Auto-assigned to advisory.`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          sender_name: data.name || 'Client',
          timestamp: new Date().toISOString(),
          content: data.message || '',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabaseAdmin
          .from('inquiries')
          .insert({
            property_id: newInquiry.propertyId,
            name: newInquiry.name,
            email: newInquiry.email,
            phone: newInquiry.phone,
            message: newInquiry.message,
            preferred_date: newInquiry.preferredDate,
            type: newInquiry.type,
            status: newInquiry.status,
          })
          .select()
          .single();

        if (inserted && !error) {
          newInquiry.id = inserted.id;
        }
      } catch (err: any) {
        logger.warn('[InquiryService] Database insert failed, storing locally:', err.message);
      }
    }

    localInquiriesState.unshift(newInquiry);
    return newInquiry;
  }

  /**
   * Fetch all inquiries with optional filtering
   */
  public static async listInquiries(filter?: InquiryFilterQuery): Promise<InquiryItem[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (filter?.status && filter.status !== 'ALL') {
          query = query.eq('status', filter.status.toLowerCase());
        }
        if (filter?.type) {
          query = query.eq('type', filter.type);
        }

        const { data, error } = await query;

        if (data && !error && data.length > 0) {
          return data.map((row: any) => {
            const localMatch = localInquiriesState.find((l) => l.id === row.id || l.name === row.name);
            return {
              id: row.id,
              propertyId: row.property_id,
              propertyTitle: localMatch?.propertyTitle || 'Estate Portfolio Asset',
              propertyPrice: localMatch?.propertyPrice || 'Price upon request',
              name: row.name,
              email: row.email,
              phone: row.phone,
              message: row.message,
              preferredDate: row.preferred_date,
              type: row.type,
              status: (row.status || 'new').toLowerCase() as any,
              agentId: localMatch?.agentId || 'agent-1',
              agentName: localMatch?.agentName || 'Elena Rossi',
              aiSummary: localMatch?.aiSummary || 'Client inquiry registered for advisory consultation.',
              messages: localMatch?.messages || [
                {
                  id: `msg-${row.id}`,
                  sender: 'client',
                  sender_name: row.name,
                  timestamp: row.created_at,
                  content: row.message,
                },
              ],
              createdAt: row.created_at,
            };
          });
        }
      } catch (err: any) {
        logger.warn('[InquiryService] DB fetch failed, using local seed:', err.message);
      }
    }

    let results = [...localInquiriesState];
    if (filter?.status && filter.status !== 'ALL') {
      const target = filter.status.toLowerCase();
      results = results.filter((i) => i.status.toLowerCase() === target);
    }
    if (filter?.agentId && filter.agentId !== 'ALL') {
      results = results.filter((i) => i.agentId === filter.agentId);
    }
    if (filter?.type) {
      results = results.filter((i) => i.type === filter.type);
    }

    return results;
  }

  /**
   * Fetch single inquiry by ID
   */
  public static async getInquiryById(id: string): Promise<InquiryItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('inquiries')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          const localMatch = localInquiriesState.find((l) => l.id === id);
          return {
            id: data.id,
            propertyId: data.property_id,
            propertyTitle: localMatch?.propertyTitle || 'Estate Portfolio Asset',
            propertyPrice: localMatch?.propertyPrice || 'Price upon request',
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
            preferredDate: data.preferred_date,
            type: data.type,
            status: (data.status || 'new').toLowerCase() as any,
            agentId: localMatch?.agentId || 'agent-1',
            agentName: localMatch?.agentName || 'Elena Rossi',
            aiSummary: localMatch?.aiSummary,
            messages: localMatch?.messages || [],
            createdAt: data.created_at,
          };
        }
      } catch (err: any) {
        logger.warn('[InquiryService] DB getById failed, checking local state:', err.message);
      }
    }

    const found = localInquiriesState.find((i) => i.id === id);
    return found || null;
  }

  /**
   * Update inquiry by ID (status, reassignment, messages)
   */
  public static async updateInquiry(
    id: string,
    updateData: Partial<InquiryItem>
  ): Promise<InquiryItem | null> {
    const index = localInquiriesState.findIndex((i) => i.id === id);
    let item = index !== -1 ? localInquiriesState[index] : null;

    if (!item) {
      // Check if it exists in Supabase
      const dbItem = await this.getInquiryById(id);
      if (dbItem) {
        item = { ...dbItem };
        localInquiriesState.push(item);
      }
    }

    if (!item) return null;

    const normalizedStatus = updateData.status
      ? (updateData.status.toLowerCase() as any)
      : item.status;

    const updatedItem: InquiryItem = {
      ...item,
      ...updateData,
      status: normalizedStatus,
      agentId: updateData.agentId || item.agentId,
      agentName: updateData.agentName || item.agentName,
      messages: updateData.messages || item.messages,
    };

    if (index !== -1) {
      localInquiriesState[index] = updatedItem;
    } else {
      localInquiriesState.push(updatedItem);
    }

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {};
        if (updateData.status) {
          // Map to database enum: 'new' | 'contacted' | 'scheduled' | 'closed'
          const dbStatus = ['new', 'contacted', 'scheduled', 'closed'].includes(normalizedStatus)
            ? normalizedStatus
            : normalizedStatus === 'resolved'
            ? 'closed'
            : normalizedStatus === 'assigned'
            ? 'contacted'
            : 'contacted';
          updatePayload.status = dbStatus;
        }

        await supabaseAdmin.from('inquiries').update(updatePayload).eq('id', id);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase update failed:', err.message);
      }
    }

    return updatedItem;
  }

  /**
   * Delete inquiry by ID
   */
  public static async deleteInquiry(id: string): Promise<boolean> {
    const index = localInquiriesState.findIndex((i) => i.id === id);
    if (index !== -1) {
      localInquiriesState.splice(index, 1);
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('inquiries').delete().eq('id', id);
      } catch (err: any) {
        logger.warn('[InquiryService] Supabase delete failed:', err.message);
      }
    }

    return true;
  }
}

export default InquiryService;
