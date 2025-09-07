// src/components/GamePickCard.tsx
import { useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, Stack, Typography, Grid2, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Game, Pick } from '../types';
import { getTeamColor } from '../utils/teamColors';

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function TeamBadge({ name, abbr, nickname, score }: { name: string; abbr: string; nickname: string; score?: number }) {
  const teamColor = getTeamColor(abbr);
  
  return (
    <Box
      sx={{
        backgroundColor: teamColor,
        borderRadius: 1,
        px: 1.5,
        py: 1,
        minWidth: 110,
        minHeight: 60,
        textAlign: 'left',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
          {abbr}
        </Typography>
        <Typography variant="caption" sx={{ color: 'white', opacity: 0.9, fontSize: '0.75rem' }}>
          {nickname}
        </Typography>
      </Box>
      {score !== undefined && (
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
          {score}
        </Typography>
      )}
    </Box>
  );
}

function BettingOption({ 
  value, 
  odds, 
  isPicked = false,
  isMoneyline = false
}: { 
  value: string; 
  odds: string; 
  isPicked?: boolean;
  isMoneyline?: boolean;
}) {
  return (
    <Box
      sx={{
        backgroundColor: isPicked ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.05)',
        borderRadius: 1,
        px: 0.5,
        py: 1,
        textAlign: 'center',
        border: isPicked ? '2px solid #00E676' : '1px solid rgba(255,255,255,0.1)',
        minHeight: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {isMoneyline ? (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '0.85rem',
            color: odds.startsWith('+') ? '#00E676' : 'text.primary'
          }}
        >
          {odds}
        </Typography>
      ) : (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.85rem' }}>
            {value}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: odds.startsWith('+') ? '#00E676' : 'text.secondary',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          >
            {odds}
          </Typography>
        </>
      )}
    </Box>
  );
}

export default function GamePickCard({
  game,
  pick,
  picks,
  onClick,
}: {
  game: Game;
  pick?: Pick;
  picks?: Pick[];
  onClick?: () => void;
}) {
  const [isRationaleExpanded, setIsRationaleExpanded] = useState(false);
  const kickoff = new Date(game.kickoffEt);
  const gameDate = kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const gameTime = kickoff.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  // Use real pick data if available, otherwise use game odds
  const primaryPick = (picks && picks.length > 0 ? picks[0] : pick);
  const hasPick = primaryPick && (primaryPick as Pick).selection && (primaryPick as Pick).marketData;
  const hasGameOdds = game.odds && game.odds.spread && game.odds.total && game.odds.moneyline;
  
  // Get betting data from pick, game odds, or use default values
  const bettingData = hasPick ? {
    spread: {
      away: { 
        value: formatSigned((primaryPick as Pick).marketData.spread.away.line), 
        odds: formatSigned((primaryPick as Pick).marketData.spread.away.odds) 
      },
      home: { 
        value: formatSigned((primaryPick as Pick).marketData.spread.home.line), 
        odds: formatSigned((primaryPick as Pick).marketData.spread.home.odds) 
      }
    },
    total: {
      over: { 
        value: `O ${(primaryPick as Pick).marketData.total.over.line}`, 
        odds: formatSigned((primaryPick as Pick).marketData.total.over.odds) 
      },
      under: { 
        value: `U ${(primaryPick as Pick).marketData.total.under.line}`, 
        odds: formatSigned((primaryPick as Pick).marketData.total.under.odds) 
      }
    },
    moneyline: {
      away: formatSigned((primaryPick as Pick).marketData.moneyline.away.odds),
      home: formatSigned((primaryPick as Pick).marketData.moneyline.home.odds)
    }
  } : hasGameOdds ? {
    spread: game.odds.spread ? {
      away: { 
        value: formatSigned(game.odds.spread.away.line), 
        odds: formatSigned(game.odds.spread.away.odds) 
      },
      home: { 
        value: formatSigned(game.odds.spread.home.line), 
        odds: formatSigned(game.odds.spread.home.odds) 
      }
    } : undefined,
    total: game.odds.total ? {
      over: { 
        value: `O ${game.odds.total.over.line}`, 
        odds: formatSigned(game.odds.total.over.odds) 
      },
      under: { 
        value: `U ${game.odds.total.under.line}`, 
        odds: formatSigned(game.odds.total.under.odds) 
      }
    } : undefined,
    moneyline: game.odds.moneyline ? {
      away: formatSigned(game.odds.moneyline.away.odds),
      home: formatSigned(game.odds.moneyline.home.odds)
    } : undefined
  } : {
    spread: {
      away: { value: 'N/A', odds: 'N/A' },
      home: { value: 'N/A', odds: 'N/A' }
    },
    total: {
      over: { value: 'N/A', odds: 'N/A' },
      under: { value: 'N/A', odds: 'N/A' }
    },
    moneyline: {
      away: 'N/A',
      home: 'N/A'
    }
  };

  // Determine if a specific cell is selected by any pick
  const isCellPicked = (
    cell: 'spread-away' | 'spread-home' | 'total-over' | 'total-under' | 'moneyline-away' | 'moneyline-home'
  ) => {
    const list = picks && picks.length ? picks : (pick ? [pick] : []);
    if (!list.length) return false;
    return list.some((p) => {
      const { betType, side } = p.selection;
      if (betType === 'spread') return (side === 'away' && cell === 'spread-away') || (side === 'home' && cell === 'spread-home');
      if (betType === 'total') return (side === 'over' && cell === 'total-over') || (side === 'under' && cell === 'total-under');
      if (betType === 'moneyline') return (side === 'away' && cell === 'moneyline-away') || (side === 'home' && cell === 'moneyline-home');
      return false;
    });
  };

  // Build pick status rows
  const statusListSource = picks && picks.length ? picks : (pick ? [pick] : []);
  const pickStatusList = statusListSource.map((p) => ({
    status: p.result?.status || 'pending',
    text: p.selection.betType === 'total'
      ? `${p.selection.side === 'over' ? 'OVER' : 'UNDER'} ${p.selection.line} ${p.selection.odds > 0 ? '+' : ''}${p.selection.odds}`
      : `${p.selection.side === 'away' ? game.away.abbr : game.home.abbr} ${p.selection.betType === 'spread' ? p.selection.line : ''} ${p.selection.odds > 0 ? '+' : ''}${p.selection.odds}`,
    rationale: p.selection.rationale || p.rationale || 'No rationale provided.'
  }));
  const pickStatusFallback = [{ status: 'pending' as const, text: 'No pick', rationale: 'No pick has been made for this game.' }];

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'won': return '✅';
      case 'loss': return '❌';
      default: return '⏳';
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
          {/* Game Date and Time */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {gameDate} • {gameTime}
            </Typography>
          </Stack>

          {/* Main Content: 3×4 Grid Layout */}
          <Grid2 container spacing={1} sx={{ mb: 3 }}>
            {/* Row 1: Headers */}
            <Grid2 size={5}>
              <Box sx={{ p: 1, textAlign: 'center', minHeight: 32 }} />
            </Grid2>
            <Grid2 size={2.33}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Spread
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={2.33}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={2.33}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Money
                </Typography>
              </Box>
            </Grid2>

            {/* Row 2: Away Team */}
            <Grid2 size={5}>
              <TeamBadge name={game.away.name} abbr={game.away.abbr} nickname={game.away.nickname} score={(primaryPick as Pick | undefined)?.awayTeam?.score} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.spread?.away?.value || 'N/A'}
                odds={bettingData.spread?.away?.odds || 'N/A'}
                isPicked={isCellPicked('spread-away')}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.total?.over?.value || 'N/A'}
                odds={bettingData.total?.over?.odds || 'N/A'}
                isPicked={isCellPicked('total-over')}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={bettingData.moneyline?.away || 'N/A'}
                isPicked={isCellPicked('moneyline-away')}
                isMoneyline={true}
              />
            </Grid2>

            {/* Row 3: Home Team */}
            <Grid2 size={5}>
              <TeamBadge name={game.home.name} abbr={game.home.abbr} nickname={game.home.nickname} score={(primaryPick as Pick | undefined)?.homeTeam?.score} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.spread?.home?.value || 'N/A'}
                odds={bettingData.spread?.home?.odds || 'N/A'}
                isPicked={isCellPicked('spread-home')}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.total?.under?.value || 'N/A'}
                odds={bettingData.total?.under?.odds || 'N/A'}
                isPicked={isCellPicked('total-under')}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={bettingData.moneyline?.home || 'N/A'}
                isPicked={isCellPicked('moneyline-home')}
                isMoneyline={true}
              />
            </Grid2>
          </Grid2>

          {/* Pick Status Elements */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {(pickStatusList.length ? pickStatusList : pickStatusFallback).map((ps, idx) => (
              <Box key={idx} sx={{ '&:not(:first-of-type)': { mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontSize: '1.2rem' }}>
                    {getStatusEmoji(ps.status as string)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {ps.text}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{ color: 'text.secondary' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRationaleExpanded(!isRationaleExpanded);
                    }}
                  >
                    {isRationaleExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Stack>
                <Collapse in={isRationaleExpanded}>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {ps.rationale}
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>

      </CardContent>
    </Card>
  );
}
