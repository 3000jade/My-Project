import {
  AlertCircle,
  Car,
  Clock,
  Hospital,
  MapPin,
  School,
  ShoppingBag,
  Train,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LANDMARK_META = {
  school: { label: 'School', Icon: School },
  mall: { label: 'Mall', Icon: ShoppingBag },
  hospital: { label: 'Hospital', Icon: Hospital },
  transit: { label: 'Transport', Icon: Train },
  highway: { label: 'Highway', Icon: Car },
};

/**
 * Nearby landmarks and estimated drive times card for AI Property Concierge replies.
 *
 * @param {object} props
 * @param {{ propertyId: string, propertyTitle: string, landmarks?: Array, commutes?: Array, unavailable?: boolean }} props.nearby
 */
export default function ChatNearbyCard({ nearby }) {
  if (!nearby) {
    return null;
  }

  const landmarks = Array.isArray(nearby.landmarks) ? nearby.landmarks : [];
  const commutes = Array.isArray(nearby.commutes) ? nearby.commutes : [];

  return (
    <Card className="w-full min-w-0 overflow-hidden bg-white border-[#E2E8F0] shadow-xs">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
          <MapPin className="size-4 shrink-0 text-[#0F766E]" />
          <span className="min-w-0">Nearby {nearby.propertyTitle}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4 pt-0">
        {nearby.unavailable ? (
          <Alert variant="warning">
            <AlertCircle />
            <AlertDescription>
              Distance details are temporarily unavailable right now. Talk to an agent for exact travel times.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {landmarks.length > 0 && (
              <div className="flex flex-col gap-2">
                {landmarks.map((item, idx) => {
                  const meta = LANDMARK_META[item.category] || {
                    label: item.category,
                    Icon: MapPin,
                  };
                  const CategoryIcon = meta.Icon;

                  return (
                    <div
                      key={`${item.category}-${idx}`}
                      className="flex items-center justify-between gap-2 text-xs text-[#1E293B]"
                    >
                      <span className="flex items-center gap-2 text-[#64748B] shrink-0">
                        <CategoryIcon className="size-4 shrink-0 text-[#0F766E]" />
                        <Badge variant="secondary">{meta.label}</Badge>
                      </span>
                      <span className="text-right font-medium text-[#1E293B] min-w-0 truncate">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {landmarks.length > 0 && commutes.length > 0 && <Separator />}

            {commutes.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Estimated Drive Times
                </h4>
                <div className="flex flex-col gap-2">
                  {commutes.map((commute, idx) => (
                    <div
                      key={`${commute.destinationName}-${idx}`}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="flex items-center gap-1 font-medium text-[#1E293B] min-w-0 truncate">
                        <Clock className="size-4 shrink-0 text-[#0F766E]" />
                        <span className="truncate">{commute.destinationName}</span>
                      </span>
                      <span className="text-[#64748B] tabular-nums shrink-0">
                        {commute.durationText} · {commute.distanceText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
