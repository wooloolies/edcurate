import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_PUBLIC_GIT_COMMIT ??
  crypto.randomUUID();

const { dynamic, dynamicParams, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ revision, url: "/offline" }],
  nextConfig: {},
  swSrc: "src/app/sw.ts",
});

const revalidate = 0;

export { dynamic, dynamicParams, revalidate, generateStaticParams, GET };
