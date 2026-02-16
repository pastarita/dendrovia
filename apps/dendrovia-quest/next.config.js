import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/architectus',
    '@dendrovia/imaginarium',
    '@dendrovia/ludus',
    '@dendrovia/oculus',
    // '@dendrovia/operatus', // Uses node:fs/promises — re-enable when server integration is ready
    '@dendrovia/dendrite',
  ],
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    // Imaginarium barrel exports server-side modules that use Node.js APIs.
    // Provide shims/stubs so they can load in client bundles.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        path: false,
        os: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        url: path.resolve(__dirname, 'lib/url-browser-shim.js'),
        // OPERATUS uses node:fs/promises — stub it for browser builds
        'node:fs/promises': false,
        'node:fs': false,
        'node:path': false,
        'node:os': false,
      };
    }
    return config;
  },
};

export default nextConfig;
