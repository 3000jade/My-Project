import { formatPHP } from '../../data/agentMockData.js'

export function buildAiSuggestion(inquiry, property) {
  const name = property?.name ?? 'this property'
  switch (inquiry.inquiryType) {
    case 'Property Availability':
      return `Yes, ${name} is currently ${property?.status === 'Available' ? 'available' : property?.status?.toLowerCase()}. Would you like to schedule a viewing this week?`
    case 'Price Inquiry':
      return `${name} is priced at ${formatPHP(property?.price)}. I can send a full breakdown of fees and financing options if you'd like.`
    case 'Property Details':
      return `${name} has ${property?.bedrooms ?? 0} bedroom(s), ${property?.bathrooms ?? 0} bathroom(s), and ${
        property?.floorArea || property?.lotArea
      } sqm of space. Let me know if you'd like the full specifications sheet.`
    case 'Viewing Request':
      return `We have viewing slots open this week for ${name}. Would Saturday at 2:00 PM work for you, or would you prefer a different day?`
    case 'Financing Question':
      return `We offer both in-house and bank/Pag-IBIG financing for ${name}. Would you like me to prepare a sample computation based on your preferred down payment?`
    case 'General Inquiry':
    default:
      return `Thanks for reaching out about ${name}! Let me know if you have any specific questions and I'll be glad to help.`
  }
}
