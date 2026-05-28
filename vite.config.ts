// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vercel 배포 설정:
// - cloudflare: false  → Cloudflare Workers 플러그인 비활성화
// - tanstackStart.target: "vercel"  → Vercel adapter(Nitro vercel preset) 사용
// - server.entry: "server"  → 기존 SSR error wrapper(src/server.ts) 유지
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "vercel",
    server: { entry: "server" },
  },
});
