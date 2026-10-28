import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';
import { useAuth } from '../../../context/AuthContext';

export default function AgentAppointments() {
  const { user } = useAuth();
  const effectiveAgentId = user?.id || 'agent-1';
  const effectiveAgentName = user?.full_name || user?.name || 'Assigned Consultant';

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
        fixedAgentId={effectiveAgentId}
        fixedAgentName={effectiveAgentName}
        title="Viewing Appointments"
        subtitle="Manage client property tours, virtual walk-throughs, and transaction signing dates."
      />
    </div>
  );
}
