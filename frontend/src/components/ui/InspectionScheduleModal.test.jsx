import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InspectionScheduleModal from './InspectionScheduleModal';

describe('InspectionScheduleModal', () => {
  const mockProperty = {
    id: 'cmtdur9ap00011041l5curjy2',
    ref_code: 'MLSPH91M99LRH7',
    title: 'BEST ORTIGAS PASIG CONDO FOR SALE 2 BEDROOM CONDO',
    development: 'Urban Deca Homes Ortigas',
    agent: {
      name: 'Jayson Canonico',
      title: 'Real Estate Agent',
      cta: 'Direct message for free site viewing'
    }
  };

  it('renders modal with inspection options and agent details', () => {
    render(
      <InspectionScheduleModal
        isOpen={true}
        onClose={() => {}}
        property={mockProperty}
      />
    );

    expect(screen.getByText(/Schedule Free Site Viewing/i)).toBeInTheDocument();
    expect(screen.getByText(/MLSPH91M99LRH7/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Move-In Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Jayson Canonico/i)).toBeInTheDocument();
  });

  it('submits inspection booking and invokes onScheduleSuccess callback', () => {
    const handleSuccess = vi.fn();
    render(
      <InspectionScheduleModal
        isOpen={true}
        onClose={() => {}}
        property={mockProperty}
        onScheduleSuccess={handleSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Maria Santos' }
    });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), {
      target: { value: '09171234567' }
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Free Site Viewing/i });
    fireEvent.click(submitBtn);

    expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({
      listing_id: 'cmtdur9ap00011041l5curjy2',
      reference_code: 'MLSPH91M99LRH7',
      agent_name: 'Jayson Canonico',
      full_name: 'Maria Santos',
      phone: '09171234567'
    }));
  });
});
