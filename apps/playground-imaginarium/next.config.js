import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      fs: './lib/node-stub.js',
      crypto: './lib/node-stub.js',
    },
  },
  transpilePackages: ['@dendrovia/shared', '@dendrovia/imaginarium', '@dendrovia/dendrite', '@dendrovia/oculus'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
