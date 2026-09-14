import React from 'react';
import { motion } from 'framer-motion';
import HomeValuationTool from '../components/ui/HomeValuationTool';

export default function HomeValuationPage() {
  return (
    <div className="bg-[#F9F9F8] min-h-screen pt-[120px] pb-32">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Editorial Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold font-sans bg-[#266F71]/10 text-[#174849] uppercase tracking-[0.2em] mb-6 border border-[#266F71]/20">
            Market Intelligence
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-[#174849] mb-6">
            Algorithmic Precision meets <span className="text-[#FB8E5D]">On-the-Ground Insight.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-sans leading-relaxed">
            Our valuation model cross-references real-time MLS data, off-market transaction history, and macroeconomic zoning indicators to deliver an institutional-grade baseline for your property.
          </p>
        </div>

        {/* CMA Tool Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <HomeValuationTool />
        </motion.div>

        {/* Editorial Footer */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto border-t border-gray-200 pt-16">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
              <span className="material-symbols-outlined text-[#266F71]">analytics</span>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Data-Driven</h4>
            <p className="text-sm text-gray-500 font-sans">Drawing from 10,000+ data points across public registries and private networks.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
              <span className="material-symbols-outlined text-[#266F71]">verified_user</span>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Absolute Discretion</h4>
            <p className="text-sm text-gray-500 font-sans">Your property details are securely processed and never shared with third-party lead aggregators.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
              <span className="material-symbols-outlined text-[#266F71]">real_estate_agent</span>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#174849] mb-2 font-sans">Expert Validation</h4>
            <p className="text-sm text-gray-500 font-sans">Baseline algorithms are always verified by our senior advisory partners before listing.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
