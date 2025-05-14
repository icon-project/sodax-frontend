export const uiPoolDataAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_networkBaseTokenPriceInUsdProxyAggregator',
        type: 'address',
        internalType: 'contract IEACAggregatorProxy',
      },
      {
        name: '_marketReferenceCurrencyPriceInUsdProxyAggregator',
        type: 'address',
        internalType: 'contract IEACAggregatorProxy',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'ETH_CURRENCY_UNIT',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MKR_ADDRESS',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bytes32ToString',
    inputs: [
      {
        name: '_bytes32',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'getEModes',
    inputs: [
      {
        name: 'provider',
        type: 'address',
        internalType: 'contract IPoolAddressesProvider',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct IUiPoolDataProviderV3.Emode[]',
        components: [
          {
            name: 'id',
            type: 'uint8',
            internalType: 'uint8',
          },
          {
            name: 'eMode',
            type: 'tuple',
            internalType: 'struct DataTypes.EModeCategory',
            components: [
              {
                name: 'ltv',
                type: 'uint16',
                internalType: 'uint16',
              },
              {
                name: 'liquidationThreshold',
                type: 'uint16',
                internalType: 'uint16',
              },
              {
                name: 'liquidationBonus',
                type: 'uint16',
                internalType: 'uint16',
              },
              {
                name: 'collateralBitmap',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'label',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'borrowableBitmap',
                type: 'uint128',
                internalType: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReservesData',
    inputs: [
      {
        name: 'provider',
        type: 'address',
        internalType: 'contract IPoolAddressesProvider',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct IUiPoolDataProviderV3.AggregatedReserveData[]',
        components: [
          {
            name: 'underlyingAsset',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'name',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'symbol',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'decimals',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'baseLTVasCollateral',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'reserveLiquidationThreshold',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'reserveLiquidationBonus',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'reserveFactor',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'usageAsCollateralEnabled',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'borrowingEnabled',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'isActive',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'isFrozen',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'liquidityIndex',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'variableBorrowIndex',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'liquidityRate',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'variableBorrowRate',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'lastUpdateTimestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
          {
            name: 'aTokenAddress',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'variableDebtTokenAddress',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'interestRateStrategyAddress',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'availableLiquidity',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'totalScaledVariableDebt',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'priceInMarketReferenceCurrency',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'priceOracle',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'variableRateSlope1',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'variableRateSlope2',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'baseVariableBorrowRate',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'optimalUsageRatio',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'isPaused',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'isSiloedBorrowing',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'accruedToTreasury',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'unbacked',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'isolationModeTotalDebt',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'flashLoanEnabled',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'debtCeiling',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'debtCeilingDecimals',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'borrowCap',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'supplyCap',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'borrowableInIsolation',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'virtualAccActive',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'virtualUnderlyingBalance',
            type: 'uint128',
            internalType: 'uint128',
          },
        ],
      },
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IUiPoolDataProviderV3.BaseCurrencyInfo',
        components: [
          {
            name: 'marketReferenceCurrencyUnit',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'marketReferenceCurrencyPriceInUsd',
            type: 'int256',
            internalType: 'int256',
          },
          {
            name: 'networkBaseTokenPriceInUsd',
            type: 'int256',
            internalType: 'int256',
          },
          {
            name: 'networkBaseTokenPriceDecimals',
            type: 'uint8',
            internalType: 'uint8',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReservesList',
    inputs: [
      {
        name: 'provider',
        type: 'address',
        internalType: 'contract IPoolAddressesProvider',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserReservesData',
    inputs: [
      {
        name: 'provider',
        type: 'address',
        internalType: 'contract IPoolAddressesProvider',
      },
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct IUiPoolDataProviderV3.UserReserveData[]',
        components: [
          {
            name: 'underlyingAsset',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'scaledATokenBalance',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'usageAsCollateralEnabledOnUser',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'scaledVariableDebt',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
      {
        name: '',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'marketReferenceCurrencyPriceInUsdProxyAggregator',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IEACAggregatorProxy',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'networkBaseTokenPriceInUsdProxyAggregator',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IEACAggregatorProxy',
      },
    ],
    stateMutability: 'view',
  },
] as const;
