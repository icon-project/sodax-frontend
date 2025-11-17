import { Accordion, AccordionItem, AccordionContent, AccordionTriggerWithButton } from '@/components/ui/accordion';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { Token, XToken, SpokeChainId } from '@sodax/types';
import NetworkIcon from './network-icon';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon } from 'lucide-react';
import { useMemo } from 'react';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { getChainName } from '@/constants/chains';
import { INJECTIVE_MAINNET_CHAIN_ID } from '@sodax/types';

export default function CurrencyList({ searchQuery }: { searchQuery: string }) {
  const tokens = useMemo(
    () =>
      Object.entries(moneyMarketSupportedTokens).flatMap(([chainId, chainTokens]) =>
        chainTokens.map((t: Token) => {
          if (chainId !== INJECTIVE_MAINNET_CHAIN_ID) {
            return {
              ...t,
              xChainId: chainId as SpokeChainId,
            } satisfies XToken;
          }
        }),
      ),
    [],
  );

  const uniqueTokenSymbols = getUniqueTokenSymbols(tokens.filter(token => token !== undefined) as XToken[]);
  const filteredTokens = uniqueTokenSymbols.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full">
      <Accordion type="single" collapsible className="network-accordion">
        {filteredTokens.map(({ symbol, tokens }) => (
          <AccordionItem key={symbol} value={symbol} className="border-none">
            <Separator className="h-[1px] bg-clay opacity-30" />
            <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />
            <AccordionTriggerWithButton>
              <Item variant="default" className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal)">
                <ItemMedia>
                  <CurrencyLogo currency={tokens[0] as XToken} hideNetwork={true} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="justify-between flex w-full">
                    <span className="text-espresso text-(length:--body-comfortable) font-['InterRegular']">
                      {symbol}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">5.52%</span>
                      <span className="text-clay-light text-(length:--body-comfortable) font-['InterRegular']">
                        APY
                      </span>
                    </div>
                  </ItemTitle>
                  <div className="flex w-full justify-between">
                    <div className="flex items-center">
                      {tokens.map(token => (
                        <NetworkIcon key={token.xChainId} imageSrc={getChainName(token.xChainId) || ''} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-clay-light text-(length:--body-small) font-['InterBold']">$28,067.62</span>
                      <span className="text-clay-light text-(length:--body-small) font-['InterRegular']">
                        paid-out (30d)
                      </span>
                    </div>
                  </div>
                </ItemContent>
              </Item>
            </AccordionTriggerWithButton>
            <AccordionContent className="pl-0 md:pl-18 pb-8 flex flex-col gap-4">
              <div className="flex items-center">
                <div className="flex h-12 items-center">
                  <Separator orientation="vertical" className="bg-cream-white border-l-2" />
                  <div className="flex-col pl-(--layout-space-small) pr-(--layout-space-normal)">
                    <div className="text-espresso text-(length:--subtitle) font-['InterBold']">3.56%</div>
                    <div className="text-clay-light text-(length:--body-small) font-['InterRegular'] flex gap-1">
                      Current APY <AlertCircleIcon className="w-4 h-4 text-clay-light" />
                    </div>
                  </div>
                  <Separator orientation="vertical" className="bg-cream-white border-l-2" />
                  <div className="flex-col pl-(--layout-space-small) pr-(--layout-space-normal)">
                    <div className="text-espresso text-(length:--subtitle) font-['InterBold']">$34.9k</div>
                    <div className="text-clay-light text-(length:--body-small) font-['InterRegular'] flex gap-1">
                      All deposits <AlertCircleIcon className="w-4 h-4 text-clay-light" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex">
                    <CurrencyLogo currency={tokens[0] as XToken} hideNetwork={true} />
                  </div>
                  <div className="text-clay text-(length:--body-small) font-['InterRegular'] text-center">{symbol}</div>
                </div>
              </div>
              <div className="flex gap-4 items-center mt-4">
                <Button variant="cream" className="w-27">
                  Continue
                </Button>
                <span className="text-clay text-(length:--body-small) font-['InterRegular']">
                  Pick an assset to continue
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
