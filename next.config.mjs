const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@vercel/postgres']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['api.telegram.org'],
    unoptimized: true,
  }
}

export default nextConfig
