import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import type {
  InquiryAiSummary,
  InquiryAiSummarySections,
  InquiryBusinessStatus,
  InquiryOperationalStatus,
  AiFactCitation,
} from '../../../shared/types/inquiry';

export interface SummarySourceInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactVerified?: boolean;
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: string;
  businessStatus?: InquiryBusinessStatus;
  operationalStatus?: InquiryOperationalStatus;
  status: string;
  agentId?: string;
  agentName?: string;
  sessionId?: string;
  messages: Array<{
    id: string;
    sender: string;
    sender_name: string;
    timestamp: string;
    content: string;
  }>;
}

const PROMPT_INJECTION_REGEX =
  /ignore\s+(all\s+)?previous\s+instructions|change\s+status\s+to|grant\s+admin|system\s+override|disregard\s+rules|you\s+are\s+now\s+root/i;

let summariesByInquiry = new Map<string, InquiryAiSummary[]>();

function stripPromptInjectionInstructions(text: string): { sanitized: string; blocked: boolean } {
  const blocked = PROMPT_INJECTION_REGEX.test(text);
  // Keep factual parts while neutralizing imperative instruction injection phrases
  const sanitized = text.replace(
    /ignore\s+(all\s+)?previous\s+instructions[^.]*\.?/gi,
    '[UNTRUSTED_INSTRUCTION_IGNORED]'
  );
  return { sanitized, blocked };
}

function notProvidedCitation(): AiFactCitation {
  return {
    value: 'Not provided',
    sourceMessageIds: [],
    basis: 'not_provided',
  };
}

export class InquirySummaryService {
  public static resetForTesting(): void {
    summariesByInquiry.clear();
  }

  public static listSummariesForInquiry(inquiryId: string): InquiryAiSummary[] {
    return [...(summariesByInquiry.get(inquiryId) || [])].sort((a, b) => b.version - a.version);
  }

  public static getLatestSummary(inquiryId: string): InquiryAiSummary | null {
    const list = this.listSummariesForInquiry(inquiryId);
    return list[0] || null;
  }

  /**
   * Mark any 'ready' summary on an inquiry as 'outdated' when new messages arrive (AI-02)
   */
  public static markSummariesOutdated(inquiryId: string, _newMessageId?: string): void {
    const existing = summariesByInquiry.get(inquiryId);
    if (!existing) return;
    for (const s of existing) {
      if (s.generationStatus === 'ready') {
        s.generationStatus = 'outdated';
      }
    }
  }

  /**
   * Generate structured 6-section AI Client Summary Report from an authorized transcript snapshot (AI-01, AI-02)
   */
  public static async generateSummary(params: {
    inquiry: SummarySourceInquiry;
    actor: { id: string; name: string; role: string };
    simulateFailure?: boolean;
  }): Promise<InquiryAiSummary> {
    const { inquiry, actor, simulateFailure } = params;
    const existingList = summariesByInquiry.get(inquiry.id) || [];
    const nextVersion = existingList.length + 1;
    const messages = inquiry.messages || [];
    const fromMsgId = messages[0]?.id || 'none';
    const toMsgId = messages[messages.length - 1]?.id || 'none';
    const nowIso = new Date().toISOString();

    if (simulateFailure) {
      const failedRecord: InquiryAiSummary = {
        id: `aisum-${Date.now()}-v${nextVersion}`,
        inquiryId: inquiry.id,
        sessionId: inquiry.sessionId,
        version: nextVersion,
        generationStatus: 'failed',
        reviewStatus: 'unreviewed',
        coveredFromMessageId: fromMsgId,
        coveredToMessageId: toMsgId,
        coveredMessageCount: messages.length,
        modelVersion: 'human-shelter-concierge-summarizer-v2',
        templateVersion: 'v1.0',
        sections: this.buildEmptySections(inquiry, nowIso),
        errorMessage: 'AI summarization provider temporarily unavailable. Retry available.',
        generatedAt: nowIso,
      };
      existingList.push(failedRecord);
      summariesByInquiry.set(inquiry.id, existingList);

      await AuditService.recordEvent({
        eventType: 'inquiry.ai_summary_failed',
        actorId: actor.id,
        actorName: actor.name,
        actorType: 'human',
        actorRole: actor.role,
        inquiryId: inquiry.id,
        targetType: 'ai_summary',
        targetId: failedRecord.id,
        outcome: 'failure',
        reason: failedRecord.errorMessage,
      });

      await NotificationService.enqueueInquiryEvent({
        eventKey: `ai_summary.failed:${failedRecord.id}`,
        eventType: 'ai_summary.failed',
        inquiryId: inquiry.id,
        recipientId: inquiry.agentId || actor.id,
        recipientRole: 'agent',
        title: 'AI Summary Generation Failed',
        message: `AI summary generation for inquiry ${inquiry.id} failed. Click to retry.`,
        channels: ['system'],
      });

      return failedRecord;
    }

    // Analyze transcript strictly as untrusted data (AI-01)
    let promptInjectionBlocked = false;
    let budgetFact: AiFactCitation = notProvidedCitation();
    let locationFact: AiFactCitation = notProvidedCitation();
    let preferenceFact: AiFactCitation = notProvidedCitation();
    let intentFact: AiFactCitation = notProvidedCitation();
    let urgencyFact: AiFactCitation = notProvidedCitation();
    let timelineFact: AiFactCitation = notProvidedCitation();
    let statedContactFact: AiFactCitation = notProvidedCitation();
    const mainQuestions: string[] = [];
    const answersProvided: string[] = [];
    const unresolvedItems: string[] = [];
    const qaMsgIds: string[] = [];
    const nextStepMsgIds: string[] = [];
    let viewingRequestText = 'Not provided';
    let nextStepsText = 'Not provided';

    for (const msg of messages) {
      const { sanitized, blocked } = stripPromptInjectionInstructions(msg.content);
      if (blocked) {
        promptInjectionBlocked = true;
      }

      // Extract budget
      const budgetMatch = sanitized.match(/(?:budget(?:\s+of)?|₱|PHP\s*)\s*([₱\d.,]+\s*[MBKmbk]?)/i);
      if (budgetMatch) {
        budgetFact = {
          value: budgetMatch[0].trim(),
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
      }

      // Extract location
      const locMatch = sanitized.match(
        /(?:in|near|at)\s+(Ayala Alabang|Forbes Park|Makati|BGC|Taguig|Alabang|Bonifacio Global City|Rockwell|Proscenium)/i
      );
      if (locMatch) {
        locationFact = {
          value: locMatch[1],
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
      }

      // Extract buying/renting intent
      if (/\b(buy|purchase|acquire|residence|letter of intent|LOI)\b/i.test(sanitized)) {
        intentFact = {
          value: 'Purchase / Acquisition',
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
      } else if (/\b(lease|leasing|rent|renting)\b/i.test(sanitized)) {
        intentFact = {
          value: 'Lease / Rental',
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
      }

      // Extract timeline & urgency
      const timeMatch = sanitized.match(/within\s+\d+\s+(?:days?|weeks?|months?)|this\s+(?:Saturday|Friday|Tuesday|week)/i);
      if (timeMatch) {
        timelineFact = {
          value: timeMatch[0],
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
        urgencyFact = {
          value: 'High (explicit target timeframe stated)',
          sourceMessageIds: [msg.id],
          basis: 'inferred',
        };
      }

      // Extract preferences
      if (/\b(parking|bedroom|pool|pavilion|penthouse|garden)\b/i.test(sanitized)) {
        preferenceFact = {
          value: sanitized.slice(0, 120),
          sourceMessageIds: [msg.id],
          basis: 'explicit',
        };
      }

      // Questions & Answers
      if (msg.sender === 'client' && sanitized.includes('?')) {
        mainQuestions.push(sanitized);
        qaMsgIds.push(msg.id);
      } else if (msg.sender === 'agent' || msg.sender === 'broker') {
        answersProvided.push(sanitized);
        qaMsgIds.push(msg.id);
      }

      // Viewing / Next steps
      if (/\b(viewing|visit|tour|schedule|Friday|Saturday)\b/i.test(sanitized)) {
        viewingRequestText = sanitized.slice(0, 140);
        nextStepsText = `Coordinate viewing / follow-up (${viewingRequestText})`;
        nextStepMsgIds.push(msg.id);
      }
    }

    if (mainQuestions.length > answersProvided.length) {
      unresolvedItems.push('Awaiting agent response to latest client question.');
    }

    const sections: InquiryAiSummarySections = {
      clientIdentity: {
        accountName: inquiry.name || 'Not provided',
        accountEmail: inquiry.email || 'Not provided',
        accountPhone: inquiry.phone || 'Not provided',
        contactVerified: Boolean(inquiry.contactVerified),
        conversationStatedDetails: statedContactFact,
      },
      propertyRequirements: {
        relatedListing: inquiry.propertyTitle
          ? `${inquiry.propertyTitle}${inquiry.propertyPrice ? ` (${inquiry.propertyPrice})` : ''}`
          : 'Not provided',
        preferredLocations: locationFact,
        budget: budgetFact,
        preferences: preferenceFact,
      },
      intentAndTimeline: {
        intent: intentFact,
        urgency: urgencyFact,
        timeline: timelineFact,
      },
      questionsAndConcerns: {
        mainQuestions: mainQuestions.length > 0 ? mainQuestions : ['Not provided'],
        answersProvided: answersProvided.length > 0 ? answersProvided : ['Not provided'],
        unresolvedItems: unresolvedItems.length > 0 ? unresolvedItems : ['None'],
        sourceMessageIds: Array.from(new Set(qaMsgIds)),
      },
      agreedNextSteps: {
        nextSteps: nextStepsText,
        responsiblePerson: inquiry.agentName || 'Assigned Advisory Agent',
        followUpDates: timelineFact.value !== 'Not provided' ? timelineFact.value : 'Not provided',
        viewingRequests: viewingRequestText,
        sourceMessageIds: Array.from(new Set(nextStepMsgIds)),
      },
      inquiryStatusSnapshot: {
        businessStatus: inquiry.businessStatus || 'active',
        operationalStatus: inquiry.operationalStatus || 'awaiting_agent',
        workflowStatus: inquiry.status || 'new',
        assignedAgentName: inquiry.agentName || 'Unassigned',
        snapshotTimestamp: nowIso,
      },
    };

    const summaryRecord: InquiryAiSummary = {
      id: `aisum-${Date.now()}-v${nextVersion}`,
      inquiryId: inquiry.id,
      sessionId: inquiry.sessionId,
      version: nextVersion,
      generationStatus: 'ready',
      reviewStatus: 'unreviewed',
      coveredFromMessageId: fromMsgId,
      coveredToMessageId: toMsgId,
      coveredMessageCount: messages.length,
      modelVersion: 'human-shelter-concierge-summarizer-v2',
      templateVersion: 'v1.0',
      sections,
      promptInjectionBlocked,
      clientShared: false,
      generatedAt: nowIso,
    };

    existingList.push(summaryRecord);
    summariesByInquiry.set(inquiry.id, existingList);

    await AuditService.recordEvent({
      eventType: 'inquiry.ai_summary_generated',
      actorId: actor.id,
      actorName: actor.name,
      actorType: 'human',
      actorRole: actor.role,
      inquiryId: inquiry.id,
      targetType: 'ai_summary',
      targetId: summaryRecord.id,
      outcome: 'success',
      newValues: {
        version: summaryRecord.version,
        coveredFromMessageId: fromMsgId,
        coveredToMessageId: toMsgId,
        promptInjectionBlocked,
      },
    });

    await NotificationService.enqueueInquiryEvent({
      eventKey: `ai_summary.ready:${summaryRecord.id}`,
      eventType: 'ai_summary.ready',
      inquiryId: inquiry.id,
      recipientId: inquiry.agentId || actor.id,
      recipientRole: 'agent',
      title: 'AI Client Summary Ready',
      message: `AI Client Summary v${summaryRecord.version} is ready for review.`,
      channels: ['system'],
    });

    return summaryRecord;
  }

  /**
   * Staff review or correction creates an attributed version while preserving history (AI-02)
   */
  public static async reviewOrCorrectSummary(
    inquiryId: string,
    summaryId: string,
    reviewInput: {
      actorId: string;
      actorName: string;
      actorRole: 'agent' | 'broker' | 'admin';
      reviewStatus: 'reviewed' | 'corrected' | 'approved';
      corrections?: Partial<InquiryAiSummarySections>;
    }
  ): Promise<InquiryAiSummary> {
    const existingList = summariesByInquiry.get(inquiryId) || [];
    const target = existingList.find((s) => s.id === summaryId);
    if (!target) {
      throw new Error(`AI summary "${summaryId}" not found for inquiry "${inquiryId}".`);
    }

    const nowIso = new Date().toISOString();
    if (reviewInput.corrections && Object.keys(reviewInput.corrections).length > 0) {
      const nextVersion = existingList.length + 1;
      const mergedSections: InquiryAiSummarySections = {
        ...target.sections,
        ...reviewInput.corrections,
        clientIdentity: {
          ...target.sections.clientIdentity,
          ...(reviewInput.corrections.clientIdentity || {}),
        },
        propertyRequirements: {
          ...target.sections.propertyRequirements,
          ...(reviewInput.corrections.propertyRequirements || {}),
        },
        intentAndTimeline: {
          ...target.sections.intentAndTimeline,
          ...(reviewInput.corrections.intentAndTimeline || {}),
        },
        questionsAndConcerns: {
          ...target.sections.questionsAndConcerns,
          ...(reviewInput.corrections.questionsAndConcerns || {}),
        },
        agreedNextSteps: {
          ...target.sections.agreedNextSteps,
          ...(reviewInput.corrections.agreedNextSteps || {}),
        },
        inquiryStatusSnapshot: {
          ...target.sections.inquiryStatusSnapshot,
          ...(reviewInput.corrections.inquiryStatusSnapshot || {}),
        },
      };

      const newVersionRecord: InquiryAiSummary = {
        ...target,
        id: `aisum-${Date.now()}-v${nextVersion}`,
        version: nextVersion,
        reviewStatus: reviewInput.reviewStatus,
        sections: mergedSections,
        staffCorrections: reviewInput.corrections,
        reviewedBy: reviewInput.actorId,
        reviewedByName: reviewInput.actorName,
        reviewedAt: nowIso,
      };
      existingList.push(newVersionRecord);
      summariesByInquiry.set(inquiryId, existingList);

      await AuditService.recordEvent({
        eventType: 'inquiry.ai_summary_corrected',
        actorId: reviewInput.actorId,
        actorName: reviewInput.actorName,
        actorType: 'human',
        actorRole: reviewInput.actorRole,
        inquiryId,
        targetType: 'ai_summary',
        targetId: newVersionRecord.id,
        outcome: 'success',
        previousValues: { version: target.version },
        newValues: { version: newVersionRecord.version, reviewStatus: reviewInput.reviewStatus },
      });

      return newVersionRecord;
    }

    target.reviewStatus = reviewInput.reviewStatus;
    target.reviewedBy = reviewInput.actorId;
    target.reviewedByName = reviewInput.actorName;
    target.reviewedAt = nowIso;

    await AuditService.recordEvent({
      eventType: 'inquiry.ai_summary_reviewed',
      actorId: reviewInput.actorId,
      actorName: reviewInput.actorName,
      actorType: 'human',
      actorRole: reviewInput.actorRole,
      inquiryId,
      targetType: 'ai_summary',
      targetId: target.id,
      outcome: 'success',
      newValues: { reviewStatus: target.reviewStatus },
    });

    return target;
  }

  private static buildEmptySections(inquiry: SummarySourceInquiry, nowIso: string): InquiryAiSummarySections {
    return {
      clientIdentity: {
        accountName: inquiry.name || 'Not provided',
        accountEmail: inquiry.email || 'Not provided',
        accountPhone: inquiry.phone || 'Not provided',
        contactVerified: Boolean(inquiry.contactVerified),
        conversationStatedDetails: notProvidedCitation(),
      },
      propertyRequirements: {
        relatedListing: inquiry.propertyTitle || 'Not provided',
        preferredLocations: notProvidedCitation(),
        budget: notProvidedCitation(),
        preferences: notProvidedCitation(),
      },
      intentAndTimeline: {
        intent: notProvidedCitation(),
        urgency: notProvidedCitation(),
        timeline: notProvidedCitation(),
      },
      questionsAndConcerns: {
        mainQuestions: ['Not provided'],
        answersProvided: ['Not provided'],
        unresolvedItems: ['Not provided'],
        sourceMessageIds: [],
      },
      agreedNextSteps: {
        nextSteps: 'Not provided',
        responsiblePerson: inquiry.agentName || 'Not provided',
        followUpDates: 'Not provided',
        viewingRequests: 'Not provided',
        sourceMessageIds: [],
      },
      inquiryStatusSnapshot: {
        businessStatus: inquiry.businessStatus || 'active',
        operationalStatus: inquiry.operationalStatus || 'awaiting_agent',
        workflowStatus: inquiry.status || 'new',
        assignedAgentName: inquiry.agentName || 'Unassigned',
        snapshotTimestamp: nowIso,
      },
    };
  }
}

export default InquirySummaryService;
