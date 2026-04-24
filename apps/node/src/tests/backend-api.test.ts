// import { Sodax } from '@sodax/sdk';

// const sodax = new Sodax();

// async function main() {
//   const orderbook = await sodax.backendApi.getOrderbook({
//     offset: '0',
//     limit: '5',
//   });
//   console.log('Orderbook:', orderbook);

//   // Purpose: Call all GET query functions from BackendApiService and log their outputs

//   // 1. getIntentByTxHash (example txHash, replace with real if needed)
//   try {
//     const intentByTxHash = await sodax.backendApi.getIntentByTxHash(
//       '0xe6c9496781ef863e7d83ad86265076a633939384d6227bbe8154bea7028191d3',
//     );
//     console.log('getIntentByTxHash:', intentByTxHash);
//   } catch (err) {
//     console.error('getIntentByTxHash error:', err);
//   }

//   // 2. getIntentByHash (example intentHash, replace with real if needed)
//   try {
//     const intentByHash = await sodax.backendApi.getIntentByHash(
//       '0xe789418f2cc226e48a73d135392d7dd0bfded03f4adde43baa105abe3644761a',
//     );
//     console.log('getIntentByHash:', intentByHash);
//   } catch (err) {
//     console.error('getIntentByHash error:', err);
//   }

//   // 3. getOrderbook (already called above)

//   // 4. getMoneyMarketPosition (example user address, replace with real if needed)
//   try {
//     const mmPosition = await sodax.backendApi.getMoneyMarketPosition('0x0Ab764AB3816cD036Ea951bE973098510D8105A6');
//     console.log('getMoneyMarketPosition:', mmPosition);
//   } catch (err) {
//     console.error('getMoneyMarketPosition error:', err);
//   }

//   // 5. getAllMoneyMarketAssets
//   try {
//     const allMMAssets = await sodax.backendApi.getAllMoneyMarketAssets();
//     console.log('getAllMoneyMarketAssets:', allMMAssets);
//     // Use a reserveAddress from the result for further queries if available
//     if (allMMAssets.length > 0) {
//       const reserveAddress = allMMAssets[0].reserveAddress;

//       // 6. getMoneyMarketAsset
//       try {
//         const mmAsset = await sodax.backendApi.getMoneyMarketAsset(reserveAddress);
//         console.log('getMoneyMarketAsset:', mmAsset);
//       } catch (err) {
//         console.error('getMoneyMarketAsset error:', err);
//       }

//       // 7. getMoneyMarketAssetBorrowers
//       try {
//         const mmAssetBorrowers = await sodax.backendApi.getMoneyMarketAssetBorrowers(reserveAddress, {
//           offset: '0',
//           limit: '5',
//         });
//         console.log('getMoneyMarketAssetBorrowers:', mmAssetBorrowers);
//       } catch (err) {
//         console.error('getMoneyMarketAssetBorrowers error:', err);
//       }

//       // 8. getMoneyMarketAssetSuppliers
//       try {
//         const mmAssetSuppliers = await sodax.backendApi.getMoneyMarketAssetSuppliers(reserveAddress, {
//           offset: '0',
//           limit: '5',
//         });
//         console.log('getMoneyMarketAssetSuppliers:', mmAssetSuppliers);
//       } catch (err) {
//         console.error('getMoneyMarketAssetSuppliers error:', err);
//       }
//     }
//   } catch (err) {
//     console.error('getAllMoneyMarketAssets error:', err);
//   }

//   // 9. getAllMoneyMarketBorrowers
//   try {
//     const allMMBorrowers = await sodax.backendApi.getAllMoneyMarketBorrowers({ offset: '0', limit: '5' });
//     console.log('getAllMoneyMarketBorrowers:', allMMBorrowers);
//   } catch (err) {
//     console.error('getAllMoneyMarketBorrowers error:', err);
//   }

//   // 10. RequestOverrideConfig smoke tests
//   console.log('\n--- RequestOverrideConfig smoke tests ---');

//   // baseURL override (same default URL — proves param is accepted)
//   try {
//     const orderbookWithConfig = await sodax.backendApi.getOrderbook(
//       { offset: '0', limit: '1' },
//       { baseURL: 'https://api.sodax.com/v1/be' },
//     );
//     console.log('getOrderbook with baseURL override:', orderbookWithConfig.total >= 0 ? 'OK' : 'FAIL');
//   } catch (err) {
//     console.error('getOrderbook with baseURL override error:', err);
//   }

//   // headers override
//   try {
//     const orderbookWithHeaders = await sodax.backendApi.getOrderbook(
//       { offset: '0', limit: '1' },
//       { headers: { 'X-Test': 'smoke' } },
//     );
//     console.log('getOrderbook with headers override:', orderbookWithHeaders.total >= 0 ? 'OK' : 'FAIL');
//   } catch (err) {
//     console.error('getOrderbook with headers override error:', err);
//   }

//   // getSubmitSwapTxStatus with config override
//   try {
//     const statusWithConfig = await sodax.backendApi.getSubmitSwapTxStatus(
//       { txHash: '0xe6c9496781ef863e7d83ad86265076a633939384d6227bbe8154bea7028191d3' },
//       { timeout: 10000 },
//     );
//     console.log('getSubmitSwapTxStatus with timeout override:', statusWithConfig);
//   } catch (err) {
//     console.error('getSubmitSwapTxStatus with config override error:', err);
//   }
// }

// main();
