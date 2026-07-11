/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/api-client', '@repo/api-types', '@repo/ui'],
};

export default nextConfig;
