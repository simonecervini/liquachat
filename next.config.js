/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  devIndicators: false,
  async redirects() {
    return Promise.resolve([
      {
        source: "/(.*)",
        destination: "https://github.com/simonecervini/liquachat",
        // has: [
        //   {
        //     type: "host",
        //     value: "liqua.chat",
        //   },
        // ],
        permanent: false,
      },
    ]);
  },
  // We run these separately in CI, so we can skip them here.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

if (process.env.DOCKER_BUILD === "true") {
  config.output = "standalone";
}

export default config;
