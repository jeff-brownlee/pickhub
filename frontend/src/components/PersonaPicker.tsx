// src/components/PersonaPicker.tsx
import { MenuItem, TextField } from '@mui/material';
import type { Persona } from '../types';

export default function PersonaPicker({
  personas,
  value,
  onChange,
}: {
  personas: Persona[];
  value: string;
  onChange: (id: string) => void;
}) {
  const hasOption = personas.some((x) => x.id === value);
  const safeValue = hasOption ? value : '';
  return (
    <TextField
      size="small"
      select
      label="Analyst"
      value={safeValue}
      disabled={personas.length === 0}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 160 }}
      SelectProps={{
        displayEmpty: true,
        renderValue: (v) => {
          const p = personas.find((x) => x.id === v);
          return p ? p.name : 'Select analyst';
        },
      }}
    >
      {personas.map((p) => (
        <MenuItem key={p.id} value={p.id}>
          {p.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
