import { BlockCommentNode, LineCommentNode } from "./util";

export function scanComments(text: string) {
  const comments: (LineCommentNode | BlockCommentNode)[] = [];

  for (let i = 0, lastI = -1, l = text.length; i < l; ) {
    /* IMPORTANT! You MUST ALWAYS increment i! */
    if (i <= lastI) {
      throw new Error(`Potential infinite loop! (${i} <= ${lastI})`);
    }
    lastI = i;

    const char = text[i];

    switch (char) {
      case '"':
      case "'": {
        // It's a string; drop it
        const end = text.indexOf(char, i + 1);
        if (end < 0) {
          throw new Error(
            `Invalid string, could not find terminator at position ${i}`,
          );
        }
        i = end + 1;
        break;
      }
      case "-": {
        // Could be a comment
        if (text[i + 1] === "-") {
          // Double dash -> comment -> scan to end of line
          const eol = text.indexOf("\n", i);
          const end = eol >= 0 ? eol : l;
          const lineComment: LineCommentNode = {
            LineComment: true,
            value: text.substr(i, end - i),
            start: i,
            end,
          };
          comments.push(lineComment);
          i = end + 1;
        } else {
          i++;
        }
        break;
      }
      case "/": {
        // Could be a block comment
        if (text[i + 1] === "*") {
          // It's a block comment!
          let start = i + 2;
          let depth = 1;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const open = text.indexOf("/*", start);
            const close = text.indexOf("*/", start);
            if (close < 0) {
              throw new Error(
                `Unclosed block comment, starting at position ${i}`,
              );
            }
            if (open >= 0 && open < close) {
              // We must go deeper
              start = open + 2;
              depth++;
            } else {
              start = close + 2;
              depth--;
            }
            if (depth === 0) {
              // We're done!
              const end = start - 1;
              const blockComment: BlockCommentNode = {
                BlockComment: true,
                value: text.substr(i, end - i),
                start: i,
                end,
              };
              comments.push(blockComment);
              i = end + 1;
            }
          }
        } else {
          i++;
        }
        break;
      }
      case "$": {
        // Could be a dollar quoted string constant

        // "The tag, if any, of a dollar-quoted string follows the same rules
        // as an unquoted identifier, except that it cannot contain a dollar
        // sign. Tags are case sensitive"
        const dollarTagRegexp = /\$[\w_][\w\d_]*\$|\$\$/i;
        const match = text.substr(i).match(dollarTagRegexp);
        if (match) {
          // It's a dollar quoted string constant; skip the entire string.
          const end = text.indexOf(match[0], i + match[0].length);
          if (end < 0) {
            throw new Error(
              `Invalid tagged string - no string terminator, starting at position ${i}`,
            );
          }
          i = end + 1;
        } else {
          i++;
        }
        break;
      }
      default: {
        i++;
      }
    }
  }
  return comments;
}
