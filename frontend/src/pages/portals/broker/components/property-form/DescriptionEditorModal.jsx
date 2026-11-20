import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from 'cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenLine, Check, RotateCcw } from 'lucide-react';

function stripHtml(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'clean'],
  ],
};

const QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'align',
  'link',
];

/**
 * Rich-text Description Editor Modal with standard editing tools (ReactQuill)
 * and visible plain-text character limit tracking.
 */
export default function DescriptionEditorModal({
  open,
  onOpenChange,
  title = 'Edit Description',
  subtitle = 'Use headings, bold text, and bullet points to make your description easy to scan.',
  initialValue = '',
  maxLength = 3000,
  placeholder = 'Write a clear, helpful description...',
  onSave,
}) {
  const [draftHtml, setDraftHtml] = useState(initialValue || '');

  useEffect(() => {
    if (open) {
      setDraftHtml(initialValue || '');
    }
  }, [open, initialValue]);

  const plainLength = useMemo(() => stripHtml(draftHtml).length, [draftHtml]);
  const isOverLimit = plainLength > maxLength;
  const isNearLimit = plainLength >= Math.floor(maxLength * 0.9);

  const handleChange = (content, _delta, _source, editor) => {
    const textLen = editor.getText().replace(/\n$/, '').length;
    if (textLen <= maxLength) {
      setDraftHtml(content);
    } else {
      // Allow edits that shorten text even if pasted over limit
      if (textLen < plainLength) {
        setDraftHtml(content);
      }
    }
  };

  const handleSave = () => {
    if (isOverLimit) return;
    const cleanText = stripHtml(draftHtml);
    onSave?.(cleanText.length === 0 ? '' : draftHtml);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-white border-[#E2E8F0] rounded-xl flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 bg-white border-b border-[#E2E8F0]">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center shrink-0">
                <PenLine className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#1E293B]">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B]">
                  {subtitle}
                </DialogDescription>
              </div>
            </div>

            <Badge
              className={cn(
                'border text-xs font-semibold tabular-nums',
                isOverLimit
                  ? 'bg-[#FFF5F5] text-[#FF6B6B] border-[#FF6B6B]/40'
                  : isNearLimit
                  ? 'bg-[#FFF5F5] text-[#FF6B6B] border-[#FF6B6B]/30'
                  : 'bg-[#F0FDFA] text-[#0F766E] border-[#0F766E]/20'
              )}
            >
              {plainLength} / {maxLength}
            </Badge>
          </div>
        </DialogHeader>

        {/* Rich Text Editor Body */}
        <div className="p-6 bg-[#F8FAFC] flex flex-col gap-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[#E2E8F0] [&_.ql-toolbar]:bg-[#F8FAFC] [&_.ql-container]:border-0 [&_.ql-editor]:min-h-60 [&_.ql-editor]:max-h-96 [&_.ql-editor]:text-sm [&_.ql-editor]:text-[#1E293B] [&_.ql-editor]:leading-relaxed">
            <ReactQuill
              theme="snow"
              value={draftHtml}
              onChange={handleChange}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder={placeholder}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
            <span>Standard formatting: Headings, Bold, Italic, Underline, Lists, Alignment & Links</span>
            <button
              type="button"
              onClick={() => setDraftHtml('')}
              className="inline-flex items-center gap-1 font-semibold text-[#475569] hover:text-[#1E293B] cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Clear text
            </button>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11 px-4 border-[#E2E8F0] text-[#1E293B] font-semibold rounded-lg cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isOverLimit}
            onClick={handleSave}
            className="min-h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold rounded-lg cursor-pointer"
          >
            <Check data-icon="inline-start" />
            Save Description
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
