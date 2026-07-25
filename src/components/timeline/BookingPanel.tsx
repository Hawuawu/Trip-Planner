import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useTripStore } from '../../store/tripStore';
import { MarkdownNotes } from '../shared/MarkdownNotes';
import { MarkdownNotesField } from '../shared/MarkdownNotesField';

interface Props {
  checkpointId: string;
  linkedBookingId?: string;
}

export function BookingPanel({ checkpointId, linkedBookingId }: Props) {
  const tripId = useTripStore((s) => s.tripId);
  const bookings = useTripStore((s) => s.bookings);
  const addBooking = useTripStore((s) => s.addBooking);
  const updateCheckpoint = useTripStore((s) => s.updateCheckpoint);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedBooking = linkedBookingId
    ? bookings.find((b) => b.id === linkedBookingId)
    : undefined;

  function handleOpenDialog() {
    setProvider('');
    setConfirmationNumber('');
    setNotes('');
    setError(null);
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
  }

  async function handleSubmit() {
    if (!provider.trim() || !confirmationNumber.trim()) return;
    if (!tripId) return;

    setSubmitting(true);
    setError(null);
    try {
      const newBooking = await addBooking({
        provider: provider.trim(),
        confirmationNumber: confirmationNumber.trim(),
        notes: notes.trim() || undefined,
      });
      await updateCheckpoint(checkpointId, { linkedBookingId: newBooking.id });
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveLink() {
    setError(null);
    try {
      await updateCheckpoint(checkpointId, { linkedBookingId: undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove booking link.');
    }
  }

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 0, pt: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <ReceiptLongIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Booking
          </Typography>
        </Stack>

        {linkedBooking ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {linkedBooking.provider}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {linkedBooking.confirmationNumber}
            </Typography>
            {linkedBooking.notes && (
              <MarkdownNotes
                notes={linkedBooking.notes}
                variant="caption"
                sx={{ display: 'block', mt: 0.5 }}
              />
            )}
            <Button size="small" color="error" onClick={handleRemoveLink} sx={{ mt: 1, px: 0 }}>
              Remove link
            </Button>
            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={handleOpenDialog}
            startIcon={<ReceiptLongIcon />}
          >
            Add booking
          </Button>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add booking</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
              size="small"
              fullWidth
              autoFocus
              inputProps={{ 'data-testid': 'booking-provider' }}
            />
            <TextField
              label="Confirmation number"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              required
              size="small"
              fullWidth
              inputProps={{ 'data-testid': 'booking-confirmation' }}
            />
            <MarkdownNotesField
              label="Notes (optional)"
              value={notes}
              onChange={setNotes}
              inputProps={{ 'data-testid': 'booking-notes' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !provider.trim() || !confirmationNumber.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
