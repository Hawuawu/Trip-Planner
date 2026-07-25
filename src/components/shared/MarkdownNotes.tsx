import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface Props {
  notes: string;
  variant?: 'body2' | 'caption';
  sx?: SxProps<Theme>;
}

export function MarkdownNotes({ notes, variant = 'body2', sx }: Props) {
  return (
    <Box
      sx={[
        {
          typography: variant,
          color: 'text.secondary',
          '& p, & ul, & ol, & blockquote, & pre': { m: 0 },
          '& p + p': { mt: 0.5 },
          '& ul, & ol': { pl: 2.5 },
          '& code': { fontSize: '0.9em' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {notes}
      </ReactMarkdown>
    </Box>
  );
}
