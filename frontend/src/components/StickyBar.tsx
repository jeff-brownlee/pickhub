// src/components/StickyBar.tsx
import { Box } from '@mui/material';
import { PropsWithChildren } from 'react';

export default function StickyBar({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: (t) => t.palette.background.default,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        py: 1,
      }}
    >
      {children}
    </Box>
  );
}
