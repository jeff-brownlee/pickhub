// src/components/WeekSelector.tsx
import { IconButton, Stack, TextField } from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';

export default function WeekSelector({
  week,
  setWeek,
  maxWeek = 18,
}: {
  week: number;
  setWeek: (w: number) => void;
  maxWeek?: number;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(maxWeek, n));
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <IconButton onClick={() => setWeek(clamp(week - 1))} disabled={week <= 1}>
        <ChevronLeftRounded />
      </IconButton>
      <TextField
        size="small"
        label="Week"
        type="number"
        value={week}
        onChange={(e) => setWeek(clamp(parseInt(e.target.value || '1', 10)))}
        sx={{ width: 80 }}
        inputProps={{ min: 1, max: maxWeek }}
      />
      <IconButton onClick={() => setWeek(clamp(week + 1))} disabled={week >= maxWeek}>
        <ChevronRightRounded />
      </IconButton>
    </Stack>
  );
}
