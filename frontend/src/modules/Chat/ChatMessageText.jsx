import React from 'react';

const BULLET_LINE_PATTERN = /^(?:[-*•]|\d+\.)\s+(.+)$/;
const INLINE_BOLD_PATTERN = /(\*\*(?:(?!\*\*).)+\*\*)/g;

/**
 * Render inline **bold** spans safely as React elements while keeping all
 * other characters (including HTML/script tags) as literal text nodes.
 *
 * @param {string} text
 * @returns {Array<string | React.ReactElement>}
 */
function renderInlineBold(text) {
  return text.split(INLINE_BOLD_PATTERN).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
      return (
        <strong key={index} className="font-semibold text-[#1E293B]">
          {segment.slice(2, -2)}
        </strong>
      );
    }
    return segment;
  });
}

/**
 * Parse plain-text assistant content into paragraph and bullet list blocks.
 *
 * @param {string} rawText
 * @returns {Array<{ type: 'paragraph', lines: string[] } | { type: 'list', items: string[] }>}
 */
function parseMessageBlocks(rawText) {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let currentBlock = null;

  const flushBlock = () => {
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushBlock();
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_LINE_PATTERN);
    if (bulletMatch) {
      if (currentBlock?.type !== 'list') {
        flushBlock();
        currentBlock = { type: 'list', items: [] };
      }
      currentBlock.items.push(bulletMatch[1]);
    } else {
      if (currentBlock?.type !== 'paragraph') {
        flushBlock();
        currentBlock = { type: 'paragraph', lines: [] };
      }
      currentBlock.lines.push(trimmed);
    }
  }

  flushBlock();
  return blocks;
}

/**
 * Pure React chat message text renderer.
 * Supports paragraphs, bullet/numbered lists, and inline **bold** spans
 * with zero dangerouslySetInnerHTML usage.
 */
export function ChatMessageText({ text }) {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const blocks = parseMessageBlocks(text);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed break-words">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'list') {
          return (
            <ul key={blockIndex} className="list-disc pl-4 flex flex-col gap-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineBold(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-line">
            {renderInlineBold(block.lines.join('\n'))}
          </p>
        );
      })}
    </div>
  );
}

export default ChatMessageText;
