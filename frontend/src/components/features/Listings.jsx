import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Listings() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="mb-stack-xl max-w-container-max mx-auto px-margin-desktop py-stack-xl"
    >
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="text-headline-md font-headline-md text-primary font-semibold">Featured Listings</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Exclusive properties selected by our experts.</p>
        </div>
        <Link
          className="text-primary-container hover:text-primary text-label-md font-label-md flex items-center gap-1 transition-colors"
          to="/properties"
        >
          View all <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Large Featured Card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-outline-variant/20 h-full relative cursor-pointer"
        >
          <div className="absolute top-4 left-4 z-20 bg-tertiary-container text-white text-label-sm font-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-[16px] icon-fill">star</span> Featured
          </div>
          <div className="relative w-full h-80 overflow-hidden">
            <img
              alt="Ayala Alabang Estate"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_0mFlInVxyIa3OGHF2yXc4OzXAvW4AQV6qyJx41Od3nuC-OYxn7ZEZnamBFYNiPbDAZ3kYCCetTd93h1OGRqSdDwJBObTpzk4QNOJ6V040hH5rT4JO76Rw-0u4XxKad6TkxHs84DbyQyjVtqmr-xu5FLMN3xsf9PyDyhGo5Gn9bG2-JbHr1E7zPockoy8boivwZsKjvAYyETuVQpWL4wjmYJ-5OA5S6TfXCmT6ZXDM3KzXdeu95rq6rFrNoDzQKMwAZXUeVUoyhG7"
            />
            <div className="absolute bottom-4 left-4 z-20 bg-surface/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
              <span className="text-title-lg font-title-lg text-primary font-bold">₱185,000,000</span>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-title-lg font-title-lg text-on-surface mb-2 line-clamp-1 group-hover:text-primary-container transition-colors">
              Ayala Alabang Estate
            </h3>
            <p className="text-body-md text-on-surface-variant flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-[18px] text-outline">location_on</span>
              Muntinlupa City, Metro Manila
            </p>
            <div className="flex items-center gap-4 text-on-surface-variant mt-auto mb-6">
              <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md">
                <span className="material-symbols-outlined text-[18px]">bed</span>
                <span className="text-label-md font-label-md">5</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md">
                <span className="material-symbols-outlined text-[18px]">shower</span>
                <span className="text-label-md font-label-md">6</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                <span className="text-label-md font-label-md">4</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-md">
                <span className="material-symbols-outlined text-[18px]">square_foot</span>
                <span className="text-label-md font-label-md">850 sqm</span>
              </div>
            </div>
            <button className="w-full bg-primary-container text-on-primary-container rounded-lg py-3 text-label-md font-label-md hover:bg-primary transition-colors">
              View Details
            </button>
          </div>
        </motion.div>
        <div className="flex flex-col gap-gutter">
          {/* Secondary Featured 1 */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row border border-outline-variant/20 h-full relative cursor-pointer"
          >
            <div className="absolute top-4 left-4 z-20 bg-tertiary-container text-white text-label-sm font-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[16px] icon-fill">star</span> Featured
            </div>
            <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
              <img
                alt="The Proscenium Penthouse"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAETZZp0xAAYpS9Okp6MrMewZf0lPxqNX2MM5gR4tuXfOxGBTtqDP3GXfYvoB46AY1I5k_S2cS69Xxn1Sl8F1eM1yywJoGmCLwJ9pHuuwXXZUoxX4kj0xY3p_OSYIKbBotBYvyGwez5b2uAdTHRwE1o1hK61HuCeTfpBfBYL-35YL_uoLLqGinEC30HlRqV_uN-fBihNNanrJbyXNj1NrH_cvhmFlyWUIuWXnizQWBhTO7_h0Ib3RwYPorg7fDw6V9BLwEZ8syLfVAW"
              />
            </div>
            <div className="p-5 flex flex-col justify-center sm:w-3/5">
              <div className="mb-2">
                <span className="text-title-lg font-title-lg text-primary font-bold block">₱85,500,000</span>
              </div>
              <h3 className="text-body-lg font-bold text-on-surface mb-1 line-clamp-1 group-hover:text-primary-container transition-colors">
                The Proscenium Penthouse
              </h3>
              <p className="text-body-md text-on-surface-variant flex items-center gap-1 mb-4 text-sm">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                Rockwell Center, Makati
              </p>
              <div className="flex items-center gap-3 text-on-surface-variant mb-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">bed</span>
                  <span className="text-label-sm font-label-sm">3</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">shower</span>
                  <span className="text-label-sm font-label-sm">3.5</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">square_foot</span>
                  <span className="text-label-sm font-label-sm">280 sqm</span>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Secondary Featured 2 */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row border border-outline-variant/20 h-full relative cursor-pointer"
          >
            <div className="absolute top-4 left-4 z-20 bg-tertiary-container text-white text-label-sm font-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[16px] icon-fill">star</span> Featured
            </div>
            <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
              <img
                alt="Punta Fuego Cliffside"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuASSEScTTUaGm-VsQg5FB-Ow6Lt72_tAvqmnKTjOX3d5mhqAQ1-xCmQhfzbbl8w7QO9xLgrR-arLOfn9wLJy1f18grLhstQWKxNhusWo7MdDsGKFJImQtIE3jTQo4rB0BPJFQvxE7nHCkjLpqfLcymeh-T54qLvAkJYCp2q6BxZ9dGaeEwqIFr-_DNyIt5hLGX5Zn813bSieSFUybG3LdVItH7a30CSkgvxYTRDO70qWOFWHc_5DhB4dnxTKjdHkNtaYHDmggqisEth"
              />
            </div>
            <div className="p-5 flex flex-col justify-center sm:w-3/5">
              <div className="mb-2">
                <span className="text-title-lg font-title-lg text-primary font-bold block">₱120,000,000</span>
              </div>
              <h3 className="text-body-lg font-bold text-on-surface mb-1 line-clamp-1 group-hover:text-primary-container transition-colors">
                Punta Fuego Cliffside
              </h3>
              <p className="text-body-md text-on-surface-variant flex items-center gap-1 mb-4 text-sm">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                Nasugbu, Batangas
              </p>
              <div className="flex items-center gap-3 text-on-surface-variant mb-4">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">bed</span>
                  <span className="text-label-sm font-label-sm">4</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">shower</span>
                  <span className="text-label-sm font-label-sm">5</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">square_foot</span>
                  <span className="text-label-sm font-label-sm">650 sqm</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
