// import { Button } from '@/components/ui/button';
// import { useSolver } from '@/contexts/SolverContextProvider';
// import { useConnectWallet, useWallets } from '@mysten/dapp-kit';
// import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
// import { SuiProvider } from 'icon-intents-sdk';
// import React from 'react';

// export default function ConnectSuiWalletButton() {
//   const { setSuiProvider } = useSolver();
//   const suiWallets = useWallets();
//   const { mutateAsync: suiConnectAsync } = useConnectWallet();

//   const onConnectClick = async () => {
//     const wallet = suiWallets[0];

//     if (wallet) {
//       const { accounts } = await suiConnectAsync({ wallet: wallet });
//       console.log('Connected accounts', accounts);
//       const account = accounts[0];

//       if (account) {
//         setSuiProvider(
//           new SuiProvider({
//             wallet,
//             account,
//             client: new SuiClient({ url: getFullnodeUrl('mainnet') }),
//           }),
//         );
//       } else {
//         alert('No SUI account selected!');
//       }
//     } else {
//       alert('No SUI wallet connected!');
//     }
//   };

//   return <Button onClick={() => onConnectClick()}>Connect Sui Wallet</Button>;
// }
