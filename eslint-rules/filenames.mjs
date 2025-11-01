import path from 'node:path';

const ALLOWED_EXT = new Set(['.ts', '.json']);
const SEGMENT_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default {
  rules: {
    'kebab-case-filenames': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Enforce kebab-case for all file name segments (basename segments separated by dots)',
          recommended: false,
        },
        schema: [],
      },

      create(context) {
        const filename = context.getFilename();
        if (!filename || filename.startsWith('<')) return {}; // ignore virtual files

        const ext = path.extname(filename);
        if (!ALLOWED_EXT.has(ext)) return {}; // ignore other extensions

        const base = path.basename(filename, ext); // preserves dot-segments
        const segments = base.split('.');

        for (const seg of segments) {
          if (!SEGMENT_RE.test(seg)) {
            return {
              Program(node) {
                context.report({
                  node,
                  message: `Filename "${path.basename(filename)}" must use kebab-case for each segment like "my-file-name${ext}"; "${seg}" is invalid.`,
                });
              },
            };
          }
        }

        return {};
      },
    },
  },
};
