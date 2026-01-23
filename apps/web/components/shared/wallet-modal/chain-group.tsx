import type { FeeClaimAsset } from '@/app/(apps)/partner/utils/useFeeClaimAssets';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type ChainGroupProps = {
  chainName: string;
  chainIcon: string;
  balances: FeeClaimAsset[];
  children: React.ReactNode;
};

export function ChainGroup({ chainName, chainIcon, balances, children }: ChainGroupProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'bg-white w-full md:w-1/2 overflow-hidden relative',
        'transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)',
        'rounded-[28px]',
        open ? 'shadow-xl' : 'shadow-none',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 pointer-events-none z-20 rounded-[28px] border-[0.5px] ring-1 ring-clay-light/5',
        )}
      />

      <Button
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between px-7 py-3 h-auto relative z-10',
          'transition-all duration-500 ease-in-out',
          'hover:bg-clay-light/4 active:bg-clay-light/8',
          open ? 'rounded-t-[27px] rounded-b-none bg-clay-light/2' : 'rounded-[27px]',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={chainIcon}
              alt={chainName}
              className="w-6 h-6 rounded-full border-[0.5px] border-clay-light/10 shadow-sm"
            />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-espresso text-base tracking-tight">{chainName}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-clay">{balances.length} Assets</span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-5 h-5 text-clay-light/40 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)',
            open ? 'rotate-180 text-espresso' : 'rotate-0',
          )}
        />
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-5 pb-5 bg-vibrant-white/20">
              <div className="mx-2 h-[0.5px] bg-clay-light/10 mb-4" />
              <div className="flex flex-col gap-2">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
