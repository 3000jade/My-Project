import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';

export interface AppointmentItem {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  property_id: string;
  property_title: string;
  agent_id: string;
  agent_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'Site Visit' | 'Online Consultation' | 'Document Signing';
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at: string;
}

export interface AppointmentFilterQuery {
  status?: string;
  agentId?: string;
  search?: string;
}

const seedAppointments: AppointmentItem[] = [
  {
    id: "apt-201",
    client_name: "Atty. Fernando Zobel",
    client_email: "fzobel@ayala.ph",
    client_phone: "+63 917 888 1234",
    property_id: "1",
    property_title: "Ayala Alabang Estate",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    appointment_date: "2026-09-08",
    appointment_time: "10:00 AM",
    appointment_type: "Site Visit",
    status: "REQUESTED",
    notes: "Client requested entry gate gatepass clearance for two vehicles. Bring site architectural plans.",
    created_at: "2026-09-04T10:00:00.000Z"
  },
  {
    id: "apt-202",
    client_name: "Dr. Beatrice Ramos-Tan",
    client_email: "b.ramos@medclinic.ph",
    client_phone: "+63 920 901 4455",
    property_id: "2",
    property_title: "The Proscenium Penthouse",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    appointment_date: "2026-09-09",
    appointment_time: "02:30 PM",
    appointment_type: "Document Signing",
    status: "CONFIRMED",
    notes: "Reservation agreement signing and issuance of earnest deposit receipt at Rockwell Club.",
    created_at: "2026-09-02T14:30:00.000Z"
  },
  {
    id: "apt-203",
    client_name: "Engr. Mateo Villanueva",
    client_email: "mvillanueva@buildcon.ph",
    client_phone: "+63 918 333 7654",
    property_id: "3",
    property_title: "Forbes Park Modern Residence",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    appointment_date: "2026-09-11",
    appointment_time: "11:00 AM",
    appointment_type: "Site Visit",
    status: "CONFIRMED",
    notes: "Structural ocular inspection with buyer's certified structural engineer.",
    created_at: "2026-08-30T11:00:00.000Z"
  },
  {
    id: "apt-204",
    client_name: "Patricia Sy-Cojuangco",
    client_email: "psy@syinvest.com",
    client_phone: "+63 917 222 9901",
    property_id: "4",
    property_title: "One Serendra Garden Villa",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    appointment_date: "2026-08-25",
    appointment_time: "03:00 PM",
    appointment_type: "Document Signing",
    status: "COMPLETED",
    notes: "Turnover deed execution completed. Key handover ceremony executed.",
    created_at: "2026-08-15T15:00:00.000Z"
  },
  {
    id: "apt-205",
    client_name: "Gregory Delgado",
    client_email: "gdelgado@shipping.com",
    client_phone: "+63 917 111 4433",
    property_id: "5",
    property_title: "Tagaytay Ridge Sanctuary",
    agent_id: "agent-1",
    agent_name: "Elena Rossi",
    appointment_date: "2026-08-19",
    appointment_time: "01:00 PM",
    appointment_type: "Site Visit",
    status: "CANCELLED",
    notes: "Client rescheduled due to heavy monsoon rains in Tagaytay.",
    created_at: "2026-08-10T13:00:00.000Z"
  },
  {
    id: "apt-206",
    client_name: "Michael Anthony Cruz",
    client_email: "mcruz@globalcap.sg",
    client_phone: "+65 9123 4567",
    property_id: "6",
    property_title: "Aurelia Residences Horizon Suite",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    appointment_date: "2026-09-10",
    appointment_time: "04:00 PM",
    appointment_type: "Online Consultation",
    status: "CONFIRMED",
    notes: "Zoom virtual walkthrough and 3D digital twin presentation.",
    created_at: "2026-09-05T16:00:00.000Z"
  },
  {
    id: "apt-207",
    client_name: "Corazon Aquino-Dee",
    client_email: "cdee@deegroup.com",
    client_phone: "+63 917 444 8877",
    property_id: "7",
    property_title: "Greenhills West Contemporary Villa",
    agent_id: "agent-2",
    agent_name: "Alexander Sterling",
    appointment_date: "2026-09-12",
    appointment_time: "09:30 AM",
    appointment_type: "Site Visit",
    status: "REQUESTED",
    notes: "Inspection of interior master suite and garden drainage systems.",
    created_at: "2026-09-01T09:30:00.000Z"
  }
];

const localAppointmentsState: AppointmentItem[] = [...seedAppointments];

export class AppointmentService {
  /**
   * List appointments with filtering
   */
  public static async listAppointments(query?: AppointmentFilterQuery): Promise<AppointmentItem[]> {
    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabaseAdmin
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false });

        if (query?.status && query.status !== 'ALL') {
          dbQuery = dbQuery.eq('status', query.status.toUpperCase());
        }
        if (query?.agentId && query.agentId !== 'ALL') {
          dbQuery = dbQuery.eq('agent_id', query.agentId);
        }

        const { data, error } = await dbQuery;

        if (data && !error && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            client_name: row.client_name || row.name,
            client_email: row.client_email || row.email,
            client_phone: row.client_phone || row.phone,
            property_id: row.property_id,
            property_title: row.property_title || 'Premier Estate Asset',
            agent_id: row.agent_id || 'agent-1',
            agent_name: row.agent_name || 'Elena Rossi',
            appointment_date: row.appointment_date,
            appointment_time: row.appointment_time,
            appointment_type: row.appointment_type || 'Site Visit',
            status: (row.status || 'REQUESTED').toUpperCase() as any,
            notes: row.notes,
            created_at: row.created_at || new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        logger.warn('[AppointmentService] Supabase fetch failed, falling back to local seed:', err.message);
      }
    }

    let results = [...localAppointmentsState];

    if (query?.status && query.status !== 'ALL') {
      const target = query.status.toUpperCase();
      results = results.filter((a) => (a.status || '').toUpperCase() === target);
    }

    if (query?.agentId && query.agentId !== 'ALL') {
      results = results.filter((a) => a.agent_id === query.agentId);
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.client_name.toLowerCase().includes(q) ||
          a.property_title.toLowerCase().includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Get appointment by ID
   */
  public static async getAppointmentById(id: string): Promise<AppointmentItem | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('appointments')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            client_name: data.client_name || data.name,
            client_email: data.client_email || data.email,
            client_phone: data.client_phone || data.phone,
            property_id: data.property_id,
            property_title: data.property_title || 'Premier Estate Asset',
            agent_id: data.agent_id || 'agent-1',
            agent_name: data.agent_name || 'Elena Rossi',
            appointment_date: data.appointment_date,
            appointment_time: data.appointment_time,
            appointment_type: data.appointment_type || 'Site Visit',
            status: (data.status || 'REQUESTED').toUpperCase() as any,
            notes: data.notes,
            created_at: data.created_at || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        logger.warn(`[AppointmentService] DB getById failed for ${id}:`, err.message);
      }
    }

    const found = localAppointmentsState.find((a) => a.id === id);
    return found || null;
  }

  /**
   * Create an appointment (Site viewing / tour request)
   */
  public static async createAppointment(data: Partial<AppointmentItem>): Promise<AppointmentItem> {
    const newAppointment: AppointmentItem = {
      id: `apt-${Date.now()}`,
      client_name: data.client_name || 'Anonymous Client',
      client_email: data.client_email || 'client@estate.ph',
      client_phone: data.client_phone || '+63 900 000 0000',
      property_id: data.property_id || '1',
      property_title: data.property_title || 'Premier Estate Portfolio Asset',
      agent_id: data.agent_id || 'agent-1',
      agent_name: data.agent_name || 'Elena Rossi',
      appointment_date: data.appointment_date || new Date().toISOString().split('T')[0],
      appointment_time: data.appointment_time || '10:00 AM',
      appointment_type: data.appointment_type || 'Site Visit',
      status: 'REQUESTED',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabaseAdmin
          .from('appointments')
          .insert({
            client_name: newAppointment.client_name,
            client_email: newAppointment.client_email,
            client_phone: newAppointment.client_phone,
            property_id: newAppointment.property_id,
            property_title: newAppointment.property_title,
            agent_id: newAppointment.agent_id,
            agent_name: newAppointment.agent_name,
            appointment_date: newAppointment.appointment_date,
            appointment_time: newAppointment.appointment_time,
            appointment_type: newAppointment.appointment_type,
            status: newAppointment.status,
            notes: newAppointment.notes,
          })
          .select()
          .single();

        if (inserted && !error) {
          newAppointment.id = inserted.id;
        }
      } catch (err: any) {
        logger.warn('[AppointmentService] Supabase insert failed, storing locally:', err.message);
      }
    }

    localAppointmentsState.unshift(newAppointment);
    return newAppointment;
  }

  /**
   * Update appointment status or reschedule
   */
  public static async updateAppointment(
    id: string,
    updateData: Partial<AppointmentItem>
  ): Promise<AppointmentItem | null> {
    const item = await this.getAppointmentById(id);
    if (!item) return null;

    const index = localAppointmentsState.findIndex((a) => a.id === id);

    const updatedItem: AppointmentItem = {
      ...item,
      ...updateData,
      status: updateData.status
        ? (updateData.status.toUpperCase() as any)
        : item.status,
      appointment_date: updateData.appointment_date || item.appointment_date,
      appointment_time: updateData.appointment_time || item.appointment_time,
      notes: updateData.notes !== undefined ? updateData.notes : item.notes,
    };

    if (index !== -1) {
      localAppointmentsState[index] = updatedItem;
    } else {
      localAppointmentsState.push(updatedItem);
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({
            status: updatedItem.status,
            appointment_date: updatedItem.appointment_date,
            appointment_time: updatedItem.appointment_time,
            notes: updatedItem.notes,
          })
          .eq('id', id);
      } catch (err: any) {
        logger.warn(`[AppointmentService] Supabase update failed for ${id}:`, err.message);
      }
    }

    return updatedItem;
  }

  /**
   * Delete appointment
   */
  public static async deleteAppointment(id: string): Promise<boolean> {
    const index = localAppointmentsState.findIndex((a) => a.id === id);
    if (index !== -1) {
      localAppointmentsState.splice(index, 1);
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('appointments').delete().eq('id', id);
      } catch (err: any) {
        logger.warn(`[AppointmentService] Supabase delete failed for ${id}:`, err.message);
      }
    }

    return true;
  }
}

export default AppointmentService;
