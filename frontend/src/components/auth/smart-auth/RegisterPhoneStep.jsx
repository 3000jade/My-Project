import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

const PRIMARY_BUTTON_CLASS =
  'w-full h-14 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-base normal-case tracking-normal gap-2';

const INPUT_CLASS =
  'h-14 px-4 rounded-lg border-outline bg-surface text-base text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';

export default function RegisterPhoneStep({ phone, onChangePhone, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        <Field className="gap-2">
          <FieldLabel htmlFor="reg-phone" className="text-base font-medium text-on-surface">
            Phone number
          </FieldLabel>
          <Input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            autoFocus
            value={phone}
            onChange={(e) => onChangePhone(e.target.value)}
            placeholder="+63 917 000 0000"
            className={INPUT_CLASS}
            required
          />
        </Field>
      </FieldGroup>

      <Button type="submit" className={PRIMARY_BUTTON_CLASS}>
        <span>Continue</span>
        <ArrowRight className="size-5" />
      </Button>
    </form>
  );
}
