/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pakai output 'export' tidak kompatibel dengan API routes.
  // Untuk Cloudflare Pages, biarkan default, lalu jalankan @cloudflare/next-on-pages.
  experimental: {
    serverComponentsExternalPackages: ["citation-js", "@citation-js/plugin-csl"],
  },
};

module.exports = nextConfig;
