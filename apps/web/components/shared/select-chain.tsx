'use client';

import { Label } from '@/components/ui/label';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Custom lightweight SelectChain component. The existing chain selector component includes extra logic (logos, modals, layout wrappers)
// that isn't needed here, so this version keeps it simpler and easier to reuse in minimal UIs.

type SelectChainProps = {
  chainList: SpokeChainId[];
  value: SpokeChainId;
  setChain: (chain: SpokeChainId) => void;
  placeholder?: string;
  label?: string;
  id?: string;
};

export function SelectChain({ chainList, value, setChain, placeholder = 'Select chain', label, id }: SelectChainProps) {
  return (
    <div className="flex items-center gap-2 my-2">
      {label && (
        <Label htmlFor={id} className="text-md text-clay-light whitespace-nowrap">
          {label}
        </Label>
      )}
      <Select value={value.toString()} onValueChange={v => setChain(v as SpokeChainId)}>
        <SelectTrigger id={id} className="w-45">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {chainList.map(chain => (
            <SelectItem key={chain} value={chain.toString()}>
              {chainIdToChainName(chain)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
