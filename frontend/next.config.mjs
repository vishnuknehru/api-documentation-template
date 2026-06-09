/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@apidevtools/swagger-parser", "js-yaml"],
  },
};

export default nextConfig;
