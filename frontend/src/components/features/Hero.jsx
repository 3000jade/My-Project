import '../styles/Hero.css';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          alt="Luxurious Modern Villa"
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      <div className="relative z-10 max-w-container-max-width mx-auto px-margin-desktop text-center">
        <span className="font-label-lg text-label-lg text-accent uppercase tracking-widest mb-6 block animate-fade-in-up opacity-0">
          Elite Real Estate Intelligence
        </span>
        <h1 className="font-display-lg text-display-lg text-white mb-8 leading-tight max-w-5xl mx-auto animate-fade-in-up opacity-0 delay-100">
          Where Heritage Meets <span className="text-accent">Strategic Advisory.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 delay-200">
          Experience the next evolution of luxury property acquisition. Our exclusive market insights analyze
          global markets to secure your legacy.
        </p>
        <div className="flex gap-6 justify-center animate-fade-in-up opacity-0 delay-300">
          <button className="bg-primary text-on-primary px-10 py-5 font-label-lg text-label-lg uppercase rounded-lg premium-btn">
            Explore Portfolio
          </button>
          <button className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-5 font-label-lg text-label-lg uppercase rounded-lg premium-btn hover:bg-white/20">
            The Private Office
          </button>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <div className="absolute bottom-12 w-full max-w-5xl animate-fade-in-up opacity-0 delay-400">
        <div className="bg-white p-2 shadow-lg rounded-2xl flex flex-col md:flex-row gap-2 items-stretch">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">location_on</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Local Destination"
                type="text"
              />
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">home_work</span>
              <select className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface">
                <option>Property Type</option>
                <option>Villa</option>
                <option>Penthouse</option>
                <option>Private Island</option>
              </select>
            </div>
            <div className="relative flex items-center px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary mr-3">payments</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body-md text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Minimum ₱10M"
                type="text"
              />
            </div>
          </div>
          <button className="bg-primary text-on-primary px-12 py-4 font-label-lg text-label-lg uppercase rounded-xl premium-btn flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">search</span> Search
          </button>
        </div>
      </div>
    </section>
  );
}
