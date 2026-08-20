import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "penguin.linux.test",
    "penguin",
  ],
  async redirects() {
    return [
      { source: "/install", destination: "/start", permanent: false },
      { source: "/share", destination: "/", permanent: false },
      { source: "/app/hood", destination: "/app/radar", permanent: false },
      { source: "/app/vibe", destination: "/app/profile", permanent: false },
      { source: "/app/identity", destination: "/app/profile", permanent: false },
      { source: "/app/curate", destination: "/app/results", permanent: false },
      { source: "/app/field", destination: "/app", permanent: false },
      { source: "/app/room", destination: "/app/profile", permanent: false },
      { source: "/app/avatar", destination: "/app/profile", permanent: false },
      { source: "/ledger", destination: "/app/results", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
