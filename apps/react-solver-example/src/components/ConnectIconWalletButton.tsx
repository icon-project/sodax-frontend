import { Button } from '@/components/ui/button';
import { useSolver } from '@/contexts/SolverContextProvider';
import {
  IconSpokeProvider,
  requestAddress as IconRequestAddress,
  IconWalletProvider,
  spokeChainConfig,
  ICON_MAINNET_CHAIN_ID,
  IconSpokeChainConfig,
  IconEoaAddress,
} from '@new-world/sdk';
import React from 'react';

export default function ConnectIconWalletButton() {
  const { setIconProvider } = useSolver();

  const onConnectClick = async () => {
    const addressResult = await IconRequestAddress();

    if (addressResult.ok) {
      const iconWalletProvider = new IconWalletProvider(
        addressResult.value as IconEoaAddress,
        'https://ctz.solidwallet.io/api/v3',
      );
      setIconProvider(
        new IconSpokeProvider(iconWalletProvider, spokeChainConfig[ICON_MAINNET_CHAIN_ID] as IconSpokeChainConfig),
      );
    } else {
      alert('Failed to request Hana Wallet address!');
    }
  };

  return <Button onClick={() => onConnectClick()}>Connect Icon Wallet</Button>;
}
