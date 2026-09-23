import { useState } from 'react';

export default function FinancialCalculatorSection() {
  const [homePrice, setHomePrice] = useState(24500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.25);
  const [loanTermYears, setLoanTermYears] = useState(30);

  // Financial math calculations
  const downPaymentAmount = (homePrice * downPaymentPercent) / 100;
  const loanPrincipal = homePrice - downPaymentAmount;
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPrincipalAndInterest =
    monthlyInterestRate > 0
      ? (loanPrincipal *
          (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : loanPrincipal / numberOfPayments;

  const estimatedPropertyTaxMonthly = (homePrice * 0.012) / 12;
  const estimatedHOAMonthly = 2450;
  const estimatedInsuranceMonthly = 1850;

  const totalMonthlyPayment =
    monthlyPrincipalAndInterest +
    estimatedPropertyTaxMonthly +
    estimatedHOAMonthly +
    estimatedInsuranceMonthly;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <section className="w-full bg-[#f9f9f7] py-20 border-b border-[#e5e5df]">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1b4d4b] font-sans">
            TRANSPARENT ECONOMICS
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#0f1722] tracking-tight font-sans mt-1">
            Financial Details & Mortgage Estimator
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-[#ffffff] rounded-[4px] border border-[#e5e5df] p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0f1722] font-sans border-b border-[#e5e5df] pb-3">
              Interactive Mortgage Inputs
            </h3>

            {/* Home Price Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700 font-sans">
                <span>HOME PRICE</span>
                <span className="text-[#1b4d4b] font-bold">{formatCurrency(homePrice)}</span>
              </div>
              <input
                type="range"
                min={5000000}
                max={50000000}
                step={500000}
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="w-full accent-[#1b4d4b] cursor-pointer"
              />
            </div>

            {/* Down Payment Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700 font-sans">
                <span>DOWN PAYMENT ({downPaymentPercent}%)</span>
                <span className="text-[#1b4d4b] font-bold">{formatCurrency(downPaymentAmount)}</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full accent-[#1b4d4b] cursor-pointer"
              />
            </div>

            {/* Interest Rate & Loan Term Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 font-sans block">INTEREST RATE (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 font-sans block">LOAN TERM</label>
                <select
                  value={loanTermYears}
                  onChange={(e) => setLoanTermYears(Number(e.target.value))}
                  className="w-full h-[54px] bg-[#f9f9f7] rounded-[4px] border border-[#e5e5df] px-4 font-sans text-sm outline-none focus:border-[#1b4d4b]"
                >
                  <option value={15}>15 Years Fixed</option>
                  <option value={30}>30 Years Fixed</option>
                </select>
              </div>
            </div>

          </div>

          {/* Breakdown Summary Sidebar */}
          <div className="lg:col-span-5 bg-[#0f1722] text-white rounded-[4px] p-8 space-y-6 shadow-xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#e28468] font-sans">
              ESTIMATED MONTHLY EXPENSE
            </span>
            <div className="text-4xl font-bold font-sans text-white">
              {formatCurrency(totalMonthlyPayment)}
              <span className="text-xs font-normal text-gray-400 block mt-1">per month (P&I + Taxes + HOA + Ins.)</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 font-sans text-xs">
              <div className="flex justify-between py-1">
                <span className="text-gray-300">Principal & Interest</span>
                <span className="font-semibold text-white">{formatCurrency(monthlyPrincipalAndInterest)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-300">Property Taxes (Est.)</span>
                <span className="font-semibold text-white">{formatCurrency(estimatedPropertyTaxMonthly)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-300">HOA & Enclave Dues</span>
                <span className="font-semibold text-white">{formatCurrency(estimatedHOAMonthly)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-300">Homeowners Insurance</span>
                <span className="font-semibold text-white">{formatCurrency(estimatedInsuranceMonthly)}</span>
              </div>
            </div>

            <button 
              onClick={() => alert("Connecting to Mortgage Advisor...")}
              className="w-full h-[54px] bg-[#e28468] hover:bg-[#c9684b] text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-[4px] transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">request_quote</span>
              Get Pre-Approved with Preferred Partner
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
