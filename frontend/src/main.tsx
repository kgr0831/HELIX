// main.tsx - React 애플리케이션 진입점
// DOM에 App 컴포넌트를 마운트하고 StrictMode를 활성화
// HELIX 다크 테마 CSS 스타일시트를 임포트

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
