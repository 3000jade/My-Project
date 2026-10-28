import * as React from "react";
import { cva } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/utils/cn";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

export function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export function toast({ ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  const duration = props.duration || TOAST_REMOVE_DELAY;
  if (duration !== Infinity) {
    setTimeout(() => {
      dismiss();
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", toastId: id });
      }, 500);
    }, duration);
  }

  return {
    id,
    dismiss,
    update,
  };
}

export const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full font-sans",
  {
    variants: {
      variant: {
        default: "border-[#E2E8F0] bg-white text-[#1E293B] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100",
        primary: "border-[#0F766E]/20 bg-teal-50 text-[#0F766E] dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-200",
        coral: "border-[#FF6B6B]/20 bg-rose-50 text-[#1E293B] dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200",
        destructive: "border-red-200 bg-red-50 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Toast({ className, variant, title, description, action, onClose, open = true, ...props }) {
  if (!open) return null;

  const Icon = variant === 'success' ? CheckCircle2 :
               variant === 'destructive' ? AlertCircle :
               variant === 'primary' ? Info : null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="broker-toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3 flex-1">
        {Icon && <Icon className="w-5 h-5 shrink-0 mt-0.5" />}
        <div className="grid gap-1">
          {title && <div className="text-sm font-bold tracking-tight">{title}</div>}
          {description && <div className="text-xs opacity-90">{description}</div>}
        </div>
      </div>
      {action}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0F766E] cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      data-testid="broker-toaster"
      className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none"
    >
      {toasts.map(({ id, title, description, variant, action, open }) => (
        <Toast
          key={id}
          open={open}
          variant={variant}
          title={title}
          description={description}
          action={action}
          onClose={() => dismiss(id)}
        />
      ))}
    </div>
  );
}

export default Toast;
