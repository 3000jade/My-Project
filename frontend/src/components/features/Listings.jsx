import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../styles/Listings.css';

export default function Listings() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="py-section-gap px-margin-desktop max-w-container-max-width mx-auto"
    >
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="font-label-lg text-label-lg text-accent uppercase tracking-widest mb-4 block">
            Curated Selection
          </span>
          <h2 className="font-headline-lg text-headline-lg text-tertiary">Signature Collections</h2>
        </div>
        <Link
          className="font-label-lg text-label-lg text-primary hover:text-accent flex items-center gap-2 transition-all group tracking-widest uppercase"
          to="/properties"
        >
          View All Listings{' '}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Card 1 */}
        <div className="group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 rounded-2xl bg-white border border-surface-container-high overflow-hidden">
          <div className="relative overflow-hidden aspect-[4/5]">
            <img
              alt="The Alpine Sanctuary"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute top-4 right-4">
              <span className="bg-accent text-white text-label-sm font-label-sm px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">
                Just Listed
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-headline-sm text-headline-sm text-tertiary mb-2 group-hover:text-primary transition-colors">
              The Alpine Sanctuary
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span> Makati City, Philippines
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-surface-container-high">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₱34.5M</span>
              <button className="bg-accent text-white px-6 py-2 text-label-sm font-label-sm uppercase rounded-lg premium-btn">
                Inquire
              </button>
            </div>
          </div>
        </div>
        {/* Card 2 */}
        <div className="group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 rounded-2xl bg-white border border-surface-container-high overflow-hidden">
          <div className="relative overflow-hidden aspect-[4/5]">
            <img
              alt="Villa de l'Azur"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1613490908592-5d46815a51cf?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-white text-label-sm font-label-sm px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">
                Off-Market
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-headline-sm text-headline-sm text-tertiary mb-2 group-hover:text-primary transition-colors">
              Villa de l'Azur
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span> Taguig City, Philippines
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-surface-container-high">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₱52.0M</span>
              <button className="bg-accent text-white px-6 py-2 text-label-sm font-label-sm uppercase rounded-lg premium-btn">
                Inquire
              </button>
            </div>
          </div>
        </div>
        {/* Card 3 */}
        <div className="group cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 rounded-2xl bg-white border border-surface-container-high overflow-hidden">
          <div className="relative overflow-hidden aspect-[4/5]">
            <img
              alt="The Glass Monolith"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute top-4 right-4">
              <span className="bg-tertiary text-white text-label-sm font-label-sm px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">
                Elite Portfolio
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-headline-sm text-headline-sm text-tertiary mb-2 group-hover:text-primary transition-colors">
              The Glass Monolith
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span> Mandaluyong City, Philippines
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-surface-container-high">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₱28.9M</span>
              <button className="bg-accent text-white px-6 py-2 text-label-sm font-label-sm uppercase rounded-lg premium-btn">
                Inquire
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
