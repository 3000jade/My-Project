import React from 'react';

function CitationChip({ citation, onCiteMessage }) {
  if (!citation || (!citation.sourceMessageIds?.length && !citation.basis)) return null;
  const ids = citation.sourceMessageIds || [];
  const label = citation.basis === 'inferred' ? 'Inferred' : citation.basis === 'not_provided' ? 'Not Provided' : 'Cited';

  return (
    <button
      type="button"
      onClick={() => onCiteMessage?.(ids)}
      disabled={!ids.length || !onCiteMessage}
      title={ids.length ? `Jump to source message(s): ${ids.join(', ')}` : label}
      className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/25 hover:bg-[#0F766E] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-default"
    >
      {label}{ids.length ? ` (${ids.length})` : ''}
    </button>
  );
}

export default function AiQualificationPanel({
  aiSummary,
  fallbackSummaryText,
  onRefresh,
  refreshing = false,
  onCiteMessage,
}) {
  const sections = aiSummary?.sections;

  const overviewText =
    sections?.clientOverview?.summary ||
    sections?.clientIdentity?.conversationStatedDetails?.value ||
    fallbackSummaryText;

  const targetProperty =
    sections?.propertyRequirements?.targetProperty ||
    (sections?.propertyRequirements?.relatedListing
      ? { value: sections.propertyRequirements.relatedListing }
      : null);

  const budget = sections?.propertyRequirements?.budget;
  const bedrooms = sections?.propertyRequirements?.bedrooms;
  const bathrooms = sections?.propertyRequirements?.bathrooms;
  const features = sections?.propertyRequirements?.mustHaveFeatures || sections?.propertyRequirements?.preferences;

  const timeframe = sections?.timelineAndUrgency?.timeframe || sections?.intentAndTimeline?.timeline;
  const urgencyLevel =
    sections?.timelineAndUrgency?.urgencyLevel || sections?.intentAndTimeline?.urgency?.value;
  const financing = sections?.qualificationAndReadiness?.financingMode || sections?.intentAndTimeline?.intent;
  const decisionMakers = sections?.qualificationAndReadiness?.decisionMakers;

  const questions =
    sections?.keyQuestionsAndConcerns ||
    (sections?.questionsAndConcerns?.mainQuestions || []).map((q) => ({ question: q }));

  const nextAction =
    sections?.recommendedNextAction?.action || sections?.agreedNextSteps?.nextSteps;
  const nextRationale =
    sections?.recommendedNextAction?.rationale || sections?.agreedNextSteps?.viewingRequests;
  const nextPriority = sections?.recommendedNextAction?.priority;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#0F766E] text-2xl">psychology</span>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B]">AI Client Summary Report</h3>
            <p className="text-[11px] text-[#64748B]">
              Structured lead qualification synthesized from conversation history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {aiSummary?.generationStatus && (
            <span
              data-testid="ai-summary-status-badge"
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                aiSummary.generationStatus === 'outdated'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : aiSummary.generationStatus === 'ready'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {aiSummary.generationStatus}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="px-3 py-1 bg-[#0F766E] hover:bg-[#115E59] text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {refreshing ? 'Regenerating...' : 'Refresh AI Summary'}
            </button>
          )}
        </div>
      </div>

      {sections ? (
        <div className="space-y-4 text-xs">
          {overviewText && (
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                1. Client Overview
              </span>
              <p className="text-[#1E293B] font-medium leading-relaxed">{overviewText}</p>
            </div>
          )}

          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-2">
              2. Property Requirements &amp; Criteria
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#64748B]">Target Property:</span>{' '}
                <strong className="text-[#1E293B]">{targetProperty?.value || 'Not specified'}</strong>
                <CitationChip citation={targetProperty} onCiteMessage={onCiteMessage} />
              </div>
              <div>
                <span className="text-[#64748B]">Budget:</span>{' '}
                <strong className="text-[#1E293B]">{budget?.value || 'Not specified'}</strong>
                <CitationChip citation={budget} onCiteMessage={onCiteMessage} />
              </div>
              {bedrooms?.value && (
                <div>
                  <span className="text-[#64748B]">Bedrooms:</span>{' '}
                  <span className="text-[#1E293B]">{bedrooms.value}</span>
                </div>
              )}
              {bathrooms?.value && (
                <div>
                  <span className="text-[#64748B]">Bathrooms:</span>{' '}
                  <span className="text-[#64748B] italic">{bathrooms.value}</span>
                </div>
              )}
              {features?.value && (
                <div className="sm:col-span-2">
                  <span className="text-[#64748B]">Features / Preferences:</span>{' '}
                  <span className="text-[#1E293B]">{features.value}</span>
                  <CitationChip citation={features} onCiteMessage={onCiteMessage} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                3. Timeline &amp; Urgency
              </span>
              <p className="text-[11px]">
                <span className="text-[#64748B]">Timeframe:</span>{' '}
                <strong>{timeframe?.value || 'Not specified'}</strong>
                <CitationChip citation={timeframe} onCiteMessage={onCiteMessage} />
              </p>
              {urgencyLevel && (
                <p className="text-[11px] mt-1">
                  <span className="text-[#64748B]">Urgency Level:</span>{' '}
                  <span className="uppercase font-bold text-amber-700">{urgencyLevel}</span>
                </p>
              )}
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                4. Readiness &amp; Intent
              </span>
              <p className="text-[11px]">
                <span className="text-[#64748B]">Financing / Intent:</span>{' '}
                <strong>{financing?.value || 'Not specified'}</strong>
                <CitationChip citation={financing} onCiteMessage={onCiteMessage} />
              </p>
              {decisionMakers?.value && (
                <p className="text-[11px] mt-1">
                  <span className="text-[#64748B]">Decision Makers:</span>{' '}
                  <span>{decisionMakers.value}</span>
                </p>
              )}
            </div>
          </div>

          {questions.length > 0 && (
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-1">
                5. Key Questions &amp; Client Inquiries
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                {questions.map((q, idx) => (
                  <li key={idx} className="text-[#1E293B]">
                    {q.question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nextAction && (
            <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-[#0F766E] uppercase tracking-wider text-[10px] block mb-0.5">
                  6. Recommended Next Action
                </span>
                <p className="text-xs font-bold text-[#0F766E]">{nextAction}</p>
                {nextRationale && <p className="text-[11px] text-[#64748B] mt-0.5">{nextRationale}</p>}
              </div>
              {nextPriority && (
                <span className="px-2 py-0.5 bg-[#0F766E] text-white rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {nextPriority}
                </span>
              )}
            </div>
          )}
        </div>
      ) : fallbackSummaryText ? (
        <p className="text-xs font-sans text-[#1E293B] leading-relaxed">{fallbackSummaryText}</p>
      ) : (
        <p className="text-xs text-[#64748B] italic">
          AI Client Summary has not been generated for this inquiry yet.
        </p>
      )}
    </div>
  );
}
