import { Link } from 'react-router-dom';

export default function AuthShowcasePanel() {
  return (
    <section
      aria-label="Human Shelter Realty overview"
      className="hidden lg:flex lg:w-1/2 p-4 lg:p-6 bg-background"
    >
      <div className="relative w-full min-h-full rounded-2xl overflow-hidden bg-slate-900 text-white shadow-xs">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85"
          alt="Modern residential architecture"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between size-full p-8 lg:p-12">
          <Link
            to="/"
            aria-label="Human Shelter Realty Home"
            className="relative inline-flex items-center self-start rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-full bg-white/80 blur-xl"
            />
            <img
              src="/images/human-shelter-logo.webp"
              alt="Human Shelter Realty"
              className="relative z-10 h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]"
            />
          </Link>

          <div className="max-w-md flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tertiary-container">
              <span className="w-6 h-0.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
              <span>Est. 1989</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-white">
              Selling Homes, Building Dreams
              <span className="text-accent">.</span>
            </h1>
            <p className="text-sm text-white/90 leading-relaxed">
              Human Shelter Realty — helping Filipino families find the right home since 1989.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
