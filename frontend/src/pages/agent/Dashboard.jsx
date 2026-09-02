import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Building2,
  MessagesSquare,
  Users,
  CalendarClock,
  TrendingUp,
  Plus,
  UserPlus,
  CalendarPlus,
  Eye,
  Check,
} from 'lucide-react'
import { useApp } from '../../context/AgentContext.jsx'
import SummaryCard from '../../components/agent/ui/SummaryCard.jsx'
import PageHeader from '../../components/agent/ui/PageHeader.jsx'
import Button from '../../components/agent/ui/Button.jsx'
import StatusBadge from '../../components/agent/ui/StatusBadge.jsx'
import PriorityBadge from '../../components/agent/ui/PriorityBadge.jsx'
import { inquiryStatusTone, followUpStatusTone } from '../../utils/agent/tone.js'
import { findProperty, formatPHP, formatDate, timeAgo } from '../../data/agentMockData.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { properties, inquiries, leads, followUps, transactions, completeFollowUp } = useApp()

  const newInquiries = inquiries.filter((i) => i.status === 'New').length
  const activeLeads = leads.filter((l) => !['Converted', 'Lost'].includes(l.status)).length
  const pendingFollowUps = followUps.filter((f) => f.status !== 'Completed').length

  const completedSales = transactions.filter((t) => t.status === 'Completed')
  const totalSales = completedSales.reduce((sum, t) => sum + t.salePrice, 0)
  const currentMonthSales = completedSales
    .filter((t) => t.date.startsWith('2026-08'))
    .reduce((sum, t) => sum + t.salePrice, 0)
  const pendingTransactions = transactions.filter((t) => t.status === 'Pending' || t.status === 'Processing').length

  const inquiryOverview = [
    { name: 'New', value: inquiries.filter((i) => i.status === 'New').length },
    { name: 'In Progress', value: inquiries.filter((i) => i.status === 'In Progress').length },
    { name: 'Qualified', value: inquiries.filter((i) => i.status === 'Qualified').length },
    { name: 'Closed', value: inquiries.filter((i) => i.status === 'Closed').length },
  ]

  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived))
    .slice(0, 5)

  const upcomingFollowUps = [...followUps]
    .filter((f) => f.status !== 'Completed')
    .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
    .slice(0, 5)

  return (
    <div>
      <PageHeader title={`Welcome back, Marie 👋`} subtitle="Here's what's happening with your listings and clients today." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Building2}
          label="Total Properties"
          value={properties.length}
          sublabel="Properties you manage"
          actionLabel="View Properties"
          onAction={() => navigate('/agent/properties')}
        />
        <SummaryCard
          icon={MessagesSquare}
          label="New Inquiries"
          value={newInquiries}
          sublabel="Awaiting your response"
          actionLabel="View Inquiries"
          onAction={() => navigate('/agent/inquiries/new')}
          accent="orange"
        />
        <SummaryCard
          icon={Users}
          label="Active Leads"
          value={activeLeads}
          sublabel="In your CRM pipeline"
          actionLabel="View Leads"
          onAction={() => navigate('/agent/crm/leads')}
        />
        <SummaryCard
          icon={CalendarClock}
          label="Pending Follow-ups"
          value={pendingFollowUps}
          sublabel="Due this week"
          actionLabel="View Follow-ups"
          onAction={() => navigate('/agent/crm/follow-ups')}
          accent="orange"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Sales Overview"
          value={formatPHP(totalSales)}
          sublabel={`${formatPHP(currentMonthSales)} this month · ${pendingTransactions} pending`}
          actionLabel="View Sales"
          onAction={() => navigate('/agent/sales/overview')}
          accent="dark"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-darkteal-800">Inquiry Overview</p>
              <p className="text-xs text-ink-500">Snapshot of your current inquiry pipeline</p>
            </div>
            <button onClick={() => navigate('/agent/inquiries')} className="text-xs font-semibold text-teal-600 hover:underline">
              View All Inquiries →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inquiryOverview} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E4E2DA" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={{ stroke: '#E4E2DA' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F0EC' }}
                  contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#266F71" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card lg:col-span-2">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Quick Actions</p>
          <p className="mb-4 text-xs text-ink-500">Jump straight into your most common tasks</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="primary" icon={Plus} onClick={() => navigate('/agent/properties/add')} className="justify-start">
              Add Property
            </Button>
            <Button variant="secondary" icon={MessagesSquare} onClick={() => navigate('/agent/inquiries')} className="justify-start">
              View Inquiries
            </Button>
            <Button variant="secondary" icon={UserPlus} onClick={() => navigate('/agent/crm/leads')} className="justify-start">
              Add Lead
            </Button>
            <Button variant="secondary" icon={CalendarPlus} onClick={() => navigate('/agent/crm/follow-ups')} className="justify-start">
              Schedule Follow-up
            </Button>
            <Button variant="dark" icon={TrendingUp} onClick={() => navigate('/agent/sales/overview')} className="col-span-2 justify-start">
              View Sales
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-lg border border-surface-200 bg-white shadow-card xl:col-span-3">
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <p className="text-sm font-semibold text-darkteal-800">Recent Inquiries</p>
            <button onClick={() => navigate('/agent/inquiries')} className="text-xs font-semibold text-teal-600 hover:underline">
              View all
            </button>
          </div>
          <div data-lenis-prevent="true" className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2.5 font-medium">Client</th>
                  <th className="px-5 py-2.5 font-medium">Property</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Priority</th>
                  <th className="px-5 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentInquiries.map((inq) => {
                  const property = findProperty(inq.propertyId)
                  return (
                    <tr key={inq.id} className="hover:bg-surface-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-darkteal-800">{inq.client.name}</p>
                        <p className="text-xs text-ink-400">{timeAgo(inq.dateReceived)}</p>
                      </td>
                      <td className="px-5 py-3 text-ink-600">{property?.name}</td>
                      <td className="px-5 py-3">
                        <StatusBadge label={inq.status} tone={inquiryStatusTone(inq.status)} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={inq.priority} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => navigate(`/agent/inquiries?open=${inq.id}`)}
                          className="text-xs font-semibold text-teal-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <p className="text-sm font-semibold text-darkteal-800">Upcoming Follow-ups</p>
            <button onClick={() => navigate('/agent/crm/follow-ups')} className="text-xs font-semibold text-teal-600 hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-surface-100">
            {upcomingFollowUps.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-darkteal-800">{f.clientName}</p>
                  <p className="text-xs text-ink-500">
                    {f.purpose} · {formatDate(f.date)}, {f.time}
                  </p>
                  <div className="mt-1">
                    <StatusBadge label={f.status} tone={followUpStatusTone(f.status)} size="sm" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs font-semibold">
                  <button onClick={() => navigate('/agent/crm/follow-ups')} className="flex items-center gap-1 text-teal-600 hover:underline">
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => completeFollowUp(f.id)} className="flex items-center gap-1 text-ink-500 hover:underline">
                    <Check size={12} /> Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
