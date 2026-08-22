import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (and its gRPC/protobuf deps) must stay external — bundling
  // it breaks the serverless function at load time on Vercel.
  serverExternalPackages: ["firebase-admin", "google-auth-library"],
};

export default nextConfig;
