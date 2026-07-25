import { useEffect, useState } from 'react';
import type { MouseEvent, KeyboardEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Box, IconButton, Popover, TextField, Button, Stack, Typography } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';

interface Props {
  label: string;
  value: string;
  onChange(value: string): void;
  inputProps?: object;
}

export function MarkdownNotesField({ label, value, onChange, inputProps }: Props) {
  const [, forceRender] = useState(0);
  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
        strike: false,
        link: {
          autolink: true,
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
      Markdown.configure({ html: false, tightLists: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    onTransaction: () => {
      forceRender((n) => n + 1);
    },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        ...inputProps,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  function openLinkPopover(e: MouseEvent<HTMLElement>) {
    setLinkUrl(editor.getAttributes('link').href ?? '');
    setLinkAnchor(e.currentTarget);
  }

  function applyLink() {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkAnchor(null);
  }

  function handleLinkKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyLink();
    }
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          '&:focus-within': { borderColor: 'primary.main' },
        }}
      >
        <Stack direction="row" spacing={0.25} sx={{ px: 0.5, pt: 0.5 }}>
          <IconButton
            size="small"
            aria-label="Bold"
            color={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Italic"
            color={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Bullet list"
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Numbered list"
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Link"
            color={editor.isActive('link') ? 'primary' : 'default'}
            onClick={openLinkPopover}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            minHeight: 56,
            fontSize: '0.875rem',
            '& p': { m: 0 },
            '& ul, & ol': { m: 0, pl: 2.5 },
            '& a': { color: 'primary.main' },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
      <Popover
        open={Boolean(linkAnchor)}
        anchorEl={linkAnchor}
        onClose={() => setLinkAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack direction="row" spacing={1} onKeyDown={handleLinkKeyDown} sx={{ p: 1.5 }}>
          <TextField
            size="small"
            label="URL"
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Button onClick={applyLink}>Apply</Button>
        </Stack>
      </Popover>
    </Box>
  );
}
