import React from 'react';
import { motion } from 'framer-motion';

const ARTICLES = [
  {
    id: 1,
    category: "Macroeconomics",
    title: "The 2027 Macroeconomic Shift: Why High-Net-Worth Buyers Are Accumulating Land.",
    excerpt: "As inflation metrics stabilize, institutional capital is quietly rotating out of equities and into generational tangible assets. Here is what the top 1% are doing.",
    date: "Sep 12, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 2,
    category: "Acquisition Strategy",
    title: "Navigating the Silent Market: Off-Market Acquisitions.",
    excerpt: "The most exclusive estates never see the public MLS. Discover the mechanics of private, off-market transactions and how absolute discretion dictates pricing.",
    date: "Aug 24, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 3,
    category: "Architecture & Yield",
    title: "The Architecture of Yield: Evaluating GFA in Prime CBDs.",
    excerpt: "Gross Floor Area isn't just a metric; it's the fundamental ceiling of your portfolio's yield. A deep dive into zoning arbitrage in Makati and BGC.",
    date: "Aug 05, 2026",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=1200&auto=format&fit=crop"
  }
];

export default function BlogPage() {
  return (
    <div className="bg-[#F9F9F8] min-h-screen pt-[120px] pb-32">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold font-sans bg-[#266F71]/10 text-[#174849] uppercase tracking-[0.2em] mb-6 border border-[#266F71]/20">
            Editorial & Insights
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-[#174849] mb-6">
            The Executive <span className="text-[#FB8E5D]">Journal.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-sans leading-relaxed">
            Unfiltered market intelligence, macroeconomic analysis, and acquisition strategies for the institutional and private investor.
          </p>
        </div>

        {/* Masonry Grid (Simulated with columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {ARTICLES.map((article, idx) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur-md text-[#174849] text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">
                    {article.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 font-sans">
                <span>{article.date}</span>
                <span className="w-1 h-1 rounded-full bg-[#FB8E5D]"></span>
                <span>{article.readTime}</span>
              </div>

              <h2 className="text-2xl font-display font-bold text-[#174849] leading-tight mb-4 group-hover:text-[#266F71] transition-colors">
                {article.title}
              </h2>
              
              <p className="text-gray-500 font-sans text-sm leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Newsletter Capture */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-5xl mx-auto bg-[#071313] rounded-[40px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#266F71]/20 rounded-full blur-[80px] -mr-40 -mt-40"></div>
          
          <div className="flex-1 relative z-10">
            <span className="text-[#FB8E5D] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">Subscribe</span>
            <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-4">The Executive Manifesto</h3>
            <p className="text-white/60 font-sans max-w-md text-sm">
              Receive our exclusive quarterly macroeconomic brief and off-market property alerts directly to your private inbox.
            </p>
          </div>

          <div className="w-full md:w-[400px] relative z-10">
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); alert("Subscribed to the Manifesto."); }}>
              <input 
                type="email" 
                required
                placeholder="Private Email Address" 
                className="w-full h-[54px] bg-white/5 border border-white/10 text-white focus:border-[#266F71] rounded-xl px-5 outline-none font-sans placeholder:text-white/30 transition-colors"
              />
              <button 
                type="submit"
                className="w-full h-[54px] bg-white hover:bg-gray-100 text-[#174849] rounded-xl font-sans font-bold tracking-widest uppercase text-[12px] flex items-center justify-center transition-colors"
              >
                Request Access
              </button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
