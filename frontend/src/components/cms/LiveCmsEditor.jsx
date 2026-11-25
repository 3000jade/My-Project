import React, { createContext, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Check, X, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Editable, EditablePreview, EditableInput } from '@/components/ui/editable';

const LiveEditContext = createContext({
  isAdmin: false,
  isEditing: false,
  setIsEditing: () => { },
});

export function useLiveEdit() {
  return useContext(LiveEditContext);
}

export function LiveEditProvider({
  children,
  defaultEditing = false,
  editing: controlledEditing,
  onEditingChange,
  forceAdmin = false,
}) {
  const { user } = useAuth();
  const isAdmin = forceAdmin || user?.role === 'admin';
  const [internalEditing, setInternalEditing] = useState(defaultEditing);

  const isControlled = controlledEditing !== undefined;
  const rawEditing = isControlled ? controlledEditing : internalEditing;
  const setIsEditing = (next) => {
    const resolved = typeof next === 'function' ? next(rawEditing) : next;
    if (!isControlled) {
      setInternalEditing(resolved);
    }
    if (onEditingChange) {
      onEditingChange(resolved);
    }
  };

  return (
    <LiveEditContext.Provider
      value={{
        isAdmin,
        isEditing: isAdmin && rawEditing,
        setIsEditing,
      }}
    >
      {children}
    </LiveEditContext.Provider>
  );
}

export function LiveEditFloatingBar() {
  const { isAdmin, isEditing, setIsEditing } = useContext(LiveEditContext);

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-white border border-[#E2E8F0] shadow-xl p-2">
      <Button
        type="button"
        onClick={() => setIsEditing((prev) => !prev)}
        className={
          isEditing
            ? 'rounded-full bg-[#0F766E] hover:bg-[#115E59] text-white h-10 px-4 gap-2'
            : 'rounded-full bg-[#1E293B] hover:bg-[#0F766E] text-white h-10 px-4 gap-2'
        }
      >
        {isEditing ? <Check className="size-4" /> : <Pencil className="size-4" />}
        <span>{isEditing ? 'Done Editing' : 'Edit Page'}</span>
      </Button>
      <Link to="/admin/cms">
        <Button type="button" variant="outline" className="rounded-full h-10 px-4 gap-2">
          <LayoutGrid className="size-4" />
          <span>CMS Desk</span>
        </Button>
      </Link>
    </div>
  );
}

export function LiveEditableText({
  value,
  onSave,
  placeholder = 'Click to edit...',
  className = '',
  multiline = false,
  ariaLabel,
  children,
}) {
  const { isEditing } = useContext(LiveEditContext);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value || '');

  if (!isEditing) {
    return children !== undefined ? children : value;
  }

  if (multiline) {
    if (!isOpen) {
      return (
        <button
          type="button"
          aria-label={ariaLabel || placeholder}
          onClick={() => {
            setDraft(value || '');
            setIsOpen(true);
          }}
          className={`block w-full text-left border border-dashed border-[#0F766E]/60 bg-[#CCFBF1]/20 hover:bg-[#CCFBF1]/40 rounded-lg px-2 py-1 transition-colors cursor-pointer ${!value ? 'italic text-[#64748B]' : ''
            } ${className}`}
        >
          {value || placeholder}
        </button>
      );
    }

    const commit = () => {
      setIsOpen(false);
      if (onSave && draft !== (value || '')) {
        onSave(draft);
      }
    };

    return (
      <div className="w-full space-y-2">
        <Textarea
          rows={4}
          autoFocus
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setDraft(value || '');
              setIsOpen(false);
            }
          }}
          className="w-full bg-white text-sm text-[#1E293B]"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={commit}
            className="bg-[#0F766E] hover:bg-[#115E59] text-white h-8 px-3 gap-1"
          >
            <Check className="size-3.5" />
            <span>Save</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(value || '');
              setIsOpen(false);
            }}
            className="h-8 px-3 gap-1"
          >
            <X className="size-3.5" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Editable
      value={value || ''}
      placeholder={placeholder}
      onSave={onSave}
      className="w-full"
    >
      <EditablePreview
        aria-label={ariaLabel || 'Edit value'}
        className={`border border-dashed border-[#0F766E]/60 bg-[#CCFBF1]/20 rounded-lg px-2 py-1 ${className}`}
      />
      <EditableInput className="w-full min-w-[180px]" />
    </Editable>
  );
}
