'use client';

import { Button } from '@/components/ui/button';

import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { ICON_MAINNET_CHAIN_ID, type SpokeChainId, type XToken } from '@sodax/types';

import { SwitchDirectionIcon } from '@/components/icons';
import CurrencyInputPanel, { CurrencyInputPanelType } from './currency-input-panel';
import { useMigrationStore } from '../_stores/migration-store-provider';
import { formatUnits } from 'viem';
import Image from 'next/image';
import { chainIdToChainName } from '@/providers/constants';
import { MigrateButton } from './migrate-button';
import { itemVariants } from '@/constants/animation';
import { motion } from 'framer-motion';

export default function BnusdMigration() {
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const switchDirection = useMigrationStore(state => state.switchDirection);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);
  const setChainForCurrency = useMigrationStore(state => state.setChainForCurrency);

  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  const { data: fromChainBalances } = useXBalances({
    xChainId: direction.from,
    xTokens: [currencies.from],
    address: sourceAddress,
  });

  const { data: toChainBalances } = useXBalances({
    xChainId: direction.to,
    xTokens: [currencies.to],
    address: destinationAddress,
  });

  const getBalanceForChain = (chainId: SpokeChainId, token: XToken): bigint => {
    if (chainId === direction.from) {
      return fromChainBalances?.[token.address] || 0n;
    }
    if (chainId === direction.to) {
      return toChainBalances?.[token.address] || 0n;
    }

    return 0n;
  };

  const handleMaxClick = async () => {
    const balance = getBalanceForChain(direction.from, currencies.from);
    setTypedValue(formatUnits(balance, currencies.from.decimals));
  };

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  return (
    <div className="flex flex-col w-full gap-(--layout-space-comfortable)">
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <motion.div className="relative w-full" variants={itemVariants}>
          <CurrencyInputPanel
            type={CurrencyInputPanelType.INPUT}
            chainId={direction.from}
            currency={currencies.from}
            currencyBalance={getBalanceForChain(direction.from, currencies.from)}
            inputValue={typedValue}
            onInputChange={e => setTypedValue(e.target.value)}
            onMaxClick={handleMaxClick}
            onChainSelect={(chainId, token) => setChainForCurrency('from', chainId, token)}
            isChainConnected={isSourceChainConnected}
          />

          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 left-1/2 bottom-[-22px] absolute transform -translate-x-1/2 bg-cream-white rounded-[256px] border-4 border-[#F5F2F2] flex justify-center items-center hover:bg-cherry-grey hover:outline-cherry-grey hover:scale-110 cursor-pointer transition-all duration-200 active:bg-cream-white z-50"
            onClick={switchDirection}
          >
            <SwitchDirectionIcon className="w-3 h-3" />
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <CurrencyInputPanel
            type={CurrencyInputPanelType.OUTPUT}
            chainId={direction.to}
            currency={currencies.to}
            currencyBalance={getBalanceForChain(direction.to, currencies.to)}
            inputValue={typedValue}
            onChainSelect={(chainId, token) => setChainForCurrency('to', chainId, token)}
            isChainConnected={isDestinationChainConnected}
          />
        </motion.div>
      </div>

      <div className="inline-flex flex-col justify-start items-start gap-4">
        <motion.div variants={itemVariants}>
          <MigrateButton />
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="text-center justify-center text-clay-light font-['InterRegular'] leading-tight text-(size:--body-comfortable)">
            Takes ~1 min · Network fee:{' '}
            {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : `~0.1 ${currencies.from.symbol}`}
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="w-full">
          <div className="w-full self-stretch bg-[#efe9e8] rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
            <div className="self-stretch inline-flex justify-center items-center gap-2">
              <div className="w-4 h-4 relative mix-blend-multiply">
                <Image src="/symbol_dark.png" alt="" width={16} height={16} />
              </div>
              <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
                {`You're migrating bnUSD from ${chainIdToChainName(direction.from)} to ${chainIdToChainName(direction.to)}`}
              </div>
            </div>
            <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
              {direction.to === ICON_MAINNET_CHAIN_ID
                ? 'bnUSD will be sent to your connected ICON wallet.'
                : `bnUSD will be sent to your connected ${chainIdToChainName(direction.to)} wallet.`}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
