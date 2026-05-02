import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown + LaTeX content. The single source of math + content rendering
 * across the app. Authors use `$...$` for inline and `$$...$$` for block math.
 *
 * The host app must import KaTeX styles once (e.g. in the root layout):
 *   import 'katex/dist/katex.min.css';
 */
export function Markdown({ content, className }: MarkdownProps): React.ReactElement {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore', output: 'html' }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
