import { Sodax } from '@sodax/sdk';

const sodax = new Sodax();

async function main() {
  const orderbook = await sodax.backendApi.getOrderbook({
    offset: '0',
    limit: '5',
  });
  console.log('Orderbook:', orderbook);

  // Purpose: Call all GET query functions from BackendApiService and log their outputs

  // 1. getIntentByTxHash (example txHash, replace with real if needed)
  try {
    const intentByTxHash = await sodax.backendApi.getIntentByTxHash(
      '0xe6c9496781ef863e7d83ad86265076a633939384d6227bbe8154bea7028191d3',
    );
    console.log('getIntentByTxHash:', intentByTxHash);
  } catch (err) {
    console.error('getIntentByTxHash error:', err);
  }

  // 2. getIntentByHash (example intentHash, replace with real if needed)
  try {
    const intentByHash = await sodax.backendApi.getIntentByHash(
      '0xe789418f2cc226e48a73d135392d7dd0bfded03f4adde43baa105abe3644761a',
    );
    console.log('getIntentByHash:', intentByHash);
  } catch (err) {
    console.error('getIntentByHash error:', err);
  }

  // 3. getOrderbook (already called above)

  // 4. getMoneyMarketPosition (example user address, replace with real if needed)
  try {
    const mmPosition = await sodax.backendApi.getMoneyMarketPosition('0x0Ab764AB3816cD036Ea951bE973098510D8105A6');
    console.log('getMoneyMarketPosition:', mmPosition);
  } catch (err) {
    console.error('getMoneyMarketPosition error:', err);
  }

  // 5. getAllMoneyMarketAssets
  try {
    const allMMAssets = await sodax.backendApi.getAllMoneyMarketAssets();
    console.log('getAllMoneyMarketAssets:', allMMAssets);
    // Use a reserveAddress from the result for further queries if available
    if (allMMAssets.length > 0) {
      const reserveAddress = allMMAssets[0].reserveAddress;

      // 6. getMoneyMarketAsset
      try {
        const mmAsset = await sodax.backendApi.getMoneyMarketAsset(reserveAddress);
        console.log('getMoneyMarketAsset:', mmAsset);
      } catch (err) {
        console.error('getMoneyMarketAsset error:', err);
      }

      // 7. getMoneyMarketAssetBorrowers
      try {
        const mmAssetBorrowers = await sodax.backendApi.getMoneyMarketAssetBorrowers(reserveAddress, {
          offset: '0',
          limit: '5',
        });
        console.log('getMoneyMarketAssetBorrowers:', mmAssetBorrowers);
      } catch (err) {
        console.error('getMoneyMarketAssetBorrowers error:', err);
      }

      // 8. getMoneyMarketAssetSuppliers
      try {
        const mmAssetSuppliers = await sodax.backendApi.getMoneyMarketAssetSuppliers(reserveAddress, {
          offset: '0',
          limit: '5',
        });
        console.log('getMoneyMarketAssetSuppliers:', mmAssetSuppliers);
      } catch (err) {
        console.error('getMoneyMarketAssetSuppliers error:', err);
      }
    }
  } catch (err) {
    console.error('getAllMoneyMarketAssets error:', err);
  }

  // 9. getAllMoneyMarketBorrowers
  try {
    const allMMBorrowers = await sodax.backendApi.getAllMoneyMarketBorrowers({ offset: '0', limit: '5' });
    console.log('getAllMoneyMarketBorrowers:', allMMBorrowers);
  } catch (err) {
    console.error('getAllMoneyMarketBorrowers error:', err);
  }
}

main();
