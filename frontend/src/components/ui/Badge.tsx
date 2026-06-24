import { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type BadgeVariant = 'pill' | 'coral';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  pill: 'bg-surface-card text-ink text-caption',
  coral: 'bg-primary text-on-primary text-caption-uppercase uppercase',
};

export function Badge({ variant = 'pill', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-medium',
        BADGE_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
