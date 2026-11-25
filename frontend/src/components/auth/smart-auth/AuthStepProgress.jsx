import { Progress } from '@/components/ui/progress';

const STEP_META = {
  email: { label: 'Step 1 of 5', caption: 'Email', value: 20 },
  otp: { label: 'Step 2 of 5', caption: 'Verify email', value: 40 },
  phone: { label: 'Step 3 of 5', caption: 'Phone', value: 60 },
  name: { label: 'Step 4 of 5', caption: 'Full name', value: 80 },
  password: { label: 'Step 5 of 5', caption: 'Password', value: 95 },
  success: { label: 'Complete', caption: 'Done', value: 100 },
  loginEmail: { label: 'Step 1 of 2', caption: 'Sign in', value: 50 },
  login: { label: 'Step 2 of 2', caption: 'Password', value: 100 },
  invite: { label: 'Step 2 of 2', caption: 'Broker invitation', value: 100 },
};

export default function AuthStepProgress({ step }) {
  const meta = STEP_META[step] || STEP_META.email;

  return (
    <div className="flex flex-col gap-2" aria-label={`Authentication progress: ${meta.label}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{meta.label}</span>
        <span className="text-on-surface-variant">{meta.caption}</span>
      </div>
      <Progress value={meta.value} className="w-full" />
    </div>
  );
}
