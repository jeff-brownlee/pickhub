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
    const weekStr = week.toString().padStart(2, '0');
    fetch(`/data/nfl/season-2025/week-${weekStr}/games.json`).then(r => r.json()).then(setGames);
  }, [week]);

  useEffect(() => {
    if (!selectedPersonaId) return;
    const weekStr = week.toString().padStart(2, '0');
    fetch(`/data/nfl/season-2025/week-${weekStr}/picks/${selectedPersonaId}.json`)
      .then(r => r.json())
      .then((pickData: any) => {
        // Convert new pick structure to old format for compatibility
        const picksMap: Record<string, Pick> = {};
        if (pickData.picks) {
          pickData.picks.forEach((pick: any) => {
            picksMap[pick.gameId] = {
              id: `${selectedPersonaId}-${pick.gameId}`,
              gameId: pick.gameId,
              analystId: selectedPersonaId,
              selection: pick.selection,
              rationale: pick.selection.rationale,
              result: pick.result
            };
          });
        }
        setPicks(picksMap);
      })
      .catch(() => setPicks({}));
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
