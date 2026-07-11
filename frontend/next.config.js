const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = Object.assign({}, config.resolve.alias, {
      '@': path.resolve(__dirname),
      '@/lib/store$': path.resolve(__dirname, 'lib', 'store.ts'),
      '@/lib': path.resolve(__dirname, 'lib')
    });
    return config;
  },
};
