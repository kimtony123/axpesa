/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8080',
  },
  transpilePackages: ['@web3auth/modal', '@web3auth/base', '@web3auth/ethereum-provider'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.web3auth.io',
      },
    ],
  },
};

module.exports = nextConfig;
