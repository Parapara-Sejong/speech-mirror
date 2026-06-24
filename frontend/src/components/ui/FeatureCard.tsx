import { ReactNode } from 'react';

type FeatureCardProps = {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
};

export function FeatureCard({ icon, title, children }: FeatureCardProps) {
  return (
    <div className="rounded-lg bg-surface-card p-8">
      {icon ? <div className="mb-4 text-primary">{icon}</div> : null}
      <h3 className="text-title-md font-medium text-ink">{title}</h3>
      {children ? <p className="mt-2 text-body-md text-body">{children}</p> : null}
    </div>
  );
}
