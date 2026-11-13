import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function InternalNotesRail({
  notes = [],
  onAddNote,
  addingNote = false,
}) {
  const [noteText, setNoteText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = noteText.trim();
    if (!trimmed || !onAddNote) return;
    await onAddNote(trimmed);
    setNoteText('');
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] font-sans">
          Internal Staff Notes
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Private</span>
        </span>
      </div>

      <p className="text-[11px] text-amber-900 bg-amber-50/70 border border-amber-200/80 rounded-lg px-2.5 py-1.5 font-sans">
        Private — Never visible to clients or the AI Concierge.
      </p>

      <div className="space-y-2 max-h-40 overflow-y-auto" data-lenis-prevent="true">
        {notes && notes.length > 0 ? (
          notes.map((n, i) => (
            <div
              key={n.id || i}
              className="p-2.5 bg-amber-50/60 rounded border border-amber-200/60 text-xs space-y-1"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-800">
                <strong>{n.authorName || n.author_name || 'Staff'}</strong>
                <span>{n.timestamp ? String(n.timestamp).substring(0, 10) : 'Recent'}</span>
              </div>
              <p className="text-[#1E293B] font-sans">{n.content}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-[#64748B] italic text-center py-2">
            No internal notes recorded yet.
          </p>
        )}
      </div>

      {onAddNote && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add confidential client note..."
            rows={2}
            className="w-full p-2.5 border border-[#E2E8F0] rounded text-xs font-sans outline-none focus:border-[#0F766E] resize-none text-[#1E293B]"
          />
          <button
            type="submit"
            disabled={addingNote || !noteText.trim()}
            className="w-full py-1.5 bg-[#1E293B] hover:bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider font-sans transition-colors disabled:opacity-50 cursor-pointer"
          >
            {addingNote ? 'Saving...' : 'Save Private Note'}
          </button>
        </form>
      )}
    </div>
  );
}
