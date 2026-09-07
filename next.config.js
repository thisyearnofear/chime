/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  turbopack: {},
  transpilePackages: ['@somnia-chain/markets-sdk', '@somnia-chain/reactivity'],
  serverExternalPackages: ['ws', 'bufferutil'],
  async redirects() {
    return [
      { source: '/rankings', destination: '/roster', permanent: false },
      { source: '/commitment/:path*', destination: '/', permanent: false },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
