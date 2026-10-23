/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Prisma's query engine is a .wasm file that Next's file tracing misses; without this the
  // deployed site crashes with "ENOENT ... query_compiler_bg.wasm".
  outputFileTracingIncludes: {
    "/": ["./node_modules/.prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/client/**/*"],
    "/**/*": ["./node_modules/.prisma/client/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
