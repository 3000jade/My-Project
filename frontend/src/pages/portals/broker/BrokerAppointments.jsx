import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';
import { Card, CardContent } from '../../../components/ui';

export default function BrokerAppointments() {
  return (
    <div className="space-y-4 font-sans max-w-[1440px] mx-auto" data-testid="broker-appointments-portal">
      <Card data-testid="broker-card" className="border border-teal-200 dark:border-teal-900 bg-teal-50/80 dark:bg-teal-950/40 rounded-lg shadow-2xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0F766E] dark:text-teal-300">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Appointment scheduling is now unified inside <strong>Agent Management → Calendar &amp; Appointments</strong>.
            </span>
          </div>
          <Link
            to="/broker/agents?tab=calendar"
            className="inline-flex items-center gap-1 font-bold hover:underline shrink-0 text-[#0F766E] dark:text-teal-300"
          >
            <span>Open in Agent Management</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>

      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <AgentScheduleCalendar
            role="broker"
            title="Firm-Wide Appointment Monitoring"
            subtitle="Supervise client ocular inspections, online video presentations, and contract execution schedules."
          />
        </CardContent>
      </Card>
    </div>
  );
}
