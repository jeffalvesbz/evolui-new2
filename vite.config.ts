import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: false,
      cors: true,
    },
    plugins: [
      react(),
      // Visualizador de bundle (só gera arquivo em build)
      visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'sunburst' | 'treemap' | 'network'
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    // Otimizações de build para produção
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    // Vite automaticamente expõe variáveis com prefixo VITE_ em import.meta.env
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Usar terser para melhor compressão
      minify: isProduction ? 'terser' : 'esbuild',
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false,
        },
      } : undefined,
      // Otimizar chunk size
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar vendor chunks para melhor caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-tabs', 'cmdk', 'framer-motion'],
            'chart-vendor': ['recharts'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'gemini-vendor': ['@google/genai'],
            // NOVO: Separar date-fns para melhor caching
            'date-vendor': ['date-fns'],
            // NOVO: Separar PDF.js que é pesado
            'pdf-vendor': ['pdfjs-dist'],
          },
        },
      },
    },
  };
});
