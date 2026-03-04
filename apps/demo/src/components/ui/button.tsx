import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer',
        ghost: 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
        link: 'text-primary underline-offset-4 hover:underline cursor-pointer',
        cherry: 'bg-cherry-dark text-white hover:bg-cherry-soda hover:scale-105 cursor-pointer',
        cherrySoda: 'bg-cherry-soda text-white hover:bg-cherry-dark hover:scale-105 cursor-pointer',
        cherryOutline:
          'bg-cherry-dark border-2 border-cherry-bright text-cherry-brighter hover:bg-cherry-brighter hover:text-cherry-dark hover:scale-105 cursor-pointer',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
