import React, { createContext, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Check, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Editable, EditablePreview, EditableInput } from '@/components/ui/editable';

const LiveEditContext = createContext({
  isAdmin: false,
  isEditing: false,
  setIsEditing: () => {},
});

export function LiveEditProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);

  return (
    <LiveEditContext.Provider
      value={{
        isAdmin,
        isEditing: isAdmin && isEditing,
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
  children,
}) {
  const { isEditing } = useContext(LiveEditContext);

  if (!isEditing) {
    return children !== undefined ? children : value;
  }

  return (
    <Editable
      value={value || ''}
      placeholder={placeholder}
      onSave={onSave}
      className="w-full"
    >
      <EditablePreview
        className={`border border-dashed border-[#0F766E]/60 bg-[#CCFBF1]/20 rounded-lg px-2 py-1 ${className}`}
      />
      <EditableInput className="w-full min-w-[220px]" />
    </Editable>
  );
}
