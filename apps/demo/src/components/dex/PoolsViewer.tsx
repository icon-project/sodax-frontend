// apps/demo/src/components/dex/PoolsViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConcentratedLiquidityService, EvmHubProvider, type PoolData, type PoolKey } from '@sodax/sdk';
import { PoolInfo } from './PoolInfo';
import { Loader2, RefreshCw } from 'lucide-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { createSonicPublicClient } from '@/lib/token-utils';

export function PoolsViewer() {
  const [pools, setPools] = useState<PoolKey[]>([]);
  const [poolDataList, setPoolDataList] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [clService, setClService] = useState<ConcentratedLiquidityService | undefined>(undefined);

  // Initialize ConcentratedLiquidityService on component mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        const publicClient = createSonicPublicClient();

        // Create proper hub provider
        const mockHubProvider = new EvmHubProvider();

        const service = new ConcentratedLiquidityService(
          undefined, // Use default config
          mockHubProvider, // Mock hub provider
        );

        setClService(service);
      } catch (err) {
        console.error('Failed to initialize ConcentratedLiquidityService:', err);
        setError('Failed to initialize service');
      }
    };

    initializeService();
  }, []);

  const fetchPools = useCallback(async () => {
    if (!clService) {
      setError('Service not initialized');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const publicClient = createSonicPublicClient();

      // Get all available pools from ConcentratedLiquidityService
      const availablePools = clService.getPools();
      setPools(availablePools);

      console.log('Available pools:', availablePools);

      // Fetch detailed data for each pool
      const poolDataPromises = availablePools.map(async poolKey => {
        try {
          const poolData = await clService.getPoolData(poolKey, publicClient);
          return poolData;
        } catch (err) {
          console.error(`Failed to fetch data for pool ${poolKey.currency0}/${poolKey.currency1}:`, err);
          return null;
        }
      });

      const poolDataResults = await Promise.all(poolDataPromises);
      const validPoolData = poolDataResults.filter((data): data is PoolData => data !== null);

      setPoolDataList(validPoolData);
      console.log('Pool data fetched:', validPoolData);
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError(`Failed to fetch pools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [clService]);

  // Auto-fetch pools when service is ready
  useEffect(() => {
    if (clService) {
      fetchPools();
    }
  }, [clService, fetchPools]);

  const handleRefresh = () => {
    fetchPools();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Pools</span>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={loading || !clService} variant="outline" size="sm">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!clService && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Initializing ConcentratedLiquidityService...</p>
            </div>
          )}

          {clService && pools.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-8">
              <p>No pools found</p>
            </div>
          )}

          {poolDataList.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {poolDataList.length} pool(s) out of {pools.length} available
              </div>

              {poolDataList.map((poolData, index) => (
                <PoolInfo
                  key={`${poolData.poolKey.currency0}-${poolData.poolKey.currency1}-${poolData.poolKey.fee}`}
                  poolData={poolData}
                  clService={clService}
                />
              ))}
            </div>
          )}

          {loading && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Fetching pool data...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
