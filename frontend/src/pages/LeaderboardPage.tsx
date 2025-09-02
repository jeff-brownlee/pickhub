// src/pages/LeaderboardPage.tsx
import { ThemeProvider, CssBaseline, Container, Stack, Grid2, Card, CardContent, Avatar, Typography, Chip } from '@mui/material';
import { theme } from '../theme';

import StickyBar from '../components/StickyBar';
import type { Persona, PersonaMetrics } from '../types';
import { useEffect, useMemo, useState } from 'react';

type SortKey = 'winPct'|'wins'|'streak'|'last5';

const getCurrentWeek = (): number => {
  const seasonStart = new Date('2025-09-04'); // NFL season start
  const now = new Date();
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksSinceStart + 1, 1), 18); // Clamp between 1-18
};

export default function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>('winPct');
  const [rows, setRows] = useState<Array<{ persona: Persona; metrics: PersonaMetrics }>>([]);

  useEffect(() => {
    const currentWeek = getCurrentWeek();
    const weekStr = currentWeek.toString().padStart(2, '0');
    Promise.all([
      fetch('/data/personas.json').then(r=>r.json()),
      fetch(`/data/nfl/season-2025/week-${weekStr}/leaderboard.json`).then(r=>r.json()),
    ]).then(([personas, leaderboard]) => {
      const map = new Map(personas.map((p: Persona) => [p.id, p]));
      const data = leaderboard.map((row: any) => ({ persona: map.get(row.personaId)!, metrics: row.metrics as PersonaMetrics }));
      setRows(data);
    });
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a,b) => {
      switch (sort) {
        case 'winPct': return b.metrics.winPct - a.metrics.winPct;
        case 'wins': return b.metrics.wins - a.metrics.wins;
        case 'streak': return b.metrics.streak - a.metrics.streak;
        case 'last5': return (b.metrics.last5.filter(x=>x==='W').length) - (a.metrics.last5.filter(x=>x==='W').length);
      }
    });
    return copy;
  }, [rows, sort]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StickyBar>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="center" sx={{ py: 1 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip
                label="Win %"
                variant={sort === 'winPct' ? 'filled' : 'outlined'}
                color={sort === 'winPct' ? 'primary' : 'default'}
                onClick={() => setSort('winPct')}
                size="small"
              />
              <Chip
                label="Wins"
                variant={sort === 'wins' ? 'filled' : 'outlined'}
                color={sort === 'wins' ? 'primary' : 'default'}
                onClick={() => setSort('wins')}
                size="small"
              />
              <Chip
                label="Streak"
                variant={sort === 'streak' ? 'filled' : 'outlined'}
                color={sort === 'streak' ? 'primary' : 'default'}
                onClick={() => setSort('streak')}
                size="small"
              />
              <Chip
                label="Last 5"
                variant={sort === 'last5' ? 'filled' : 'outlined'}
                color={sort === 'last5' ? 'primary' : 'default'}
                onClick={() => setSort('last5')}
                size="small"
              />
            </Stack>
          </Stack>
        </Container>
      </StickyBar>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Grid2 container spacing={2}>
          {sorted.map(({ persona, metrics }) => (
            <Grid2 key={persona.id} size={{ xs: 12 }}>
              <Card>
                <CardContent sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar 
                      src={persona.avatarUrl} 
                      sx={{ 
                        width: { xs: 100, sm: 80 }, 
                        height: { xs: 100, sm: 80 },
                        border: '2px solid',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }} 
                    />
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {persona.name}
                      </Typography>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} justifyContent="space-between">
                          <Chip 
                            size="small" 
                            label={`${metrics.wins}-${metrics.losses}${metrics.pushes?`-${metrics.pushes}`:''}`}
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            color="primary" 
                            label={`${Math.round(metrics.winPct*100)}%`}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1} justifyContent="space-between">
                          <Chip 
                            size="small" 
                            label={`Streak: ${metrics.streak>0?`W${metrics.streak}`: metrics.streak<0?`L${-metrics.streak}`:'—'}`}
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            label={`Last5: ${metrics.last5.join(' ') || '—'}`}
                            variant="outlined"
                          />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      </Container>
    </ThemeProvider>
  );
}
