/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/connection.json`.
 */
export type Connection = {
  address: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB';
  metadata: {
    name: 'connection';
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
          name: 'signer';
          docs: ['Rent payer'];
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'config';
          docs: ['config'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'chainId';
          type: 'u128';
        },
      ];
    },
    {
      name: 'queryVerifyMessageAccounts';
      discriminator: [97, 51, 83, 151, 233, 7, 126, 117];
      accounts: [
        {
          name: 'config';
          docs: ['config'];
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103];
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
          name: 'connSn';
          type: 'u128';
        },
      ];
      returns: {
        defined: {
          name: 'queryAccountsResponse';
        };
      };
    },
    {
      name: 'sendMessage';
      discriminator: [57, 40, 34, 178, 189, 10, 65, 26];
      accounts: [
        {
          name: 'signer';
          writable: true;
          signer: true;
        },
        {
          name: 'dapp';
          signer: true;
          optional: true;
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
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'dstChainId';
          type: 'u128';
        },
        {
          name: 'dstAddress';
          type: 'bytes';
        },
        {
          name: 'payload';
          type: 'bytes';
        },
      ];
    },
    {
      name: 'setAdmin';
      discriminator: [251, 163, 0, 52, 91, 194, 187, 92];
      accounts: [
        {
          name: 'admin';
          docs: ['Transaction signer'];
          writable: true;
          signer: true;
          relations: ['config'];
        },
        {
          name: 'config';
          docs: ['config'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'account';
          type: 'pubkey';
        },
      ];
    },
    {
      name: 'setThreshold';
      discriminator: [155, 53, 245, 104, 116, 169, 239, 167];
      accounts: [
        {
          name: 'admin';
          docs: ['Transaction signer'];
          writable: true;
          signer: true;
          relations: ['config'];
        },
        {
          name: 'config';
          docs: ['config'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'threshold';
          type: 'u8';
        },
      ];
    },
    {
      name: 'updateValidators';
      discriminator: [211, 66, 122, 122, 121, 107, 148, 111];
      accounts: [
        {
          name: 'admin';
          docs: ['Transaction signer'];
          writable: true;
          signer: true;
          relations: ['config'];
        },
        {
          name: 'config';
          docs: ['config'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: 'validators';
          type: {
            vec: {
              array: ['u8', 65];
            };
          };
        },
        {
          name: 'threshold';
          type: 'u8';
        },
      ];
    },
    {
      name: 'verifyMessage';
      discriminator: [180, 193, 120, 55, 189, 135, 203, 83];
      accounts: [
        {
          name: 'signer';
          writable: true;
          signer: true;
        },
        {
          name: 'dapp';
          signer: true;
          optional: true;
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
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: 'receipt';
          writable: true;
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
  ];
  accounts: [
    {
      name: 'config';
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130];
    },
    {
      name: 'receipt';
      discriminator: [39, 154, 73, 106, 80, 102, 145, 153];
    },
  ];
  events: [
    {
      name: 'sendMessage';
      discriminator: [146, 38, 13, 221, 87, 214, 247, 12];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'onlyAdmin';
      msg: 'Only admin';
    },
    {
      code: 6001;
      name: 'adminValidatorCnnotBeRemoved';
      msg: 'Admin Validator Cnnot Be Removed';
    },
    {
      code: 6002;
      name: 'validatorsMustBeGreaterThanThreshold';
      msg: 'Validators Must Be Greater Than Threshold';
    },
  ];
  types: [
    {
      name: 'accountMetadata';
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
      name: 'config';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'pubkey';
          },
          {
            name: 'chainId';
            type: 'u128';
          },
          {
            name: 'validators';
            type: {
              vec: {
                array: ['u8', 65];
              };
            };
          },
          {
            name: 'threshold';
            type: 'u8';
          },
          {
            name: 'sn';
            type: 'u128';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'queryAccountsResponse';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'accounts';
            type: {
              vec: {
                defined: {
                  name: 'accountMetadata';
                };
              };
            };
          },
        ];
      };
    },
    {
      name: 'receipt';
      type: {
        kind: 'struct';
        fields: [];
      };
    },
    {
      name: 'sendMessage';
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
            name: 'dstChainId';
            type: 'u128';
          },
          {
            name: 'dstAddress';
            type: 'bytes';
          },
          {
            name: 'payload';
            type: 'bytes';
          },
        ];
      };
    },
  ];
};
