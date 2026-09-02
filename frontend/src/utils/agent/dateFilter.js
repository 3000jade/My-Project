const NOW = new Date('2026-08-27T10:00:00')

export function withinDateFilter(dateStr, filter, from, to) {
  const d = new Date(dateStr)
  if (filter === 'All') return true
  if (filter === 'Today') return d.toDateString() === NOW.toDateString()
  if (filter === 'This Week') {
    const weekAgo = new Date(NOW)
    weekAgo.setDate(NOW.getDate() - 7)
    return d >= weekAgo && d <= NOW
  }
  if (filter === 'This Month') return d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear()
  if (filter === 'Custom Range') {
    if (!from || !to) return true
    return d >= new Date(from) && d <= new Date(to + 'T23:59:59')
  }
  return true
}

export const DATE_FILTER_OPTIONS = ['All', 'Today', 'This Week', 'This Month', 'Custom Range']
