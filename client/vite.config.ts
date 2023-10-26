import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tsconfigPaths(), eslint(), svgr() ],
  optimizeDeps: {disabled: false},
  build: {
    commonjsOptions: { include: [] }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    exclude:[
      ...configDefaults.exclude, 
      '**/detail.test.tsx'
    ]
 }
});
