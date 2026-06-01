/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'chartjs-node-canvas', 'canvas'],
  },
}

module.exports = nextConfig
