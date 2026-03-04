/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rate_limit_contract.json`.
 */
export type RateLimitContract = {
  address: '2Vyy3A3Teju2EMCkdnappEeWqBXyAaF5V2WsrU4hDtsk';
  metadata: {
    name: 'rateLimitContract';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'configureRateLimit';
      discriminator: [227, 52, 114, 110, 151, 143, 179, 169];
      accounts: [
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'rateLimit';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 105, 109, 105, 116];
              },
              {
                kind: 'arg';
                path: 'token';
              },
            ];
          };
        },
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [114, 109, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'token';
          type: 'pubkey';
        },
        {
          name: 'period';
          type: 'u64';
        },
        {
          name: 'percentage';
          type: 'u64';
        },
      ];
    },
    {
      name: 'initialize';
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [114, 109, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'queryVerifyWithdrawAccounts';
      discriminator: [170, 40, 182, 35, 169, 95, 103, 40];
      accounts: [
        {
          name: 'config';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [114, 109, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'token';
          type: 'pubkey';
        },
      ];
      returns: {
        defined: {
          name: 'paramAccounts';
        };
      };
    },
    {
      name: 'setAssetManager';
      discriminator: [183, 165, 55, 207, 57, 159, 164, 69];
      accounts: [
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [114, 109, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
      ];
      args: [
        {
          name: 'assetManager';
          type: 'pubkey';
        },
      ];
    },
    {
      name: 'verifyWithdraw';
      discriminator: [133, 213, 154, 98, 6, 8, 93, 13];
      accounts: [
        {
          name: 'signer';
          writable: true;
          signer: true;
        },
        {
          name: 'dapp';
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rateLimits';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 105, 109, 105, 116];
              },
              {
                kind: 'arg';
                path: 'token';
              },
            ];
          };
        },
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [114, 109, 99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'token';
          type: 'pubkey';
        },
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'balance';
          type: 'u64';
        },
      ];
      returns: 'bool';
    },
  ];
  accounts: [
    {
      name: 'rateLimitAccount';
      discriminator: [217, 50, 226, 90, 10, 8, 80, 60];
    },
    {
      name: 'rmConfig';
      discriminator: [43, 115, 231, 93, 90, 23, 151, 156];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'onlyOwner';
      msg: 'Only Owner';
    },
    {
      code: 6001;
      name: 'onlyAssetManager';
      msg: 'Only Asset Manager';
    },
    {
      code: 6002;
      name: 'invalidPercentage';
      msg: 'Invalid percentage value.';
    },
    {
      code: 6003;
      name: 'rateLimitNotSet';
      msg: 'Rate limit not set for this token.';
    },
    {
      code: 6004;
      name: 'exceedsWithdrawLimit';
      msg: 'Exceeds the withdraw limit.';
    },
    {
      code: 6005;
      name: 'accountNotEnough';
      msg: 'Account not enough.';
    },
  ];
  types: [
    {
      name: 'paramAccountProps';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'pubkey';
            type: 'pubkey';
          },
          {
            name: 'isWritable';
            type: 'bool';
          },
          {
            name: 'isSigner';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'paramAccounts';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'accounts';
            type: {
              vec: {
                defined: {
                  name: 'paramAccountProps';
                };
              };
            };
          },
        ];
      };
    },
    {
      name: 'rateLimitAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            type: 'pubkey';
          },
          {
            name: 'period';
            type: 'u64';
          },
          {
            name: 'percentage';
            type: 'u64';
          },
          {
            name: 'currentLimit';
            type: 'u64';
          },
          {
            name: 'lastUpdate';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'rmConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'assetManager';
            type: 'pubkey';
          },
        ];
      };
    },
  ];
};
