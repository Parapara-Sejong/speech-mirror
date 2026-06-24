import { ReactNode } from 'react';

type HeroBandProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function HeroBand({ eyebrow, title, subtitle, actions, aside }: HeroBandProps) {
  return (
    <section className="grid grid-cols-1 items-center gap-12 py-section md:grid-cols-2">
      <div className="flex flex-col gap-5">
        {eyebrow ? (
          <span className="text-caption-uppercase uppercase text-primary">{eyebrow}</span>
        ) : null}
        <h1 className="text-display-xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="text-title-md text-body">{subtitle}</p> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {aside ? <div>{aside}</div> : null}
    </section>
  );
}
