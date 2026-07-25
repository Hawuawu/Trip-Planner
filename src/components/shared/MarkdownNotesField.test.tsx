import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/helpers';
import { MarkdownNotesField } from './MarkdownNotesField';

function setup(overrides: Partial<React.ComponentProps<typeof MarkdownNotesField>> = {}) {
  const props = {
    label: 'Notes',
    value: '',
    onChange: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<MarkdownNotesField {...props} />);
  return props;
}

function getEditor() {
  return screen.getByRole('textbox', { name: 'Notes' });
}

function ControlledWrapper({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <MarkdownNotesField label="Notes" value={value} onChange={setValue} />
      <button onClick={() => setValue('**second version**')}>External update</button>
    </>
  );
}

describe('MarkdownNotesField', () => {
  it('renders the toolbar with accessible bold/italic/list/link buttons', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
  });

  it('parses and renders the initial markdown value as rich content', () => {
    setup({ value: 'this is **bold** and a [link](https://example.com)' });
    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a markdown list as real <ul><li> elements', () => {
    setup({ value: '- first\n- second' });
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(screen.getByText('first').closest('li')).not.toBeNull();
  });

  it('updates rendered content when the value prop changes externally', () => {
    renderWithProviders(<ControlledWrapper initial="first version" />);
    expect(screen.getByText('first version')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'External update' }));
    const strong = screen.getByText('second version');
    expect(strong.tagName).toBe('STRONG');
  });

  it('passes inputProps through to the editor root element', () => {
    setup({ value: 'hi', inputProps: { 'data-testid': 'booking-notes' } });
    expect(screen.getByTestId('booking-notes')).toBeInTheDocument();
  });

  it('opens a URL popover when the Link button is clicked', async () => {
    setup({ value: 'hello' });
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(await screen.findByRole('textbox', { name: 'URL' })).toBeInTheDocument();
  });

  it('calls onChange with the updated markdown when text is pasted into the editor', () => {
    const onChange = vi.fn();
    setup({ onChange, value: '' });
    const editorEl = getEditor();
    fireEvent.focus(editorEl);
    fireEvent.paste(editorEl, {
      clipboardData: {
        getData: (fmt: string) => (fmt === 'text/plain' ? 'hello world' : ''),
      },
    });
    expect(onChange).toHaveBeenCalled();
  });
});
