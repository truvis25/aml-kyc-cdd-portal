import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the page from being embedded in an iframe on other origins.
  // Critical for a financial platform to prevent clickjacking.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevents MIME-type sniffing — XSS vector mitigation.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Forces HTTPS for the lifetime of the session (1 year).
  // Only sent over HTTPS connections; safe to include unconditionally.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Controls what information is sent in the Referer header.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restricts browser features. Minimal set appropriate for a KYC portal.
  // Expand if camera/microphone access is needed for IDV in future milestones.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Old per-vendor compare pages collapsed into a generic /compare.
      { source: "/compare/sumsub", destination: "/compare", permanent: true },
      { source: "/compare/azakaw", destination: "/compare", permanent: true },
    ];
  },

  // Ensure Next.js does not expose build-time information in error responses.
  poweredByHeader: false,
};

export default nextConfig;
