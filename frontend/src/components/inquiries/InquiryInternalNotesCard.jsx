import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Textarea,
  ShadcnButton as Button,
} from '../ui';

export default function InquiryInternalNotesCard({
  notes = [],
  onAddNote,
  adding = false,
}) {
  const [noteText, setNoteText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !onAddNote) return;
    const trimmed = noteText.trim();
    setNoteText('');
    await onAddNote(trimmed);
  };

  return (
    <Card className="bg-surface border border-outline shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 border-b border-outline">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-amber-600 shrink-0" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface">
            Private Internal Notes
          </CardTitle>
        </div>
        <Badge variant="warning">Staff Only</Badge>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto" data-lenis-prevent="true">
          {notes.length > 0 ? (
            notes.map((n, idx) => (
              <div
                key={n.id || idx}
                className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2 text-amber-800 font-medium">
                  <span>{n.authorName || n.author_name || 'Staff'}</span>
                  <span className="tabular-nums">
                    {n.timestamp ? String(n.timestamp).substring(0, 10) : 'Recent'}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{n.content}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-2">
              No internal notes recorded yet.
            </p>
          )}
        </div>

        {onAddNote && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t border-outline">
            <Textarea
              aria-label="Private internal note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add confidential client note (hidden from client)..."
              rows={2}
              className="min-h-[72px] resize-none text-sm"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={adding || !noteText.trim()}
              className="w-full h-11"
            >
              {adding ? 'Saving...' : 'Save Private Note'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
