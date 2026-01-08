import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Cấu hình Base path chuẩn
    base: '/',
    // Định nghĩa biến toàn cục để tránh lỗi Runtime trên browser
    define: {
      // Fix lỗi "process is not defined"
      'process.env': {
        API_KEY: env.API_KEY || ''
      },
      // Polyfill cho global nếu thư viện nào đó cần
      global: 'window',
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'lucide-react'],
            ai: ['@google/genai']
          },
        },
      },
    },
    server: {
      port: 3000,
    }
  };
});