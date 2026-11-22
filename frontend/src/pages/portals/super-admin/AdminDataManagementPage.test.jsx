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
    previewRestore: vi.fn(),
    commitRestore: vi.fn(),
  },
}));

describe('AdminDataManagementPage (Admin Backup & Safe Merge Restore)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    dataManagementService.getBackupSummary.mockResolvedValue({
      tables: [
        { table: 'properties', count: 2 },
        { table: 'inquiries', count: 1 },
        { table: 'sales', count: 1 },
      ],
      estimatedBytes: 4350,
      cooldownRemainingSec: 0,
      lastBackupAt: null,
      recentBackups: [],
    });
    dataManagementService.exportSnapshot.mockResolvedValue({
      _metadata: {
        schema_version: '1.0',
        exported_at: '2026-11-22T00:00:00.000Z',
        sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      tables: { properties: [], inquiries: [], sales: [] },
    });
    dataManagementService.previewRestore.mockResolvedValue({
      valid: true,
      schemaVersion: '1.0',
      sha256Prefix: 'abcdef123456',
      tables: {
        properties: { willAdd: 1, alreadyExists: 2, errors: 0 },
        inquiries: { willAdd: 0, alreadyExists: 1, errors: 0 },
        sales: { willAdd: 0, alreadyExists: 1, errors: 0 },
      },
      totalWillAdd: 1,
      totalAlreadyExists: 4,
      totalErrors: 0,
    });
    dataManagementService.commitRestore.mockResolvedValue({
      safetySnapshot: { _metadata: { sha256: 'safety123456' }, tables: { properties: [], inquiries: [], sales: [] } },
      insertedCounts: { properties: 1, inquiries: 0, sales: 0 },
      skippedCounts: { properties: 2, inquiries: 1, sales: 1 },
    });
  });

  it('shows empty state, downloads snapshot with SHA-256 receipt, and activates cooldown', async () => {
    render(
      <MemoryRouter>
        <AdminDataManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('properties')).toBeInTheDocument();
      expect(screen.getByText('No backup snapshots recorded yet')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Download Backup Snapshot/i }));
    expect(screen.getByText(/across 3 tables/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirm Download/i }));

    await waitFor(() => {
      expect(dataManagementService.exportSnapshot).toHaveBeenCalledTimes(1);
      expect(screen.getByText('abcdef123456')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Available in/i })).toBeDisabled();
    });
  });

  it('switches to Restore tab, previews uploaded json, and commits Safe Merge restore', async () => {
    render(
      <MemoryRouter>
        <AdminDataManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('properties')).toBeInTheDocument();
    });

    const restoreTab = screen.getByRole('tab', { name: /Restore \(Safe Merge\)/i });
    fireEvent.mouseDown(restoreTab, { button: 0 });
    fireEvent.click(restoreTab);

    const fileInput = await screen.findByLabelText(/Select Backup File/i);
    const mockFile = {
      name: 'backup.json',
      size: 100,
      text: vi.fn().mockResolvedValue(JSON.stringify({ _metadata: { schema_version: '1.0' }, tables: {} })),
    };

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Dry-Run Preview/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Restore 1 Missing Record/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Restore 1 Missing Record/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Restore/i }));

    await waitFor(() => {
      expect(dataManagementService.commitRestore).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Safe Merge complete/i)).toBeInTheDocument();
    });
  });
});
