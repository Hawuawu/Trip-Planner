import { Box, Chip } from '@mui/material';
import { formatDayLabel } from '../../utils/date';

interface Props {
  days: string[];
  selected: string[];
  onChange: (days: string[]) => void;
  multiple: boolean;
}

export function DayChipRow({ days, selected, onChange, multiple }: Props) {
  const allSelected = multiple
    ? days.length > 0 && days.every((d) => selected.includes(d))
    : selected.length === 0;

  function handleAllDaysClick() {
    if (multiple) {
      onChange(allSelected ? [] : days);
    } else {
      onChange([]);
    }
  }

  function handleDayClick(day: string) {
    if (multiple) {
      onChange(selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day]);
    } else {
      onChange([day]);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      <Chip
        label="All days"
        size="small"
        clickable
        color="primary"
        variant={allSelected ? 'filled' : 'outlined'}
        onClick={handleAllDaysClick}
      />
      {days.map((day) => {
        const isSelected = selected.includes(day);
        return (
          <Chip
            key={day}
            label={formatDayLabel(day)}
            size="small"
            clickable
            color="primary"
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => handleDayClick(day)}
          />
        );
      })}
    </Box>
  );
}
