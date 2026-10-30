import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SubdivisionPlanReplacementModal from './SubdivisionPlanReplacementModal';

describe('SubdivisionPlanReplacementModal (FR-005)', () => {
  it('renders modal when open and displays dropzone', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <SubdivisionPlanReplacementModal
        isOpen={true}
        onClose={handleClose}
        onConfirmReplacement={handleConfirm}
        existingLotsCount={12}
      />
    );

    expect(screen.getByTestId('subdivision-plan-replacement-modal')).toBeInTheDocument();
    expect(screen.getByText(/Replace Blueprint Plan Graphic/i)).toBeInTheDocument();
    expect(screen.getByText(/12 vector lots/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SubdivisionPlanReplacementModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirmReplacement={vi.fn()}
      />
    );

    expect(screen.queryByTestId('subdivision-plan-replacement-modal')).not.toBeInTheDocument();
  });
});
