import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, Clock, CheckCircle2, Percent } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import SummaryCard from '../../../components/agent/ui/SummaryCard.jsx'
import { MONTHLY_SALES, SALES_BY_TYPE, SALES_BY_STATUS, CONVERSION_FUNNEL, formatPHP } from '../../../data/agentMockData.js'

const PALETTE = ['#266F71', '#4F9B9C', '#7BB4B5', '#FB8E5D', '#174849', '#A2ABA8']

export default function SalesOverview() {
  const { transactions } = useApp()

  const completed = transactions.filter((t) => t.status === 'Completed')
  const totalSales = completed.reduce((sum, t) => sum + t.salePrice, 0)
  const monthlySales = completed.filter((t) => t.date.startsWith('2026-08')).reduce((sum, t) => sum + t.salePrice, 0)
  const pendingSales = transactions.filter((t) => t.status === 'Pending' || t.status === 'Processing').length
  const completedCount = completed.length
  const estimatedCommission = completed.reduce((sum, t) => sum + t.commission, 0)

  const salesByTypeData = SALES_BY_TYPE.filter((s) => s.value > 0)
  const salesByStatusData = SALES_BY_STATUS.filter((s) => s.value > 0)

  return (
    <div>
      <PageHeader title="Sales Overview" subtitle="Track your revenue performance and transaction pipeline." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={Wallet} label="Total Sales" value={formatPHP(totalSales)} sublabel="All completed transactions" accent="dark" />
        <SummaryCard icon={TrendingUp} label="Monthly Sales" value={formatPHP(monthlySales)} sublabel="August 2026" />
        <SummaryCard icon={Clock} label="Pending Sales" value={pendingSales} sublabel="Awaiting completion" accent="orange" />
        <SummaryCard icon={CheckCircle2} label="Completed Transactions" value={completedCount} sublabel="Fully closed deals" />
        <SummaryCard icon={Percent} label="Est. Commission" value={formatPHP(estimatedCommission)} sublabel="From completed sales" accent="dark" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Monthly Sales</p>
          <p className="mb-4 text-xs text-ink-500">Completed sale value by month</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SALES} margin={{ top: 0, right: 8, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E4E2DA" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={{ stroke: '#E4E2DA' }} tickLine={false} />
                <YAxis tickFormatter={(v) => `₱${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#5F6B68' }} axisLine={false} tickLine={false} width={54} />
                <Tooltip formatter={(v) => formatPHP(v)} contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} cursor={{ fill: '#F1F0EC' }} />
                <Bar dataKey="sales" fill="#266F71" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Sales by Property Type</p>
          <p className="mb-4 text-xs text-ink-500">Completed sale value by property category</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByTypeData} dataKey="value" nameKey="type" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {salesByTypeData.map((entry, idx) => (
                    <Cell key={entry.type} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatPHP(v)} contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Sales by Status</p>
          <p className="mb-4 text-xs text-ink-500">Number of transactions per status</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByStatusData} dataKey="value" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {salesByStatusData.map((entry, idx) => (
                    <Cell key={entry.status} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
          <p className="mb-1 text-sm font-semibold text-darkteal-800">Inquiry-to-Sale Conversion</p>
          <p className="mb-4 text-xs text-ink-500">Where inquiries drop off across your pipeline</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONVERSION_FUNNEL} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#E4E2DA" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5F6B68' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: '#5F6B68' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#E4E2DA', fontSize: 12 }} cursor={{ fill: '#F1F0EC' }} />
                <Bar dataKey="value" fill="#FB8E5D" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
