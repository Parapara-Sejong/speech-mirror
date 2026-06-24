import { ReactNode } from 'react';

type CalloutCardCoralProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function CalloutCardCoral({ title, children, action }: CalloutCardCoralProps) {
  return (
    <div className="rounded-lg bg-primary p-12 text-on-primary">
      <h3 className="text-display-sm font-semibold">{title}</h3>
      {children ? <p className="mt-3 text-body-md text-on-primary/90">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
