import { transform } from '@babel/core';
import { endent } from '@dword-design/functions';
import { parseVueRequest } from '@vitejs/plugin-vue';
import { generateCodeFrame } from '@vue/compiler-dom';
import { parse } from 'vue/compiler-sfc';
import vueSfcDescriptorToString from 'vue-sfc-descriptor-to-string';

export default () => ({
  transform: async (code, id) => {
    const query = parseVueRequest(id);

    if (
      query.filename.endsWith('.vue') &&
      (!query.query.type ||
        query.query.type === 'template' ||
        query.query.type === 'script') &&
      !query.filename.split('/').includes('node_modules')
    ) {
      const sfc = parse(code);

      for (const section of ['scriptSetup', 'script']) {
        if (
          sfc.descriptor[section] &&
          sfc.descriptor[section].lang === undefined
        ) {
          try {
            sfc.descriptor[section].content = (
              await transform(sfc.descriptor[section].content, {
                filename: query.filename,
              })
            ).code;
          } catch (error) {
            error.message = endent`
              [vue/compiler-sfc] ${error.message.split('\n')[0]}

              ${query.filename}
              ${generateCodeFrame(
                sfc.descriptor.source,
                error.pos + sfc.descriptor[section].loc.start.offset,
                error.pos + sfc.descriptor[section].loc.start.offset + 1,
              )}
            `;

            throw error;
          }
        }
      }

      return vueSfcDescriptorToString(sfc.descriptor);
    }

    return code;
  },
});
