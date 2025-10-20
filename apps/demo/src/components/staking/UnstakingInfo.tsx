import React, { useState } from 'react';
import { useCancelUnstake, useClaim, useStakingConfig, useUnstakingInfoWithPenalty } from '@sodax/dapp-kit';
import { Skeleton } from '../ui/skeleton';
import { formatTokenAmount, getTimeRemaining } from '@/lib/utils';
import type { SpokeProvider } from '@sodax/sdk';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function UnstakingInfo({
  spokeProvider,
  userAddress,
}: Readonly<{ spokeProvider: SpokeProvider; userAddress: string }>) {
  const [claimRequestId, setClaimRequestId] = useState<string>('');
  const { data: unstakingInfoWithPenalty, isLoading: isLoadingUnstakingInfoWithPenalty } = useUnstakingInfoWithPenalty(
    userAddress,
    spokeProvider,
  );
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();

  const { mutateAsync: claim, isPending: isClaiming } = useClaim(spokeProvider);
  const { mutateAsync: cancelUnstake, isPending: isCancellingUnstake } = useCancelUnstake(spokeProvider);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

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
    } catch (error) {
      console.error('Cancel unstake error:', error);
    }
  };

  return (
    <>
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
                                  {request.penaltyPercentage.toFixed(1)}% ({formatTokenAmount(request.penalty, 18)}{' '}
                                  SODA)
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

                          {isLoadingStakingConfig ? (
                            <Skeleton className="h-4 w-full" />
                          ) : (
                            stakingConfig && (
                              <div className="text-xs font-medium text-blue-600 mt-1">
                                {getTimeRemaining(request.request.startTime, stakingConfig.unstakingPeriod)}
                              </div>
                            )
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
    </>
  );
}
