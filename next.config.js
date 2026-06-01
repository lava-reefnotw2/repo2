/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      '@sparticuz/chromium'
    ],
  },
  webpack: (config) => {
    config.externals.push('puppeteer', 'puppeteer-core', '@sparticuz/chromium');
    return config;
  },
}

module.exports = nextConfig
