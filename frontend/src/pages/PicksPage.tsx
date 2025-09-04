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
import { usePickhubContext } from '../context/PickhubContext';

export default function PicksPage() {
  const { selectedPersonaId, setSelectedPersonaId } = usePickhubContext();
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [week, setWeek] = useState(1);

  // Extract games from picks data
  const games = useMemo(() => {
    return Object.values(picks).map(pick => ({
      id: pick.gameId,
      kickoffEt: pick.gameDate,
      away: {
        name: pick.awayTeam.name,
        abbr: pick.awayTeam.id,
        nickname: pick.awayTeam.nickname,
        primaryHex: '#000000' // Default color, could be enhanced later
      },
      home: {
        name: pick.homeTeam.name,
        abbr: pick.homeTeam.id,
        nickname: pick.homeTeam.nickname,
        primaryHex: '#000000' // Default color, could be enhanced later
      },
      odds: {
        spread: pick.marketData.spread ? {
          away: { line: pick.marketData.spread.away.line, odds: pick.marketData.spread.away.odds },
          home: { line: pick.marketData.spread.home.line, odds: pick.marketData.spread.home.odds }
        } : undefined,
        total: pick.marketData.total ? {
          over: { line: pick.marketData.total.over.line, odds: pick.marketData.total.over.odds },
          under: { line: pick.marketData.total.under.line, odds: pick.marketData.total.under.odds }
        } : undefined,
        moneyline: pick.marketData.moneyline ? {
          away: { odds: pick.marketData.moneyline.away.odds },
          home: { odds: pick.marketData.moneyline.home.odds }
        } : undefined
      }
    }));
  }, [picks]);

  // Load mock JSON from /public/data
  useEffect(() => {
    fetch('/data/personas.json')
      .then(r => r.json())
      .then((d: Persona[]) => {
        setPersonas(d);
        // Only set a default if none is selected or current selection is not in the list
        const hasSelection = !!selectedPersonaId;
        const selectionValid = d.some(p => p.id === selectedPersonaId);
        if (!hasSelection || !selectionValid) {
          if (d.length) setSelectedPersonaId(d[0].id);
        }
      });
  }, [selectedPersonaId, setSelectedPersonaId]);



  useEffect(() => {
    if (!selectedPersonaId) return;
    const weekStr = week.toString().padStart(2, '0');
    fetch(`/data/nfl/season-2025/week-${weekStr}/picks/${selectedPersonaId}.json`)
      .then(r => r.json())
      .then((pickData: any) => {
        // Convert new pick structure to match Pick type
        const picksMap: Record<string, Pick> = {};
        if (pickData.picks) {
          pickData.picks.forEach((pick: any) => {
            picksMap[pick.gameId] = {
              id: `${selectedPersonaId}-${pick.gameId}`,
              gameId: pick.gameId,
              gameDate: pick.gameDate,
              awayTeam: pick.awayTeam,
              homeTeam: pick.homeTeam,
              marketData: pick.marketData,
              selection: pick.selection,
              result: pick.result,
              analystId: selectedPersonaId,
              rationale: pick.selection.rationale
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
