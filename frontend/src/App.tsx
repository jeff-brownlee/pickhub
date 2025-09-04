// src/App.tsx
import * as React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Container, Stack, Button } from '@mui/material';
import PicksPage from './pages/PicksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BiosPage from './pages/BiosPage';
import AboutPage from './pages/AboutPage';
import GlobalHeader from './components/GlobalHeader';

function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  return (
    <AppBar position="static" color="transparent" elevation={0}
      sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)' }}>
      <Toolbar>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
              component={Link} 
              to="/leaderboard" 
              variant="text" 
              size="small"
              sx={{
                color: '#00E676',
                textDecoration: isActive('/leaderboard') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              Leaderboard
            </Button>
            <Button 
              component={Link} 
              to="/picks" 
              variant="text" 
              size="small"
              sx={{
                color: '#00E676',
                textDecoration: isActive('/picks') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              Picks
            </Button>
            <Button 
              component={Link} 
              to="/bio" 
              variant="text" 
              size="small"
              sx={{
                color: '#00E676',
                textDecoration: isActive('/bio') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              BIO
            </Button>
            <Button 
              component={Link} 
              to="/about" 
              variant="text" 
              size="small"
              sx={{
                color: '#00E676',
                textDecoration: isActive('/about') ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              About
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
      <GlobalHeader />
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/picks" replace />} />
        <Route path="/picks" element={<PicksPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/bio" element={<BiosPage />} />
        <Route path="/bio/:id" element={<BiosPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}
