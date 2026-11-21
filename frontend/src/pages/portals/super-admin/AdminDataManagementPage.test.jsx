import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDataManagementPage from './AdminDataManagementPage';
import dataManagementService from '@/services/dataManagementService';

vi.mock('@/services/dataManagementService', () => ({
  default: {
    getBackupSummary: vi.fn(),
    exportSnapshot: vi.fn(),
  },
}));

describe('AdminDataManagementPage (Admin Backup Only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    dataManagementService.getBackupSummary.mockResolvedValue([
      { table: 'properties', count: 2 },
      { table: 'inquiries', count: 1 },
      { table: 'sales', count: 1 },
    ]);
    dataManagementService.exportSnapshot.mockResolvedValue({
      generatedAt: '2026-11-22T00:00:00.000Z',
      tables: { properties: [], inquiries: [], sales: [] },
    });
  });

  it('shows backup summary and downloads snapshot after confirmation', async () => {
    render(
      <MemoryRouter>
        <AdminDataManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('properties')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Download Backup Snapshot/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Download/i }));

    await waitFor(() => {
      expect(dataManagementService.exportSnapshot).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Backup snapshot downloaded/i)).toBeInTheDocument();
    });
  });
});
