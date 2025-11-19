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
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function CurrencyList({
  searchQuery,
  openValue,
  setOpenValue,
}: { searchQuery: string; openValue: string; setOpenValue: (value: string) => void }) {
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

  //This is for mock data only
  const stablecoins = ['bnUSD', 'USDC', 'USDT', 'BTC', 'ETH'];

  const megaAssets = [{ BTC: ['BTCB', 'WBTC', 'cbBTC', 'tBTC'] }, { ETH: ['ETH', 'WETH', 'weETH', 'wstETH', 'ETHB'] }];

  const megaAssetSymbolMap = useMemo(() => {
    const map = new Map<string, string[]>();
    megaAssets.forEach(asset => {
      const entries = Object.entries(asset);
      if (entries.length > 0) {
        const firstEntry = entries[0];
        if (firstEntry) {
          const [megaSymbol, childSymbols] = firstEntry;
          if (megaSymbol && childSymbols) {
            map.set(megaSymbol, childSymbols as string[]);
          }
        }
      }
    });
    return map;
  }, []);

  const megaAssetTokenSymbols = megaAssets.flatMap(asset => Object.values(asset)[0]);

  const allTokens = tokens.filter(token => token !== undefined) as XToken[];
  const regularTokens = allTokens.filter(token => !megaAssetTokenSymbols.includes(token.symbol));
  const uniqueTokenSymbols = getUniqueTokenSymbols(regularTokens);

  const megaAssetEntries = megaAssets
    .map(asset => {
      const entries = Object.entries(asset);
      if (entries.length === 0) {
        return { symbol: '', tokens: [] };
      }
      const firstEntry = entries[0];
      if (!firstEntry) {
        return { symbol: '', tokens: [] };
      }
      const [megaSymbol, childSymbols] = firstEntry;
      const megaTokens = allTokens.filter(token => (childSymbols as string[]).includes(token.symbol));
      return {
        symbol: megaSymbol,
        tokens: megaTokens,
      };
    })
    .filter(entry => entry.symbol !== '' && entry.tokens.length > 0);

  const allFilteredTokens = [...uniqueTokenSymbols, ...megaAssetEntries]
    .filter(token => token.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aIsStablecoin = stablecoins.includes(a.symbol);
      const bIsStablecoin = stablecoins.includes(b.symbol);
      if (aIsStablecoin && !bIsStablecoin) return -1;
      if (!aIsStablecoin && bIsStablecoin) return 1;
      return 0;
    });

  return (
    <Accordion type="single" collapsible className="network-accordion" value={openValue} onValueChange={setOpenValue}>
      {allFilteredTokens.map(({ symbol, tokens }) => {
        const isCollapsed = openValue !== symbol || openValue === '';
        return (
          <AccordionItem
            key={symbol}
            value={symbol}
            className={cn(
              'border-none',
              openValue === '' ? 'opacity-100' : openValue === symbol ? 'opacity-100' : 'opacity-40',
            )}
          >
            <Separator className="h-[1px] bg-clay opacity-30" />
            <Separator className="data-[orientation=horizontal]:!h-[3px] bg-white opacity-30" />
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full group"
            >
              <AccordionTriggerWithButton>
                <Item variant="default" className="cursor-pointer py-5 px-0 w-full gap-(--layout-space-normal)">
                  <ItemMedia>
                    <CurrencyLogo currency={tokens[0] as XToken} hideNetwork={true} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="justify-between flex w-full">
                      <motion.div
                        className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] group-hover:font-bold"
                        data-name="Market name"
                        animate={{ y: isCollapsed ? 0 : 4 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      >
                        {megaAssetSymbolMap.has(symbol) ? (
                          <>
                            {symbol} <span className="text-clay">{megaAssetSymbolMap.get(symbol)?.join(' + ')}</span>
                          </>
                        ) : (
                          symbol
                        )}
                      </motion.div>
                      <AnimatePresence>
                        {isCollapsed && (
                          <motion.div
                            className="flex items-center gap-1 -mr-8 md:mr-0"
                            data-name="APR"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">
                              5.52%
                            </span>
                            <span className="text-clay-light text-(length:--body-comfortable) font-['InterRegular']">
                              APY
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </ItemTitle>
                    <div className="flex w-full justify-between">
                      <AnimatePresence>
                        {isCollapsed && (
                          <motion.div
                            className="content-stretch flex h-[16px] items-center justify-between relative shrink-0 w-full"
                            data-name="Row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div
                              className="content-stretch gap-0 flex items-center group-hover:gap-[2px] transition-all duration-200"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {(() => {
                                const uniqueTokensMap = new Map<SpokeChainId, XToken>();
                                for (const token of tokens) {
                                  if (!uniqueTokensMap.has(token.xChainId)) {
                                    uniqueTokensMap.set(token.xChainId, token);
                                  }
                                }
                                const uniqueTokens = Array.from(uniqueTokensMap.values());

                                return uniqueTokens.length >= 10 ? (
                                  <>
                                    {uniqueTokens.slice(0, 9).map(token => (
                                      <div
                                        className="-mr-[2px] group-hover:mr-0 transition-all duration-200"
                                        key={token.xChainId}
                                      >
                                        <NetworkIcon
                                          key={token.xChainId}
                                          imageSrc={getChainName(token.xChainId) || ''}
                                        />
                                      </div>
                                    ))}
                                    <div className="ring-2 ring-white shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] rounded w-4 h-4 flex items-center justify-center bg-white">
                                      <span className="text-espresso text-[8px] font-['InterRegular'] leading-none">
                                        +{uniqueTokens.length - 9}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  uniqueTokens.map(token => (
                                    <div
                                      className="-mr-[2px] group-hover:mr-0 transition-all duration-200"
                                      key={token.xChainId}
                                    >
                                      <NetworkIcon key={token.xChainId} imageSrc={getChainName(token.xChainId) || ''} />
                                    </div>
                                  ))
                                );
                              })()}
                            </motion.div>
                            <motion.div
                              className="items-center gap-1 hidden md:flex"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span className="text-clay-light text-(length:--body-small) font-['InterBold']">
                                $28,067.62
                              </span>
                              <span className="text-clay-light text-(length:--body-small) font-['InterRegular']">
                                paid-out (30d)
                              </span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </ItemContent>
                </Item>
              </AccordionTriggerWithButton>
            </motion.div>
            <AccordionContent className="pl-0 md:pl-18 pb-8 flex flex-col gap-4">
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
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
              </motion.div>
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex gap-(--layout-space-big)">
                  {megaAssetSymbolMap.has(symbol) ? (
                    getUniqueTokenSymbols(tokens).map(megaTokens =>
                      megaTokens.tokens.length === 1 ? (
                        <div className="flex flex-col gap-2" key={megaTokens.symbol}>
                          <div className="flex">
                            <CurrencyLogo currency={megaTokens.tokens[0] as XToken} />
                          </div>
                          <div className="text-clay text-(length:--body-small) font-['InterRegular'] text-center">
                            {megaTokens.symbol}
                          </div>
                        </div>
                      ) : (
                        <CurrencyLogo
                          currency={megaTokens.tokens[0] as XToken}
                          isGroup={true}
                          tokenCount={megaTokens.tokens.length}
                          key={megaTokens.symbol}
                        />
                      ),
                    )
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex">
                        {tokens.length === 1 ? (
                          <CurrencyLogo currency={tokens[0] as XToken} />
                        ) : (
                          <CurrencyLogo currency={tokens[0] as XToken} isGroup={true} tokenCount={tokens.length} />
                        )}
                      </div>
                      <div className="text-clay text-(length:--body-small) font-['InterRegular'] text-center">
                        {symbol}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              <motion.div
                className="flex gap-4 items-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Button variant="cream" className="w-27">
                  Continue
                </Button>
                <span className="text-clay text-(length:--body-small) font-['InterRegular']">
                  Pick an assset to continue
                </span>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
