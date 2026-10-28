import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrokerAudit from './BrokerAudit';
import { auditService, MOCK_AUDIT_EVENTS } from '../../../services/auditService';

vi.mock('../../../services/auditService', () => ({
  auditService: {
    listAuditEvents: vi.fn(),
    exportAuditEvents: vi.fn()
  },
  MOCK_AUDIT_EVENTS: [
    {
      id: 'aud-test-01',
      eventType: 'property.edit_approved',
      actorName: 'Eleanor Vance',
      actorRole: 'broker',
      targetTitle: 'Grand Horizon Penthouse BGC',
      targetType: 'property',
      targetId: 'prop-bgc-01',
      outcome: 'success',
      reason: 'Price adjustment verified.',
      correlationId: 'corr-test-01',
      previousValues: { list_price: 45000000 },
      newValues: { list_price: 43500000 },
      createdAt: '2026-10-28T05:00:00.000Z'
    },
    {
      id: 'aud-test-02',
      eventType: 'audit.tamper_denied',
      actorName: 'Unknown Contributor',
      actorRole: 'agent',
      targetTitle: 'Immutable Record Mutation',
      targetType: 'audit_event',
      targetId: 'aud-old-01',
      outcome: 'denied',
      reason: 'Audit records are immutable.',
      correlationId: 'corr-test-02',
      previousValues: null,
      newValues: null,
      createdAt: '2026-10-28T04:30:00.000Z'
    }
  ]
}));

describe('BrokerAudit Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditService.listAuditEvents.mockResolvedValue([
      {
        id: 'aud-test-01',
        eventType: 'property.edit_approved',
        actorName: 'Eleanor Vance',
        actorRole: 'broker',
        targetTitle: 'Grand Horizon Penthouse BGC',
        targetType: 'property',
        targetId: 'prop-bgc-01',
        outcome: 'success',
        reason: 'Price adjustment verified.',
        correlationId: 'corr-test-01',
        previousValues: { list_price: 45000000 },
        newValues: { list_price: 43500000 },
        createdAt: '2026-10-28T05:00:00.000Z'
      },
      {
        id: 'aud-test-02',
        eventType: 'audit.tamper_denied',
        actorName: 'Unknown Contributor',
        actorRole: 'agent',
        targetTitle: 'Immutable Record Mutation',
        targetType: 'audit_event',
        targetId: 'aud-old-01',
        outcome: 'denied',
        reason: 'Audit records are immutable.',
        correlationId: 'corr-test-02',
        previousValues: null,
        newValues: null,
        createdAt: '2026-10-28T04:30:00.000Z'
      }
    ]);
    auditService.exportAuditEvents.mockResolvedValue({
      exportedAt: '2026-10-28T05:30:00.000Z',
      exportedBy: 'Eleanor Vance',
      count: 2,
      events: []
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <BrokerAudit />
      </BrowserRouter>
    );

  it('renders page header, export button, and KPI metrics correctly', async () => {
    renderComponent();

    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText(/Export Compliance Log/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Evidentiary Records')).toBeInTheDocument();
      expect(screen.getByText('Listing Mutations Reviewed')).toBeInTheDocument();
      expect(screen.getByText('Security & Tamper Denials')).toBeInTheDocument();
    });
  });

  it('populates data table with audit events and renders status badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Grand Horizon Penthouse BGC')).toBeInTheDocument();
      expect(screen.getByText('Immutable Record Mutation')).toBeInTheDocument();
      expect(screen.getByText('property.edit_approved')).toBeInTheDocument();
      expect(screen.getByText('audit.tamper_denied')).toBeInTheDocument();
    });
  });

  it('filters events when searching keyword', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Grand Horizon Penthouse BGC')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by actor, property, inquiry/i);
    fireEvent.change(searchInput, { target: { value: 'Eleanor' } });

    expect(screen.getByText('Grand Horizon Penthouse BGC')).toBeInTheDocument();
    expect(screen.queryByText('Immutable Record Mutation')).not.toBeInTheDocument();
  });

  it('opens side drawer when clicking Inspect', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Inspect')[0]).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText('Inspect');
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Administrative Stated Rationale')).toBeInTheDocument();
      expect(screen.getByText('Price adjustment verified.')).toBeInTheDocument();
      expect(screen.getByText('Previous State (Before Mutation)')).toBeInTheDocument();
      expect(screen.getByText('Committed State (After Mutation)')).toBeInTheDocument();
    });
  });

  it('calls exportAuditEvents and displays confirmation alert on Export click', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    renderComponent();

    const exportBtn = screen.getByText(/Export Compliance Log/i);
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(auditService.exportAuditEvents).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Compliance Bundle Generated:/i)).toBeInTheDocument();
    });
  });
});
