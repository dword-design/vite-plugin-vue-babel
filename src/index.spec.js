import { endent } from '@dword-design/functions';
import { expect, test as base } from '@playwright/test';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import kill from 'tree-kill-promise';
import withLocalTmpDir from 'with-local-tmp-dir';

const test = base.extend({
  localTmpDir: [
    async ({}, use) => {
      const reset = await withLocalTmpDir();
      process.on('SIGINT', () => reset());

      try {
        await use();
      } finally {
        await reset();
      }
    },
    { auto: true },
  ],
});

test('works', async ({ page }) => {
  await outputFiles({
    'babel.config.json': JSON.stringify({
      plugins: [
        [
          packageName`@babel/plugin-proposal-pipeline-operator`,
          { proposal: 'fsharp' },
        ],
      ],
    }),
    'nuxt.config.js': endent`
      import self from '../src/index.js'

      export default {
        vite: {
          plugins: [{ enforce: 'pre', ...self() }],
        },
      }
    `,
    'pages/index.vue': endent`
      <template>
        <div class="foo">{{ foo }}</div>
      </template>

      <script setup>
      const foo = 1 |> x => x * 2
      </script>
    `,
  });

  const nuxt = execaCommand('nuxt dev', { env: { NODE_ENV: '' } });

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('.foo')).toHaveText('2');
  } finally {
    await kill(nuxt.pid);
  }
});
