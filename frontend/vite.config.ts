// vite.config.ts - Vite 빌드 도구 설정
// React 플러그인 적용, 개발 서버에서 /api 프록시
// HELIX 프론트엔드 빌드 파이프라인 구성

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 프론트엔드(5173) → 백엔드(8000) API 프록시 설정
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
