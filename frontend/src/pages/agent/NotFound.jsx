import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import EmptyState from '../../components/agent/ui/EmptyState.jsx'
import Button from '../../components/agent/ui/Button.jsx'

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      message="The page you’re looking for doesn’t exist or may have moved."
      action={
        <Button as={Link} to="/agent" variant="primary">
          Back to Dashboard
        </Button>
      }
    />
  )
}
