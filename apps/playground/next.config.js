import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/oculus',
    '@dendrovia/architectus',
    '@dendrovia/imaginarium',
    '@dendrovia/dendrite',
  ],
  webpack: (config, { isServer, webpack }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
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
        url: resolve(__dirname, 'lib/url-browser-shim.js'),
      };
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
