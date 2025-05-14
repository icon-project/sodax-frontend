// import { xChainMap } from '@/constants/xChains';

// export const getNetworkDisplayName = (chain: XChainId) => {
//   return xChainMap[chain].name;
// };

// export const ONE_DAY_DURATION = 86400000;

// export function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export const showMessageOnBeforeUnload = (e) => {
//   e.preventDefault();
//   window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
//   e.returnValue = 'Your transaction will be canceled, and you’ll need to sign in again.';
//   return e.returnValue;
// };

// export const getTrackerLink = (
//   xChainId: XChainId,
//   data: string,
//   type: 'transaction' | 'address' | 'block' | 'contract' = 'transaction',
// ) => {
//   const tracker = xChainMap[xChainId].tracker;

//   switch (type) {
//     case 'transaction': {
//       return `${tracker.tx}/${data}`;
//     }
//     case 'address': {
//       return ``;
//     }
//     case 'block': {
//       return ``;
//     }
//     default: {
//       return ``;
//     }
//   }
// };
