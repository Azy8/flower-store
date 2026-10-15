import type { NextConfig } from "next";

// Firebase Hosting (Spark plan): build a fully static site into out/.
// - No server: pages load data from Supabase in the browser (security = Supabase RLS)
// - Security headers live in firebase.json (headers() doesn't apply to static export)
// - Image optimization needs a server, so photos load straight from Supabase Storage
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
