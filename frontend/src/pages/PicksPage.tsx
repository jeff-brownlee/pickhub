// src/pages/PicksPage.tsx
import { ThemeProvider, CssBaseline, Container, Stack, Grid2, Box } from '@mui/material';
import { theme } from '../theme';
import PersonaHeader from '../components/PersonaHeader';
import PersonaPicker from '../components/PersonaPicker';
import WeekSelector from '../components/WeekSelector';
import GamePickCard from '../components/GamePickCard';
import StickyBar from '../components/StickyBar';
import type { Game, Persona, Pick } from '../types';
import { useMemo, useState, useEffect } from 'react';

export default function PicksPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [week, setWeek] = useState(1);

  // Load mock JSON from /public/data
  useEffect(() => {
    fetch('/data/personas.json').then(r => r.json()).then((d: Persona[]) => {
      setPersonas(d);
      if (d.length) setSelectedPersonaId(d[0].id);
    });
  }, []);

  useEffect(() => {
    fetch(`/data/games_week${week}.json`).then(r => r.json()).then(setGames);
  }, [week]);

  useEffect(() => {
    if (!selectedPersonaId) return;
    fetch(`/data/picks_${selectedPersonaId}_week${week}.json`).then(r => r.json()).then(setPicks).catch(()=>setPicks({}));
  }, [selectedPersonaId, week]);

  const selectedPersona = useMemo(() => personas.find(p => p.id === selectedPersonaId), [personas, selectedPersonaId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StickyBar>
        <Container maxWidth="lg">
          {selectedPersona && <PersonaHeader persona={selectedPersona} />}
          <Box sx={{ py: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <PersonaPicker personas={personas} value={selectedPersonaId} onChange={setSelectedPersonaId} />
              <WeekSelector week={week} setWeek={setWeek} maxWeek={18} />
            </Stack>
          </Box>
        </Container>
      </StickyBar>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Grid2 container spacing={2}>
          {games.map((g) => (
            <Grid2 key={g.id} size={{ xs: 12 }}>
              <GamePickCard game={g} pick={picks[g.id]} onClick={() => { /* optional: open inline facts */ }} />
            </Grid2>
          ))}
        </Grid2>
      </Container>
    </ThemeProvider>
  );
}
