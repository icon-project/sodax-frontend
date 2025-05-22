import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChainSelector } from '@/contexts/ChainSelectorContext';
import { xChains } from '@new-world/xwagmi';

export function ChainSelector() {
  const { selectedChain, changeChain } = useChainSelector();

  return (
    <Select value={selectedChain} onValueChange={changeChain}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <SelectValue placeholder="Select a chain" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {xChains.map(xChain => (
          <SelectItem key={xChain.xChainId} value={xChain.xChainId}>
            {xChain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
