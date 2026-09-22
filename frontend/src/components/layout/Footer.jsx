import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#174849] text-white pt-12 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 w-full">
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
          <h4 className="text-lg font-bold font-display tracking-tight text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm font-sans">
            <li><Link className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" to="/">Home</Link></li>
            <li><Link className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" to="/properties">Properties</Link></li>
            <li><Link className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" to="/about">About Us</Link></li>
            <li><Link className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Column 3: Property Types */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold font-display tracking-tight text-white">Categories</h4>
          <ul className="space-y-2 text-sm font-sans">
            <li><a className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" href="#">Modern Mansions</a></li>
            <li><a className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" href="#">Luxury Penthouses</a></li>
            <li><a className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" href="#">Waterfront Estates</a></li>
            <li><a className="opacity-70 hover:opacity-100 hover:text-accent transition-all text-gray-500" href="#">Architectural Gems</a></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold font-display tracking-tight text-white">Stay Informed</h4>
          <p className="text-sm leading-relaxed font-sans opacity-70 text-gray-500">Subscribe for curations of architectural marvels and high-end listings.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-accent w-full"
            />
            <button className="bg-white text-primary px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16 flex flex-col md:flex-row justify-between items-center text-xs opacity-50 font-sans text-gray-500">
        <p>&copy; {new Date().getFullYear()} [COMPANY NAME]. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="hover:underline" href="#">Privacy Policy</a>
          <a className="hover:underline" href="#">Terms of Service</a>
          <a className="hover:underline" href="#">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
