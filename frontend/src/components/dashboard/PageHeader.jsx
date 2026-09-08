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
    <div className={`mb-8 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-400">/</span>}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-[#266F71] transition-colors"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#174849]">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm font-sans text-gray-600 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center flex-wrap gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
