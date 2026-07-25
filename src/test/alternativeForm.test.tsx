import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlternativeForm } from '../components/alternatives/AlternativeForm';
import { renderWithProviders } from './helpers';

const { convertMock } = vi.hoisted(() => ({ convertMock: vi.fn() }));

vi.mock('@sglkc/kuroshiro', () => ({
  default: vi.fn().mockImplementation(function KuroshiroMock() {
    return {
      init: vi.fn().mockResolvedValue(undefined),
      convert: convertMock,
    };
  }),
}));

vi.mock('@sglkc/kuroshiro-analyzer-kuromoji', () => ({
  default: vi.fn().mockImplementation(function KuromojiAnalyzerMock() {
    return {};
  }),
}));

function getNameInput() {
  return screen.getByRole('textbox', { name: 'Name' });
}

function getWebsiteInput() {
  return screen.getByRole('textbox', { name: /website/i });
}

function getNotesInput() {
  return screen.getByRole('textbox', { name: /notes/i });
}

// The notes field is a Tiptap rich-text editor (contenteditable), not a plain
// <textarea> — fireEvent.change doesn't apply. Paste events are the one input
// mechanism ProseMirror handles reliably under jsdom.
function pasteIntoNotes(text: string) {
  const notesInput = getNotesInput();
  fireEvent.focus(notesInput);
  fireEvent.paste(notesInput, {
    clipboardData: { getData: (fmt: string) => (fmt === 'text/plain' ? text : '') },
  });
}

describe('AlternativeForm Google Maps / Search links and website field', () => {
  it('hides the Maps and Search links when name and location are both empty', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /google maps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /google search/i })).not.toBeInTheDocument();
  });

  it('Maps link uses the name as a fallback query when no location is set', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'Fushimi Inari' } });
    const link = screen.getByRole('link', { name: /google maps/i });
    expect(link.getAttribute('href')).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Fushimi Inari')}`
    );
  });

  it('Search link reflects the live name and is absent when name is empty', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /google search/i })).not.toBeInTheDocument();
    fireEvent.change(getNameInput(), { target: { value: 'Ichiran Ramen' } });
    const link = screen.getByRole('link', { name: /google search/i });
    expect(link.getAttribute('href')).toBe(
      `https://www.google.com/search?q=${encodeURIComponent('Ichiran Ramen')}`
    );
  });

  it('pre-fills the website field from initial.websiteUrl', () => {
    renderWithProviders(
      <AlternativeForm
        initial={{ type: 'poi', name: 'Sensoji', websiteUrl: 'https://www.senso-ji.jp' }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(getWebsiteInput()).toHaveValue('https://www.senso-ji.jp');
  });

  it('round-trips websiteUrl through onSave, omitting it when blank', () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'No Website' } });
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].websiteUrl).toBeUndefined();
  });

  it('includes websiteUrl when the field has content', () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'With Website' } });
    fireEvent.change(getWebsiteInput(), { target: { value: 'https://example.com' } });
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].websiteUrl).toBe('https://example.com');
  });

  it('does not render a clickable "Visit website" link for a javascript: URL', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getWebsiteInput(), { target: { value: 'javascript:alert(1)' } });
    expect(screen.queryByRole('link', { name: /visit website/i })).not.toBeInTheDocument();
    expect(screen.getByText(/won't be clickable/i)).toBeInTheDocument();
  });

  it('renders a clickable "Visit website" link for a valid https URL', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getWebsiteInput(), { target: { value: 'https://example.com' } });
    const link = screen.getByRole('link', { name: /visit website/i });
    expect(link.getAttribute('href')).toBe('https://example.com');
  });
});

describe('AlternativeForm notes', () => {
  it('round-trips raw markdown through onSave', async () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'Markdown Alt' } });
    pasteIntoNotes('**bring cash**');
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].notes).toBe('**bring cash**');
  });

  it('renders bold markdown notes as a real element', async () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    pasteIntoNotes('**bring cash**');
    const strong = await screen.findByText('bring cash');
    expect(strong.tagName).toBe('STRONG');
  });
});

describe('AlternativeForm romanize affordance', () => {
  it('does not render when the name has no kanji', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'Narita Airport' } });
    expect(
      screen.queryByRole('button', { name: /insert romaji reading/i })
    ).not.toBeInTheDocument();
  });

  it('renders once the name contains kanji', () => {
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: '銀の鈴幼稚園' } });
    expect(screen.getByRole('button', { name: /insert romaji reading/i })).toBeInTheDocument();
  });

  it('appends the romaji reading directly into the Name field on click', async () => {
    convertMock.mockResolvedValueOnce('gin no suzu yōchien');
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: '銀の鈴幼稚園' } });
    fireEvent.click(screen.getByRole('button', { name: /insert romaji reading/i }));
    await waitFor(() => expect(getNameInput()).toHaveValue('銀の鈴幼稚園 (Gin-No-Suzu-Yōchien)'));
  });

  it('hides the insert button after the reading has been inserted', async () => {
    convertMock.mockResolvedValueOnce('gin no suzu yōchien');
    renderWithProviders(<AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: '銀の鈴幼稚園' } });
    fireEvent.click(screen.getByRole('button', { name: /insert romaji reading/i }));
    await waitFor(() => expect(getNameInput()).toHaveValue('銀の鈴幼稚園 (Gin-No-Suzu-Yōchien)'));
    expect(
      screen.queryByRole('button', { name: /insert romaji reading/i })
    ).not.toBeInTheDocument();
  });
});

describe('AlternativeForm tags', () => {
  it('pre-fills tags as chips from initial.tags', () => {
    renderWithProviders(
      <AlternativeForm
        initial={{ type: 'poi', name: 'Nishiki Market', tags: ['food'] }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('food')).toBeInTheDocument();
  });

  it('suggests existingTags in the tags input', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AlternativeForm onSave={vi.fn()} onCancel={vi.fn()} existingTags={['rainy-day']} />
    );
    await user.click(screen.getByRole('combobox', { name: /tags/i }));
    expect(screen.getByRole('option', { name: 'rainy-day' })).toBeInTheDocument();
  });

  it('includes newly typed tags in onSave, trimmed and deduped', () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'Tagged Alt' } });
    const tagsInput = screen.getByRole('combobox', { name: /tags/i });
    fireEvent.change(tagsInput, { target: { value: '  food  ' } });
    fireEvent.keyDown(tagsInput, { key: 'Enter' });
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].tags).toEqual(['food']);
  });

  it('includes a typed tag in onSave even without pressing Enter first', () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'Tagged Alt' } });
    const tagsInput = screen.getByRole('combobox', { name: /tags/i });
    fireEvent.change(tagsInput, { target: { value: 'food' } });
    // No Enter/blur to commit the chip — just submit directly, as a user
    // clicking Save straight after typing would.
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].tags).toEqual(['food']);
  });

  it('omits tags entirely when none are entered', () => {
    const onSave = vi.fn();
    renderWithProviders(<AlternativeForm onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(getNameInput(), { target: { value: 'No Tags' } });
    fireEvent.submit(document.querySelector('form')!);
    expect(onSave.mock.calls[0][0].tags).toBeUndefined();
  });
});
