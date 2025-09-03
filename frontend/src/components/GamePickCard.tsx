// src/components/GamePickCard.tsx
import { useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, Stack, Typography, Grid2, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Game, Pick } from '../types';
import { getTeamColor } from '../utils/teamColors';

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
  onClick,
}: {
  game: Game;
  pick?: Pick;
  onClick?: () => void;
}) {
  const [isRationaleExpanded, setIsRationaleExpanded] = useState(false);
  const kickoff = new Date(game.kickoffEt);
  const gameDate = kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const gameTime = kickoff.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  // Use real pick data if available, otherwise use game odds
  const hasPick = pick && pick.selection && pick.marketData;
  const hasGameOdds = game.odds && game.odds.spread && game.odds.total && game.odds.moneyline;
  
  // Get betting data from pick, game odds, or use default values
  const bettingData = hasPick ? {
    spread: {
      away: { 
        value: `+${pick.marketData.spread.away.line}`, 
        odds: pick.marketData.spread.away.odds.toString() 
      },
      home: { 
        value: `-${pick.marketData.spread.home.line}`, 
        odds: pick.marketData.spread.home.odds.toString() 
      }
    },
    total: {
      over: { 
        value: `O ${pick.marketData.total.over.line}`, 
        odds: pick.marketData.total.over.odds.toString() 
      },
      under: { 
        value: `U ${pick.marketData.total.under.line}`, 
        odds: pick.marketData.total.under.odds.toString() 
      }
    },
    moneyline: {
      away: pick.marketData.moneyline.away.odds.toString(),
      home: pick.marketData.moneyline.home.odds.toString()
    }
  } : hasGameOdds ? {
    spread: game.odds.spread ? {
      away: { 
        value: `+${game.odds.spread.away.line}`, 
        odds: game.odds.spread.away.odds.toString() 
      },
      home: { 
        value: `-${game.odds.spread.home.line}`, 
        odds: game.odds.spread.home.odds.toString() 
      }
    } : undefined,
    total: game.odds.total ? {
      over: { 
        value: `O ${game.odds.total.over.line}`, 
        odds: game.odds.total.over.odds.toString() 
      },
      under: { 
        value: `U ${game.odds.total.under.line}`, 
        odds: game.odds.total.under.odds.toString() 
      }
    } : undefined,
    moneyline: game.odds.moneyline ? {
      away: game.odds.moneyline.away.odds.toString(),
      home: game.odds.moneyline.home.odds.toString()
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

  // Determine which bet is picked based on actual pick data
  const getPickedBet = () => {
    if (!hasPick) return null;
    
    const { betType, side } = pick.selection;
    if (betType === 'spread') {
      return side === 'away' ? 'spread-away' : 'spread-home';
    } else if (betType === 'total') {
      return side === 'over' ? 'total-over' : 'total-under';
    } else if (betType === 'moneyline') {
      return side === 'away' ? 'moneyline-away' : 'moneyline-home';
    }
    return null;
  };

  const pickedBet = getPickedBet();

  // Get pick status from actual pick data
  const pickStatus = hasPick ? {
    status: pick.result?.status || 'pending',
    pick: pick.selection.betType === 'total' 
      ? `${pick.selection.side === 'over' ? 'OVER' : 'UNDER'} ${pick.selection.line} ${pick.selection.odds > 0 ? '+' : ''}${pick.selection.odds}`
      : `${pick.selection.side === 'away' ? game.away.abbr : game.home.abbr} ${pick.selection.betType === 'spread' ? pick.selection.line : ''} ${pick.selection.odds > 0 ? '+' : ''}${pick.selection.odds}`,
    rationale: pick.selection.rationale || pick.rationale || 'No rationale provided.'
  } : {
    status: 'pending' as const,
    pick: 'No pick',
    rationale: 'No pick has been made for this game.'
  };

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
              <TeamBadge name={game.away.name} abbr={game.away.abbr} nickname={game.away.nickname} score={pick?.awayTeam?.score} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.spread?.away?.value || 'N/A'}
                odds={bettingData.spread?.away?.odds || 'N/A'}
                isPicked={pickedBet === 'spread-away'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.total?.over?.value || 'N/A'}
                odds={bettingData.total?.over?.odds || 'N/A'}
                isPicked={pickedBet === 'total-over'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={bettingData.moneyline?.away || 'N/A'}
                isPicked={pickedBet === 'moneyline-away'}
                isMoneyline={true}
              />
            </Grid2>

            {/* Row 3: Home Team */}
            <Grid2 size={5}>
              <TeamBadge name={game.home.name} abbr={game.home.abbr} nickname={game.home.nickname} score={pick?.homeTeam?.score} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.spread?.home?.value || 'N/A'}
                odds={bettingData.spread?.home?.odds || 'N/A'}
                isPicked={pickedBet === 'spread-home'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={bettingData.total?.under?.value || 'N/A'}
                odds={bettingData.total?.under?.odds || 'N/A'}
                isPicked={pickedBet === 'total-under'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={bettingData.moneyline?.home || 'N/A'}
                isPicked={pickedBet === 'moneyline-home'}
                isMoneyline={true}
              />
            </Grid2>
          </Grid2>

          {/* Pick Status Element */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
                                 <Stack direction="row" alignItems="center" spacing={1}>
                       <Typography sx={{ fontSize: '1.2rem' }}>
                         {getStatusEmoji(pickStatus.status)}
                       </Typography>
                       <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                         {pickStatus.pick}
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
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                  {pickStatus.rationale}
                </Typography>
              </Box>
            </Collapse>
          </Box>

      </CardContent>
    </Card>
  );
}
