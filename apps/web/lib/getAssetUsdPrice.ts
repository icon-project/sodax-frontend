'use server';

export type AssetUsdPrice = {
  usdPrice: number | null;
};

// a bit of a hacky way of getting prices consulted with Paul, using an endpoint from the Sodax Monitor that returns a 1-time-fetched price for a given asset. Not ideal but works fine for now
export async function getAssetUsdPrice(assetSymbol: string): Promise<AssetUsdPrice> {
  if (!assetSymbol) {
    throw new Error('Asset symbol is required to fetch USD price');
  }
  if (assetSymbol.toLowerCase().includes('usd')) {
    return {
      usdPrice: 1,
    };
  }

  const monitorIp = process.env.SODAX_MONITOR_IP;
  const monitorSecret = process.env.SODAX_MONITOR_SECRET;
  if (!monitorIp || !monitorSecret) {
    throw new Error('SODAX_MONITOR_IP and SODAX_MONITOR_SECRET must be set in environment variables');
  }

  const coingeckoId = getCoingeckoIdFromSymbol(assetSymbol);
  if (coingeckoId === 'unknown') {
    // TODO there should me a mesage on the frontend about unknown asset
    return {
      usdPrice: null,
    };
  }

  try {
    console.log('Fetching USD price for asset:', assetSymbol);
    const response = await fetch(`${monitorIp}/api/price?coingecko_id=${coingeckoId}&secret=${monitorSecret}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${monitorSecret}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching price: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Fetched price data:', data);
    return {
      usdPrice: data.usd_price,
    };
  } catch (error) {
    console.error('Failed to fetch asset USD price:', error);
  }
  return {
    usdPrice: null,
  };
}
//check if chainId might be needed
//function that
//signature of the function - check it

//TODO make sure it doesnt render usdc prices
function getCoingeckoIdFromSymbol(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return 'bitcoin';

    case 'BTCB': // BTC on BSC
      return 'bitcoin';

    case 'ETH':
      return 'ethereum';

    case 'BNB':
      return 'binancecoin';

    case 'SOL':
      return 'solana';

    case 'AVAX':
      return 'avalanche-2';

    case 'MATIC':
      return 'matic-network'; // CoinGecko still uses this id

    case 'USDC':
      return 'usd-coin';

    case 'USDT':
      return 'tether';

    case 'SUI':
      return 'sui';

    case 'HYPE':
      return 'hyperliquid'; // confirm if this is correct for your token

    case 'S':
      return 'sonic-3';

    case 'SODAX': // TODO important: later change to real SODAX token
      return 'icon';

    default:
      return 'unknown';
  }
}

//backend doesnt have shh

// when i have preview - it should work there
// if work son pr then it should sodax
