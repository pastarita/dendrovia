/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages export raw TypeScript — Next.js must transpile them.
  transpilePackages: [
    '@dendrovia/shared',
    '@dendrovia/architectus',
    '@dendrovia/ludus',
    '@dendrovia/oculus',
    '@dendrovia/operatus',
  ],
};

export default nextConfig;
