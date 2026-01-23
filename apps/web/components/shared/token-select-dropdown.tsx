import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { Address } from '@sodax/types';

type Token = {
  address: Address;
  symbol: string;
  icon?: string;
  className?: string;
};

export function TokenSelectDropdown({
  selectedToken,
  onSelectToken,
  tokens,
  disabled = false,
}: {
  selectedToken: Address | '';
  onSelectToken: (token: Address) => void;
  tokens: Token[];
  disabled?: boolean;
}) {
  return (
    <Select value={selectedToken} onValueChange={onSelectToken} disabled={disabled}>
      <SelectTrigger className="w-full" disabled={disabled}>
        <SelectValue placeholder="Select token" />
      </SelectTrigger>

      <SelectContent>
        {tokens.map(token => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center gap-2">
              {token.icon && <img src={token.icon} alt={token.symbol} className="w-4 h-4" />}
              {token.symbol}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
