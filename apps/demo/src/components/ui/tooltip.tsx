'use client';
import * as React from 'react';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider(props: ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={0} {...props} />;
}

function Tooltip(props: ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger(props: ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const TooltipContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>>(
  function TooltipContent({ className, sideOffset = 0, children, ...props }, ref) {
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          data-slot="tooltip-content"
          sideOffset={sideOffset}
          className={cn(
            `
    z-50 w-fit rounded-md px-3 py-1.5 text-xs
    bg-cherry-soda text-primary-foreground

    transition-all duration-200 ease-out
    data-[state=delayed-open]:animate-in
    data-[state=closed]:animate-out

    data-[state=delayed-open]:fade-in-0
    data-[state=closed]:fade-out-0

    data-[state=delayed-open]:zoom-in-95
    data-[state=closed]:zoom-out-95
    `,
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="fill-cherry-soda w-2 h-1 mr-1" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  },
);

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
