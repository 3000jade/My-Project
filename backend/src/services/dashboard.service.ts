import { PropertyService } from './property.service';
import { InquiryService } from './inquiry.service';
import { AppointmentService } from './appointment.service';
import { AgentService } from './agent.service';
import { SaleService } from './sale.service';
import logger from '../utils/logger';
import type { QueryDashboardInput } from '../schemas/dashboard.schema';

export interface ActivityItem {
  id: string;
  action: string;
  type: string;
  user_name: string;
  target: string;
  timestamp: string;
  icon: string;
}

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    action: "New Inquiry Received",
    type: "inquiry",
    user_name: "Atty. Fernando Zobel",
    target: "Ayala Alabang Estate",
    timestamp: "10 minutes ago",
    icon: "mail"
  },
  {
    id: "act-2",
    action: "Appointment Requested",
    type: "appointment",
    user_name: "Dr. Beatrice Ramos-Tan",
    target: "The Proscenium Penthouse",
    timestamp: "1 hour ago",
    icon: "calendar_today"
  },
  {
    id: "act-3",
    action: "Property Published",
    type: "property",
    user_name: "Elena Rossi",
    target: "Forbes Park Modern Residence",
    timestamp: "3 hours ago",
    icon: "apartment"
  },
  {
    id: "act-4",
    action: "Sale Recorded",
    type: "sale",
    user_name: "Alexander Sterling",
    target: "Aurelia Residences Horizon Suite",
    timestamp: "Yesterday",
    icon: "monetization_on"
  },
  {
    id: "act-5",
    action: "Agent Verification Submitted",
    type: "agent",
    user_name: "Marcus Aurelius Tan",
    target: "DHSUD & PRC License Documents",
    timestamp: "2 days ago",
    icon: "verified_user"
  },
  {
    id: "act-6",
    action: "Appointment Completed",
    type: "appointment",
    user_name: "Elena Rossi",
    target: "One Serendra Garden Villa",
    timestamp: "3 days ago",
    icon: "event_available"
  }
];

export class DashboardService {
  static async getSummary({ role, agentId }: QueryDashboardInput) {
    try {
      // Parallel fetch across domain services
      const [
        propRes,
        inquiries,
        appointments,
        agents,
        sales
      ] = await Promise.all([
        PropertyService.findProperties({ limit: 100 }),
        InquiryService.listInquiries({}),
        AppointmentService.listAppointments({}),
        AgentService.listAgents(),
        SaleService.listSales({ status: 'ALL', limit: 100 }),
      ]);

      const properties = propRes.properties || [];

      if (role === 'agent') {
        const targetAgentId = agentId || 'agent-1';

        const agentProps = properties.filter(
          p => p.agentId === targetAgentId || (p as any).agent_id === targetAgentId
        );
        const scopedProps = agentProps.length > 0 ? agentProps : properties.slice(0, 3);

        const agentInqs = inquiries.filter(
          i => i.agentId === targetAgentId || (i as any).agent_id === targetAgentId
        );
        const scopedInqs = agentInqs.length > 0 ? agentInqs : inquiries.slice(0, 4);

        const agentAppts = appointments.filter(a => a.agent_id === targetAgentId);
        const scopedAppts = agentAppts.length > 0 ? agentAppts : appointments.slice(0, 4);

        const agentSalesList = sales.filter(s => s.agent_id === targetAgentId);
        const scopedSales = agentSalesList.length > 0 ? agentSalesList : sales.slice(0, 3);

        const totalProperties = scopedProps.length;
        const availableProperties = scopedProps.filter(
          p => p.status.toLowerCase() === 'available'
        ).length;
        const reservedProperties = scopedProps.filter(
          p => p.status.toLowerCase() === 'reserved' || p.status.toLowerCase() === 'pending'
        ).length;
        const soldProperties = scopedProps.filter(
          p => p.status.toLowerCase() === 'sold'
        ).length;

        const newInquiries = scopedInqs.filter(
          i => i.status.toLowerCase() === 'new'
        ).length;
        const unresolvedInquiries = scopedInqs.filter(
          i => i.status.toLowerCase() !== 'resolved' && i.status.toLowerCase() !== 'closed'
        ).length;

        const upcomingAppointments = scopedAppts.filter(
          a => a.status === 'REQUESTED' || a.status === 'CONFIRMED'
        ).length;

        const totalRecordedSalesValue = scopedSales
          .filter(s => s.status === 'COMPLETED')
          .reduce((sum, s) => sum + s.property_value, 0);

        return {
          role: 'agent',
          agentId: targetAgentId,
          metrics: {
            totalProperties,
            availableProperties,
            reservedProperties,
            soldProperties,
            newInquiries,
            unresolvedInquiries,
            upcomingAppointments,
            totalRecordedSalesValue,
          },
          agentProperties: scopedProps,
          agentAppointments: scopedAppts,
          agentInquiries: scopedInqs,
          agentSales: scopedSales,
          recentActivity: defaultActivities,
        };
      }

      // Broker Firm-Wide Summary
      const totalProperties = properties.length;
      const availableProperties = properties.filter(
        p => p.status.toLowerCase() === 'available'
      ).length;
      const reservedProperties = properties.filter(
        p => p.status.toLowerCase() === 'reserved' || p.status.toLowerCase() === 'pending'
      ).length;
      const soldProperties = properties.filter(
        p => p.status.toLowerCase() === 'sold'
      ).length;

      const totalInquiries = inquiries.length;
      const newInquiries = inquiries.filter(
        i => i.status.toLowerCase() === 'new'
      ).length;
      const unresolvedInquiries = inquiries.filter(
        i => i.status.toLowerCase() !== 'resolved' && i.status.toLowerCase() !== 'closed'
      ).length;

      const upcomingAppointments = appointments.filter(
        a => a.status === 'REQUESTED' || a.status === 'CONFIRMED'
      ).length;

      const totalAgents = agents.length;
      const pendingAgentVerification = agents.filter(
        a => a.verification_status === 'PENDING'
      ).length;

      const totalSalesValue = sales
        .filter(s => s.status === 'COMPLETED')
        .reduce((sum, s) => sum + s.property_value, 0);

      const closedSalesCount = sales.filter(s => s.status === 'COMPLETED').length;

      return {
        role: 'broker',
        metrics: {
          totalProperties,
          availableProperties,
          reservedProperties,
          soldProperties,
          totalInquiries,
          newInquiries,
          unresolvedInquiries,
          upcomingAppointments,
          totalAgents,
          pendingAgentVerification,
          totalSalesValue,
        },
        salesSummary: {
          totalSalesValue,
          closedCount: closedSalesCount,
          recentSales: sales.slice(0, 4),
        },
        agentOverview: agents,
        recentActivity: defaultActivities,
      };
    } catch (err) {
      logger.error('Error compiling dashboard summary:', err);
      throw err;
    }
  }
}
