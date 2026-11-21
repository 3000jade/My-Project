import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import AgentScheduleCalendar from '../../../components/dashboard/AgentScheduleCalendar';
import { Card, CardContent, Toaster } from '../../../components/ui';
import { Alert, AlertDescription } from '../../../components/ui/alert';

export default function BrokerAppointments() {
  return (
    <div className="flex flex-col gap-6 font-sans w-full min-w-0 max-w-full" data-testid="broker-appointments-portal">
      <Alert variant="teal" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          <AlertDescription className="text-xs font-medium">
            Appointment scheduling is now unified inside <strong>Agent Management → Calendar &amp; Appointments</strong>.
          </AlertDescription>
        </div>
        <Link
          to="/broker/agents?tab=calendar"
          className="inline-flex items-center gap-1 text-xs font-bold hover:underline shrink-0 text-[#0F766E] dark:text-teal-300"
        >
          <span>Open in Agent Management</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </Alert>

      <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <AgentScheduleCalendar
            role="broker"
            title="Firm-Wide Appointment Monitoring"
            subtitle="Supervise client ocular inspections, online video presentations, and contract execution schedules."
          />
        </CardContent>
      </Card>
      <Toaster position="top-right" />
    </div>
  );
}
