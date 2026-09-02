const VARIANTS = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600 focus-visible:outline-teal-700 shadow-sm',
  dark: 'bg-darkteal-800 text-white hover:bg-darkteal-900 shadow-sm',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
  secondary: 'bg-white text-darkteal-800 border border-surface-300 hover:bg-surface-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-surface-200',
  ghostTeal: 'bg-transparent text-teal-600 hover:bg-teal-50',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export default function Button({
  as: Component = 'button',
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </Component>
  )
}
