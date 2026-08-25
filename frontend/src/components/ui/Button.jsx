import React from 'react';
import { Link } from 'react-router-dom';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  to,
  className = '', 
  ...props 
}) {
  // Base classes for typography and standard premium button effects
  const baseClasses = "font-bold uppercase tracking-widest font-sans transition-colors flex items-center justify-center gap-2";
  
  // Apply premium-btn class only to non-text variants
  const premiumClass = variant === 'text' ? '' : 'premium-btn';
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    cta: "bg-accent text-white hover:bg-accent/90",
    secondary: "bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20",
    teal: "bg-primary text-white hover:bg-primary/90",
    text: "nav-link text-primary hover:text-primary/80",
    outline: "bg-surface-container-low border border-outline-variant/30 text-tertiary hover:bg-surface-container"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-[11px] rounded-full",
    md: "px-8 py-3 text-xs rounded-full",
    lg: "px-12 py-4 text-sm rounded-full",
    icon: "p-2 rounded-full",
    full: "w-full py-4 text-xs rounded-full"
  };

  // If text variant, remove the large padding
  const finalSize = variant === 'text' ? 'text-xs' : sizes[size];
  
  const combinedClasses = `${baseClasses} ${premiumClass} ${variants[variant] || variants.primary} ${finalSize} ${className}`.trim();

  const innerContent = (
    <>
      {children}
      {icon && <span className="material-symbols-outlined">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {innerContent}
    </button>
  );
}
