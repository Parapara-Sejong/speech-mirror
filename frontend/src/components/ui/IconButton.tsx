import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas text-ink',
        className,
      )}
      {...props}
    />
  );
}
