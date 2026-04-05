import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_GIT_COMMIT ?? crypto.randomUUID();

export const revalidate = 0;

export const { dynamic, dynamicParams, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ revision, url: "/offline" }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
