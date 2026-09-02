import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  PROPERTIES,
  INQUIRIES,
  LEADS,
  CLIENTS,
  FOLLOW_UPS,
  SCHEDULE_EVENTS,
  TRANSACTIONS,
  NOTIFICATIONS,
  AGENT,
} from '../data/agentMockData.js'

const AppContext = createContext(null)

let idCounter = 1000
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function AppProvider({ children }) {
  const [agent, setAgent] = useState(AGENT)
  const [properties, setProperties] = useState(PROPERTIES)
  const [inquiries, setInquiries] = useState(INQUIRIES)
  const [leads, setLeads] = useState(LEADS)
  const [clients, setClients] = useState(CLIENTS)
  const [followUps, setFollowUps] = useState(FOLLOW_UPS)
  const [scheduleEvents, setScheduleEvents] = useState(SCHEDULE_EVENTS)
  const [transactions, setTransactions] = useState(TRANSACTIONS)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [toasts, setToasts] = useState([])

  // ---------- Toasts ----------
  const showToast = useCallback((message, variant = 'success') => {
    const id = nextId('toast')
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---------- Notifications ----------
  const addNotification = useCallback((type, title, message) => {
    setNotifications((prev) => [
      { id: nextId('NT'), type, title, message, time: new Date().toISOString(), read: false },
      ...prev,
    ])
  }, [])
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  // ---------- Agent profile ----------
  const updateAgent = useCallback(
    (patch) => {
      setAgent((prev) => ({ ...prev, ...patch }))
      showToast('Profile updated successfully.')
    },
    [showToast]
  )

  // ---------- Properties ----------
  const addProperty = useCallback(
    (data) => {
      const property = {
        id: nextId('PR'),
        inquiryCount: 0,
        leadCount: 0,
        dateListed: new Date().toISOString().slice(0, 10),
        images: data.images?.length ? data.images : ['placeholder'],
        ...data,
      }
      setProperties((prev) => [property, ...prev])
      showToast('Property saved successfully.')
      addNotification('status', 'Property listed', `${property.name} was added to your listings.`)
      return property
    },
    [showToast, addNotification]
  )

  const updateProperty = useCallback(
    (id, patch) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      showToast('Property updated.')
    },
    [showToast]
  )

  const deleteProperty = useCallback(
    (id) => {
      setProperties((prev) => prev.filter((p) => p.id !== id))
      showToast('Property deleted.', 'danger')
    },
    [showToast]
  )

  const changePropertyStatus = useCallback(
    (id, status) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      const property = properties.find((p) => p.id === id)
      addNotification('status', 'Property status changed', `${property?.name ?? 'Property'} changed to ${status}.`)
      showToast(`Property marked as ${status}.`)
    },
    [properties, showToast, addNotification]
  )

  // ---------- Inquiries ----------
  const addInquiry = useCallback(
    (data) => {
      const now = new Date().toISOString()
      const inquiry = {
        id: nextId('INQ'),
        status: 'New',
        dateReceived: now,
        lastActivity: now,
        aiHandled: true,
        messages: [{ id: nextId('m'), sender: 'client', text: data.message, time: now }],
        activity: [{ time: now, label: 'Inquiry logged by agent' }],
        ...data,
      }
      setInquiries((prev) => [inquiry, ...prev])
      addNotification('inquiry', 'New property inquiry', `${data.client.name} inquired about a listing.`)
      showToast('Inquiry logged successfully.')
      return inquiry
    },
    [addNotification, showToast]
  )

  const updateInquiryStatus = useCallback(
    (id, status) => {
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === id
            ? {
                ...inq,
                status,
                lastActivity: new Date().toISOString(),
                activity: [...inq.activity, { time: new Date().toISOString(), label: `Status changed to ${status}` }],
              }
            : inq
        )
      )
      showToast(`Inquiry status updated to ${status}.`)
    },
    [showToast]
  )

  const updateInquiryPriority = useCallback(
    (id, priority) => {
      setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, priority } : inq)))
      showToast(`Priority updated to ${priority}.`)
    },
    [showToast]
  )

  const sendInquiryMessage = useCallback((id, sender, text) => {
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== id) return inq
        const time = new Date().toISOString()
        const label =
          sender === 'agent' ? 'Agent sent response' : sender === 'note' ? 'Agent added internal note' : 'Client replied'
        return {
          ...inq,
          lastActivity: time,
          messages: [...inq.messages, { id: nextId('m'), sender, text, time }],
          activity: [...inq.activity, { time, label }],
          status: inq.status === 'New' && sender === 'agent' ? 'In Progress' : inq.status,
        }
      })
    )
  }, [])

  const setInquiryAiHandling = useCallback((id, aiHandled) => {
    setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, aiHandled } : inq)))
  }, [])

  const closeInquiry = useCallback(
    (id) => {
      updateInquiryStatus(id, 'Closed')
    },
    [updateInquiryStatus]
  )

  const reopenInquiry = useCallback(
    (id) => {
      updateInquiryStatus(id, 'In Progress')
    },
    [updateInquiryStatus]
  )

  const convertInquiryToLead = useCallback(
    (inquiry, extra = {}) => {
      const lead = {
        id: nextId('LD'),
        name: inquiry.client.name,
        email: inquiry.client.email,
        phone: inquiry.client.phone,
        budget: extra.budget ?? null,
        preferredLocation: extra.preferredLocation ?? '',
        propertyPreferences: extra.propertyPreferences ?? inquiry.inquiryType,
        interestedPropertyIds: [inquiry.propertyId],
        status: 'New',
        priority: inquiry.priority,
        lastContact: new Date().toISOString().slice(0, 10),
        nextFollowUp: null,
        sourceInquiryId: inquiry.id,
        communicationHistory: [],
        followUpHistory: [],
        activity: [{ time: new Date().toISOString(), label: `Converted from inquiry ${inquiry.id}` }],
      }
      setLeads((prev) => [lead, ...prev])
      updateInquiryStatus(inquiry.id, 'Converted')
      addNotification('lead', 'New lead created', `${lead.name} was converted from an inquiry into a new CRM lead.`)
      showToast('Inquiry successfully converted to lead.')
      return lead
    },
    [updateInquiryStatus, addNotification, showToast]
  )

  // ---------- Leads ----------
  const addLead = useCallback(
    (data) => {
      const lead = {
        id: nextId('LD'),
        status: 'New',
        lastContact: new Date().toISOString().slice(0, 10),
        nextFollowUp: null,
        sourceInquiryId: null,
        communicationHistory: [],
        followUpHistory: [],
        activity: [{ time: new Date().toISOString(), label: 'Lead added manually' }],
        interestedPropertyIds: [],
        ...data,
      }
      setLeads((prev) => [lead, ...prev])
      showToast('Lead added successfully.')
      return lead
    },
    [showToast]
  )

  const updateLead = useCallback(
    (id, patch) => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      showToast('Lead updated.')
    },
    [showToast]
  )

  const addLeadNote = useCallback((id, note) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, activity: [{ time: new Date().toISOString(), label: `Note: ${note}` }, ...l.activity] }
          : l
      )
    )
  }, [])

  const convertLeadToClient = useCallback(
    (lead) => {
      const client = {
        id: nextId('CL'),
        name: lead.name,
        contact: lead.phone,
        email: lead.email,
        propertyId: lead.interestedPropertyIds?.[0] ?? null,
        status: 'Active',
        assignedAgent: AGENT.name,
        lastActivity: new Date().toISOString().slice(0, 10),
      }
      setClients((prev) => [client, ...prev])
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: 'Converted' } : l)))
      addNotification('lead', 'Lead converted', `${lead.name} is now a client.`)
      showToast(`${lead.name} converted to client.`)
      return client
    },
    [addNotification, showToast]
  )

  const closeLead = useCallback(
    (id) => {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Lost' } : l)))
      showToast('Lead marked as lost.', 'danger')
    },
    [showToast]
  )

  // ---------- Clients ----------
  const updateClient = useCallback(
    (id, patch) => {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
      showToast('Client updated.')
    },
    [showToast]
  )

  // ---------- Follow-ups ----------
  const addFollowUp = useCallback(
    (data) => {
      const followUp = {
        id: nextId('FU'),
        status: 'Upcoming',
        ...data,
      }
      setFollowUps((prev) => [followUp, ...prev])
      addNotification('followup', 'Follow-up scheduled', `Follow-up with ${data.clientName} set for ${data.date} ${data.time}.`)
      showToast('Follow-up scheduled.')
      return followUp
    },
    [addNotification, showToast]
  )

  const completeFollowUp = useCallback(
    (id) => {
      setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'Completed' } : f)))
      showToast('Follow-up marked as complete.')
    },
    [showToast]
  )

  const rescheduleFollowUp = useCallback(
    (id, date, time) => {
      setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, date, time, status: 'Upcoming' } : f)))
      showToast('Follow-up rescheduled.')
    },
    [showToast]
  )

  // ---------- Schedule ----------
  const addScheduleEvent = useCallback(
    (data) => {
      const event = { id: nextId('EV'), ...data }
      setScheduleEvents((prev) => [event, ...prev])
      addNotification('meeting', 'Meeting scheduled', `${data.type} with ${data.client} on ${data.date} at ${data.time}.`)
      showToast('Meeting scheduled successfully.')
      return event
    },
    [addNotification, showToast]
  )

  // ---------- Transactions ----------
  const updateTransactionStatus = useCallback(
    (id, status) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      showToast(`Transaction marked as ${status}.`)
    },
    [showToast]
  )

  const addTransaction = useCallback(
    (data) => {
      const tx = { id: nextId('TX'), status: 'Pending', ...data }
      setTransactions((prev) => [tx, ...prev])
      showToast('Transaction recorded.')
      return tx
    },
    [showToast]
  )

  const value = {
    agent,
    updateAgent,
    properties,
    inquiries,
    leads,
    clients,
    followUps,
    scheduleEvents,
    transactions,
    notifications,
    unreadCount,
    toasts,
    showToast,
    dismissToast,
    markNotificationRead,
    markAllNotificationsRead,
    addProperty,
    updateProperty,
    deleteProperty,
    changePropertyStatus,
    addInquiry,
    updateInquiryStatus,
    updateInquiryPriority,
    sendInquiryMessage,
    setInquiryAiHandling,
    closeInquiry,
    reopenInquiry,
    convertInquiryToLead,
    addLead,
    updateLead,
    addLeadNote,
    convertLeadToClient,
    closeLead,
    updateClient,
    addFollowUp,
    completeFollowUp,
    rescheduleFollowUp,
    addScheduleEvent,
    updateTransactionStatus,
    addTransaction,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider or AgentProvider')
  return ctx
}

export const AgentProvider = AppProvider
export const useAgent = useApp

