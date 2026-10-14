import React, { useState } from 'react';
import { IconDeviceFloppy, IconCheck, IconArrowRight, IconFileUpload } from '@tabler/icons-react';

export default function RegisterForm({ onSubmitRegistration }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    brokerageName: '',
    prcLicense: '',
    licenseExpiry: '',
    dhsudNumber: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    setIsSubmitting(true);
    try {
      await onSubmitRegistration({
        ...formData,
        acceptedTerms
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-8 bg-white shadow-[0_16px_36px_rgba(13,68,70,0.06)] rounded-[14px]">
      <div className="flex flex-col gap-1 mb-2">
        <h3 className="text-[24px] font-semibold font-manrope text-[#141717]">Applicant Details</h3>
        <p className="text-[16px] font-inter text-[#5C6768]">Provide your personal and licensing credentials for expedited verification.</p>
      </div>

      {error && (
        <div className="p-3 bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-[14px] font-medium rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FIRST NAME */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            First Name <span className="text-[#E76F51]">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Joaquin"
            value={formData.firstName}
            onChange={handleChange}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
            required
          />
        </div>

        {/* LAST NAME */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            Last Name <span className="text-[#E76F51]">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Del Rosario"
            value={formData.lastName}
            onChange={handleChange}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
            required
          />
        </div>

        {/* EMAIL ADDRESS */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            Email Address <span className="text-[#E76F51]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="joaquin@delrosariorealty.ph"
            value={formData.email}
            onChange={handleChange}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
            required
          />
        </div>

        {/* PHONE NUMBER */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            Phone Number <span className="text-[#E76F51]">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            placeholder="+63 917 842 9011"
            value={formData.phone}
            onChange={handleChange}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
            required
          />
        </div>
      </div>

      {/* BROKERAGE */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="brokerageName" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
          Brokerage / Real Estate Firm Name
        </label>
        <input
          id="brokerageName"
          name="brokerageName"
          type="text"
          placeholder="Del Rosario Prime Properties Inc. (or Independent)"
          value={formData.brokerageName}
          onChange={handleChange}
          className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRC LICENSE */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prcLicense" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            PRC License Number <span className="text-[#E76F51]">*</span>
          </label>
          <input
            id="prcLicense"
            name="prcLicense"
            type="text"
            placeholder="0029415"
            value={formData.prcLicense}
            onChange={handleChange}
            className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
            required
          />
        </div>

        {/* EXPIRY DATE */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="licenseExpiry" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            License Expiry Date <span className="text-[#E76F51]">*</span>
          </label>
          <div className="relative">
            <input
              id="licenseExpiry"
              name="licenseExpiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={handleChange}
              className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors"
              required
            />
          </div>
        </div>
      </div>

      {/* DHSUD */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dhsudNumber" className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
          DHSUD Registration Number <span className="text-[#E76F51]">*</span>
        </label>
        <input
          id="dhsudNumber"
          name="dhsudNumber"
          type="text"
          placeholder="NCR-B-11/2023-0982"
          value={formData.dhsudNumber}
          onChange={handleChange}
          className="h-[54px] w-full rounded-md border border-[#D8DFDF] bg-[#F4F5F4] px-4 text-[16px] text-[#141717] outline-none focus:border-[#0D4446] focus:ring-1 focus:ring-[#0D4446] transition-colors placeholder:text-[#8E9A9B]"
          required
        />
      </div>

      {/* UPLOAD FILE */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center mb-1">
          <label className="text-[12px] font-semibold font-inter text-[#141717] uppercase tracking-widest">
            License or ID Upload <span className="text-[#E76F51]">*</span>
          </label>
          <span className="text-[10px] font-bold font-inter text-[#5C6768] uppercase tracking-widest">
            PDF, JPG, PNG • Max 10MB
          </span>
        </div>
        <div className="border border-dashed border-[#D8DFDF] bg-[#F4F5F4] rounded-md h-[160px] flex flex-col items-center justify-center cursor-pointer hover:border-[#0D4446] hover:bg-[#F4F5F4]/80 transition-colors">
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-[0_4px_16px_rgba(13,68,70,0.04)] mb-3">
            <IconFileUpload size={24} className="text-[#0D4446]" />
          </div>
          <p className="text-[16px] font-semibold font-inter text-[#141717]">Upload PRC License or DHSUD ID</p>
          <p className="text-[14px] font-inter text-[#5C6768] mt-1">Click or drag your scanned document here</p>
        </div>
      </div>

      {/* CHECKBOX */}
      <div className="flex items-start gap-3 mt-4">
        <input
          id="acceptedTerms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-[18px] w-[18px] rounded border-[#D8DFDF] text-[#0D4446] focus:ring-[#0D4446] cursor-pointer"
          required
        />
        <label htmlFor="acceptedTerms" className="text-[14px] leading-relaxed font-medium font-inter text-[#5C6768] cursor-pointer">
          I agree to the <a href="#" className="text-[#0D4446] underline decoration-[#0D4446]/40 underline-offset-4 hover:decoration-[#0D4446]">Terms of Accreditation</a> and confirm that the submitted details are valid and active.
        </label>
      </div>

      {/* BUTTONS */}
      <div className="flex items-center justify-between mt-6 pt-2">
        <button
          type="button"
          className="flex items-center gap-2 text-[#5C6768] hover:text-[#141717] font-semibold font-inter text-[15px] transition-colors"
        >
          <IconDeviceFloppy size={20} stroke={1.5} />
          Save Draft
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting || !acceptedTerms}
          className="h-[54px] px-6 rounded-md bg-[#0D4446] text-white font-semibold font-inter text-[16px] hover:bg-[#083335] active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <IconCheck size={20} stroke={2.5} />
              Submit Broker Application
              <IconArrowRight size={20} stroke={2} className="ml-1" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

