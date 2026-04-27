/*
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/zustand/useAppStore';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, CheckCircle2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useXAccount, useWalletProvider, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import { useGetUserHubWalletAddress, useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { hubAssets, erc20Abi, EvmAssetManagerService, SpokeService } from '@sodax/sdk';
import { baseChainInfo, type ChainId, type SpokeChainId } from '@sodax/types';
import { formatTokenAmount, getChainExplorerTxUrl, getReadableTxError } from '@/lib/utils';
import type { Address, Hex } from 'viem';

type HubAssetBalance = {
  spokeTokenAddress: string;
  hubAssetAddress: string;
  symbol: string;
  name: string;
  decimal: number;
  balance: bigint;
};

type WithdrawResult = {
  success: boolean;
  txHash?: string;
  error?: string;
};

export default function RecoveryPage() {
  const { selectedChainId, selectChainId, openWalletModal } = useAppStore();
  const xAccount = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId as SpokeChainId, walletProvider);
  const { data: hubWalletAddress } = useGetUserHubWalletAddress(selectedChainId as SpokeChainId, xAccount?.address);
  const { sodax } = useSodaxContext();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const [balances, setBalances] = useState<HubAssetBalance[] | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [withdrawingAssets, setWithdrawingAssets] = useState<Set<string>>(new Set());
  const [withdrawResults, setWithdrawResults] = useState<Record<string, WithdrawResult>>({});
  const [isWithdrawingAll, setIsWithdrawingAll] = useState(false);

  const allowedChains = useMemo(
    () =>
      Object.values(baseChainInfo)
        .filter(chain => chain.type === 'EVM' && hubAssets[chain.id as SpokeChainId])
        .map(chain => chain.id as ChainId),
    [],
  );

  // Clear state when chain changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedChainId is the intentional trigger to reset state
  useEffect(() => {
    setBalances(null);
    setBalanceError(null);
    setWithdrawingAssets(new Set());
    setWithdrawResults({});
    setIsWithdrawingAll(false);
  }, [selectedChainId]);

  const fetchBalances = useCallback(async () => {
    if (!hubWalletAddress || !selectedChainId || !sodax) return;

    const chainHubAssets = hubAssets[selectedChainId as SpokeChainId];
    if (!chainHubAssets || Object.keys(chainHubAssets).length === 0) {
      setBalances([]);
      return;
    }

    setIsLoadingBalances(true);
    setBalanceError(null);

    try {
      const entries = Object.entries(chainHubAssets);

      const results = await sodax.hubProvider.publicClient.multicall({
        contracts: entries.map(([, hubAsset]) => ({
          address: hubAsset.asset as Address,
          abi: erc20Abi,
          functionName: 'balanceOf' as const,
          args: [hubWalletAddress],
        })),
        allowFailure: true,
      });

      const assetBalances: HubAssetBalance[] = entries
        .map(([spokeTokenAddress, hubAsset], index) => {
          const result = results[index];
          const balance = result.status === 'success' ? (result.result as bigint) : 0n;
          return {
            spokeTokenAddress,
            hubAssetAddress: hubAsset.asset,
            symbol: hubAsset.symbol,
            name: hubAsset.name,
            decimal: hubAsset.decimal,
            balance,
          };
        })
        .filter(asset => asset.balance > 0n);

      setBalances(assetBalances);
    } catch (err) {
      setBalanceError(getReadableTxError(err));
      setBalances(null);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [hubWalletAddress, selectedChainId, sodax]);

  useEffect(() => {
    if (hubWalletAddress) {
      fetchBalances();
    }
  }, [hubWalletAddress, fetchBalances]);

  const handleWithdrawAsset = useCallback(
    async (asset: HubAssetBalance) => {
      if (!spokeProvider || !hubWalletAddress || !xAccount?.address || !sodax) return;

      setWithdrawingAssets(prev => new Set(prev).add(asset.spokeTokenAddress));

      try {
        const data: Hex = EvmAssetManagerService.withdrawAssetData(
          {
            token: asset.spokeTokenAddress as Hex,
            to: xAccount.address as Hex,
            amount: asset.balance,
          },
          sodax.hubProvider,
          selectedChainId as SpokeChainId,
        );

        const txHash = await SpokeService.callWallet(hubWalletAddress, data, spokeProvider, sodax.hubProvider);

        setWithdrawResults(prev => ({
          ...prev,
          [asset.spokeTokenAddress]: { success: true, txHash: txHash as string },
        }));
      } catch (err) {
        setWithdrawResults(prev => ({
          ...prev,
          [asset.spokeTokenAddress]: { success: false, error: getReadableTxError(err) },
        }));
      } finally {
        setWithdrawingAssets(prev => {
          const next = new Set(prev);
          next.delete(asset.spokeTokenAddress);
          return next;
        });
      }
    },
    [spokeProvider, hubWalletAddress, xAccount, sodax, selectedChainId],
  );

  const handleWithdrawAll = useCallback(async () => {
    if (!balances || balances.length === 0) return;
    setIsWithdrawingAll(true);

    for (const asset of balances) {
      if (withdrawResults[asset.spokeTokenAddress]?.success) continue;
      await handleWithdrawAsset(asset);
    }

    setIsWithdrawingAll(false);
    await fetchBalances();
  }, [balances, withdrawResults, handleWithdrawAsset, fetchBalances]);

  const pendingWithdrawCount = balances?.filter(a => !withdrawResults[a.spokeTokenAddress]?.success).length ?? 0;

  return (
    <main className="min-h-screen bg-linear-to-br from-almost-white via-cream-white to-vibrant-white">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="my-3">
          <h1 className="text-4xl font-bold text-cherry-dark">Recovery</h1>
          <p className="text-clay">Withdraw assets stuck in your hub wallet back to your spoke chain wallet.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-cherry-grey/20 p-3 my-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-clay">Chain:</span>
              <ChainSelector
                selectedChainId={selectedChainId}
                selectChainId={selectChainId}
                allowedChains={allowedChains}
              />
            </div>

            {hubWalletAddress && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-clay">Hub Wallet:</span>
                <span className="px-3 py-1.5 bg-cream rounded-lg text-cherry-dark text-xs font-mono">
                  {hubWalletAddress}
                </span>
              </div>
            )}
          </div>
        </div>

        {xAccount?.address ? (
          <Card className="animate-in fade-in duration-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-cherry-dark">Hub Wallet Assets</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="cherryOutline"
                  size="sm"
                  onClick={fetchBalances}
                  disabled={isLoadingBalances || !hubWalletAddress}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {balances && balances.length > 0 && pendingWithdrawCount > 0 && (
                  <Button
                    variant="cherry"
                    size="sm"
                    onClick={handleWithdrawAll}
                    disabled={isWithdrawingAll || isWrongChain || withdrawingAssets.size > 0}
                  >
                    {isWithdrawingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      `Withdraw All (${pendingWithdrawCount})`
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isWrongChain && (
                <div className="flex items-center gap-3 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Your wallet is connected to a different network.
                  </span>
                  <Button variant="cherry" size="sm" onClick={handleSwitchChain}>
                    Switch Network
                  </Button>
                </div>
              )}

              {balanceError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {balanceError}
                </div>
              )}

              {isLoadingBalances && !balances ? (
                <div className="flex items-center justify-center py-12 text-clay">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading hub wallet balances...
                </div>
              ) : balances && balances.length === 0 ? (
                <div className="text-center py-12 text-clay">
                  No recoverable assets found for this chain.
                </div>
              ) : balances && balances.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Hub Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map(asset => {
                      const result = withdrawResults[asset.spokeTokenAddress];
                      const isWithdrawing = withdrawingAssets.has(asset.spokeTokenAddress);

                      return (
                        <TableRow key={asset.spokeTokenAddress}>
                          <TableCell>
                            <div>
                              <span className="font-medium text-cherry-dark">{asset.symbol}</span>
                              <span className="text-xs text-clay ml-2">{asset.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatTokenAmount(asset.balance, asset.decimal, 6)}
                          </TableCell>
                          <TableCell>
                            {result?.success ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Withdrawn</span>
                                {result.txHash && (
                                  <>
                                    {' - '}
                                    <a
                                      href={getChainExplorerTxUrl(selectedChainId, result.txHash)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      tx
                                    </a>
                                  </>
                                )}
                              </div>
                            ) : result?.error ? (
                              <span className="text-red-600 text-sm">{result.error}</span>
                            ) : isWithdrawing ? (
                              <div className="flex items-center gap-1 text-clay text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="cherryOutline"
                              size="sm"
                              onClick={() => handleWithdrawAsset(asset)}
                              disabled={isWithdrawing || result?.success || isWrongChain || isWithdrawingAll}
                            >
                              {isWithdrawing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : result?.success ? (
                                'Done'
                              ) : result?.error ? (
                                'Retry'
                              ) : (
                                'Withdraw'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : !hubWalletAddress ? (
                <div className="text-center py-12 text-clay">
                  Deriving hub wallet address...
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-xl shadow-sm border border-cherry-grey/20 p-12">
            <div className="max-w-md text-center space-y-6">
              <div className="w-15 h-15 bg-cherry-brighter rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-cherry-dark" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-cherry-dark mb-2">Connect Your Wallet</h2>
                <p className="text-clay">Connect your wallet to check for recoverable assets in your hub wallet</p>
              </div>
              <Button onClick={openWalletModal} variant="cherry" size="lg" className="px-8">
                Connect Wallet
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
*/
