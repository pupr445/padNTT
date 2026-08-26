/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Integrasi dev server Next.js dengan OpenNext Cloudflare adapter,
// supaya `npm run dev` bisa akses binding Cloudflare (kalau ada) saat development.
import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
  initOpenNextCloudflareForDev();
});

module.exports = nextConfig;
