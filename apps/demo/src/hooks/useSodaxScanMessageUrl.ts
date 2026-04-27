// // Fetches SodaxScan message URL for a given source tx hash for use in success modals.
//
// import { useEffect, useState } from 'react';
// import { getSodaxScanMessageUrl } from '@/lib/sodaxScan';
//
// export interface UseSodaxScanMessageUrlResult {
//   url: string | null;
//   isLoading: boolean;
// }
//
// /**
//  * Resolves a transaction hash to a SodaxScan message URL.
//  * Used by money market success modals to link to "View on SodaxScan" instead of chain explorer. If not available, fallback to explorerUrl
//  */
// export function useSodaxScanMessageUrl(txHash: string | undefined): UseSodaxScanMessageUrlResult {
//   const [url, setUrl] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//
//   useEffect(() => {
//     if (!txHash) {
//       setUrl(null);
//       setIsLoading(false);
//       return;
//     }
//     let cancelled = false;
//     let retryCount = 0;
//     const maxRetries = 3;
//     const retryDelay = 2000; // 2 seconds between retries
//
//     const fetchUrl = async (): Promise<void> => {
//       try {
//         const resolved = await getSodaxScanMessageUrl(txHash);
//         if (!cancelled) {
//           if (resolved) {
//             setUrl(resolved);
//             setIsLoading(false);
//           } else if (retryCount < maxRetries) {
//             // Retry if message not found (might not be indexed yet)
//             retryCount++;
//             setTimeout(() => {
//               if (!cancelled) fetchUrl();
//             }, retryDelay);
//           } else {
//             // Give up after max retries
//             setUrl(null);
//             setIsLoading(false);
//           }
//         }
//       } catch {
//         if (!cancelled) {
//           setUrl(null);
//           setIsLoading(false);
//         }
//       }
//     };
//
//     setIsLoading(true);
//     setUrl(null);
//     fetchUrl();
//
//     return () => {
//       cancelled = true;
//     };
//   }, [txHash]);
//
//   return { url, isLoading };
// }
