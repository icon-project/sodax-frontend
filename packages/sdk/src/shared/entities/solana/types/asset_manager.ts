/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/asset_manager.json`.
 */
export type AssetManager = {
  address: 'AnCCJjheynmGqPp6Vgat9DTirGKD4CtQzP8cwTYV8qKH';
  metadata: {
    name: 'assetManager';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
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
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: 'nativeVaultAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116, 95, 110, 97, 116, 105, 118, 101];
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
          name: 'authority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [100, 97, 112, 112, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
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
          name: 'hubChainId';
          type: 'u128';
        },
        {
          name: 'hubAssetManager';
          type: 'bytes';
        },
        {
          name: 'connectionProgram';
          type: 'pubkey';
        },
        {
          name: 'rateLimitProgram';
          type: 'pubkey';
        },
        {
          name: 'rateLimitConfig';
          type: 'pubkey';
        },
      ];
    },
    {
      name: 'queryDappConfigAccounts';
      discriminator: [123, 175, 45, 80, 137, 236, 132, 37];
      accounts: [
        {
          name: 'config';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
              },
            ];
          };
        },
      ];
      args: [];
      returns: {
        defined: {
          name: 'paramAccounts';
        };
      };
    },
    {
      name: 'queryRecvMessageAccounts';
      discriminator: [36, 243, 79, 158, 41, 247, 134, 15];
      accounts: [
        {
          name: 'config';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'data';
          type: 'bytes';
        },
        {
          name: 'srcChainId';
          type: 'u128';
        },
        {
          name: 'connSn';
          type: 'u128';
        },
        {
          name: 'page';
          type: 'u8';
        },
        {
          name: 'limit';
          type: 'u8';
        },
      ];
      returns: {
        defined: {
          name: 'queryAccountsPaginateResponse';
        };
      };
    },
    {
      name: 'recvMessage';
      discriminator: [49, 210, 56, 132, 17, 157, 18, 123];
      accounts: [
        {
          name: 'signer';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'config';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: 'nativeVaultAccount';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116, 95, 110, 97, 116, 105, 118, 101];
              },
            ];
          };
        },
        {
          name: 'tokenVaultAccount';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116, 95, 115, 101, 101, 100];
              },
              {
                kind: 'account';
                path: 'adminTokenAccount';
              },
            ];
          };
        },
        {
          name: 'mint';
          optional: true;
        },
        {
          name: 'to';
          writable: true;
          optional: true;
        },
        {
          name: 'toNative';
          writable: true;
        },
        {
          name: 'tokenProgram';
          optional: true;
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          optional: true;
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'authority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [100, 97, 112, 112, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              },
            ];
          };
        },
        {
          name: 'adminTokenAccount';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'config.owner';
                account: 'amConfig';
              },
              {
                kind: 'const';
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: 'account';
                path: 'mint';
              },
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: 'tokenAccountCreationPda';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  116,
                  97,
                  95,
                  99,
                  114,
                  101,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  95,
                  115,
                  101,
                  101,
                  100,
                ];
              },
              {
                kind: 'account';
                path: 'adminTokenAccount';
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'srcChainId';
          type: 'u128';
        },
        {
          name: 'srcAddress';
          type: 'bytes';
        },
        {
          name: 'connSn';
          type: 'u128';
        },
        {
          name: 'payload';
          type: 'bytes';
        },
        {
          name: 'signatures';
          type: {
            vec: {
              array: ['u8', 65];
            };
          };
        },
      ];
    },
    {
      name: 'setOwner';
      discriminator: [72, 202, 120, 52, 77, 128, 96, 197];
      accounts: [
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
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
          name: 'owner';
          type: 'pubkey';
        },
      ];
    },
    {
      name: 'setTaCreationFee';
      discriminator: [175, 205, 14, 122, 102, 202, 29, 96];
      accounts: [
        {
          name: 'tokenAccountCreationPda';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  116,
                  97,
                  95,
                  99,
                  114,
                  101,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  95,
                  115,
                  101,
                  101,
                  100,
                ];
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
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
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
      args: [
        {
          name: 'token';
          type: 'pubkey';
        },
        {
          name: 'tokenAccountCreationFee';
          type: 'u64';
        },
      ];
    },
    {
      name: 'transfer';
      discriminator: [163, 52, 200, 231, 140, 3, 69, 186];
      accounts: [
        {
          name: 'signer';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'config';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103, 45, 115, 101, 101, 100];
              },
            ];
          };
        },
        {
          name: 'nativeVaultAccount';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116, 95, 110, 97, 116, 105, 118, 101];
              },
            ];
          };
        },
        {
          name: 'tokenVaultAccount';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116, 95, 115, 101, 101, 100];
              },
              {
                kind: 'account';
                path: 'signerTokenAccount';
              },
            ];
          };
        },
        {
          name: 'signerTokenAccount';
          writable: true;
          optional: true;
        },
        {
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [100, 97, 112, 112, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              },
            ];
          };
        },
        {
          name: 'mint';
          optional: true;
        },
        {
          name: 'connection';
          address: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'to';
          type: 'bytes';
        },
        {
          name: 'data';
          type: 'bytes';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'amConfig';
      discriminator: [239, 80, 113, 23, 121, 60, 23, 118];
    },
    {
      name: 'authority';
      discriminator: [36, 108, 254, 18, 167, 144, 27, 36];
    },
    {
      name: 'tokenAccountCreationFee';
      discriminator: [47, 215, 227, 72, 67, 69, 254, 245];
    },
    {
      name: 'vaultNative';
      discriminator: [30, 156, 76, 163, 253, 211, 113, 26];
    },
  ];
  events: [
    {
      name: 'messageReceived';
      discriminator: [231, 68, 47, 77, 173, 241, 157, 166];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'insufficientFunds';
      msg: 'Insufficient funds for native SOL deposit.';
    },
    {
      code: 6001;
      name: 'tokenVaultIsRequired';
      msg: 'Token vault is required.';
    },
    {
      code: 6002;
      name: 'nativeVaultIsRequired';
      msg: 'Native vault is required';
    },
    {
      code: 6003;
      name: 'invalidAssetManager';
      msg: 'Invalid hub asset manager.';
    },
    {
      code: 6004;
      name: 'invalidHubNid';
      msg: 'Invalid hub nid.';
    },
    {
      code: 6005;
      name: 'tokenProgramIsRequired';
      msg: 'Token program is required.';
    },
    {
      code: 6006;
      name: 'associatedTokenProgramIsRequired';
      msg: 'Associated Token program is required.';
    },
    {
      code: 6007;
      name: 'toTokenAddressIsRequired';
      msg: 'To token address is required.';
    },
    {
      code: 6008;
      name: 'depositorTokenAddressIsRequired';
      msg: 'Depositor token address is required';
    },
    {
      code: 6009;
      name: 'invalidReceiver';
      msg: 'Invalid Receiver';
    },
    {
      code: 6010;
      name: 'invalidRecipientAddress';
      msg: 'Invalid Recipient Address';
    },
    {
      code: 6011;
      name: 'invalidTokenAddress';
      msg: 'Invalid Token Address';
    },
    {
      code: 6012;
      name: 'invalidVaultConfiguration';
      msg: 'Invalid vault configuration.';
    },
    {
      code: 6013;
      name: 'onlyAdmin';
      msg: 'Only Admin';
    },
    {
      code: 6014;
      name: 'invalidAmount';
      msg: 'Invalid Amount';
    },
    {
      code: 6015;
      name: 'insufficientTransferAmount';
      msg: 'Insufficient Transfer Amount';
    },
    {
      code: 6016;
      name: 'decodeFailed';
      msg: 'Decode failed';
    },
    {
      code: 6017;
      name: 'invalidConnectionProgram';
      msg: 'Invalid Connection Program';
    },
    {
      code: 6018;
      name: 'invalidRateLimitProgram';
      msg: 'Invalid Rate Limit Program';
    },
    {
      code: 6019;
      name: 'invalidToken';
      msg: 'Invalid Token';
    },
    {
      code: 6020;
      name: 'toAccountIsRequired';
      msg: 'To Account Is Required';
    },
  ];
  types: [
    {
      name: 'amConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'hubChainId';
            type: 'u128';
          },
          {
            name: 'hubAssetManager';
            type: 'bytes';
          },
          {
            name: 'connectionProgram';
            type: 'pubkey';
          },
          {
            name: 'rateLimitProgram';
            type: 'pubkey';
          },
          {
            name: 'rateLimitConfig';
            type: 'pubkey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'authority';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'messageReceived';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'srcChainId';
            type: 'u128';
          },
          {
            name: 'srcAddress';
            type: 'bytes';
          },
          {
            name: 'connSn';
            type: 'u128';
          },
          {
            name: 'payload';
            type: 'bytes';
          },
        ];
      };
    },
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
      name: 'queryAccountsPaginateResponse';
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
          {
            name: 'totalAccounts';
            type: 'u8';
          },
          {
            name: 'limit';
            type: 'u8';
          },
          {
            name: 'page';
            type: 'u8';
          },
          {
            name: 'hasNextPage';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'tokenAccountCreationFee';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            type: 'pubkey';
          },
          {
            name: 'tokenAccountCreationFee';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'vaultNative';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
  ];
};
