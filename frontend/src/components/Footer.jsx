

export default function Footer() {
  return (
    <footer className="bg-[#174849] text-white pt-12 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-5 md:px-10 lg:px-20 w-full">
        {/* Column 1: Brand & Contact */}
        <div className="space-y-4">
          <span className="text-2xl md:text-4xl font-bold font-display tracking-tight text-white">[COMPANY NAME]</span>
          <p className="text-sm leading-relaxed font-sans opacity-70 text-gray-500">
            [Placeholder Address Line 1]<br/>
            [Placeholder City, State, Zip]<br/>
            [Placeholder Phone Number]
          </p>
          <div className="flex gap-4 pt-2">
            <a className="text-white/60 hover:text-accent transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">public</span></a>
            <a className="text-white/60 hover:text-accent transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">alternate_email</span></a>
            <a className="text-white/60 hover:text-accent transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">share</span></a>
          </div>
        </div>

        {/* Column 2: Navigation */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-accent font-sans">Explore</h5>
          <ul className="space-y-2 text-sm leading-relaxed font-sans text-gray-500">
            <li><a className="hover:text-accent transition-colors" href="/">Home</a></li>
            <li><a className="hover:text-accent transition-colors" href="/properties">Properties</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Services</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Agents</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-accent font-sans">Company</h5>
          <ul className="space-y-2 text-sm leading-relaxed font-sans text-gray-500">
            <li><a className="hover:text-accent transition-colors" href="#">About</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Testimonials</a></li>
            <li><a className="hover:text-accent transition-colors" href="#">Contact</a></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-accent font-sans">Newsletter</h5>
          <p className="text-sm leading-relaxed font-sans opacity-70 text-gray-500">
            [Placeholder Newsletter Text]
          </p>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="email" 
              placeholder="[Placeholder Email]" 
              className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2 w-full focus:outline-none focus:border-accent transition-colors"
            />
            <button className="bg-accent text-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-accent/80 transition-colors">
              [CTA]
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-5 md:px-10 lg:px-20 mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans opacity-50">
          © 2024 [Company Name]. [Placeholder Copyright].
        </p>
        <div className="flex gap-6">
          <a className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans opacity-50 hover:opacity-100 transition-opacity" href="#">[Placeholder Privacy]</a>
          <a className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans opacity-50 hover:opacity-100 transition-opacity" href="#">[Placeholder Terms]</a>
        </div>
      </div>
    </footer>
  );
}
