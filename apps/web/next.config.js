/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Resolve internal monorepo packages via filesystem (no npm publish needed)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@bacen-monitor/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@bacen-monitor/cadoc-engine': path.resolve(__dirname, '../../packages/cadoc-engine/src/index.ts'),
    }
    return config
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',       value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      ],
    }]
  },
}

module.exports = nextConfig
