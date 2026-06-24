import { ReactNode } from 'react';

import { cn } from '../../lib/cn';

type CtaBandProps = {
  variant?: 'coral' | 'dark';
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CtaBand({ variant = 'coral', title, subtitle, action }: CtaBandProps) {
  const isCoral = variant === 'coral';

  return (
    <section
      className={cn(
        'rounded-lg p-16 text-center',
        isCoral ? 'bg-primary text-on-primary' : 'bg-surface-dark text-on-dark',
      )}
    >
      <h2 className="text-display-sm font-semibold">{title}</h2>
      {subtitle ? (
        <p
          className={cn(
            'mx-auto mt-3 max-w-xl text-body-md',
            isCoral ? 'text-on-primary/90' : 'text-on-dark-soft',
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}
