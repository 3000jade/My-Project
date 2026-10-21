import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';

export default function AgentAppointments() {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0F766E]">
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            Viewing appointments are now integrated with your <strong>Schedule &amp; Availability</strong> workspace.
          </span>
        </div>
        <Link
          to="/agent/availability"
          className="inline-flex items-center gap-1 font-bold hover:underline shrink-0"
        >
          <span>Open Schedule &amp; Availability</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <AgentScheduleCalendar
        role="agent"
        fixedAgentId="agent-1"
        fixedAgentName="Elena Rossi"
        title="Viewing Appointments"
        subtitle="Manage client property tours, virtual walk-throughs, and transaction signing dates."
      />
    </div>
  );
}
