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
  webpack: (config, { isServer, webpack }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    // Imaginarium + pino barrel exports server-side modules that use Node.js APIs.
    // Provide shims/stubs so they can load in client bundles.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        events: false,
        buffer: false,
        assert: false,
        string_decoder: false,
        querystring: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        child_process: false,
        worker_threads: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        url: path.resolve(__dirname, 'lib/url-browser-shim.js'),
      };

      // Rewrite ALL `node:*` imports to their unprefixed equivalents
      // so webpack's resolve.fallback stubs kick in for browser builds.
      // This catches pino's `node:stream`, `node:events`, `node:os`, etc.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
