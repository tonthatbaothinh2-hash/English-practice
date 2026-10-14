import { defineConfig } from "vite";

// base "./" giúp bản build chạy được ở bất kỳ đường dẫn nào
// (GitHub Pages dạng username.github.io/ten-repo/ hoặc Netlify).
export default defineConfig({
  base: "./",
  test: {
    environment: "node",
  },
});
