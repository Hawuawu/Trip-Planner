import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import { ListControls } from './ListControls';

function setup(overrides: Partial<React.ComponentProps<typeof ListControls>> = {}) {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    searchPlaceholder: 'Search…',
    allTags: ['food', 'must-see'],
    selectedTags: [] as string[],
    onToggleTag: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<ListControls {...props} />);
  return props;
}

describe('ListControls', () => {
  it('is collapsed by default — the search input is not visible', () => {
    setup();
    expect(screen.getByPlaceholderText('Search…')).not.toBeVisible();
  });

  it('expands to show the search input and tag chips when the toggle is clicked', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /show search and filters/i }));
    expect(screen.getByPlaceholderText('Search…')).toBeVisible();
    expect(screen.getByText('food')).toBeVisible();
    expect(screen.getByText('must-see')).toBeVisible();
  });

  it('calls onSearchChange when typing in the search box', async () => {
    const onSearchChange = vi.fn();
    setup({ onSearchChange });
    await userEvent.click(screen.getByRole('button', { name: /show search and filters/i }));
    await userEvent.type(screen.getByPlaceholderText('Search…'), 'a');
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('calls onToggleTag when a tag chip is clicked', async () => {
    const onToggleTag = vi.fn();
    setup({ onToggleTag });
    await userEvent.click(screen.getByRole('button', { name: /show search and filters/i }));
    await userEvent.click(screen.getByText('food'));
    expect(onToggleTag).toHaveBeenCalledWith('food');
  });

  it('shows a count badge next to the toggle when tags are selected', () => {
    setup({ selectedTags: ['food'] });
    expect(screen.getByText(/search & filter \(1\)/i)).toBeInTheDocument();
  });

  it('omits the tag row entirely when there are no tags to filter by', async () => {
    setup({ allTags: [] });
    await userEvent.click(screen.getByRole('button', { name: /show search and filters/i }));
    expect(screen.queryByText('food')).not.toBeInTheDocument();
  });
});
