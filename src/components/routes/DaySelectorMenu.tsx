import { Popover, Box } from '@mui/material';
import { useTripStore } from '../../store/tripStore';
import { enumerateDays } from '../../utils/date';
import { DayChipRow } from './DayChipRow';

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function DaySelectorMenu({ anchorEl, onClose }: Props) {
  const trip = useTripStore((s) => s.trip);
  const selectedDay = useTripStore((s) => s.selectedDay);
  const selectDay = useTripStore((s) => s.selectDay);

  if (!trip) return null;

  const days = enumerateDays(trip.dateRange.start, trip.dateRange.end);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, maxWidth: 320 }}>
        <DayChipRow
          days={days}
          selected={selectedDay ? [selectedDay] : []}
          onChange={(newDays) => {
            selectDay(newDays[0] ?? null);
            onClose();
          }}
          multiple={false}
        />
      </Box>
    </Popover>
  );
}
