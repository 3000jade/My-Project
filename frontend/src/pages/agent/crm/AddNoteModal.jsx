import { useState } from 'react'
import Modal from '../../../components/agent/ui/Modal.jsx'
import Button from '../../../components/agent/ui/Button.jsx'

export default function AddNoteModal({ open, onClose, onSave }) {
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!note.trim()) return
    onSave(note.trim())
    setNote('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Note"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Note
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <textarea
          autoFocus
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a note about this lead..."
          className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </form>
    </Modal>
  )
}
