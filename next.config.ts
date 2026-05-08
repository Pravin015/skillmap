import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow next/image to optimise images from these external sources.
  // Without this, scraper job logos and Razorpay/UPI badges fall back to
  // raw <img> with no LCP optimisation. We're permissive on https hosts
  // because external job aggregators (Adzuna, Arbeitnow, Internshala,
  // Remotive) serve from many CDNs.
  images: {
    remotePatterns: [
      // Our own GCS bucket — profile photos, resumes, course covers
      { protocol: "https", hostname: "storage.googleapis.com" },

      // Job aggregators
      { protocol: "https", hostname: "**.adzuna.com" },
      { protocol: "https", hostname: "*.arbeitnow.com" },
      { protocol: "https", hostname: "internshala.com" },
      { protocol: "https", hostname: "*.internshala.com" },
      { protocol: "https", hostname: "remotive.com" },
      { protocol: "https", hostname: "*.remotive.com" },

      // Common company CDNs that ship logos
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.imgix.net" },

      // Razorpay assets
      { protocol: "https", hostname: "cdn.razorpay.com" },
    ],
    // Cache optimised variants for 1 day on the edge
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
