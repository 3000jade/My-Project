import { MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

/**
 * Side-by-side comparison table card for 2-3 published properties in chat replies.
 *
 * @param {object} props
 * @param {{ properties: Array<object>, rows: Array<{ label: string, values: Array<string> }> }} props.comparison
 * @param {(property: object) => void} [props.onAskAgent]
 */
export default function ChatComparisonCard({ comparison, onAskAgent }) {
  const properties = comparison?.properties;
  if (!comparison || !Array.isArray(properties) || properties.length < 2) {
    return null;
  }

  const rows = Array.isArray(comparison.rows) ? comparison.rows : [];

  return (
    <Card className="w-full min-w-0 overflow-hidden bg-white border-[#E2E8F0] shadow-xs">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-[#1E293B]">
          Side-by-Side Comparison
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-2 text-xs">Feature</TableHead>
              {properties.map((prop) => (
                <TableHead key={prop.id} className="p-2 text-xs text-[#1E293B]">
                  {prop.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="p-2 text-xs font-medium text-[#64748B]">
                  {row.label}
                </TableCell>
                {properties.map((prop, idx) => (
                  <TableCell
                    key={`${row.label}-${prop.id}`}
                    className="p-2 text-xs text-[#1E293B] tabular-nums"
                  >
                    {row.values?.[idx] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 p-4 pt-0">
        {properties.map((prop) => (
          <Button
            key={prop.id}
            type="button"
            variant="outline"
            size="sm"
            className="max-w-full"
            onClick={() => onAskAgent?.(prop)}
          >
            <MessageSquare data-icon="inline-start" className="shrink-0" />
            <span className="truncate">Ask about {prop.title}</span>
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
