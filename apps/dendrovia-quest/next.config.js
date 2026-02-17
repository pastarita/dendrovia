import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'next/dist/compiled/webpack/webpack-lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, '../..');

const nodeStubPath = resolve(__dirname, 'lib/node-stub.js');
const urlShimPath = resolve(__dirname, 'lib/url-browser-shim.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      fs: './lib/node-stub.js',
      crypto: './lib/node-stub.js',
    },
  },
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/architectus',
    '@dendrovia/imaginarium',
    '@dendrovia/ludus',
    '@dendrovia/oculus',
    '@dendrovia/operatus',
    '@dendrovia/dendrite',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };

    if (!isServer) {
      // Stub out Node.js built-ins for the browser bundle.
      // Packages like IMAGINARIUM and OPERATUS use node:fs, node:crypto, etc.
      // at the module level — these code paths never execute in the browser
      // but must resolve for the bundle to compile.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        path: false,
        url: false,
        'node:fs': false,
        'node:fs/promises': false,
        'node:crypto': false,
        'node:path': false,
        'node:url': false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        url: urlShimPath,
      };

      // Rewrite `node:*` imports to their unprefixed equivalents so webpack
      // fallbacks kick in (webpack only understands bare module names, not
      // the `node:` scheme).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(.+)$/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
