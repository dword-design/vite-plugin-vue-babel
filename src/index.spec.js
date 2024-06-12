import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import outputFiles from 'output-files'

export default tester(
  {
    works: async () => {
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
            {{ foo }}
          </template>

          <script setup>
          const foo = x |> x => x * 2
          </script>
        `,
      })
      await execaCommand('nuxt build')
    },
  },
  [testerPluginTmpDir()],
)
