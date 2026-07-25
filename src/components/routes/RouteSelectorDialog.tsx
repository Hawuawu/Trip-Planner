import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTripStore } from '../../store/tripStore';
import type { Route } from '../../types';
import { enumerateDays, localDayKey } from '../../utils/date';
import { DayChipRow } from './DayChipRow';
import { CheckpointPicker } from './CheckpointPicker';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export function RouteSelectorDialog({ open, onClose, onSaved }: Props) {
  const trip = useTripStore((s) => s.trip);
  const checkpoints = useTripStore((s) => s.checkpoints);
  const routes = useTripStore((s) => s.routes);
  const selectedRouteId = useTripStore((s) => s.selectedRouteId);
  const selectRoute = useTripStore((s) => s.selectRoute);
  const addRoute = useTripStore((s) => s.addRoute);
  const updateRoute = useTripStore((s) => s.updateRoute);
  const deleteRoute = useTripStore((s) => s.deleteRoute);

  const [editingRoute, setEditingRoute] = useState<Route | 'new' | null>(null);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState<string[]>([]);
  const [formCheckpointIds, setFormCheckpointIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!trip) return null;

  const days = enumerateDays(trip.dateRange.start, trip.dateRange.end);

  function startEdit(route: Route | 'new') {
    setEditingRoute(route);
    setFormName(route === 'new' ? '' : route.name);
    setFormDays(route === 'new' ? [] : route.days);
    setFormCheckpointIds(route === 'new' ? [] : route.checkpointIds);
    setSaveError(null);
  }

  function handleSelectRoute(routeId: string | null) {
    selectRoute(routeId);
    onClose();
  }

  async function handleSave() {
    if (!editingRoute || !formName.trim()) return;
    const wasNew = editingRoute === 'new';
    const name = formName.trim();
    setSaving(true);
    setSaveError(null);
    try {
      if (wasNew) {
        await addRoute({ name, days: formDays, checkpointIds: formCheckpointIds });
      } else {
        await updateRoute(editingRoute.id, {
          name,
          days: formDays,
          checkpointIds: formCheckpointIds,
        });
      }
      setEditingRoute(null);
      onSaved?.(wasNew ? `Route "${name}" created.` : `Route "${name}" updated.`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save route.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRoute(deleteTarget.id);
      setDeleteTarget(null);
      setEditingRoute(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete route.');
      setDeleteTarget(null);
    }
  }

  const pickerCheckpoints = checkpoints.filter((cp) =>
    formDays.includes(localDayKey(cp.startTime))
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Select route</DialogTitle>
        <DialogContent>
          {editingRoute === null ? (
            <>
              <List dense data-testid="route-list">
                <ListItem disablePadding>
                  <ListItemButton
                    selected={!selectedRouteId}
                    onClick={() => handleSelectRoute(null)}
                  >
                    <ListItemText primary="Default route" />
                  </ListItemButton>
                </ListItem>
                {routes.map((route) => (
                  <ListItem key={route.id} disablePadding>
                    <ListItemButton
                      selected={route.id === selectedRouteId}
                      onClick={() => handleSelectRoute(route.id)}
                    >
                      <ListItemText
                        primary={route.name}
                        secondary={`${route.days.length} day(s)`}
                      />
                    </ListItemButton>
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        aria-label={`Edit ${route.name}`}
                        onClick={() => startEdit(route)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Button sx={{ mt: 1 }} onClick={() => startEdit('new')}>
                + Create new route
              </Button>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {saveError && <Alert severity="error">{saveError}</Alert>}

              <TextField
                label="Route name"
                size="small"
                fullWidth
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Days
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <DayChipRow days={days} selected={formDays} onChange={setFormDays} multiple />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Checkpoints
                </Typography>
                {formDays.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Choose at least one day to pick checkpoints.
                  </Typography>
                ) : (
                  <CheckpointPicker
                    checkpoints={pickerCheckpoints}
                    selectedIds={formCheckpointIds}
                    onChange={setFormCheckpointIds}
                  />
                )}
              </Box>

              {editingRoute !== 'new' && (
                <Button
                  color="error"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => setDeleteTarget(editingRoute)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Delete route
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editingRoute !== null ? (
            <>
              <Button onClick={() => setEditingRoute(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleSave()}
                disabled={saving || !formName.trim()}
              >
                Save
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete route</DialogTitle>
        <DialogContent>
          <DialogContentText>Delete {deleteTarget?.name}? This can't be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={() => void handleConfirmDelete()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
