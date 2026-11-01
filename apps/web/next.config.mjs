/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zynveo/ui", "@zynveo/contracts", "@zynveo/database", "@zynveo/sync"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};
export default nextConfig;
