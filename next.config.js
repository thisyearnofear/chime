/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {},
  output: 'standalone',
  transpilePackages: ['@somnia-chain/markets-sdk'],
  serverExternalPackages: ['ws', 'bufferutil'],
  async headers() {
    // Allow the frontend (chime.trustfall.xyz) to call this API
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://chime.trustfall.xyz' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/desk', destination: '/dashboard', permanent: false },
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
      }
    }
    return config
  },
}

export default nextConfig
