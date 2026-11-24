import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      '../test files/backend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
  },
});
