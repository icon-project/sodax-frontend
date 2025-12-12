import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CurrencySearchPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  currencyListOpened: boolean;
  onSearchFocus?: () => void;
}

export default function CurrencySearchPanel({
  searchQuery,
  onSearchChange,
  currencyListOpened,
  onSearchFocus,
}: CurrencySearchPanelProps) {
  return (
    <div className="w-full gap-(--layout-space-small) flex">
      <InputGroup
        className={cn(
          'rounded-full w-full md:w-44 h-10 border-none shadow-none mix-blend-multiply',
          currencyListOpened ? 'bg-almost-white/60' : 'bg-almost-white',
        )}
      >
        <InputGroupAddon>
          <InputGroupText>
            <SearchIcon className="w-4 h-4 text-clay-light" />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search"
          className="placeholder:text-clay-light font-['InterRegular']"
          onChange={e => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          value={searchQuery}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton className="outline-none gap-1">
            <div className="w-6 h-6 grid grid-cols-2 gap-1 p-[2px]">
              <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" priority />
              <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" priority />
              <Image
                src="/chain/0xa4b1.arbitrum.png"
                alt="Arbitrum"
                width={8}
                height={8}
                className="rounded-[2px]"
                priority
              />
              <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" priority />
            </div>
            <ChevronDownIcon className="w-4 h-4 text-clay-light" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <Tabs defaultValue="account" className="hidden md:block">
        <TabsList className="bg-transparent text-clay-light text-(length:--body-comfortable) p-0 gap-(--layout-space-small)">
          <TabsTrigger
            value="stablecoins"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn('mix-blend-multiply', currencyListOpened ? 'bg-vibrant-white/60' : 'bg-vibrant-white')}
            >
              2
            </Badge>
            Stablecoins
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn('mix-blend-multiply', currencyListOpened ? 'bg-vibrant-white/60' : 'bg-vibrant-white')}
            >
              2
            </Badge>
            Assets
          </TabsTrigger>
          <TabsTrigger
            value="top-apy"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn('mix-blend-multiply', currencyListOpened ? 'bg-vibrant-white/60' : 'bg-vibrant-white')}
            >
              2
            </Badge>
            Top APY
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
