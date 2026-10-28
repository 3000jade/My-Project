import * as React from "react";
import { Edit2, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

const EditableContext = React.createContext({
  isEditing: false,
  value: "",
  setValue: () => {},
  submit: () => {},
  cancel: () => {},
  startEditing: () => {},
});

export function Editable({
  value: controlledValue,
  defaultValue = "",
  onSave,
  onCancel,
  children,
  className,
  placeholder = "Click to edit...",
  disabled = false,
  ...props
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(
    controlledValue !== undefined ? controlledValue : defaultValue
  );

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setDraftValue(controlledValue);
    }
  }, [controlledValue]);

  const startEditing = () => {
    if (disabled) return;
    setDraftValue(value);
    setIsEditing(true);
  };

  const submit = () => {
    if (controlledValue === undefined) {
      setInternalValue(draftValue);
    }
    setIsEditing(false);
    if (onSave) onSave(draftValue);
  };

  const cancel = () => {
    setDraftValue(value);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  const contextValue = {
    isEditing,
    value: draftValue,
    originalValue: value,
    setValue: setDraftValue,
    submit,
    cancel,
    startEditing,
    placeholder,
    disabled,
  };

  return (
    <EditableContext.Provider value={contextValue}>
      <div
        data-testid="broker-editable"
        className={cn("inline-flex items-center gap-1.5 font-sans relative", className)}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <EditablePreview />
            <EditableInput />
          </>
        )}
      </div>
    </EditableContext.Provider>
  );
}

export function EditablePreview({ className, ...props }) {
  const { isEditing, originalValue, startEditing, placeholder, disabled } =
    React.useContext(EditableContext);

  if (isEditing) return null;

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={disabled}
      aria-label="Edit value"
      className={cn(
        "group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[#1E293B] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-[#E2E8F0] dark:hover:border-slate-700",
        !originalValue && "text-[#64748B] dark:text-slate-400 italic",
        className
      )}
      {...props}
    >
      <span>{originalValue || placeholder}</span>
      {!disabled && (
        <Edit2 className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export function EditableInput({ className, ...props }) {
  const { isEditing, value, setValue, submit, cancel, disabled } =
    React.useContext(EditableContext);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!isEditing) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-8 px-2 text-sm rounded-md border border-[#0F766E] bg-white dark:bg-slate-900 text-[#1E293B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 shadow-2xs",
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={submit}
        aria-label="Save value"
        className="h-8 w-8 rounded-md bg-[#0F766E] hover:bg-[#115E59] text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={cancel}
        aria-label="Cancel editing"
        className="h-8 w-8 rounded-md bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-100 text-[#64748B] flex items-center justify-center transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Editable;
