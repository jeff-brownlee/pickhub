// src/components/PersonaHeader.tsx
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePickhubContext } from '../context/PickhubContext';
import type { Persona } from '../types';

export default function PersonaHeader({ persona }: { persona: Persona }) {
  const navigate = useNavigate();
  const { setSelectedPersonaId } = usePickhubContext();
  const { wins, losses, pushes = 0 } = persona.record;
  const pct = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 2, py: 1 }}>
      <Avatar
        src={persona.avatarUrl}
        alt={persona.name}
        onClick={() => { setSelectedPersonaId(persona.id); navigate('/bio'); }}
        sx={{
          width: { xs: 100, sm: 80 },
          height: { xs: 100, sm: 80 },
          border: '2px solid rgba(255,255,255,0.18)',
          cursor: 'pointer',
          transition: 'transform 120ms ease',
          '&:hover': { transform: 'scale(1.03)' }
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">{persona.name}</Typography>
        {persona.tagline && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {persona.tagline}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <Chip size="small" label={`${wins}-${losses}${pushes ? `-${pushes}` : ''}`} />
          <Chip size="small" color="primary" label={`${pct}%`} />
        </Stack>
      </Box>
    </Stack>
  );
}
