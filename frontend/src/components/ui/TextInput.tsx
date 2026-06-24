import { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'h-10 rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-body-md text-ink',
        'outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15',
        className,
      )}
      {...props}
    />
  );
}
