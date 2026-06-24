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
      <div className="mt-8">
        <Button variant={featured ? 'secondary-on-dark' : 'primary'} className="w-full">
          {ctaLabel}
        </Button>
      </div>
      <ul
        className={cn(
          'mt-8 flex flex-col gap-2 border-t pt-8 text-body-md',
          featured ? 'border-on-dark/10 text-on-dark-soft' : 'border-hairline text-body',
        )}
      >
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
