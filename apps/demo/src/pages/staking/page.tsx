import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SelectChain } from '@/components/solver/SelectChain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getXChainType,
  useEvmSwitchChain,
  useWalletProvider,
  useXAccount,
  useXDisconnect,
} from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { ArrowDownUp, ArrowLeftRight, Coins, TrendingUp } from 'lucide-react';
import { scaleTokenAmount, formatTokenAmount } from '@/lib/utils';
import {
  useStake,
  useStakeApprove,
  useStakeAllowance,
  useUnstake,
  useStakeRatio,
  useInstantUnstakeRatio,
  useConvertedAssets,
  useInstantUnstake,
  useUnstakeAllowance,
  useUnstakeApprove,
  useInstantUnstakeApprove,
  useInstantUnstakeAllowance,
  useSodaxContext,
  useGetUserHubWalletAddress,
} from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSodaBalance } from '@/hooks/useSodaBalance';
import { StakingConfiguration } from '@/components/staking/StakingConfiguration';
import { StakingInfo } from '@/components/staking/StakingInfo';
import { UnstakingInfo } from '@/components/staking/UnstakingInfo';
import { SodaBalance } from '@/components/staking/SodaBalance';

export default function StakingPage() {
  const { sodax } = useSodaxContext();
  const { openWalletModal, selectChainId, selectedChainId } = useAppStore();

  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [minUnstakeAmount, setMinUnstakeAmount] = useState<string>('');
  const [minStakeReceive, setMinStakeReceive] = useState<string>('');

  const account = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const srcAddress = account?.address as `0x${string}` | undefined;
  const supportedSpokeChains = useMemo(() => sodax.config.getSupportedSpokeChains(), [sodax]);
  const { data: walletAddressOnHub } = useGetUserHubWalletAddress(selectedChainId, account?.address);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [instantUnstakeDialogOpen, setInstantUnstakeDialogOpen] = useState(false);

  const sodaToken = useMemo(
    () => sodax.config.findSupportedTokenBySymbol(selectedChainId, 'SODA') ?? null,
    [sodax, selectedChainId],
  );

  const sodaBalance = useSodaBalance(selectedChainId, account?.address);
  const isLoadingSodaBalance = sodaBalance === undefined;

  const { mutateAsync: stake, isPending: isStakingPending } = useStake();
  const { mutateAsync: approveStake, isPending: isApprovingStake } = useStakeApprove();
  const { mutateAsync: approveUnstake, isPending: isApprovingUnstake } = useUnstakeApprove();
  const { mutateAsync: approveInstantUnstake, isPending: isApprovingInstantUnstake } = useInstantUnstakeApprove();
  const { mutateAsync: unstake, isPending: isUnstakingPending } = useUnstake();

  const { data: isStakeAllowed, isLoading: isStakeAllowanceLoading } = useStakeAllowance({
    params:
      stakeAmount && sodaToken && srcAddress
        ? {
            srcChainKey: selectedChainId,
            srcAddress,
            amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
            minReceive: scaleTokenAmount(stakeAmount, sodaToken.decimals),
          }
        : undefined,
  });

  const { data: isUnstakeAllowed, isLoading: isUnstakeAllowanceLoading } = useUnstakeAllowance({
    params:
      unstakeAmount && sodaToken && srcAddress
        ? {
            srcChainKey: selectedChainId,
            srcAddress,
            amount: scaleTokenAmount(unstakeAmount, 18),
          }
        : undefined,
  });

  const { data: isInstantUnstakeAllowed, isLoading: isInstantUnstakeAllowanceLoading } = useInstantUnstakeAllowance({
    params:
      unstakeAmount && sodaToken && srcAddress
        ? {
            srcChainKey: selectedChainId,
            srcAddress,
            amount: scaleTokenAmount(unstakeAmount, 18),
            minAmount: scaleTokenAmount(minUnstakeAmount || '0', 18),
          }
        : undefined,
  });

  const scaledStakeAmount = stakeAmount && sodaToken ? scaleTokenAmount(stakeAmount, sodaToken.decimals) : undefined;
  const { data: stakeRatio, isLoading: isLoadingStakeRatio } = useStakeRatio({ amount: scaledStakeAmount });

  const scaledUnstakeAmount = unstakeAmount ? scaleTokenAmount(unstakeAmount, 18) : undefined;
  const { data: instantUnstakeRatio, isLoading: isLoadingInstantUnstakeRatio } = useInstantUnstakeRatio({
    amount: scaledUnstakeAmount,
  });

  const { data: convertedAssets, isLoading: isLoadingConvertedAssets } = useConvertedAssets({
    amount: scaledUnstakeAmount,
  });

  const { mutateAsync: instantUnstake, isPending: isInstantUnstakingPending } = useInstantUnstake();

  // Auto-calculate minUnstakeAmount as 95% of instantUnstakeRatio
  useEffect(() => {
    if (instantUnstakeRatio) {
      const minAmount = (instantUnstakeRatio * 95n) / 100n;
      setMinUnstakeAmount(formatTokenAmount(minAmount, 18));
    } else {
      setMinUnstakeAmount('');
    }
  }, [instantUnstakeRatio]);

  // Auto-calculate minStakeReceive as 95% of stakeRatio[0] (xSoda amount)
  useEffect(() => {
    if (stakeRatio) {
      const minReceive = (stakeRatio[0] * 95n) / 100n;
      setMinStakeReceive(formatTokenAmount(minReceive, 18));
    } else {
      setMinStakeReceive('');
    }
  }, [stakeRatio]);

  const handleApproveStake = async (): Promise<void> => {
    if (!srcAddress || !sodaToken || !stakeAmount || !walletProvider) return;
    const result = await approveStake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
        minReceive: scaleTokenAmount(minStakeReceive || stakeAmount, 18),
      },
      walletProvider,
    });
    if (!result.ok) console.error('Approve stake error:', result.error);
  };

  const handleApproveUnstake = async (): Promise<void> => {
    if (!srcAddress || !sodaToken || !unstakeAmount || !walletProvider) return;
    const result = await approveUnstake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(unstakeAmount, 18),
      },
      walletProvider,
    });
    if (!result.ok) console.error('Approve unstake error:', result.error);
  };

  const handleApproveInstantUnstake = async (): Promise<void> => {
    if (!srcAddress || !sodaToken || !unstakeAmount || !walletProvider) return;
    const result = await approveInstantUnstake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(unstakeAmount, 18),
        minAmount: scaleTokenAmount(minUnstakeAmount, 18),
      },
      walletProvider,
    });
    if (!result.ok) console.error('Approve instant unstake error:', result.error);
  };

  const handleStake = async (): Promise<void> => {
    if (!srcAddress || !sodaToken || !stakeAmount || !minStakeReceive || !walletProvider) return;
    const result = await stake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
        minReceive: scaleTokenAmount(minStakeReceive, 18),
        action: 'stake',
      },
      walletProvider,
    });
    if (!result.ok) {
      console.error('Stake error:', result.error);
      return;
    }
    setStakeDialogOpen(false);
    setStakeAmount('');
    setMinStakeReceive('');
  };

  const handleUnstake = async (): Promise<void> => {
    if (!srcAddress || !unstakeAmount || !walletProvider) return;
    const result = await unstake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(unstakeAmount, 18),
        action: 'unstake',
      },
      walletProvider,
    });
    if (!result.ok) {
      console.error('Unstake error:', result.error);
      return;
    }
    setUnstakeDialogOpen(false);
    setUnstakeAmount('');
  };

  const handleInstantUnstake = async (): Promise<void> => {
    if (!srcAddress || !unstakeAmount || !minUnstakeAmount || !walletProvider) return;
    const result = await instantUnstake({
      params: {
        srcChainKey: selectedChainId,
        srcAddress,
        amount: scaleTokenAmount(unstakeAmount, 18),
        minAmount: scaleTokenAmount(minUnstakeAmount, 18),
        action: 'instantUnstake',
      },
      walletProvider,
    });
    if (!result.ok) {
      console.error('Instant unstake error:', result.error);
      return;
    }
    setInstantUnstakeDialogOpen(false);
    setUnstakeAmount('');
    setMinUnstakeAmount('');
  };

  const disconnect = useXDisconnect();
  const handleDisconnect = (): void => {
    const chainType = getXChainType(selectedChainId);
    if (chainType) {
      disconnect(chainType);
    }
  };

  return (
    <div className="flex flex-col items-center content-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center gap-2">
            <Coins className="h-6 w-6" />
            SODA Staking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Chain</Label>
            <SelectChain
              chainList={supportedSpokeChains}
              value={selectedChainId}
              setChain={selectChainId}
              placeholder="Select chain"
              id="staking-chain"
              label="Chain"
            />
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Connect wallet to see address"
                value={account.address || ''}
                disabled={true}
              />
              {account.address ? (
                <Button onClick={handleDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
              {isWrongChain && (
                <Button className="w-full max-w-40" type="button" variant="default" onClick={handleSwitchChain}>
                  Switch Chain
                </Button>
              )}
            </div>
          </div>
          {walletAddressOnHub && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-clay">Hub Wallet Address:</span>
              <span className="px-3 py-1.5 bg-cream rounded-lg text-cherry-dark text-xs">{walletAddressOnHub}</span>
            </div>
          )}

          {account.address && sodaToken && (
            <SodaBalance selectedChainId={selectedChainId} account={account} sodaToken={sodaToken} />
          )}

          <StakingConfiguration />

          {srcAddress && <StakingInfo srcAddress={srcAddress} srcChainKey={selectedChainId} />}

          {srcAddress && walletProvider && (
            <UnstakingInfo srcChainKey={selectedChainId} srcAddress={srcAddress} walletProvider={walletProvider} />
          )}

          {account.address && (
            <Tabs defaultValue="stake" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="unstake">Unstake</TabsTrigger>
              </TabsList>

              <TabsContent value="stake" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stake-amount">Amount to Stake (SODA)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stake-amount"
                      type="number"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={e => setStakeAmount(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (sodaBalance && sodaToken) {
                          setStakeAmount(formatTokenAmount(sodaBalance, sodaToken.decimals));
                        }
                      }}
                      disabled={!sodaBalance || sodaBalance === 0n || !sodaToken}
                    >
                      Max
                    </Button>
                  </div>
                  {sodaBalance === 0n && !isLoadingSodaBalance && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border">
                      ⚠️ You have no SODA tokens to stake. Get some SODA tokens first.
                    </div>
                  )}
                </div>

                {stakeAmount && sodaToken && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-2">Stake Estimates</div>
                    {isLoadingStakeRatio ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : stakeRatio ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Swapped Amount:</span>
                          <span className="font-medium">{formatTokenAmount(stakeRatio[0], 18)} xSODA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Stake Amount:</span>
                          <span className="font-medium">{formatTokenAmount(stakeRatio[1], 18)} SODA</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Enter amount to see estimates</div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setStakeDialogOpen(true)}
                  disabled={!stakeAmount || !sodaToken || sodaBalance === 0n}
                  className="w-full"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Stake SODA
                </Button>
              </TabsContent>

              <TabsContent value="unstake" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unstake-amount">Amount to Unstake (xSODA)</Label>
                  <Input
                    id="unstake-amount"
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={e => setUnstakeAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-unstake-amount">Minimum Amount to Receive (SODA)</Label>
                  <Input
                    id="min-unstake-amount"
                    type="number"
                    placeholder="0.0"
                    value={minUnstakeAmount}
                    onChange={e => setMinUnstakeAmount(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Auto-calculated as 95% of estimated amount to protect against slippage
                  </div>
                </div>

                {unstakeAmount && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-2">Instant Unstake Estimate</div>
                    {isLoadingInstantUnstakeRatio || isLoadingConvertedAssets ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : instantUnstakeRatio && convertedAssets ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Instant unstake (you will receive):</span>
                          <span className="font-medium text-green-600">
                            {formatTokenAmount(instantUnstakeRatio, 18)} SODA
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Unstake Amount (you will receive):</span>
                          <span className="font-medium text-blue-600">
                            {formatTokenAmount(convertedAssets, 18)} SODA
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Instant unstake has no waiting period but may have different exchange rate
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Enter amount to see estimate</div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {isWrongChain ? (
                    <Button className="w-full" onClick={handleSwitchChain}>
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Switch Chain
                    </Button>
                  ) : (
                    <Button onClick={() => setUnstakeDialogOpen(true)} disabled={!unstakeAmount} className="w-full">
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Regular Unstake (with waiting period)
                    </Button>
                  )}

                  {isWrongChain ? (
                    <Button variant="outline" className="w-full" onClick={handleSwitchChain}>
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Switch Chain
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={
                        !unstakeAmount || !instantUnstakeRatio || !minUnstakeAmount || isInstantUnstakingPending
                      }
                      className="w-full"
                      onClick={() => setInstantUnstakeDialogOpen(true)}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      {isInstantUnstakingPending ? 'Processing...' : 'Instant Unstake'}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake SODA</DialogTitle>
            <DialogDescription>Stake {stakeAmount} SODA to receive xSODA shares</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Your SODA Balance</div>
              <div className="text-lg font-semibold">
                {isLoadingSodaBalance ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  `${formatTokenAmount(sodaBalance ?? 0n, sodaToken?.decimals ?? 18)} ${sodaToken?.symbol ?? 'SODA'}`
                )}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Amount to Stake</div>
              <div className="text-lg font-semibold">{stakeAmount} SODA</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-stake-receive">Minimum xSODA to Receive</Label>
              <Input
                id="min-stake-receive"
                type="number"
                placeholder="0.0"
                value={minStakeReceive}
                onChange={e => setMinStakeReceive(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Auto-calculated as 95% of estimated amount to protect against slippage
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleApproveStake}
              disabled={isStakeAllowanceLoading || isStakeAllowed || isApprovingStake}
            >
              {isApprovingStake ? 'Approving...' : isStakeAllowed ? 'Approved' : 'Approve'}
            </Button>

            {isWrongChain && (
              <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
                Switch Chain
              </Button>
            )}

            {!isWrongChain && (
              <Button
                className="w-full"
                onClick={handleStake}
                disabled={!isStakeAllowed || !minStakeReceive || isStakingPending}
              >
                {isStakingPending ? 'Staking...' : 'Confirm Stake'}
              </Button>
            )}

            <Button variant="outline" onClick={() => setStakeDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake xSODA</DialogTitle>
            <DialogDescription>Unstake {unstakeAmount} xSODA shares to initiate unstaking process</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnstakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleApproveUnstake}
              disabled={isUnstakeAllowanceLoading || isUnstakeAllowed || isApprovingUnstake}
            >
              {isApprovingUnstake ? 'Approving...' : isUnstakeAllowed ? 'Approved' : 'Approve'}
            </Button>
            <Button onClick={handleUnstake} disabled={isUnstakingPending || !isUnstakeAllowed}>
              {isUnstakingPending ? 'Unstaking...' : 'Confirm Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instant Unstake Dialog */}
      <Dialog open={instantUnstakeDialogOpen} onOpenChange={setInstantUnstakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instant Unstake xSODA</DialogTitle>
            <DialogDescription>InstantUnstake {unstakeAmount} xSODA shares to initiate unstaking process</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstantUnstakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleApproveInstantUnstake}
              disabled={isInstantUnstakeAllowanceLoading || isInstantUnstakeAllowed || isApprovingInstantUnstake}
            >
              {isApprovingInstantUnstake ? 'Approving...' : isInstantUnstakeAllowed ? 'Approved' : 'Approve'}
            </Button>
            <Button onClick={handleInstantUnstake} disabled={isInstantUnstakingPending || !isInstantUnstakeAllowed}>
              {isInstantUnstakingPending ? 'Unstaking...' : 'Confirm Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
