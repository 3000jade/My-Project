import { motion } from 'framer-motion';

const STORIES = [
  {
    id: 1,
    quote: "They handled the due diligence with incredible rigor. For the first time, buying in Manila felt completely stress-free.",
    author: "M. & T. Villanueva",
    location: "Acquired in Forbes Park",
  },
  {
    id: 2,
    quote: "We didn't have to view twenty properties. They understood exactly what we wanted and found our sanctuary in just three tours.",
    author: "Sarah L.",
    location: "Acquired in Dasmariñas Village",
  },
  {
    id: 3,
    quote: "From securing the clean title to the final handover, the level of professionalism was unlike any brokerage we've worked with.",
    author: "The Reyes Family",
    location: "Acquired in BGC",
  }
];

export default function ClientStoriesSection() {
  return (
    <section className="w-full bg-[#f9f9f7] py-16 md:py-24 border-b border-[#e5e5df] relative z-20">
      <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
        
        {/* Header */}
        <div className="mb-12 md:mb-16 flex flex-col md:items-center text-center">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <span className="w-6 h-[2px] bg-[#1b4d4b]" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#1b4d4b] uppercase font-sans">
              Client Stories
            </span>
            <span className="w-6 h-[2px] bg-[#1b4d4b]" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f1722] tracking-tight font-sans max-w-2xl">
            Real Relationships, Real Results
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STORIES.map((story, index) => (
            <motion.div 
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="bg-white p-8 md:p-10 rounded-2xl border border-[#e5e5df] shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-4xl text-[#1b4d4b]/20 mb-4 block">
                  format_quote
                </span>
                <p className="text-lg md:text-xl font-sans text-[#0f1722] leading-relaxed mb-8 font-medium">
                  "{story.quote}"
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold font-sans text-[#0f1722]">
                  {story.author}
                </h4>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider block mt-1">
                  {story.location}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
