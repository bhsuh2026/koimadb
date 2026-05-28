import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable published 사이트는 Cloudflare Workers에서 실행됩니다.
// Vercel로 배포할 때만 DEPLOY_TARGET=vercel 환경변수를 설정하세요.
const isVercel = process.env.DEPLOY_TARGET === "vercel" || !!process.env.VERCEL;

export default defineConfig(
  isVercel
    ? {
        cloudflare: false,
        tanstackStart: {
          target: "vercel",
          server: { entry: "server" },
        },
      }
    : {
        tanstackStart: {
          server: { entry: "server" },
        },
      },
);
