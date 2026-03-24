/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@bacen-monitor/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@bacen-monitor/cadoc-engine': path.resolve(__dirname, '../../packages/cadoc-engine/src/index.ts'),
    }
    return config
  },
}

module.exports = nextConfig
