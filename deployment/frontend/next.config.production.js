/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production config for Netlify deployment
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
  env: {
    // Point to your Hetzner backend via domain
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://chimeapp.netlify.app",
  }
};

export default nextConfig;