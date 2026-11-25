const APPROVED_HEX_COLORS = new Set([
  '#F8FAFC', '#0F172A', '#FFFFFF', '#1E293B', '#F1F5F9', '#334155',
  '#E2E8F0', '#CBD5E1', '#475569', '#64748B', '#94A3B8',
  '#0F766E', '#14B8A6', '#115E59', '#0D9488', '#CCFBF1', '#134E4A',
  '#FF8559', '#F07144', '#F87171',
  '#ECFDF5', '#15803D', '#10B981', '#064E3B', '#6EE7B7', '#34D399',
  '#FFFBEB', '#B45309', '#F59E0B', '#78350F', '#FCD34D', '#FBBF24',
  '#FEF2F2', '#DC2626', '#EF4444', '#7F1D1D', '#FCA5A5',
  '#EFF6FF', '#1D4ED8', '#3B82F6', '#1E3A8A', '#93C5FD', '#60A5FA',
  '#FEE2E2',
]);

const ALLOWED_ARBITRARY_TOKENS = new Set([
  'max-w-[1440px]',
  'min-h-[44px]',
  'min-w-[44px]',
  'sm:text-[28px]',
]);

const ARBITRARY_RE = /(?:^|\s)([a-z0-9:-]*-\[\d+(?:\.\d+)?(?:px|rem|em)\])(?=\s|$)/gi;
const HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const SLASH_LABEL_RE = /\b[A-Za-z]{2,}\s*\/\s*[A-Za-z]{2,}\b/;
const RAW_CONTROLS = new Set(['button', 'input', 'select']);
const LABEL_PROPS = new Set(['label', 'placeholder', 'title', 'aria-label']);

function getStaticString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'JSXExpressionContainer') return getStaticString(node.expression);
  return null;
}

export default {
  rules: {
    'no-arbitrary-tailwind-values': {
      meta: {
        type: 'suggestion',
        messages: {
          arbitraryValue: 'Avoid arbitrary Tailwind value "{{token}}". Use DESIGN.md 8-point spacing, typography, or radius tokens.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            let match;
            ARBITRARY_RE.lastIndex = 0;
            while ((match = ARBITRARY_RE.exec(value)) !== null) {
              const token = match[1];
              if (!ALLOWED_ARBITRARY_TOKENS.has(token)) {
                context.report({ node, messageId: 'arbitraryValue', data: { token } });
                break;
              }
            }
          },
        };
      },
    },

    'no-unapproved-hex-colors': {
      meta: {
        type: 'suggestion',
        messages: {
          unapprovedHex: 'Hex color "{{hex}}" is not in DESIGN.md Section 2. Use semantic color tokens instead.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className' && node.name?.name !== 'style') return;
            const value = getStaticString(node.value);
            if (!value) return;
            const matches = value.match(HEX_RE) || [];
            for (const hex of matches) {
              if (!APPROVED_HEX_COLORS.has(hex.toUpperCase())) {
                context.report({ node, messageId: 'unapprovedHex', data: { hex } });
                break;
              }
            }
          },
        };
      },
    },

    'no-slash-labels': {
      meta: {
        type: 'suggestion',
        messages: {
          slashLabel: 'Avoid slash-separated label "{{text}}". Use one plain-English label driven by context.',
        },
      },
      create(context) {
        return {
          JSXText(node) {
            const text = node.value?.trim();
            if (text && SLASH_LABEL_RE.test(text) && !text.includes('http')) {
              context.report({ node, messageId: 'slashLabel', data: { text } });
            }
          },
          JSXAttribute(node) {
            if (!LABEL_PROPS.has(node.name?.name)) return;
            const value = getStaticString(node.value);
            if (value && SLASH_LABEL_RE.test(value) && !value.includes('http')) {
              context.report({ node, messageId: 'slashLabel', data: { text: value } });
            }
          },
        };
      },
    },

    'no-raw-html-controls': {
      meta: {
        type: 'suggestion',
        messages: {
          rawControl: 'Use shadcn/ui components from @/components/ui/ instead of raw <{{tag}}>.',
        },
      },
      create(context) {
        const filename = (context.filename || '').replace(/\\/g, '/');
        if (filename.includes('/components/ui/')) return {};
        return {
          JSXOpeningElement(node) {
            const name = node.name?.name;
            if (typeof name === 'string' && RAW_CONTROLS.has(name)) {
              context.report({ node, messageId: 'rawControl', data: { tag: name } });
            }
          },
        };
      },
    },

    'no-unpaired-outline-none': {
      meta: {
        type: 'suggestion',
        messages: {
          unpairedOutlineNone: 'Never use outline-none without pairing focus-visible:ring-* for keyboard accessibility.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            if (/\b(?:focus:)?outline-none\b/.test(value) && !value.includes('focus-visible:ring-')) {
              context.report({ node, messageId: 'unpairedOutlineNone' });
            }
          },
        };
      },
    },

    'require-reduced-motion-safe': {
      meta: {
        type: 'suggestion',
        messages: {
          missingReducedMotion: 'Ensure animations respect prefers-reduced-motion (use motion-safe:/motion-reduce: or MotionConfig/useReducedMotion).',
        },
      },
      create(context) {
        let hasMotionSafety = false;
        const motionNodes = [];
        return {
          ImportDeclaration(node) {
            const text = context.sourceCode.getText(node);
            if (text.includes('MotionConfig') || text.includes('useReducedMotion') || text.includes('AppMotionProvider')) {
              hasMotionSafety = true;
            }
          },
          JSXAttribute(node) {
            if (node.name?.name !== 'className') return;
            const value = getStaticString(node.value);
            if (!value) return;
            if (/(?:^|\s)animate-[^\s]+/.test(value) && !value.includes('motion-reduce:') && !value.includes('motion-safe:')) {
              context.report({ node, messageId: 'missingReducedMotion' });
            }
          },
          JSXOpeningElement(node) {
            if (node.name?.type === 'JSXMemberExpression' && node.name.object?.name === 'motion') {
              motionNodes.push(node);
            }
          },
          'Program:exit'() {
            if (!hasMotionSafety) {
              for (const node of motionNodes) {
                context.report({ node, messageId: 'missingReducedMotion' });
              }
            }
          },
        };
      },
    },
  },
};
