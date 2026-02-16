const { resolve } = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(__dirname, '../..'),
  },
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/architectus',
    '@dendrovia/ludus',
    '@dendrovia/oculus',
    '@dendrovia/operatus',
  ],
};

module.exports = nextConfig;
