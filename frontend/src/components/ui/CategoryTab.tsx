import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type CategoryTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function CategoryTab({ active = false, className, ...props }: CategoryTabProps) {
  return (
    <button
      className={cn(
        'rounded-md px-3.5 py-2 text-nav-link font-medium',
        active ? 'bg-surface-card text-ink' : 'bg-transparent text-muted',
        className,
      )}
      {...props}
    />
  );
}
