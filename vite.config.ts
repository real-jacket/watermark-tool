import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // GitHub Pages 部署时需要设置 base 路径
    // 如果是用户/组织页面（username.github.io），使用 '/'
    // 如果是项目页面（username.github.io/repo-name），使用 '/repo-name/'
    base: command === 'build' ? process.env.BASE_PATH || '/' : '/',
  };
});
