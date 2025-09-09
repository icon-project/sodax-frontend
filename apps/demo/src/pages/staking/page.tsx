// apps/demo/src/pages/staking/page.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { SelectChain } from '@/components/solver/SelectChain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { spokeChainConfig, supportedSpokeChains } from '@sodax/sdk';
import type { SpokeChainId, XToken } from '@sodax/types';
import { getXChainType, useEvmSwitchChain, useWalletProvider, useXAccount, useXDisconnect } from '@sodax/wallet-sdk';
import { useAppStore } from '@/zustand/useAppStore';
import { ArrowDownUp, ArrowLeftRight, Coins, TrendingUp } from 'lucide-react';
import { normaliseTokenAmount, scaleTokenAmount, formatTokenAmount } from '@/lib/utils';
import {
  useSpokeProvider,
  useSodaxContext,
  useStake,
  useStakeApprove,
  useStakeAllowance,
  useUnstake,
  useClaim,
  useCancelUnstake,
  useStakingInfo,
  useUnstakingInfo,
  useUnstakingInfoWithPenalty,
  useStakingConfig,
} from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSodaBalance } from '@/hooks/useSodaBalance';

export default function StakingPage() {
  const { openWalletModal } = useAppStore();
  const { sodax } = useSodaxContext();

  const [selectedChainId, setSelectedChainId] = useState<SpokeChainId>('0x2105.base');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [claimRequestId, setClaimRequestId] = useState<string>('');

  const account = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  // Staking info hooks
  const { data: stakingInfo, isLoading: isLoadingStakingInfo } = useStakingInfo(spokeProvider);
  const { data: unstakingInfo, isLoading: isLoadingUnstakingInfo } = useUnstakingInfo(spokeProvider);
  const { data: unstakingInfoWithPenalty, isLoading: isLoadingUnstakingInfoWithPenalty } =
    useUnstakingInfoWithPenalty(spokeProvider);
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  // Dialog states
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  // SODA token for the selected chain
  const sodaToken = useMemo(() => {
    const chainConfig = spokeChainConfig[selectedChainId];
    return (chainConfig?.supportedTokens as Record<string, XToken>)?.SODA || null;
  }, [selectedChainId]);

  // SODA balance for the connected wallet
  const { data: sodaBalance, isLoading: isLoadingSodaBalance } = useSodaBalance(selectedChainId, account.address);

  // Staking hooks
  const { mutateAsync: stake, isPending: isStakingPending } = useStake(spokeProvider);
  const { mutateAsync: approve, isPending: isApproving } = useStakeApprove(spokeProvider);
  const { mutateAsync: unstake, isPending: isUnstakingPending } = useUnstake(spokeProvider);
  const { mutateAsync: claim, isPending: isClaiming } = useClaim(spokeProvider);
  const { mutateAsync: cancelUnstake, isPending: isCancellingUnstake } = useCancelUnstake(spokeProvider);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useStakeAllowance(
    stakeAmount && sodaToken && account.address
      ? {
          amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
          account: account.address as `0x${string}`,
        }
      : undefined,
    spokeProvider,
  );

  const handleApprove = async () => {
    if (!account.address || !sodaToken || !stakeAmount) return;

    try {
      await approve({
        amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
        account: account.address as `0x${string}`,
      });
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleStake = async () => {
    if (!account.address || !sodaToken || !stakeAmount) return;

    try {
      await stake({
        amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
        account: account.address as `0x${string}`,
      });

      console.log('Stake successful');
      setStakeDialogOpen(false);
      setStakeAmount('');
    } catch (error) {
      console.error('Stake error:', error);
    }
  };

  const handleUnstake = async () => {
    if (!account.address || !unstakeAmount) return;

    try {
      await unstake({
        amount: scaleTokenAmount(unstakeAmount, 18), // xSoda has 18 decimals
        account: account.address as `0x${string}`,
      });

      console.log('Unstake successful');
      setUnstakeDialogOpen(false);
      setUnstakeAmount('');
      // Refresh staking info
      window.location.reload();
    } catch (error) {
      console.error('Unstake error:', error);
    }
  };

  const handleClaim = async (requestId: string, claimableAmount: bigint) => {
    if (!spokeProvider) return;

    try {
      await claim({
        requestId: BigInt(requestId),
        amount: claimableAmount,
      });
      setClaimDialogOpen(false);
      setClaimRequestId('');
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  const handleCancelUnstake = async (requestId: string) => {
    if (!spokeProvider) return;

    try {
      await cancelUnstake({
        requestId: BigInt(requestId),
      });
      console.log('Cancel unstake successful');
      // Refresh staking info
      window.location.reload();
    } catch (error) {
      console.error('Cancel unstake error:', error);
    }
  };

  const disconnect = useXDisconnect();
  const handleDisconnect = () => {
    const chainType = getXChainType(selectedChainId);
    if (chainType) {
      disconnect(chainType);
    }
  };

  // Helper function to format seconds for display
  const formatSeconds = (seconds: bigint): string => {
    return Number(seconds).toLocaleString();
  };

  // Helper function to calculate time remaining for unstaking
  const getTimeRemaining = (startTime: bigint, unstakingPeriod: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const start = Number(startTime);
    const period = Number(unstakingPeriod);
    const elapsed = now - start;
    const remaining = period - elapsed;

    if (remaining <= 0) {
      return 'Ready to claim';
    }

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
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
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label>Select Chain</Label>
            <SelectChain
              chainList={supportedSpokeChains as SpokeChainId[]}
              value={selectedChainId}
              setChain={setSelectedChainId}
              placeholder="Select chain"
              id="staking-chain"
              label="Chain"
            />
          </div>

          {/* Account Connection */}
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
            </div>
          </div>

          {/* SODA Balance */}
          {account.address && sodaToken && (
            <div className="space-y-2">
              <Label>SODA Balance</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                {isLoadingSodaBalance ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {formatTokenAmount(sodaBalance || 0n, sodaToken.decimals)} {sodaToken.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">Available for staking</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staking Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Staking Configuration</h3>
            {isLoadingStakingConfig ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : stakingConfig ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Unstaking Period</div>
                  <div className="text-lg font-semibold">{formatSeconds(stakingConfig.unstakingPeriod)} seconds</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Min Unstaking Period</div>
                  <div className="text-lg font-semibold">{formatSeconds(stakingConfig.minUnstakingPeriod)} seconds</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Max Penalty</div>
                  <div className="text-lg font-semibold">{Number(stakingConfig.maxPenalty)}%</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No staking configuration available</div>
            )}
          </div>

          {/* Staking Info */}
          {account.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Staking Information</h3>
              {isLoadingStakingInfo ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : stakingInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                    <div className="text-lg font-semibold">{formatTokenAmount(stakingInfo.totalStaked, 18)} SODA</div>
                    <div className="text-xs text-muted-foreground mt-1">Total SODA staked across all users</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Your xSODA Shares</div>
                    <div className="text-lg font-semibold">
                      {formatTokenAmount(stakingInfo.userXSodaBalance, 18)} xSODA
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Your raw xSODA token balance</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Your xSODA Value</div>
                    <div className="text-lg font-semibold">
                      {formatTokenAmount(stakingInfo.userXSodaValue, 18)} SODA
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Your xSODA tokens worth in SODA</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No staking information available</div>
              )}
            </div>
          )}

          {/* Unstaking Info */}
          {account.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Unstaking Information</h3>
              {isLoadingUnstakingInfoWithPenalty ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : unstakingInfoWithPenalty ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Unstaking</div>
                    <div className="text-lg font-semibold">
                      {formatTokenAmount(unstakingInfoWithPenalty.totalUnstaking, 18)} SODA
                    </div>
                  </div>

                  {unstakingInfoWithPenalty.requestsWithPenalty.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Pending Unstake Requests</div>
                      <div className="space-y-2">
                        {unstakingInfoWithPenalty.requestsWithPenalty.map((request, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-sm font-medium">
                                    {formatTokenAmount(request.request.amount, 18)} SODA
                                  </div>
                                  <div className="text-xs text-muted-foreground">Request #{index + 1}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <div className="text-muted-foreground">Started:</div>
                                    <div>{new Date(Number(request.request.startTime) * 1000).toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">To:</div>
                                    <div className="truncate">{request.request.to}</div>
                                  </div>
                                </div>

                                <div className="mt-2 p-2 bg-background rounded border">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <div className="text-muted-foreground">Penalty:</div>
                                      <div className="font-medium text-red-600">
                                        {request.penaltyPercentage.toFixed(1)}% (
                                        {formatTokenAmount(request.penalty, 18)} SODA)
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Claimable:</div>
                                      <div className="font-medium text-green-600">
                                        {formatTokenAmount(request.claimableAmount, 18)} SODA
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {stakingConfig && (
                                  <div className="text-xs font-medium text-blue-600 mt-1">
                                    {getTimeRemaining(request.request.startTime, stakingConfig.unstakingPeriod)}
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setClaimRequestId(request.id.toString());
                                      handleClaim(request.id.toString(), request.claimableAmount);
                                    }}
                                    disabled={isClaiming}
                                    className="flex-1"
                                  >
                                    {isClaiming
                                      ? 'Claiming...'
                                      : `Claim ${formatTokenAmount(request.claimableAmount, 18)} SODA`}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelUnstake(request.id.toString())}
                                    disabled={isCancellingUnstake}
                                    className="flex-1"
                                  >
                                    {isCancellingUnstake ? 'Cancelling...' : 'Cancel'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No pending unstake requests</div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">No unstaking information available</div>
              )}
            </div>
          )}

          {/* Action Tabs */}
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
                <Button onClick={() => setUnstakeDialogOpen(true)} disabled={!unstakeAmount} className="w-full">
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Unstake xSODA
                </Button>
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
                  `${formatTokenAmount(sodaBalance || 0n, sodaToken?.decimals || 18)} ${sodaToken?.symbol || 'SODA'}`
                )}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Amount to Stake</div>
              <div className="text-lg font-semibold">{stakeAmount} SODA</div>
            </div>
          </div>
          <DialogFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleApprove}
              disabled={isAllowanceLoading || hasAllowed || isApproving}
            >
              {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
            </Button>

            {isWrongChain && (
              <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
                Switch Chain
              </Button>
            )}

            {!isWrongChain && (
              <Button className="w-full" onClick={handleStake} disabled={!hasAllowed || isStakingPending}>
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
            <Button onClick={handleUnstake} disabled={isUnstakingPending}>
              {isUnstakingPending ? 'Unstaking...' : 'Confirm Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim SODA</DialogTitle>
            <DialogDescription>
              {unstakingInfoWithPenalty && claimRequestId
                ? (() => {
                    const request = unstakingInfoWithPenalty.requestsWithPenalty.find(
                      req => req.id.toString() === claimRequestId,
                    );
                    return request ? (
                      <div>
                        <div>Request ID: {claimRequestId}</div>
                        <div>Claimable Amount: {formatTokenAmount(request.claimableAmount, 18)} SODA</div>
                        <div>
                          Penalty: {request.penaltyPercentage.toFixed(1)}% ({formatTokenAmount(request.penalty, 18)}{' '}
                          SODA)
                        </div>
                      </div>
                    ) : (
                      'Invalid request ID'
                    );
                  })()
                : 'No request selected'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (unstakingInfoWithPenalty && claimRequestId) {
                  const request = unstakingInfoWithPenalty.requestsWithPenalty.find(
                    req => req.id.toString() === claimRequestId,
                  );
                  if (request) {
                    handleClaim(claimRequestId, request.claimableAmount);
                  }
                }
              }}
              disabled={isClaiming || !unstakingInfoWithPenalty || !claimRequestId}
            >
              {isClaiming ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
