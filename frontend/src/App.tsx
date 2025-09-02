// src/App.tsx
import * as React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Container, Stack, Button } from '@mui/material';
import PicksPage from './pages/PicksPage';
import LeaderboardPage from './pages/LeaderboardPage';

function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  return (
    <AppBar position="static" color="transparent" elevation={0}
      sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)' }}>
      <Toolbar>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button component={Link} to="/leaderboard" variant={isActive('/leaderboard') ? 'contained' : 'text'} size="small">
              Leaderboard
            </Button>
            <Button component={Link} to="/picks" variant={isActive('/picks') ? 'contained' : 'text'} size="small">
              Picks
            </Button>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/picks" replace />} />
        <Route path="/picks" element={<PicksPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
