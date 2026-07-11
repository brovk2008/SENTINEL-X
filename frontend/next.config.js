/** @type {import('next').NextConfig} */
const path = require('path');
module.exports = {
  // Explicitly set turbopack root to this frontend folder to avoid lockfile/scan confusion
  turbopack: {
    root: path.resolve(__dirname),
  },
};
