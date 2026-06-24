import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'secondary-on-dark' | 'text-link';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'h-10 px-5 rounded-md bg-primary text-on-primary active:bg-primary-active disabled:bg-primary-disabled',
  secondary: 'h-10 px-5 rounded-md bg-canvas text-ink border border-hairline',
  'secondary-on-dark': 'h-10 px-5 rounded-md bg-surface-dark-elevated text-on-dark',
  'text-link': 'text-primary underline-offset-4 active:underline',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn('inline-flex items-center justify-center text-button font-medium', VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
