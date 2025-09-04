// src/pages/BiosPage.tsx
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { usePickhubContext } from '../context/PickhubContext';
import { Box, Container, Typography, Stack, CircularProgress } from '@mui/material';
import type { Persona } from '../types';

export default function BiosPage() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { selectedPersonaId } = usePickhubContext();

  useEffect(() => {
    let isMounted = true;
    fetch('/data/personas.json', { cache: 'no-cache' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load personas.json: ${res.status}`);
        const data = (await res.json()) as Persona[];
        const picked = data.find((p) => p.id === selectedPersonaId) || data.find((p) => p.id === 'coach') || null;
        if (isMounted) setPersona(picked);
      })
      .catch((e) => {
        if (isMounted) setError(e instanceof Error ? e.message : 'Unknown error');
      });
    return () => {
      isMounted = false;
    };
  }, [selectedPersonaId]);

  const getFallbackSrc = useCallback((src?: string, attempt: number = 0, avatarUrl?: string) => {
    if (!src) return avatarUrl || '';
    // Try swapping extensions to match files in /public/profiles
    const candidates: string[] = [src];
    if (src.toLowerCase().endsWith('.png')) {
      candidates.push(src.replace(/\.png$/i, '.JPG'));
      candidates.push(src.replace(/\.png$/i, '.jpg'));
      candidates.push(src.replace(/\.png$/i, '.PNG'));
    } else if (src.toLowerCase().endsWith('.jpg') || src.toLowerCase().endsWith('.jpeg')) {
      candidates.push(src.replace(/\.(jpg|jpeg)$/i, '.JPG'));
      candidates.push(src.replace(/\.(jpg|jpeg)$/i, '.png'));
    } else if (src.toLowerCase().endsWith('.jpg'.toLowerCase()) === false && src.toLowerCase().endsWith('.png') === false) {
      candidates.push(`${src}.png`);
      candidates.push(`${src}.JPG`);
    }
    // Add avatar as final fallback
    if (avatarUrl) candidates.push(avatarUrl);
    return candidates[Math.min(attempt, candidates.length - 1)];
  }, []);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!persona) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={6}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <HeroImage srcPrimary={persona.profileImageUrl} avatarUrl={persona.avatarUrl} alt={persona.name} />
          <Box sx={{ p: 3, color: 'text.primary', backgroundColor: 'background.default' }}>
            <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>{persona.name}</Typography>
            {persona.tagline ? (
              <Typography variant="subtitle1" sx={{ mb: 2, opacity: 0.8, fontStyle: 'italic' }}>
                {persona.tagline}
              </Typography>
            ) : null}
            {persona.record ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" sx={{ opacity: 0.7 }}>Record</Typography>
                <Typography variant="body2">{persona.record.wins}-{persona.record.losses}{persona.record.pushes ? `-${persona.record.pushes}` : ''}</Typography>
              </Box>
            ) : null}
            <Typography variant="h6" sx={{ mb: 1.5 }}>About Me</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
              {persona.bio || 'No bio available.'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}

function HeroImage({ srcPrimary, avatarUrl, alt }: { srcPrimary?: string; avatarUrl?: string; alt: string }) {
  const [attempt, setAttempt] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    setAttempt(0);
  }, [srcPrimary]);

  useEffect(() => {
    const initial = srcPrimary || avatarUrl || '';
    setCurrentSrc(initial);
  }, [srcPrimary, avatarUrl]);

  const handleError = () => {
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    // Compute next fallback
    const nextSrc = computeNextSrc(currentSrc, srcPrimary, avatarUrl, nextAttempt);
    if (nextSrc && nextSrc !== currentSrc) {
      setCurrentSrc(nextSrc);
    }
  };

  return (
    <Box sx={{ width: '100%', aspectRatio: '1 / 1', backgroundColor: 'rgba(255,255,255,0.04)' }}>
      {currentSrc ? (
        <Box
          component="img"
          src={currentSrc}
          alt={alt}
          onError={handleError}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box sx={{ width: '100%', height: '100%' }} />
      )}
    </Box>
  );
}

function computeNextSrc(current: string, primary?: string, avatar?: string, attempt: number = 0): string {
  const pool: string[] = [];
  if (primary) {
    pool.push(primary);
    if (primary.match(/\.png$/i)) {
      pool.push(primary.replace(/\.png$/i, '.JPG'));
      pool.push(primary.replace(/\.png$/i, '.jpg'));
      pool.push(primary.replace(/\.png$/i, '.PNG'));
    } else if (primary.match(/\.(jpg|jpeg)$/i)) {
      pool.push(primary.replace(/\.(jpg|jpeg)$/i, '.JPG'));
      pool.push(primary.replace(/\.(jpg|jpeg)$/i, '.png'));
    } else {
      pool.push(`${primary}.png`);
      pool.push(`${primary}.JPG`);
    }
  }
  if (avatar) pool.push(avatar);
  const idx = Math.min(attempt, pool.length - 1);
  return pool[idx] || current;
}


