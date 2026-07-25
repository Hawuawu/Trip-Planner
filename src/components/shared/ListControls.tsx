import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Chip,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getTagColor } from '../../utils/tagColors';

interface Props {
  search: string;
  onSearchChange(value: string): void;
  searchPlaceholder: string;
  allTags: string[];
  selectedTags: string[];
  onToggleTag(tag: string): void;
}

export function ListControls({
  search,
  onSearchChange,
  searchPlaceholder,
  allTags,
  selectedTags,
  onToggleTag,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ px: 2, pt: 2, pb: expanded ? 1 : 0 }}>
      <Box
        role="button"
        aria-label={expanded ? 'Hide search and filters' : 'Show search and filters'}
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          color: 'text.secondary',
        }}
      >
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption">
          Search & filter{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ pt: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {allTags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
              {allTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                const color = getTagColor(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    clickable
                    onClick={() => onToggleTag(tag)}
                    sx={{
                      bgcolor: color.bg,
                      color: color.fg,
                      opacity: selected ? 1 : 0.55,
                      fontWeight: selected ? 700 : 400,
                      border: selected ? '2px solid' : '2px solid transparent',
                      borderColor: selected ? 'text.primary' : 'transparent',
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
