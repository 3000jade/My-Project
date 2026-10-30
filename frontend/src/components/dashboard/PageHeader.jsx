import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  className = ""
}) {
  return (
    <div className={`mb-8 min-w-0 max-w-full ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-400">/</span>}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#0F766E] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-800 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#1E293B] tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm lg:text-base text-[#64748B] max-w-3xl min-w-0 break-words">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto min-w-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
