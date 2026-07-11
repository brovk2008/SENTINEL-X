/** @type {import('next').NextConfig} */
module.exports = {
  // Explicitly set turbopack root to this frontend folder to avoid lockfile/scan confusion
  turbopack: {
    root: './',
  },
};
