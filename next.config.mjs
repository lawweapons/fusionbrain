/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Allow large file uploads (vendor PDFs can be 45MB+).
  // Default middleware body limit is 10MB; bump for /api/admin/upload + /api/ingest.
  middlewareClientMaxBodySize: "100mb",
  experimental: {
    serverActions: { bodySizeLimit: "100mb" }
  }
};

export default nextConfig;
