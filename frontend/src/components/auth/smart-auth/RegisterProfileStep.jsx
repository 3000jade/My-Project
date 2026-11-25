import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

const PRIMARY_BUTTON_CLASS =
  'w-full h-14 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-base normal-case tracking-normal gap-2';

const INPUT_GROUP_CLASS =
  'h-14 rounded-lg border border-outline bg-surface shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20';

export default function RegisterProfileStep({
  password,
  onChangePassword,
  showPassword,
  onToggleShowPassword,
  passwordStrength,
  capsLockOn,
  onCapsLockCheck,
  isSubmitting,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        <Field className="gap-2">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="reg-password" className="text-base font-medium text-on-surface">
              Password
            </FieldLabel>
            {password.length > 0 && (
              <span
                data-testid="password-strength-label"
                className={cn('text-sm font-semibold', passwordStrength.tone)}
              >
                {passwordStrength.label}
              </span>
            )}
          </div>

          <InputGroup className={INPUT_GROUP_CLASS}>
            <InputGroupInput
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              onKeyUp={onCapsLockCheck}
              placeholder="At least 8 characters"
              className="h-14 px-4 text-base text-on-surface placeholder:text-on-surface-variant"
              required
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={onToggleShowPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="size-10 rounded-lg text-on-surface-variant hover:text-on-surface"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {capsLockOn && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-700 rounded-lg py-2 px-4">
              <AlertDescription className="text-xs text-amber-700">
                Caps Lock is on.
              </AlertDescription>
            </Alert>
          )}

          {password.length > 0 && (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-variant border border-outline">
              <Progress value={passwordStrength.score} className="w-full" />
              <div className="grid grid-cols-2 gap-2">
                {passwordStrength.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      rule.met ? 'text-emerald-700 font-medium' : 'text-on-surface-variant'
                    )}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full flex items-center justify-center shrink-0',
                        rule.met ? 'bg-emerald-100 text-emerald-700' : 'bg-outline'
                      )}
                    >
                      {rule.met && <Check className="size-3" />}
                    </span>
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Field>
      </FieldGroup>

      <p className="text-sm text-on-surface-variant leading-relaxed">
        By creating an account, you agree to our{' '}
        <span className="font-medium text-on-surface">Terms</span> and{' '}
        <span className="font-medium text-on-surface">Privacy Policy</span>.
      </p>

      <Button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASS}>
        {isSubmitting ? (
          <>
            <Spinner size="sm" className="text-white" />
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </form>
  );
}
