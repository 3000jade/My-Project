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
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header & Promo Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-600 font-bold">Pricing & Payment Plans</span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            ₱{totalContractPrice.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Contract Price (TCP)</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">local_fire_department</span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">Promo Cash-Out</span>
          </div>
          <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{promoCashOut}</p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-medium">{startingAmortization}</p>
        </div>
      </div>

      {/* Scheme Selector Tabs */}
      <div className="mt-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
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
              className={`h-[54px] px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center border text-center ${
                selectedScheme === scheme.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
              }`}
            >
              <span className="truncate w-full">{scheme.label}</span>
              {scheme.rate > 0 && <span className="text-[10px] opacity-80">{scheme.rate}% p.a.</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{currentScheme.desc}</p>
      </div>

      {/* Calculator Body */}
      {calculation.isCash ? (
        <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Spot Cash Discount (8%)</p>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                - ₱{calculation.discount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Net Cash Payable</p>
              <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                ₱{calculation.netPayable.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-3">
            * Pay in full within 30 days of reservation to avail of maximum developer spot cash discounts and priority unit turnover.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Down Payment Option */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Down Payment: {downPaymentPercent}% (₱{calculation.downPaymentAmount.toLocaleString()})
              </label>
              <div className="flex items-center gap-2">
                {[0, 5, 10, 20].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDownPaymentPercent(pct)}
                    className={`h-[54px] flex-1 rounded-xl text-xs font-bold border transition-colors ${
                      downPaymentPercent === pct
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    {pct === 0 ? 'Promo 0%' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Term Option */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                      className={`h-[54px] flex-1 rounded-xl text-xs font-bold border transition-colors ${
                        loanTermYears === term
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                          : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {term} Yrs
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Monthly Amortization Output Box */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                Est. Monthly Amortization
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                  ₱{calculation.monthlyAmortization.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">/ month</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Loan Amount: ₱{calculation.loanAmount.toLocaleString()} • {selectedScheme === 'bank' ? 'Bank Interest Rate' : 'Interest'}: {currentScheme.rate}%
              </p>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs border-t md:border-t-0 md:border-l border-amber-500/20 pt-3 md:pt-0 md:pl-6">
              * Indicative computation only. Final loan value, interest fixing period, and monthly amortization are subject to bank/Pag-IBIG assessment and credit committee approval.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
