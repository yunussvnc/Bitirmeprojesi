import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker standalone build için gerekli — .next/standalone çıktısını üretir
  // (server.js + minimal node_modules), Dockerfile bu çıktıyı kopyalar.
  output: "standalone",
};

export default nextConfig;
