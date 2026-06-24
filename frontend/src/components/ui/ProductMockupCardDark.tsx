import { ReactNode } from 'react';

type ProductMockupCardDarkProps = {
  title?: string;
  children?: ReactNode;
};

export function ProductMockupCardDark({ title, children }: ProductMockupCardDarkProps) {
  return (
    <div className="rounded-lg bg-surface-dark p-8 text-on-dark">
      {title ? <p className="text-title-sm font-medium text-on-dark">{title}</p> : null}
      <div className="mt-3 text-body-sm text-on-dark-soft">{children}</div>
    </div>
  );
}
