import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDataManagementPage from './AdminDataManagementPage';
import dataManagementService from '@/services/dataManagementService';

vi.mock('@/services/dataManagementService', () => ({
  default: {
    getDataHealth: vi.fn(),
    previewImport: vi.fn(),
    commitImport: vi.fn(),
    exportRecords: vi.fn(),
    exportSnapshot: vi.fn(),
  },
}));

describe('AdminDataManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataManagementService.getDataHealth.mockResolvedValue([
      { resource: 'properties', total: 2, active: 1, archived: 1 },
    ]);
  });

  it('previews import rows before saving and commits on confirmation', async () => {
    dataManagementService.previewImport.mockResolvedValue({
      validCount: 1,
      invalidCount: 0,
      validRows: [{ title: 'Sample Residence', price: 12000000 }],
      invalidRows: [],
    });
    dataManagementService.commitImport.mockResolvedValue({ insertedCount: 1, skippedCount: 0 });

    render(
      <MemoryRouter>
        <AdminDataManagementPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 Valid/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm & Save 1 Record/i }));

    await waitFor(() => {
      expect(dataManagementService.commitImport).toHaveBeenCalledWith('properties', [
        { title: 'Sample Residence', price: 12000000 },
      ]);
      expect(screen.getByText(/Saved 1 record/i)).toBeInTheDocument();
    });
  });
});
