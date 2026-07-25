import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Drawer,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTripStore } from '../../store/tripStore';
import { AlternativeItem } from './AlternativeItem';
import { AlternativeForm } from './AlternativeForm';
import { ListControls } from '../shared/ListControls';
import { collectAllTags, matchesAnyTag } from '../../utils/tags';
import type { Alternative } from '../../types';

interface Props {
  openAddSignal?: number;
  prefill?: Partial<Omit<Alternative, 'id'>> | null;
  onSaved?: (message: string) => void;
}

export function AlternativesShelf({ openAddSignal, prefill, onSaved }: Props) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    checkpoints,
    alternatives,
    addAlternative,
    updateAlternative,
    deleteAlternative,
    promoteAlternative,
    undoAlternative,
    undoDeleteAlternative,
    clearUndoAlternative,
  } = useTripStore();

  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promoteId, setPromoteId] = useState<string | null>(null);
  const [promoteTime, setPromoteTime] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState<Partial<Omit<Alternative, 'id'>> | undefined>(
    undefined
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const promoting = alternatives.find((a) => a.id === promoteId);
  const editing = editingId ? alternatives.find((a) => a.id === editingId) : null;

  // Read via a ref so a fresh `prefill` value doesn't need to be listed as an
  // effect dependency — only a new openAddSignal should (re)open the drawer.
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  useEffect(() => {
    if (openAddSignal === undefined) return;
    setAddPrefill(prefillRef.current ?? undefined);
    setAddOpen(true);
  }, [openAddSignal]);

  const allTags = useMemo(
    () => collectAllTags(checkpoints, alternatives),
    [checkpoints, alternatives]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alternatives.filter((a) => {
      const matchesSearch =
        !q || [a.name, a.location?.label, a.notes].some((f) => f?.toLowerCase().includes(q));
      return matchesSearch && matchesAnyTag(a.tags, selectedTags);
    });
  }, [alternatives, search, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handlePromote() {
    if (!promoteId || !promoteTime) return;
    promoteAlternative(promoteId, new Date(promoteTime).toISOString());
    setPromoteId(null);
    setPromoteTime('');
  }

  const drawerContent = addOpen ? (
    <AlternativeForm
      title="Add alternative"
      initial={addPrefill}
      existingTags={allTags}
      onSave={(data) => {
        addAlternative(data);
        setAddOpen(false);
        setAddPrefill(undefined);
        onSaved?.(`Alternative "${data.name}" added.`);
      }}
      onCancel={() => {
        setAddOpen(false);
        setAddPrefill(undefined);
      }}
    />
  ) : editing ? (
    <AlternativeForm
      title="Edit alternative"
      initial={editing}
      existingTags={allTags}
      onSave={(data) => {
        updateAlternative(editing.id, data);
        setEditingId(null);
        onSaved?.(`Alternative "${data.name}" updated.`);
      }}
      onCancel={() => setEditingId(null)}
    />
  ) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {alternatives.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 2,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6">No alternatives yet</Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              setAddPrefill(undefined);
              setAddOpen(true);
            }}
          >
            Add alternative
          </Button>
        </Box>
      ) : (
        <>
          <ListControls
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search alternatives…"
            allTags={allTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />

          <Box sx={{ px: 2, pb: 2, flex: 1 }}>
            {filtered.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: 'center' }}
              >
                No alternatives match "{search}".
              </Typography>
            ) : (
              filtered.map((alt) => (
                <AlternativeItem
                  key={alt.id}
                  alternative={alt}
                  onSelect={() => setEditingId(alt.id)}
                  onPromote={() => setPromoteId(alt.id)}
                  onDelete={() => deleteAlternative(alt.id)}
                />
              ))
            )}
          </Box>
        </>
      )}

      <Drawer
        anchor={isPhone ? 'bottom' : 'right'}
        open={!!(addOpen || editing)}
        onClose={() => {
          setAddOpen(false);
          setEditingId(null);
        }}
        PaperProps={{
          sx: {
            width: isPhone ? '100%' : 380,
            borderTopLeftRadius: isPhone ? 12 : 0,
            borderTopRightRadius: isPhone ? 12 : 0,
            maxHeight: isPhone ? '85vh' : '100vh',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Promote dialog */}
      <Dialog open={!!promoteId} onClose={() => setPromoteId(null)}>
        <DialogTitle>Add "{promoting?.name}" to timeline</DialogTitle>
        <DialogContent>
          <TextField
            label="Start time"
            type="datetime-local"
            value={promoteTime}
            onChange={(e) => setPromoteTime(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteId(null)}>Cancel</Button>
          <Button onClick={handlePromote} variant="contained" disabled={!promoteTime}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!undoAlternative}
        message={`Deleted "${undoAlternative?.name}"`}
        autoHideDuration={4000}
        onClose={clearUndoAlternative}
        action={
          <Button color="secondary" size="small" onClick={undoDeleteAlternative}>
            UNDO
          </Button>
        }
      />
    </Box>
  );
}
