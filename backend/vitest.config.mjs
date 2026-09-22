import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../test files/backend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
  },
});
