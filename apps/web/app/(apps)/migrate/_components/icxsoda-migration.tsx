'use client';

import { Button } from '@/components/ui/button';

import Image from 'next/image';
import { formatUnits, parseUnits } from 'viem';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { ICON_MAINNET_CHAIN_ID, type SpokeChainId, type XToken } from '@sodax/types';
import { useSodaxContext } from '@sodax/dapp-kit';

import { SwitchDirectionIcon } from '@/components/icons';
import { normaliseTokenAmount, calculateMaxAvailableAmount } from '../_utils';
import CurrencyInputPanel, { CurrencyInputPanelType } from './currency-input-panel';
import { useMigrationStore } from '../_stores/migration-store-provider';
import { icxToken, sodaToken } from '../_stores/migration-store';
import { MigrateButton } from './migrate-button';
import { itemVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
export default function IcxsodaMigration() {
  const { address: iconAddress } = useXAccount('ICON');
  const { address: sonicAddress } = useXAccount('EVM');
  const { sodax } = useSodaxContext();

  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const switchDirection = useMigrationStore(state => state.switchDirection);
  const setTypedValue = useMigrationStore(state => state.setTypedValue);
  const setChainForCurrency = useMigrationStore(state => state.setChainForCurrency);

  const { data: balances } = useXBalances({
    xChainId: ICON_MAINNET_CHAIN_ID,
    xTokens: [icxToken],
    address: iconAddress,
  });
  const icxBalance = balances?.[icxToken.address] || 0n;

  const { data: sodaBalances } = useXBalances({
    xChainId: SONIC_MAINNET_CHAIN_ID,
    xTokens: [sodaToken],
    address: sonicAddress,
  });
  const sodaBalance = BigInt(sodaBalances?.[sodaToken.address] || 0);

  const sourceAddress = useXAccount(direction.from).address;
  const destinationAddress = useXAccount(direction.to).address;

  const getBalanceForChain = (chainId: SpokeChainId, token: XToken): bigint => {
    return chainId === ICON_MAINNET_CHAIN_ID ? icxBalance : sodaBalance;
  };

  const handleMaxClick = async () => {
    const balance = getBalanceForChain(direction.from, currencies.from);

    try {
      // Estimate gas fee based on the chain
      let gasFeeEstimate: bigint;
      const fullBalance = normaliseTokenAmount(balance, currencies.from.decimals);
      const fullBalanceBigInt = parseUnits(fullBalance, currencies.from.decimals);
      const feeAmount = sodax.swaps.getPartnerFee(fullBalanceBigInt);
      if (direction.from === ICON_MAINNET_CHAIN_ID) {
        gasFeeEstimate = parseUnits(
          (0.02 * Number(fullBalance) < 0.02 ? 0.02 : 0.02 * Number(fullBalance)).toString(),
          currencies.from.decimals,
        );
      } else {
        gasFeeEstimate = feeAmount;
      }

      const maxAvailableAmount = calculateMaxAvailableAmount(balance, currencies.from.decimals, gasFeeEstimate);
      setTypedValue(Number(maxAvailableAmount).toFixed(2));
    } catch (error) {
      console.error('Error calculating max amount with gas fees:', error);
      // Fallback to original behavior if gas estimation fails
      setTypedValue(Number(formatUnits(balance, currencies.from.decimals)).toFixed(2));
    }
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

        <motion.div variants={itemVariants} className="w-full">
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
            Takes ~1 min · Network fee: {direction.from === ICON_MAINNET_CHAIN_ID ? '~0.02 ICX' : '~0.1 Sonic'}
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="w-full">
          <div className="w-full self-stretch bg-[#efe9e8] rounded-2xl inline-flex flex-col justify-start items-start gap-2 p-(--layout-space-comfortable) lg:mt-4 mt-2">
            <div className="self-stretch inline-flex justify-center items-center gap-2">
              <div className="w-4 h-4 relative mix-blend-multiply">
                <Image src="/symbol_dark.png" alt="" width={16} height={16} />
              </div>
              <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] text-(size:--body-super-comfortable) leading-tight">
                {direction.from === ICON_MAINNET_CHAIN_ID
                  ? "You're migrating to Sonic"
                  : "You're migrating back to ICON"}
              </div>
            </div>
            <div className="self-stretch justify-center text-clay text-xs font-medium font-['InterRegular'] text-(size:--body-comfortable) leading-tight">
              {direction.from === ICON_MAINNET_CHAIN_ID
                ? "You won't need S token to receive your SODA. But you will for any future transactions on Sonic."
                : 'ICX will be sent to your connected ICON wallet.'}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
