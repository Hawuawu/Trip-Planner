import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MapView } from './MapView';
import { renderWithProviders, resetStores } from '../../test/helpers';
import { useTripStore } from '../../store/tripStore';
import type { Checkpoint, Alternative } from '../../types';
import { getPoiAtPoint } from './poi';

const mockedGetPoiAtPoint = vi.mocked(getPoiAtPoint);

const easeTo = vi.fn();
const jumpTo = vi.fn();
const zoomIn = vi.fn();
const zoomOut = vi.fn();
const getZoom = vi.fn(() => 10);

vi.mock('./poi', () => ({ getPoiAtPoint: vi.fn() }));

vi.mock('react-map-gl/maplibre', () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: (e: unknown) => void;
  }) => (
    <div data-testid="map" onClick={() => onClick?.({})}>
      {children}
    </div>
  ),
  AttributionControl: () => <div data-testid="attribution-control" />,
  Source: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="source">{children}</div>
  ),
  Layer: () => <div data-testid="layer" />,
  Marker: ({ children, onClick }: { children: React.ReactNode; onClick: (e: unknown) => void }) => (
    <button data-testid="marker" onClick={(e) => onClick({ originalEvent: e })}>
      {children}
    </button>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ current: { easeTo, jumpTo, zoomIn, zoomOut, getZoom } }),
}));

function makeCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: 'cp-1',
    type: 'poi',
    name: 'Fushimi Inari',
    startTime: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    location: { lat: 34.9, lng: 135.77 },
    ...overrides,
  };
}

beforeEach(() => {
  resetStores();
  easeTo.mockClear();
  jumpTo.mockClear();
  zoomIn.mockClear();
  zoomOut.mockClear();
  getZoom.mockClear();
  mockedGetPoiAtPoint.mockReset();
});

describe('MapView', () => {
  it('renders a marker only for checkpoints that have a location', () => {
    useTripStore.setState({
      checkpoints: [makeCheckpoint({ id: 'a' }), makeCheckpoint({ id: 'b', location: undefined })],
    });

    renderWithProviders(<MapView />);
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
  });

  it('renders no route source data when fewer than two checkpoints have a location', () => {
    useTripStore.setState({ checkpoints: [makeCheckpoint({ id: 'a' })] });
    renderWithProviders(<MapView />);
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
  });

  it('toggles the base-layer switcher open and closed', () => {
    renderWithProviders(<MapView />);

    expect(screen.queryByText('Base layer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Toggle layer selector'));
    expect(screen.getByText('Base layer')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Toggle layer selector'));
    expect(screen.queryByText('Base layer')).not.toBeInTheDocument();
  });

  it('switches the map style when a different base layer is selected', () => {
    renderWithProviders(<MapView />);

    fireEvent.click(screen.getByLabelText('Toggle layer selector'));
    fireEvent.click(screen.getByText('Bright'));

    // Selecting a style closes the switcher again.
    expect(screen.queryByText('Base layer')).not.toBeInTheDocument();
  });

  it('eases the map to the selected checkpoint location', () => {
    useTripStore.setState({
      checkpoints: [makeCheckpoint({ id: 'a', location: { lat: 34.9, lng: 135.77 } })],
      selectedId: 'a',
    });

    renderWithProviders(<MapView />);
    expect(easeTo).toHaveBeenCalledWith({ center: [135.77, 34.9], zoom: 15, duration: 300 });
  });

  it('does not ease the map when no checkpoint is selected', () => {
    useTripStore.setState({ checkpoints: [makeCheckpoint({ id: 'a' })], selectedId: null });
    renderWithProviders(<MapView />);
    expect(easeTo).not.toHaveBeenCalled();
  });

  it('toggles selection when a marker is clicked', () => {
    useTripStore.setState({ checkpoints: [makeCheckpoint({ id: 'a' })], selectedId: null });
    renderWithProviders(<MapView />);

    fireEvent.click(screen.getByTestId('marker'));
    expect(useTripStore.getState().selectedId).toBe('a');

    fireEvent.click(screen.getByTestId('marker'));
    expect(useTripStore.getState().selectedId).toBeNull();
  });

  it('renders the orientation ball and zoom controls', () => {
    renderWithProviders(<MapView />);
    expect(screen.getByRole('img', { name: /bearing and pitch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
  });

  it('calls onPoiSelected when a click resolves to a POI', () => {
    mockedGetPoiAtPoint.mockReturnValue({
      name: 'Sensō-ji',
      location: { lat: 35.71, lng: 139.79 },
    });
    const onPoiSelected = vi.fn();
    renderWithProviders(<MapView onPoiSelected={onPoiSelected} />);

    fireEvent.click(screen.getByTestId('map'));

    expect(onPoiSelected).toHaveBeenCalledWith({
      name: 'Sensō-ji',
      location: { lat: 35.71, lng: 139.79 },
    });
  });

  it('does not call onPoiSelected when a click does not resolve to a POI', () => {
    mockedGetPoiAtPoint.mockReturnValue(null);
    const onPoiSelected = vi.fn();
    renderWithProviders(<MapView onPoiSelected={onPoiSelected} />);

    fireEvent.click(screen.getByTestId('map'));

    expect(onPoiSelected).not.toHaveBeenCalled();
  });

  describe('day / route filtering', () => {
    it('renders markers only for checkpoints on the selected day', () => {
      useTripStore.setState({
        checkpoints: [
          makeCheckpoint({ id: 'a', startTime: '2026-09-05T09:00:00.000Z' }),
          makeCheckpoint({ id: 'b', startTime: '2026-09-06T09:00:00.000Z' }),
        ],
        selectedDay: '2026-09-05',
      });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it("renders markers only for a selected route's checkpointIds", () => {
      useTripStore.setState({
        checkpoints: [makeCheckpoint({ id: 'a' }), makeCheckpoint({ id: 'b' })],
        routes: [
          {
            id: 'route-1',
            name: 'Nature route',
            days: ['2026-09-05'],
            checkpointIds: ['a'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        selectedRouteId: 'route-1',
      });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('renders all located checkpoints when no day or route is selected', () => {
      useTripStore.setState({
        checkpoints: [
          makeCheckpoint({ id: 'a', startTime: '2026-09-05T09:00:00.000Z' }),
          makeCheckpoint({ id: 'b', startTime: '2026-09-06T09:00:00.000Z' }),
        ],
      });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });
  });

  describe('alternatives layer', () => {
    function makeAlternative(overrides: Partial<Alternative> = {}): Alternative {
      return {
        id: 'alt-1',
        type: 'poi',
        name: 'Backup Shrine',
        location: { lat: 34.9, lng: 135.77 },
        ...overrides,
      };
    }

    it('renders the "Show alternatives" switch checked by default', () => {
      renderWithProviders(<MapView />);
      fireEvent.click(screen.getByLabelText('Toggle layer selector'));
      expect(screen.getByRole('checkbox', { name: /show alternatives/i })).toBeChecked();
    });

    it('renders alternative markers by default', () => {
      useTripStore.setState({ alternatives: [makeAlternative()] });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('hides alternative markers when the switch is toggled off, and shows them again when toggled back on', () => {
      useTripStore.setState({ alternatives: [makeAlternative()] });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);

      fireEvent.click(screen.getByLabelText('Toggle layer selector'));
      fireEvent.click(screen.getByRole('checkbox', { name: /show alternatives/i }));
      expect(screen.queryAllByTestId('marker')).toHaveLength(0);

      fireEvent.click(screen.getByRole('checkbox', { name: /show alternatives/i }));
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('remembers the switch state across remounts (store-backed, not component-local)', () => {
      const { unmount } = renderWithProviders(<MapView />);
      fireEvent.click(screen.getByLabelText('Toggle layer selector'));
      fireEvent.click(screen.getByRole('checkbox', { name: /show alternatives/i }));
      expect(useTripStore.getState().showAlternativesOnMap).toBe(false);
      unmount();

      renderWithProviders(<MapView />);
      fireEvent.click(screen.getByLabelText('Toggle layer selector'));
      expect(screen.getByRole('checkbox', { name: /show alternatives/i })).not.toBeChecked();
    });

    it('skips alternatives without a location', () => {
      useTripStore.setState({
        alternatives: [
          makeAlternative({ id: 'a' }),
          makeAlternative({ id: 'b', location: undefined }),
        ],
      });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('narrows rendered alternatives to match the store search/tag filter', () => {
      useTripStore.setState({
        alternatives: [
          makeAlternative({ id: 'a', name: 'Backup Shrine' }),
          makeAlternative({ id: 'b', name: 'Other Spot' }),
        ],
        alternativesSearchFilter: 'shrine',
      });
      renderWithProviders(<MapView />);
      expect(screen.getAllByTestId('marker')).toHaveLength(1);
    });

    it('eases and zooms the map to the selected alternative location', () => {
      useTripStore.setState({
        alternatives: [makeAlternative({ id: 'alt-1', location: { lat: 35.0, lng: 135.75 } })],
        selectedAlternativeId: 'alt-1',
      });

      renderWithProviders(<MapView />);
      expect(easeTo).toHaveBeenCalledWith({ center: [135.75, 35.0], zoom: 15, duration: 300 });
    });

    it('does not ease the map when no alternative is selected', () => {
      useTripStore.setState({
        alternatives: [makeAlternative()],
        selectedAlternativeId: null,
      });
      renderWithProviders(<MapView />);
      expect(easeTo).not.toHaveBeenCalled();
    });

    it('does not zoom out when already zoomed in past the focus level', () => {
      getZoom.mockReturnValue(18);
      useTripStore.setState({
        checkpoints: [makeCheckpoint({ id: 'a', location: { lat: 34.9, lng: 135.77 } })],
        selectedId: 'a',
      });

      renderWithProviders(<MapView />);
      expect(easeTo).toHaveBeenCalledWith({ center: [135.77, 34.9], zoom: 18, duration: 300 });
    });
  });
});
