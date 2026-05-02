/**
 * Vite 构建配置：`@vitejs/plugin-vue` 启用 SFC。
 *
 * @see https://vite.dev/config/
 */
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()]
});
