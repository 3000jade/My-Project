import StatusBadge from './StatusBadge.jsx'
import { priorityTone } from '../../../utils/agent/tone.js'

export default function PriorityBadge({ priority, size = 'md' }) {
  return <StatusBadge label={priority} tone={priorityTone(priority)} size={size} />
}
