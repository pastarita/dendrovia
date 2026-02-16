import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/architectus',
    '@dendrovia/imaginarium',
    '@dendrovia/dendrite',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    // Imaginarium barrel exports server-side modules (DeterministicCache,
    // ShaderAssembler, etc.) that use Node.js APIs. Provide shims/stubs
    // so they can load in client bundles without crashing.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        url: resolve(__dirname, 'lib/url-browser-shim.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
