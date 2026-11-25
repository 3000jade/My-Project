import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import { PageContainer } from '@/components/ui/layout/LayoutPrimitives';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACTION_LABELS } from '@/constants/uiLabels';
import { AppMotionProvider, fadeSlideReveal } from '@/lib/motion';

export default function UnderDevelopmentPage({
  title = 'Page Under Development',
  badgeLabel = 'Under Development',
  description = 'This page is currently being built and will be available soon.',
  variant = 'public',
  homePath = '/',
  primaryActionLabel = 'Return Home',
  onPrimaryAction,
}) {
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    if (typeof onPrimaryAction === 'function') {
      onPrimaryAction();
      return;
    }
    navigate(homePath);
  };

  return (
    <AppMotionProvider>
      <PageContainer
        variant={variant}
        className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-10 md:py-12"
      >
        <motion.div {...fadeSlideReveal} className="w-full min-w-0">
          <Card className="w-full rounded-xl border-outline bg-surface shadow-xs p-6 sm:p-10 lg:p-12 flex flex-col items-center text-center gap-8">
            <div className="size-20 sm:size-24 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Construction className="size-10 sm:size-12" aria-hidden="true" />
            </div>

            <CardHeader className="p-0 flex flex-col items-center text-center gap-4">
              <Badge
                variant="warning"
                className="px-4 py-1.5 text-sm font-semibold tracking-wider"
              >
                <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                {badgeLabel}
              </Badge>

              <CardTitle className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-tight">
                {title}
              </CardTitle>

              <CardDescription className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                {description}
              </CardDescription>
            </CardHeader>

            <CardFooter className="p-0 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button
                type="button"
                variant="default"
                size="lg"
                className="min-h-11 h-12 px-8 text-base w-full sm:w-auto"
                onClick={handlePrimaryAction}
              >
                <Home data-icon="inline-start" aria-hidden="true" />
                {primaryActionLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-11 h-12 px-8 text-base w-full sm:w-auto"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                {ACTION_LABELS.back}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </PageContainer>
    </AppMotionProvider>
  );
}
