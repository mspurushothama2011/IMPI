import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check both mode and NODE_ENV for production detection
  const isProduction = mode === 'production' || process.env.NODE_ENV === 'production';
  
  // Log environment for debugging
  console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);
  
  return {
    plugins: [
      react(),
      // Gzip compression for production builds
      compression({
        verbose: true,
        disable: false,
        threshold: 10240, // Only compress files > 10KB
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Brotli compression for production builds
      compression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ],
    // Base URL for API requests
    define: {
      'process.env': {
        ...env,
        VITE_API_BASE_URL: env.VITE_API_BASE_URL || (isProduction ? '/api' : 'http://localhost:8080'),
      },
    },
    server: {
      port: 5173,
      proxy: !isProduction ? {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      } : undefined,
    },
    build: {
      // Output directory relative to the project root
      outDir: '../dist',
      // Optimize build output
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            axios: ['axios'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Generate sourcemaps for production builds
      sourcemap: true,
    },
    // Add base URL for production builds
    base: isProduction ? '/frontend' : '/',
  };
});
