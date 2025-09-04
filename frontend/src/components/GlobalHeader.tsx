import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function GlobalHeader() {
  const theme = useTheme();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: '#000000',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Logo */}
            <Box
              component="img"
              src="/logo_black.png"
              alt="pickhub.ai logo"
              sx={{
                height: 80,
                objectFit: 'contain'
              }}
            />
            
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: '2.0rem',
                lineHeight: 1
              }}
            >
              <Box component="span" sx={{ color: '#00E676' }}>
                pickhub
              </Box>
              <Box component="span" sx={{ color: 'white' }}>
                .ai
              </Box>
            </Typography>
        </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
