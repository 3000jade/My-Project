import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="bg-tertiary text-on-tertiary pt-section-gap pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter py-section-gap px-margin-desktop max-w-container-max-width mx-auto border-t border-white/10">
        <div className="space-y-6">
          <span className="font-headline-md text-headline-md font-bold text-white tracking-tight">PROPAI</span>
          <p className="font-body-md text-body-md opacity-70">
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
          <h5 className="font-label-lg text-label-lg uppercase tracking-widest text-accent mb-6">Expertise</h5>
          <ul className="space-y-3 font-body-md text-body-md">
            <li><a className="hover:text-accent transition-colors" href="#">Portfolio Management</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Market Reports</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Strategic Intelligence</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Asset Valuation</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="font-label-lg text-label-lg uppercase tracking-widest text-accent mb-6">Company</h5>
          <ul className="space-y-3 font-body-md text-body-md">
            <li><a className="hover:text-accent transition-colors" href="#">Our Vision</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Elite Partners</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Careers</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Private Office</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="font-label-lg text-label-lg uppercase tracking-widest text-accent mb-6">Legal</h5>
          <ul className="space-y-3 font-body-md text-body-md">
            <li><a className="hover:text-accent transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Disclosures</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Market Disclaimers</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-container-max-width mx-auto px-margin-desktop mt-12 pt-8 border-t border-white/5 text-center">
        <p className="font-label-sm text-label-sm opacity-50 uppercase tracking-widest">
          © 2024 PropAI Luxury Real Estate. Precise Data. Timeless Luxury.
        </p>
      </div>
    </footer>
  );
}
