import { cn } from '../../lib/cn';
import { Button } from './Button';

type PricingTierCardProps = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
};

export function PricingTierCard({
  name,
  price,
  period,
  features,
  featured = false,
  ctaLabel,
}: PricingTierCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg p-8',
        featured ? 'bg-surface-dark text-on-dark' : 'border border-hairline bg-canvas text-ink',
      )}
    >
      <p className={cn('text-title-lg font-medium', featured ? 'text-on-dark' : 'text-ink')}>
        {name}
      </p>
      <p className="mt-3 text-display-sm font-semibold">
        {price}
        {period ? (
          <span className={cn('text-body-sm font-normal', featured ? 'text-on-dark-soft' : 'text-muted')}>
            {period}
          </span>
        ) : null}
      </p>
      <ul
        className={cn(
          'mt-6 flex flex-col gap-2 text-body-md',
          featured ? 'text-on-dark-soft' : 'text-body',
        )}
      >
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="mt-8">
        <Button variant={featured ? 'secondary-on-dark' : 'primary'} className="w-full">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
