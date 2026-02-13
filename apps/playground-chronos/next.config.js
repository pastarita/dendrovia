/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/chronos',
  ],
};

export default nextConfig;
