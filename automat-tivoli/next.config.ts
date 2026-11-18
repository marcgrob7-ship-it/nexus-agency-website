import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Erlaubt den Zugriff vom Handy im gleichen WLAN während `npm run dev`
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
};

export default nextConfig;
