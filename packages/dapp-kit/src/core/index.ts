import type { XToken } from '@new-world/xwagmi';

export const allXTokens: XToken[] = [
  // testnet
  {
    xChainId: '0xa869.fuji',
    symbol: 'AVAX',
    name: 'AVAX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },

  {
    xChainId: 'sonic-blaze',
    symbol: 'nwt',
    name: 'testcw20 Vault token',
    decimals: 18,
    address: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'AVAX',
    name: 'AVAX Vault Token',
    decimals: 18,
    address: '0xd40AbC1b98746E902Ab4194F1b6e09E8139Ba67c',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'ICX',
    name: 'ICX Vault token',
    decimals: 18,
    address: '0x70CB7B199700Ae2B1FAb3d4e6FecDa156FBf8182',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'STX',
    name: 'STX Vault token ',
    decimals: 18,
    address: '0x1d95b4c2793486BB9B58B5245DbB2B656A5b9EDA',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'SOL',
    name: 'Solana Vault token',
    decimals: 18,
    address: '0x8Ba33C0255c338A6295D282d5D97068E88b0df16',
  },
  {
    xChainId: 'sonic-blaze',
    symbol: 'SUI',
    name: 'SUI Vault token',
    decimals: 18,
    address: '0x742BD79c9997A51F1c4F38F1F33C7841B0F34a7a',
  },

  // mainnet - avalanche
  {
    xChainId: '0xa86a.avax',
    symbol: 'AVAX',
    name: 'AVAX',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },

  // Mainnet Hub Vault Assets
  // Avalanche
  {
    xChainId: 'sonic',
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    address: '0x14238D267557E9d799016ad635B53CD15935d290',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Arbitrum
  {
    xChainId: 'sonic',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x4effB5813271699683C25c734F4daBc45B363709',
  },
  {
    xChainId: 'sonic',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
  },
  {
    xChainId: 'sonic',
    symbol: 'tBTC',
    name: 'Arbitrum tBTC',
    decimals: 18,
    address: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xbDf1F453FCB61424011BBDDCB96cFDB30f3Fe876',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Base
  {
    xChainId: 'sonic',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x4effB5813271699683C25c734F4daBc45B363709',
  },
  {
    xChainId: 'sonic',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Optimism
  {
    xChainId: 'sonic',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x4effB5813271699683C25c734F4daBc45B363709',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Nibiru
  {
    xChainId: 'sonic',
    symbol: 'NIBI',
    name: 'Nibiru',
    decimals: 18,
    address: '0xc6c85287a8b173A509C2F198bB719A8a5a2d0C68',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // BSC
  {
    xChainId: 'sonic',
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    address: '0x40Cd41b35DB9e5109ae7E54b44De8625dB320E6b',
  },
  {
    xChainId: 'sonic',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x4effB5813271699683C25c734F4daBc45B363709',
  },
  {
    xChainId: 'sonic',
    symbol: 'BTCB',
    name: 'Bitcoin BEP20',
    decimals: 18,
    address: '0x7A1A5555842Ad2D0eD274d09b5c4406a95799D5d',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Polygon
  {
    xChainId: 'sonic',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },
  {
    xChainId: 'sonic',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xAbbb91c0617090F0028BDC27597Cd0D038F3A833',
  },
  {
    xChainId: 'sonic',
    symbol: 'bnUSD',
    name: 'bnUSD',
    decimals: 18,
    address: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
  },

  // Additional tokens from spokeChainConfig
  // Arbitrum
  {
    xChainId: '0xa4b1.arbitrum',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  {
    xChainId: '0xa4b1.arbitrum',
    symbol: 'wstETH',
    name: 'Wrapped stETH',
    decimals: 18,
    address: '0x5979D7b546E38E414F7E9822514be443A4800529',
  },
  {
    xChainId: '0xa4b1.arbitrum',
    symbol: 'weETH',
    name: 'Wrapped eETH',
    decimals: 18,
    address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
  },
  {
    xChainId: '0xa4b1.arbitrum',
    symbol: 'tBTC',
    name: 'Arbitrum tBTC v2',
    decimals: 18,
    address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
  },
  {
    xChainId: '0xa4b1.arbitrum',
    symbol: 'USDC',
    name: 'USD Coin (USDC)',
    decimals: 6,
    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  },

  // Polygon
  {
    xChainId: '0x89.polygon',
    symbol: 'POL',
    name: 'Polygon',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },
  {
    xChainId: '0x89.polygon',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  },
];
