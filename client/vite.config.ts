import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import eslint from 'vite-plugin-eslint';

const ci = process.env.CI ?? false;
// https://vitejs.dev/config/
export default defineConfig({
  base: ci ? '/decentralized-inference' : './',
  plugins: [react(), tsconfigPaths(), nodePolyfills({ protocolImports: true }), eslint()],
  optimizeDeps: {disabled: false},
  build: {
    commonjsOptions: { include: [] }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
    },
 }
});
