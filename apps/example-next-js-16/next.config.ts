import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '..', '..'),
    rules: {
      // @injectivelabs/wallet-ledger bundles CryptoJS UMD into ESM output.
      // Turbopack parses dead AMD define(["./core"]) as real imports.
      // Use string-replace-loader to strip AMD check in the specific file.
      '*.js': {
        condition: {
          path: /@injectivelabs\/wallet-ledger/,
        },
        loaders: [
          {
            loader: 'string-replace-loader',
            options: {
              multiple: [
                {
                  search: 'typeof define === "function" && define.amd',
                  replace: 'false',
                },
              ],
            },
          },
        ],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
