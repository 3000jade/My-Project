import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';

export default function BrokerAppointments() {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0F766E]">
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            Appointment scheduling is now unified inside <strong>Agent Management → Calendar &amp; Appointments</strong>.
          </span>
        </div>
        <Link
          to="/broker/agents?tab=calendar"
          className="inline-flex items-center gap-1 font-bold hover:underline shrink-0"
        >
          <span>Open in Agent Management</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <AgentScheduleCalendar
        role="broker"
        title="Firm-Wide Appointment Monitoring"
        subtitle="Supervise client ocular inspections, online video presentations, and contract execution schedules."
      />
    </div>
  );
}
