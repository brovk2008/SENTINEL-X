/** @type {import('next').NextConfig} */
const path = require('path');
module.exports = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow images from any domain (for camera feeds etc.)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
};
