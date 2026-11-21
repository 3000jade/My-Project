import React from 'react';
import { Brain, CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  ShadcnButton as Button,
  Spinner,
} from '../ui';

function CitationValue({ citation }) {
  if (!citation) {
    return <span className="text-on-surface-variant italic">Not provided</span>;
  }
  const value = typeof citation === 'string' ? citation : citation.value;
  const isMissing = !value || value === 'Not provided' || citation.basis === 'not_provided';
  const count = Array.isArray(citation.sourceMessageIds) ? citation.sourceMessageIds.length : 0;

  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={isMissing ? 'text-on-surface-variant italic' : 'font-medium text-on-surface'}>
        {value || 'Not provided'}
      </span>
      {count > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 normal-case tracking-normal">
          {count} {count === 1 ? 'citation' : 'citations'}
        </Badge>
      )}
    </span>
  );
}

export default function InquiryAiSummaryCard({
  aiSummary,
  fallbackSummary,
  generating = false,
  onRefresh,
}) {
  const sections = aiSummary?.sections;
  const status = aiSummary?.generationStatus;

  const badgeVariant =
    status === 'outdated'
      ? 'warning'
      : status === 'ready'
      ? 'success'
      : status === 'failed'
      ? 'destructive'
      : 'secondary';

  return (
    <Card data-testid="ai-client-summary-card" className="bg-surface border border-outline shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4 border-b border-outline">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-teal-50 text-primary flex items-center justify-center shrink-0">
            <Brain className="size-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-on-surface">
              AI Client Summary Report
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant">
              Structured 6-section client qualification extracted from the conversation
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status && (
            <Badge data-testid="ai-summary-status-badge" variant={badgeVariant}>
              {status === 'outdated' ? (
                <AlertTriangle className="size-3" />
              ) : status === 'ready' ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Sparkles className="size-3" />
              )}
              <span>{status}</span>
            </Badge>
          )}
          {onRefresh && (
            <Button
              type="button"
              size="sm"
              onClick={onRefresh}
              disabled={generating}
              className="min-h-11 sm:min-h-9"
            >
              {generating ? (
                <Spinner size="sm" className="text-current" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              <span>{generating ? 'Refreshing...' : 'Refresh AI Summary'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {sections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Client Identity */}
            <div className="p-4 rounded-lg bg-surface-variant/60 border border-outline flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                1. Client Identity
              </span>
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-on-surface-variant">Account: </span>
                  <span className="font-medium text-on-surface">
                    {sections.clientIdentity?.accountName || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Email: </span>
                  <span className="text-on-surface">
                    {sections.clientIdentity?.accountEmail || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Phone: </span>
                  <span className="text-on-surface">
                    {sections.clientIdentity?.accountPhone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Stated in Chat: </span>
                  <CitationValue citation={sections.clientIdentity?.conversationStatedDetails} />
                </div>
              </div>
            </div>

            {/* 2. Property Requirements */}
            <div className="p-4 rounded-lg bg-surface-variant/60 border border-outline flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                2. Property Requirements
              </span>
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-on-surface-variant">Listing: </span>
                  <span className="font-medium text-on-surface">
                    {sections.propertyRequirements?.relatedListing || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Locations: </span>
                  <CitationValue citation={sections.propertyRequirements?.preferredLocations} />
                </div>
                <div>
                  <span className="text-on-surface-variant">Budget: </span>
                  <CitationValue citation={sections.propertyRequirements?.budget} />
                </div>
                <div>
                  <span className="text-on-surface-variant">Preferences: </span>
                  <CitationValue citation={sections.propertyRequirements?.preferences} />
                </div>
              </div>
            </div>

            {/* 3. Intent & Timeline */}
            <div className="p-4 rounded-lg bg-surface-variant/60 border border-outline flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                3. Intent &amp; Timeline
              </span>
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-on-surface-variant">Intent: </span>
                  <CitationValue citation={sections.intentAndTimeline?.intent} />
                </div>
                <div>
                  <span className="text-on-surface-variant">Urgency: </span>
                  <CitationValue citation={sections.intentAndTimeline?.urgency} />
                </div>
                <div>
                  <span className="text-on-surface-variant">Timeline: </span>
                  <CitationValue citation={sections.intentAndTimeline?.timeline} />
                </div>
              </div>
            </div>

            {/* 4. Questions & Concerns */}
            <div className="p-4 rounded-lg bg-surface-variant/60 border border-outline flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                4. Questions &amp; Concerns
              </span>
              <div className="flex flex-col gap-1.5">
                <div>
                  <span className="text-on-surface-variant">Questions: </span>
                  <span className="text-on-surface">
                    {(sections.questionsAndConcerns?.mainQuestions || ['Not provided']).join('; ')}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Answers: </span>
                  <span className="text-on-surface">
                    {(sections.questionsAndConcerns?.answersProvided || ['Not provided']).join('; ')}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Unresolved: </span>
                  <span className="font-medium text-amber-700">
                    {(sections.questionsAndConcerns?.unresolvedItems || ['None']).join('; ')}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Agreed Next Steps */}
            <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-200 flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                5. Agreed Next Steps
              </span>
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-on-surface-variant">Next Steps: </span>
                  <span className="font-medium text-on-surface">
                    {sections.agreedNextSteps?.nextSteps || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Owner: </span>
                  <span className="text-on-surface">
                    {sections.agreedNextSteps?.responsiblePerson || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Follow-up / Viewing: </span>
                  <span className="text-on-surface">
                    {sections.agreedNextSteps?.viewingRequests && sections.agreedNextSteps.viewingRequests !== 'Not provided'
                      ? sections.agreedNextSteps.viewingRequests
                      : sections.agreedNextSteps?.followUpDates || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Status Snapshot */}
            <div className="p-4 rounded-lg bg-surface-variant/60 border border-outline flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                6. Inquiry Status Snapshot
              </span>
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-on-surface-variant">Lead Status: </span>
                  <span className="font-medium uppercase text-on-surface">
                    {sections.inquiryStatusSnapshot?.businessStatus || 'active'} (
                    {sections.inquiryStatusSnapshot?.workflowStatus || 'new'})
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Queue State: </span>
                  <span className="text-on-surface">
                    {sections.inquiryStatusSnapshot?.operationalStatus || 'awaiting_agent'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Assigned Consultant: </span>
                  <span className="font-medium text-on-surface">
                    {sections.inquiryStatusSnapshot?.assignedAgentName || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            {fallbackSummary || 'No structured AI summary generated yet. Click "Refresh AI Summary" to create one.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
