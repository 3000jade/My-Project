

export default function Footer() {
  return (
    <footer className="bg-tertiary text-on-tertiary pt-24 lg:pt-32 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 py-24 lg:py-36 px-5 md:px-10 lg:px-20 max-w-[1440px] mx-auto border-t border-white/10">
        <div className="space-y-6">
          <span className="text-3xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-white">PROPAI</span>
          <p className="text-base md:text-lg lg:text-xl leading-relaxed font-sans opacity-70 text-gray-500">
            Empowering high-net-worth investors with the world's most advanced strategic intelligence platform.
          </p>
          <div className="flex gap-4">
            <a className="text-white/60 hover:text-accent transition-colors" href="#">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a className="text-white/60 hover:text-accent transition-colors" href="#">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
            <a className="text-white/60 hover:text-accent transition-colors" href="#">
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-6">Expertise</h5>
          <ul className="space-y-3 text-base md:text-lg leading-relaxed font-sans text-gray-500">
            <li><a className="hover:text-accent transition-colors" href="#">Portfolio Management</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Market Reports</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Strategic Intelligence</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Asset Valuation</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-6">Company</h5>
          <ul className="space-y-3 text-base md:text-lg leading-relaxed font-sans text-gray-500">
            <li><a className="hover:text-accent transition-colors" href="#">Our Vision</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Elite Partners</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Careers</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Private Office</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest text-accent font-sans mb-6">Legal</h5>
          <ul className="space-y-3 text-base md:text-lg leading-relaxed font-sans text-gray-500">
            <li><a className="hover:text-accent transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Disclosures</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Market Disclaimers</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-20 mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans opacity-50">
          © 2024 PropAI Luxury Real Estate. Precise Data. Timeless Luxury.
        </p>
      </div>
    </footer>
  );
}
