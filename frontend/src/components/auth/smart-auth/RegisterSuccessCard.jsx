import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRIMARY_BUTTON_CLASS =
  'w-full h-14 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-base normal-case tracking-normal gap-2';

export default function RegisterSuccessCard({ fullName, email, onContinue }) {
  return (
    <div className="flex flex-col gap-6" data-testid="register-success-card">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-on-surface">Account created</h3>
        <p className="text-base text-on-surface-variant">
          Welcome, {fullName}.
        </p>
      </div>

      <div className="flex flex-col gap-1 p-4 rounded-lg bg-surface-variant border border-outline text-center">
        <p className="text-base font-semibold text-on-surface truncate">{fullName}</p>
        <p className="text-sm text-on-surface-variant truncate">{email}</p>
      </div>

      <Button type="button" onClick={onContinue} className={PRIMARY_BUTTON_CLASS}>
        <span>Go to dashboard</span>
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}
