import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev server dari ngrok tunnel (untuk testing di HP)
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.ngrok-free.dev"],
};

export default nextConfig;
