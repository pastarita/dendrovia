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
    '@dendrovia/chronos',
    '@dendrovia/dendrite',
    '@dendrovia/oculus',
  ],
};

export default nextConfig;
