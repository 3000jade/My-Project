import { useState } from 'react'
import { FileBarChart2, Download } from 'lucide-react'
import { useApp } from '../../../context/AgentContext.jsx'
import PageHeader from '../../../components/agent/ui/PageHeader.jsx'
import Button from '../../../components/agent/ui/Button.jsx'
import FilterDropdown from '../../../components/agent/ui/FilterDropdown.jsx'
import EmptyState from '../../../components/agent/ui/EmptyState.jsx'
import { PROPERTY_TYPES, TRANSACTION_STATUSES, findProperty, formatPHP, formatDate } from '../../../data/agentMockData.js'

export default function SalesReports() {
  const { transactions, showToast } = useApp()
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-08-27')
  const [propertyType, setPropertyType] = useState('All')
  const [status, setStatus] = useState('All')
  const [report, setReport] = useState(null)

  function computeFiltered() {
    return transactions.filter((t) => {
      const property = findProperty(t.propertyId)
      const inRange = t.date >= dateFrom && t.date <= dateTo
      const matchesType = propertyType === 'All' || property?.type === propertyType
      const matchesStatus = status === 'All' || t.status === status
      return inRange && matchesType && matchesStatus
    })
  }

  function handleGenerate() {
    const filtered = computeFiltered()
    const completed = filtered.filter((t) => t.status === 'Completed')
    const totalSales = completed.reduce((sum, t) => sum + t.salePrice, 0)
    const totalRevenue = filtered.reduce((sum, t) => sum + t.salePrice, 0)
    const commission = completed.reduce((sum, t) => sum + t.commission, 0)
    const averageSaleValue = completed.length ? totalSales / completed.length : 0
    const conversionRate = filtered.length ? (completed.length / filtered.length) * 100 : 0

    setReport({
      filtered,
      totalSales,
      totalRevenue,
      numberOfTransactions: filtered.length,
      averageSaleValue,
      commission,
      conversionRate,
    })
  }

  function handleExport() {
    const filtered = report?.filtered ?? computeFiltered()
    if (filtered.length === 0) {
      showToast('Nothing to export for the current filters.', 'danger')
      return
    }
    const header = ['Transaction ID', 'Property', 'Client', 'Sale Price', 'Status', 'Date', 'Commission']
    const rows = filtered.map((t) => [
      t.id,
      findProperty(t.propertyId)?.name ?? '',
      t.clientName,
      t.salePrice,
      t.status,
      t.date,
      t.commission,
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${dateFrom}-to-${dateTo}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast('Report exported as CSV.')
  }

  return (
    <div>
      <PageHeader title="Sales Reports" subtitle="Generate a custom sales report and export it for your records." />

      <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-card">
        <p className="mb-3 text-sm font-semibold text-darkteal-800">Report Filters</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-surface-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-surface-300 px-3 py-2 text-sm" />
          </div>
          <FilterDropdown label="Property Type" value={propertyType} onChange={setPropertyType} options={['All', ...PROPERTY_TYPES]} className="w-52" />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={['All', ...TRANSACTION_STATUSES]} className="w-44" />
          <Button variant="primary" icon={FileBarChart2} onClick={handleGenerate}>
            Generate Report
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export Report
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {!report ? (
          <EmptyState
            icon={FileBarChart2}
            title="No report generated yet"
            message="Set your filters above and click Generate Report to see results."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {[
                { label: 'Total Sales', value: formatPHP(report.totalSales) },
                { label: 'Transactions', value: report.numberOfTransactions },
                { label: 'Total Revenue', value: formatPHP(report.totalRevenue) },
                { label: 'Avg. Sale Value', value: formatPHP(Math.round(report.averageSaleValue)) },
                { label: 'Commission', value: formatPHP(report.commission) },
                { label: 'Conversion Rate', value: `${report.conversionRate.toFixed(0)}%` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-surface-200 bg-white p-4 shadow-card">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{m.label}</p>
                  <p className="mt-1 text-lg font-bold text-darkteal-800">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
              <div className="border-b border-surface-100 px-5 py-4">
                <p className="text-sm font-semibold text-darkteal-800">Transactions in this Report</p>
              </div>
              {report.filtered.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-400">No transactions match these filters.</p>
              ) : (
                <div data-lenis-prevent="true" className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-ink-400">
                        <th className="px-4 py-2.5 font-medium">Property</th>
                        <th className="px-4 py-2.5 font-medium">Client</th>
                        <th className="px-4 py-2.5 font-medium">Sale Price</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {report.filtered.map((t) => (
                        <tr key={t.id}>
                          <td className="px-4 py-2.5 font-medium text-darkteal-800">{findProperty(t.propertyId)?.name}</td>
                          <td className="px-4 py-2.5 text-ink-600">{t.clientName}</td>
                          <td className="px-4 py-2.5 text-ink-600">{formatPHP(t.salePrice)}</td>
                          <td className="px-4 py-2.5 text-ink-600">{t.status}</td>
                          <td className="px-4 py-2.5 text-ink-500">{formatDate(t.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
