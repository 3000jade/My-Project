import React, { useState, useMemo } from 'react';

export default function FinancingCalculator({
  totalContractPrice = 3000000,
  promoCashOut = 'PHP 5,000 to PHP 20,000',
  startingAmortization = 'Starting at PHP 15,000 / month'
}) {
  const [selectedScheme, setSelectedScheme] = useState('pagibig');
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [loanTermYears, setLoanTermYears] = useState(30);

  const schemes = [
    { id: 'pagibig', label: 'Pag-IBIG Housing Loan', rate: 6.25, maxTerm: 30, desc: 'Government-subsidized socialized & economic financing with 30-year terms.' },
    { id: 'bank', label: 'Bank Financing', rate: 7.00, maxTerm: 20, desc: 'Commercial bank home loan (BDO, BPI, Metrobank, Security Bank).' },
    { id: 'inhouse', label: 'In-house Financing', rate: 11.50, maxTerm: 10, desc: 'Direct developer financing without third-party bank approval requirements.' },
    { id: 'cash', label: 'Spot Cash', rate: 0, maxTerm: 0, desc: 'Full payment within 30 days with exclusive developer cash discount.' }
  ];

  const currentScheme = schemes.find(s => s.id === selectedScheme) || schemes[0];

  const calculation = useMemo(() => {
    if (selectedScheme === 'cash') {
      const discount = totalContractPrice * 0.08;
      const netPayable = totalContractPrice - discount;
      return {
        isCash: true,
        discount,
        netPayable,
        downPaymentAmount: 0,
        loanAmount: 0,
        monthlyAmortization: 0
      };
    }

    const downPaymentAmount = (totalContractPrice * downPaymentPercent) / 100;
    const loanAmount = totalContractPrice - downPaymentAmount;

    // Monthly interest formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const effectiveTermYears = Math.min(loanTermYears, currentScheme.maxTerm);
    const n = effectiveTermYears * 12;
    const r = currentScheme.rate / 100 / 12;

    let monthly = 0;
    if (r > 0 && n > 0) {
      monthly = (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    } else {
      monthly = loanAmount / (n || 1);
    }

    return {
      isCash: false,
      downPaymentAmount,
      loanAmount,
      monthlyAmortization: Math.round(monthly),
      effectiveTermYears
    };
  }, [totalContractPrice, downPaymentPercent, loanTermYears, selectedScheme, currentScheme]);

  return (
    <div className="bg-white dark:bg-[#141b1b] border border-[#e1e5df] dark:border-[#222f2e] rounded-3xl p-6 md:p-8 shadow-sm font-sans">
      {/* Header & Promo Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e1e5df] dark:border-[#222f2e]">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-[#c4683c] font-bold font-sans">Pricing & Payment Plans</span>
          <h3 className="font-display text-2xl sm:text-3xl font-normal text-[#183d3b] dark:text-[#f4f5f2] mt-1">
            ₱{totalContractPrice.toLocaleString()}
          </h3>
          <p className="text-xs text-[#7a868a] mt-0.5 font-sans">Total Contract Price (TCP)</p>
        </div>

        <div className="bg-[#fcf1eb] dark:bg-[#281d19] border border-[#c4683c]/30 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#c4683c] text-lg">local_fire_department</span>
            <span className="text-[11px] font-bold text-[#c4683c] dark:text-[#f6b492] uppercase tracking-wider font-sans">Promo Cash-Out</span>
          </div>
          <p className="text-sm font-black text-[#c4683c] dark:text-[#f6b492] mt-0.5">{promoCashOut}</p>
          <p className="text-[11px] text-[#c4683c]/80 dark:text-[#f6b492]/80 font-medium font-sans">{startingAmortization}</p>
        </div>
      </div>

      {/* Scheme Selector Tabs */}
      <div className="mt-6">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-3 font-sans">
          Select Financing Method
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {schemes.map(scheme => (
            <button
              key={scheme.id}
              type="button"
              onClick={() => {
                setSelectedScheme(scheme.id);
                if (scheme.id === 'bank' && loanTermYears > 20) setLoanTermYears(20);
                if (scheme.id === 'inhouse' && loanTermYears > 10) setLoanTermYears(10);
              }}
              className={`h-[54px] px-3 rounded-2xl text-xs font-bold font-sans transition-all flex flex-col items-center justify-center border text-center ${
                selectedScheme === scheme.id
                  ? 'bg-[#183d3b] text-white border-[#183d3b] shadow-md shadow-[#183d3b]/20'
                  : 'bg-[#ecefe9]/60 hover:bg-[#ecefe9] text-[#1c2224] dark:bg-[#1d2726] dark:text-[#d3dedc] border-[#e1e5df] dark:border-[#2c3d3b]'
              }`}
            >
              <span className="truncate w-full">{scheme.label}</span>
              {scheme.rate > 0 && <span className="text-[10px] font-mono opacity-80">{scheme.rate}% p.a.</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#5f6b6f] dark:text-[#88989c] mt-2 italic font-sans">{currentScheme.desc}</p>
      </div>

      {/* Calculator Body */}
      {calculation.isCash ? (
        <div className="mt-6 bg-[#e8eeea] dark:bg-[#183d3b]/25 border border-[#183d3b]/30 rounded-2xl p-6 text-[#183d3b] dark:text-[#e4e9e8]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f] dark:text-[#68b693] font-sans">Spot Cash Discount (8%)</p>
              <p className="font-display text-2xl font-normal text-[#2d6a4f] dark:text-[#68b693] mt-1">
                - ₱{calculation.discount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#183d3b] dark:text-[#e4e9e8] font-sans">Net Cash Payable</p>
              <p className="font-display text-3xl font-normal text-[#183d3b] dark:text-white mt-1">
                ₱{calculation.netPayable.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-[#5f6b6f] dark:text-[#88989c] mt-3 font-sans">
            * Pay in full within 30 days of reservation to avail of maximum developer spot cash discounts and priority unit turnover.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Down Payment Option */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-2 font-sans">
                Down Payment: {downPaymentPercent}% (₱{calculation.downPaymentAmount.toLocaleString()})
              </label>
              <div className="flex items-center gap-2">
                {[0, 5, 10, 20].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDownPaymentPercent(pct)}
                    className={`h-[54px] flex-1 rounded-xl text-xs font-bold font-sans border transition-colors ${
                      downPaymentPercent === pct
                        ? 'bg-[#183d3b] text-white border-[#183d3b] shadow-sm'
                        : 'bg-[#ecefe9]/60 dark:bg-[#1d2726] text-[#1c2224] dark:text-[#d3dedc] border-[#e1e5df] dark:border-[#2c3d3b]'
                    }`}
                  >
                    {pct === 0 ? 'Promo 0%' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Term Option */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6b6f] dark:text-[#88989c] mb-2 font-sans">
                Loan Term: {calculation.effectiveTermYears} Years
              </label>
              <div className="flex items-center gap-2">
                {[10, 15, 20, 30]
                  .filter(term => term <= currentScheme.maxTerm)
                  .map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setLoanTermYears(term)}
                      className={`h-[54px] flex-1 rounded-xl text-xs font-bold font-sans border transition-colors ${
                        loanTermYears === term
                          ? 'bg-[#183d3b] text-white border-[#183d3b] shadow-sm'
                          : 'bg-[#ecefe9]/60 dark:bg-[#1d2726] text-[#1c2224] dark:text-[#d3dedc] border-[#e1e5df] dark:border-[#2c3d3b]'
                      }`}
                    >
                      {term} Yrs
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Monthly Amortization Output Box */}
          <div className="bg-[#e8eeea]/50 dark:bg-[#183d3b]/20 border border-[#183d3b]/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#c4683c] dark:text-[#f6b492] font-sans">
                Est. Monthly Amortization
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-3xl md:text-4xl font-normal text-[#183d3b] dark:text-white">
                  ₱{calculation.monthlyAmortization.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-[#7a868a] font-sans">/ month</span>
              </div>
              <p className="text-xs text-[#5f6b6f] dark:text-[#88989c] mt-1 font-sans">
                Loan Amount: ₱{calculation.loanAmount.toLocaleString()} • {selectedScheme === 'bank' ? 'Bank Interest Rate' : 'Interest'}: {currentScheme.rate}%
              </p>
            </div>

            <div className="text-xs text-[#5f6b6f] dark:text-[#88989c] max-w-xs border-t md:border-t-0 md:border-l border-[#183d3b]/20 pt-3 md:pt-0 md:pl-6 font-sans">
              * Indicative computation only. Final loan value, interest fixing period, and monthly amortization are subject to bank/Pag-IBIG assessment and credit committee approval.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
