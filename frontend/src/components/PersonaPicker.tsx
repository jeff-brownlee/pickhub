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
  return (
    <TextField
      size="small"
      select
      label="Analyst"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 160 }}
      SelectProps={{
        renderValue: (v) => {
          const p = personas.find((x) => x.id === v);
          return p ? p.name : 'Analyst';
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
