import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InquirySourceBadge from './InquirySourceBadge';
import SlaCountdownPill from './SlaCountdownPill';
import AiQualificationPanel from './AiQualificationPanel';
import InternalNotesRail from './InternalNotesRail';

describe('Shared Inquiry UI Components', () => {
  describe('InquirySourceBadge', () => {
    it('renders AI Concierge and Consent Verified badges for ai_chatbot with consent', () => {
      render(<InquirySourceBadge source="ai_chatbot" consentAccepted={true} />);
      expect(screen.getByText('AI Concierge')).toBeInTheDocument();
      expect(screen.getByText('Consent Verified')).toBeInTheDocument();
    });

    it('renders Web Form without Consent Verified when source is not ai_chatbot', () => {
      render(<InquirySourceBadge source="property_page" consentAccepted={false} />);
      expect(screen.getByText('Web Form')).toBeInTheDocument();
      expect(screen.queryByText('Consent Verified')).not.toBeInTheDocument();
    });
  });

  describe('SlaCountdownPill', () => {
    it('renders remaining minutes when created within 30-minute SLA', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      render(<SlaCountdownPill createdAt={tenMinsAgo} operationalStatus="awaiting_agent" />);
      expect(screen.getByText(/m left/i)).toBeInTheDocument();
    });

    it('renders SLA Overdue when operationalStatus is overdue', () => {
      render(<SlaCountdownPill operationalStatus="overdue" />);
      expect(screen.getByText('SLA Overdue')).toBeInTheDocument();
    });

    it('renders Closed when businessStatus is inactive', () => {
      render(<SlaCountdownPill businessStatus="inactive" operationalStatus="overdue" />);
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });
  });

  describe('AiQualificationPanel', () => {
    it('renders structured sections and triggers onCiteMessage when citation chip is clicked', () => {
      const onCiteMessage = vi.fn();
      const aiSummary = {
        generationStatus: 'ready',
        sections: {
          clientOverview: { summary: 'Cash buyer seeking Makati penthouse.' },
          propertyRequirements: {
            targetProperty: { value: 'The Grand Penthouse', sourceMessageIds: ['msg-1', 'msg-2'], basis: 'explicit' },
            budget: { value: 'PHP 45M', sourceMessageIds: ['msg-2'], basis: 'explicit' },
          },
          timelineAndUrgency: { timeframe: { value: 'Within 30 days' }, urgencyLevel: 'high' },
          qualificationAndReadiness: { financingMode: { value: 'Cash' } },
          keyQuestionsAndConcerns: [{ question: 'Are association dues included?' }],
          recommendedNextAction: { action: 'Schedule private viewing', priority: 'high' },
        },
      };

      render(<AiQualificationPanel aiSummary={aiSummary} onCiteMessage={onCiteMessage} />);
      expect(screen.getByText('ready')).toBeInTheDocument();
      expect(screen.getByText('Cash buyer seeking Makati penthouse.')).toBeInTheDocument();
      expect(screen.getByText('Schedule private viewing')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cited (2)'));
      expect(onCiteMessage).toHaveBeenCalledWith(['msg-1', 'msg-2']);
    });
  });

  describe('InternalNotesRail', () => {
    it('displays privacy guardrail notice and submits new private notes', async () => {
      const onAddNote = vi.fn().mockResolvedValueOnce(undefined);
      render(
        <InternalNotesRail
          notes={[{ id: 'n1', authorName: 'Broker', content: 'VIP client', timestamp: '2026-11-13' }]}
          onAddNote={onAddNote}
        />
      );

      expect(screen.getByText(/Private — Never visible to clients or the AI Concierge/i)).toBeInTheDocument();
      expect(screen.getByText('VIP client')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/Add confidential client note/i);
      fireEvent.change(textarea, { target: { value: 'Pre-approved cash buyer' } });
      fireEvent.submit(textarea.closest('form'));

      await waitFor(() => {
        expect(onAddNote).toHaveBeenCalledWith('Pre-approved cash buyer');
      });
    });
  });
});
