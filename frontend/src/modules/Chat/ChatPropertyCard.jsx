import { MapPin, Bed, Bath, ExternalLink, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Compact property summary card rendered inside AI Property Concierge replies.
 *
 * @param {object} props
 * @param {object} props.property
 * @param {(property: object) => void} [props.onAskAgent]
 * @param {(property: object) => void} [props.onNavigate]
 */
export default function ChatPropertyCard({ property, onAskAgent, onNavigate }) {
  if (!property) {
    return null;
  }

  const displayPrice =
    property.formattedPrice ||
    (typeof property.price === 'number' ? `PHP ${property.price.toLocaleString()}` : '');

  const hasBedrooms = property.bedrooms !== null && property.bedrooms !== undefined;
  const hasBathrooms = property.bathrooms !== null && property.bathrooms !== undefined;

  return (
    <Card className="w-full min-w-0 overflow-hidden bg-white border-[#E2E8F0] shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-[#1E293B] leading-snug min-w-0">
          {property.title}
        </CardTitle>
        {property.transactionType && (
          <Badge variant="default" className="shrink-0">
            {property.transactionType}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex items-start gap-4 p-4 pt-0">
        {property.mainImage ? (
          <img
            src={property.mainImage}
            alt={property.title}
            className="size-20 shrink-0 rounded-lg object-cover border border-[#E2E8F0]"
          />
        ) : (
          <div className="size-20 shrink-0 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center p-1 text-xs text-[#64748B] text-center">
            No photo
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {displayPrice && (
            <p className="text-sm font-bold text-[#0F766E] tabular-nums">
              {displayPrice}
            </p>
          )}

          {property.city && (
            <p className="flex items-center gap-1 text-xs text-[#64748B]">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{property.city}</span>
            </p>
          )}

          {(hasBedrooms || hasBathrooms) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#1E293B]">
              {hasBedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="size-4 shrink-0 text-[#64748B]" />
                  <span>
                    {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </span>
                </span>
              )}
              {hasBathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="size-4 shrink-0 text-[#64748B]" />
                  <span>
                    {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 p-4 pt-0">
        <Button asChild variant="outline" size="sm">
          <a
            href={`/properties/${property.id}`}
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate(property);
              }
            }}
          >
            <ExternalLink data-icon="inline-start" />
            View Home
          </a>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="bg-[#FF6B6B] text-[#1E293B] hover:bg-[#EE5A5A] font-semibold"
          onClick={() => onAskAgent?.(property)}
        >
          <MessageSquare data-icon="inline-start" />
          Ask Agent
        </Button>
      </CardFooter>
    </Card>
  );
}
