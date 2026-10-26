import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Modern SaaS AuthLayout
 * Split-screen design:
 * - Left column: High-end architectural brand imagery and tagline
 * - Right column: Clean form container with modern SaaS tokens
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88',
  tagline = 'Human Shelter Realty',
  slogan = 'Exclusive properties, intelligent workflows.'
}) {
  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row m-0 p-0 overflow-x-hidden font-sans bg-[#F8FAFC]">
      {/* Left: Architectural Visual Showcase (hidden on mobile, 50% on lg) */}
      <section className="relative hidden lg:flex lg:w-1/2 min-h-screen bg-[#0F766E] overflow-hidden">
        <img
          src={heroImage}
          alt="Modern Architectural Interior"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.78] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F766E]/95 via-[#0F766E]/40 to-black/30 pointer-events-none" />

        <div className="relative z-10 w-full h-full p-12 lg:p-16 flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white">
              <span className="font-serif text-2xl font-bold tracking-tight">Human Shelter</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest font-mono">Realty</span>
            </Link>
          </div>

          <div className="max-w-md space-y-4 text-white">
            <h1 className="font-serif text-3xl lg:text-4xl font-normal leading-tight">
              {tagline}
            </h1>
            <p className="text-sm text-slate-200 font-normal leading-relaxed">
              {slogan}
            </p>
            <div className="flex items-center gap-2 pt-2" aria-hidden="true">
              <span className="w-8 h-1 rounded-full bg-white" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Right: Modern SaaS Form Card Container */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-10 shadow-sm space-y-6">
          {/* Header Mobile Brand Link */}
          <div className="lg:hidden mb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-[#0F766E]">
              <span className="font-serif text-xl font-bold">Human Shelter</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F766E]/10 uppercase tracking-wider font-mono">Realty</span>
            </Link>
          </div>

          <div className="space-y-1.5 text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E293B]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#64748B]">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
