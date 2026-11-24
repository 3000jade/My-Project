import {
  Bot,
  Home,
  Sparkles,
  Building2,
  BookOpen,
  MapPin,
  GitCompareArrows,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const GENERAL_PROMPTS = [
  {
    label: 'Homes under ₱20M',
    prompt: 'Help me find published homes under ₱20M',
    Icon: Home,
    type: 'prompt',
  },
  {
    label: 'Featured homes',
    prompt: 'Show me your featured published homes',
    Icon: Sparkles,
    type: 'prompt',
  },
  {
    label: 'Condos in Makati or BGC',
    prompt: 'Show me condos for sale in Makati or BGC',
    Icon: Building2,
    type: 'prompt',
  },
  {
    label: 'How buying works',
    prompt: 'What are the basic steps to buy a property in the Philippines?',
    Icon: BookOpen,
    type: 'prompt',
  },
];

const LISTING_PROMPTS = [
  {
    label: "What's nearby?",
    prompt: "What's nearby this property?",
    Icon: MapPin,
    type: 'prompt',
  },
  {
    label: 'Compare similar homes',
    prompt: 'Compare this home with similar published listings',
    Icon: GitCompareArrows,
    type: 'prompt',
  },
  {
    label: 'Key specs & monthly dues',
    prompt: 'Tell me the key features, sizes, and monthly association dues of this listing',
    Icon: ClipboardList,
    type: 'prompt',
  },
  {
    label: 'Ask an agent about this',
    Icon: MessageSquare,
    type: 'agent',
  },
];

/**
 * Warm, gallery-style welcome panel displayed before a visitor sends their first message.
 *
 * @param {object} props
 * @param {object | null} [props.activeListing]
 * @param {(prompt: string) => void} [props.onSelectPrompt]
 * @param {(listing: object) => void} [props.onAskAgent]
 */
export default function ChatWelcomeView({ activeListing = null, onSelectPrompt, onAskAgent }) {
  const hasActiveListing = Boolean(activeListing?.title);
  const tiles = hasActiveListing ? LISTING_PROMPTS : GENERAL_PROMPTS;

  const handleTileClick = (tile) => {
    if (tile.type === 'agent') {
      onAskAgent?.(activeListing);
      return;
    }
    onSelectPrompt?.(tile.prompt);
  };

  return (
    <Card className="w-full min-w-0 bg-white border-[#E2E8F0] shadow-xs rounded-xl">
      <CardHeader className="flex flex-col gap-2 space-y-0 p-4 pb-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="size-10 shrink-0 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
            <Bot className="size-5" aria-hidden="true" />
          </div>
          {hasActiveListing && (
            <Badge variant="default" className="max-w-full min-w-0">
              <span className="truncate">{activeListing.title}</span>
            </Badge>
          )}
        </div>

        <CardTitle className="text-base font-semibold text-[#1E293B] leading-snug">
          How can I help you find your next home?
        </CardTitle>

        <CardDescription className="text-xs text-[#64748B] leading-relaxed">
          Automated AI Property Concierge — not a PRC-licensed broker (RA 9646).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tiles.map((tile) => {
            const TileIcon = tile.Icon;
            return (
              <Button
                key={tile.label}
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full justify-start gap-2 whitespace-normal px-4 py-2 text-left text-xs font-medium normal-case tracking-normal text-[#1E293B] border-[#E2E8F0] hover:border-[#0F766E] hover:bg-[#F8FAFC]"
                onClick={() => handleTileClick(tile)}
              >
                <TileIcon data-icon="inline-start" />
                <span>{tile.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
