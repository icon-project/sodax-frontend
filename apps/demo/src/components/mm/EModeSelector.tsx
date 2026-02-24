import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSodaxContext } from '@sodax/dapp-kit';
import { poolAbi, type EmodeDataHumanized } from '@sodax/sdk';
import { getMoneyMarketConfig, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import type { Address } from 'viem';

const lendingPool = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).lendingPool as Address;

interface EModeSelectorProps {
  hubWalletAddress: string | undefined;
}

export function EModeSelector({ hubWalletAddress }: EModeSelectorProps) {
  const { sodax } = useSodaxContext();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [selectedEMode, setSelectedEMode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ txHash?: string; error?: string } | null>(null);

  // Fetch available e-mode categories
  const { data: eModes } = useQuery<EmodeDataHumanized[]>({
    queryKey: ['mm', 'eModes'],
    queryFn: () => sodax.moneyMarket.data.getEModesHumanized(),
  });

  // Fetch user's current e-mode
  const { data: currentEMode, refetch: refetchCurrentEMode } = useQuery({
    queryKey: ['mm', 'userEMode', hubWalletAddress],
    queryFn: async () => {
      if (!publicClient || !hubWalletAddress) return 0;
      const result = await publicClient.readContract({
        address: lendingPool,
        abi: poolAbi,
        functionName: 'getUserEMode',
        args: [hubWalletAddress as Address],
      });
      return Number(result);
    },
    enabled: !!publicClient && !!hubWalletAddress,
    refetchInterval: 10000,
  });

  // Set initial selection to current e-mode
  useEffect(() => {
    if (currentEMode !== undefined && selectedEMode === '') {
      setSelectedEMode(String(currentEMode));
    }
  }, [currentEMode, selectedEMode]);

  const handleSetEMode = async () => {
    if (!walletClient || !publicClient || selectedEMode === '') return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const hash = await walletClient.writeContract({
        address: lendingPool,
        abi: poolAbi,
        functionName: 'setUserEMode',
        args: [Number(selectedEMode)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setResult({ txHash: hash });
      refetchCurrentEMode();
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentEModeLabel = eModes?.find(e => e.id === currentEMode)?.eMode.label || 'None';
  const selectedEModeData = eModes?.find(e => e.id === Number(selectedEMode));
  const isChanged = selectedEMode !== '' && Number(selectedEMode) !== currentEMode;

  return (
    <Card className="my-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">E-Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 space-y-1">
            <div className="text-sm text-clay">
              Current: <span className="font-medium text-cherry-dark">{currentEMode === 0 ? 'Disabled' : `${currentEModeLabel} (ID: ${currentEMode})`}</span>
            </div>
            <Select value={selectedEMode} onValueChange={setSelectedEMode}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select E-Mode category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None (Disabled)</SelectItem>
                {eModes
                  ?.filter(e => e.id !== 0)
                  .map(eMode => (
                    <SelectItem key={eMode.id} value={String(eMode.id)}>
                      {eMode.eMode.label || `Category ${eMode.id}`} (LTV: {(Number(eMode.eMode.ltv) / 100).toFixed(0)}%)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEModeData && isChanged && (
            <div className="text-xs text-clay space-y-0.5">
              <div>LTV: {(Number(selectedEModeData.eMode.ltv) / 100).toFixed(0)}%</div>
              <div>Liq. Threshold: {(Number(selectedEModeData.eMode.liquidationThreshold) / 100).toFixed(0)}%</div>
            </div>
          )}

          <Button
            onClick={handleSetEMode}
            disabled={isSubmitting || !walletClient || !isChanged}
            size="sm"
          >
            {isSubmitting ? 'Setting...' : 'Set E-Mode'}
          </Button>
        </div>

        {result?.error && (
          <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs break-all">
            {result.error}
          </div>
        )}
        {result?.txHash && (
          <div className="mt-2 p-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs break-all">
            E-Mode updated:{' '}
            <a
              href={`https://sonicscan.org/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {result.txHash}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
