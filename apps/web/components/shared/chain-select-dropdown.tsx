import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { availableChains } from '@/constants/chains';
import type { ChainId } from '@sodax/types';

export function ChainSelectDropdown({
  selectedChainId,
  selectChainId,
  allowedChains,
}: {
  selectedChainId: ChainId;
  selectChainId: (id: ChainId) => void;
  allowedChains: ChainId[];
}) {
  const chains = availableChains.filter(c => allowedChains.includes(c.id as ChainId));

  return (
    <Select value={selectedChainId} onValueChange={selectChainId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {chains.map(chain => (
          <SelectItem key={chain.id} value={chain.id}>
            <div className="flex items-center gap-2">
              <img src={chain.icon} alt={chain.name} className="w-4 h-4" />
              {chain.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
