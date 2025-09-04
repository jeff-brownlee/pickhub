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
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {/* Logo */}
            <Box
              component="img"
              src="/logo_black.png"
              alt="pickhub.ai logo"
              sx={{
                height: { xs: 48, sm: 80 },
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
            
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2.0rem' },
                lineHeight: 1,
                overflowWrap: 'anywhere',
                minWidth: 0,
                flexShrink: 1
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
