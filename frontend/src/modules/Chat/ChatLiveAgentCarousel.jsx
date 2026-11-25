import { useRef, useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'LA';
}

/**
 * High-UX medium-scale horizontal carousel of online, verified live agents.
 *
 * @param {object} props
 * @param {Array<object>} [props.agents]
 * @param {boolean} [props.isLoading]
 * @param {boolean} [props.isExpanded]
 * @param {(agent: object) => void} [props.onSelectAgent]
 * @param {() => void} [props.onBestMatch]
 * @param {() => void} [props.onLeaveMessage]
 * @param {() => void} [props.onCancel]
 */
export default function ChatLiveAgentCarousel({
  agents = [],
  isLoading = false,
  isExpanded = false,
  onSelectAgent,
  onBestMatch,
  onLeaveMessage,
  onCancel,
}) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidthClass = isExpanded
    ? 'w-[85%] sm:w-[82%] lg:w-[48%]'
    : 'w-[85%] sm:w-[82%]';

  const scrollToIndex = (index) => {
    const clamped = Math.max(0, Math.min(index, Math.max(0, agents.length - 1)));
    setActiveIndex(clamped);
    const track = trackRef.current;
    if (!track || !track.children?.[clamped]) return;
    const child = track.children[clamped];
    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
    }
  };

  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || !agents.length) return;
    const firstCard = track.children?.[0];
    const step = firstCard ? firstCard.offsetWidth + 16 : 260;
    if (step > 0) {
      const idx = Math.round(track.scrollLeft / step);
      setActiveIndex(Math.max(0, Math.min(idx, agents.length - 1)));
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        data-testid="live-agent-carousel-panel"
        className="flex flex-col gap-4 p-4 bg-[#F8FAFC] border-t border-[#E2E8F0]"
      >
        {/* Header + Side-by-Side Carousel Arrows */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-semibold text-[#1E293B] truncate">
                Available Agents
              </h3>
              {!isLoading && agents.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                  <span className="size-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                  {agents.length} online
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Pick a specialist or let us match you right away
            </p>
          </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous agent"
            disabled={isLoading || activeIndex <= 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 sm:size-9 border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F1F5F9]"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next agent"
            disabled={isLoading || activeIndex >= agents.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 sm:size-9 border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F1F5F9]"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Snap Carousel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1].map((idx) => (
            <Card
              key={idx}
              className={`${cardWidthClass} shrink-0 rounded-xl border border-[#E2E8F0] bg-white shadow-xs`}
            >
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          data-lenis-prevent="true"
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.2) }}
              whileHover={{ y: -2 }}
              className={`${cardWidthClass} shrink-0 snap-center sm:snap-start`}
            >
              <Card className="h-full rounded-xl border border-[#E2E8F0] bg-white shadow-xs hover:shadow-md transition-shadow motion-reduce:transition-none">
              <CardContent className="p-4 flex flex-col gap-4">
                {/* Top Identity Row */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="size-12">
                      {agent.avatar ? (
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                      ) : null}
                      <AvatarFallback className="bg-[#CCFBF1] text-[#0F766E] font-semibold text-sm">
                        {getInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="absolute bottom-0 right-0 size-3 rounded-full bg-[#10B981] ring-2 ring-white"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-base font-semibold text-[#1E293B] truncate">
                      {agent.name}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <ShieldCheck className="size-3.5 text-[#0F766E]" aria-hidden="true" />
                        Verified Agent
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
                        Online now
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Reason */}
                <div className="flex items-center gap-2 text-sm text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                  {agent.isListingAgent ? (
                    <Home className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                  ) : (
                    <MapPin className="size-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate font-medium">
                    {agent.matchReason || 'Available Specialist'}
                  </span>
                </div>

                {/* Medium-Scale Primary Card Action */}
                <Button
                  type="button"
                  onClick={() => onSelectAgent?.(agent)}
                  className="w-full min-h-11 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold"
                >
                  <MessageSquare data-icon="inline-start" className="size-4" aria-hidden="true" />
                  Chat Now
                </Button>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dot Indicators */}
      {!isLoading && agents.length > 1 && (
        <div className="flex items-center justify-center gap-2" aria-label="Agent carousel pagination">
          {agents.map((agent, idx) => (
            <button
              key={agent.id}
              type="button"
              aria-label={`View agent ${idx + 1}`}
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 ${
                idx === activeIndex ? 'w-5 bg-[#0F766E]' : 'w-2 bg-[#CBD5E1] hover:bg-[#94A3B8]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Side-by-Side Panel Footer Actions */}
      <div className={`grid grid-cols-2 ${isExpanded ? 'gap-4' : 'gap-2'}`}>
        <Button
          type="button"
          variant="ghost"
          disabled={isLoading || agents.length === 0}
          onClick={onBestMatch}
          className="w-full min-h-11 bg-[#FF8559] hover:bg-[#F07144] hover:text-white text-white font-semibold"
        >
          <Sparkles data-icon="inline-start" className="size-4" aria-hidden="true" />
          Best Match
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onLeaveMessage}
          className="w-full min-h-11 border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F1F5F9] font-semibold"
        >
          <Mail data-icon="inline-start" className="size-4" aria-hidden="true" />
          Leave a Message
        </Button>
      </div>
      </motion.div>
    </MotionConfig>
  );
}
