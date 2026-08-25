import React from 'react';
import { motion } from 'framer-motion';

export default function AgentCard({ member, variants }) {
  // Use provided variants for staggered list animations, or default to empty object
  const animationVariants = variants || {};

  return (
    <motion.div variants={animationVariants} className="text-center group transition-transform duration-500 hover:-translate-y-2">
      <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border border-surface-container-high p-2 group-hover:border-primary group-hover:shadow-lg transition-all duration-700">
        <img 
          alt={member.name} 
          className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110" 
          src={member.image} 
        />
      </div>
      <h4 className="text-xl font-bold font-display text-tertiary">{member.name}</h4>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-sans mt-1">{member.role}</p>
    </motion.div>
  );
}
