import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBackendUserIntents, useDeriveUserWalletAddress } from '@sodax/dapp-kit';
import { useXAccount } from '@sodax/wallet-sdk-react';
import type { SpokeChainId } from '@sodax/types';
import LimitOrderItem from './LimitOrderItem';
import { Card } from '@/components/ui/card';

const TABLE_HEADERS = ['Input', 'Output', 'Action'];

function EmptyState({ message, className = 'text-muted-foreground' }: { message: string; className?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={TABLE_HEADERS.length} className={`text-center ${className}`}>
        {message}
      </TableCell>
    </TableRow>
  );
}

export default function LimitOrderList({ spokeChainId }: { spokeChainId: SpokeChainId }) {
  const account = useXAccount(spokeChainId);
  const { data: userHubAddress } = useDeriveUserWalletAddress(spokeChainId, account.address);

  const {
    data: userIntents,
    isLoading,
    error,
  } = useBackendUserIntents(
    useMemo(
      () =>
        userHubAddress
          ? {
              params: {
                userAddress: userHubAddress,
                limit: '100',
                offset: '0',
              },
            }
          : {
              params: undefined,
            },
      [userHubAddress],
    ),
  );

  const intents = userIntents?.items ?? [];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_HEADERS.map(header => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <EmptyState message="Loading limit orders..." />}
          {error && <EmptyState message={`Error loading limit orders: ${error.message}`} className="text-red-500" />}
          {!isLoading && !error && !userHubAddress && (
            <EmptyState message="Please connect your wallet to view limit orders" />
          )}
          {!isLoading && !error && userHubAddress && intents.length === 0 && (
            <EmptyState message="No limit orders found" />
          )}
          {!isLoading &&
            !error &&
            userHubAddress &&
            intents.length > 0 &&
            intents.map(intent => <LimitOrderItem key={intent.intentHash} intent={intent} />)}
        </TableBody>
      </Table>
    </Card>
  );
}
