// Maps every status vocabulary in the app to one of a small set of tones so that
// only the approved palette (teal, dark teal, orange, neutral gray) is ever used.
// Tones: 'teal-solid' | 'teal-soft' | 'orange-solid' | 'orange-soft' | 'neutral' | 'dark'

export function propertyStatusTone(status) {
  switch (status) {
    case 'Available':
      return 'teal-soft'
    case 'Reserved':
      return 'orange-soft'
    case 'Sold':
      return 'dark'
    case 'Unavailable':
    default:
      return 'neutral'
  }
}

export function inquiryStatusTone(status) {
  switch (status) {
    case 'New':
      return 'orange-soft'
    case 'In Progress':
      return 'teal-soft'
    case 'Qualified':
      return 'teal-solid'
    case 'Follow-up':
      return 'orange-soft'
    case 'Converted':
      return 'dark'
    case 'Closed':
      return 'neutral'
    case 'Unqualified':
    default:
      return 'neutral'
  }
}

export function leadStatusTone(status) {
  switch (status) {
    case 'New':
      return 'orange-soft'
    case 'Contacted':
      return 'teal-soft'
    case 'Qualified':
      return 'teal-solid'
    case 'Negotiation':
      return 'orange-solid'
    case 'Converted':
      return 'dark'
    case 'Lost':
    default:
      return 'neutral'
  }
}

export function priorityTone(priority) {
  switch (priority) {
    case 'High':
      return 'orange-solid'
    case 'Medium':
      return 'teal-soft'
    case 'Low':
    default:
      return 'neutral'
  }
}

export function transactionStatusTone(status) {
  switch (status) {
    case 'Pending':
      return 'orange-soft'
    case 'Processing':
      return 'teal-soft'
    case 'Completed':
      return 'dark'
    case 'Cancelled':
    default:
      return 'neutral'
  }
}

export function followUpStatusTone(status) {
  switch (status) {
    case 'Today':
      return 'orange-solid'
    case 'Overdue':
      return 'orange-solid'
    case 'Upcoming':
      return 'teal-soft'
    case 'Completed':
    default:
      return 'dark'
  }
}

export function clientStatusTone(status) {
  switch (status) {
    case 'Active':
      return 'teal-solid'
    case 'Post-Sale Follow-up':
      return 'orange-soft'
    default:
      return 'neutral'
  }
}

export function eventTypeTone(type) {
  switch (type) {
    case 'Property Viewing':
      return 'teal-solid'
    case 'Client Meeting':
      return 'dark'
    case 'Online Meeting':
      return 'teal-soft'
    case 'Follow-up':
      return 'orange-soft'
    case 'Agent Consultation':
      return 'orange-solid'
    case 'Office Meeting':
    default:
      return 'neutral'
  }
}
