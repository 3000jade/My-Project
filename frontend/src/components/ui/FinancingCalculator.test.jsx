import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FinancingCalculator from './FinancingCalculator';

describe('FinancingCalculator', () => {
  it('renders TCP, promo cash-out, and payment scheme options', () => {
    render(
      <FinancingCalculator
        totalContractPrice={3000000}
        promoCashOut="PHP 5,000 to PHP 20,000"
        startingAmortization="Starting at PHP 15,000 / month"
      />
    );

    expect(screen.getByText(/₱3,000,000/i)).toBeInTheDocument();
    expect(screen.getByText(/PHP 5,000 to PHP 20,000/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pag-IBIG Housing Loan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bank Financing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In-house Financing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Spot Cash/i })).toBeInTheDocument();
  });

  it('switches to Bank Financing and recalculates amortization', () => {
    render(
      <FinancingCalculator
        totalContractPrice={3000000}
        promoCashOut="PHP 5,000 to PHP 20,000"
        startingAmortization="Starting at PHP 15,000 / month"
      />
    );

    const bankTab = screen.getByRole('button', { name: /Bank Financing/i });
    fireEvent.click(bankTab);

    expect(screen.getByText(/Bank Interest Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Est. Monthly Amortization/i)).toBeInTheDocument();
  });
});
