// src/components/GamePickCard.tsx
import { useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, Stack, Typography, Grid2, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Game, Pick } from '../types';
import { getTeamColor } from '../utils/teamColors';

function TeamBadge({ name, abbr, score }: { name: string; abbr: string; score?: number }) {
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
          {name}
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

  // Mock betting data - in real app this would come from API
  const mockBettingData = {
    spread: {
      away: { value: '+2.5', odds: '-110' },
      home: { value: '-2.5', odds: '-110' }
    },
    total: {
      over: { value: 'O 48.5', odds: '-110' },
      under: { value: 'U 48.5', odds: '-110' }
    },
    moneyline: {
      away: '+120',
      home: '-140'
    }
  };

  // Determine which bet is picked (mock logic for now)
  const getPickedBet = () => {
    // Mock: always return a pick for testing
    return 'moneyline-away'; // Mock: assume moneyline away is picked
  };

  const pickedBet = getPickedBet();

  // Mock pick status data
  const mockPickStatus = {
    status: 'pending' as 'pending' | 'won' | 'loss',
    pick: 'PHI +120', // This would come from actual pick data
    rationale: 'The Eagles have a strong home field advantage and their defense has been performing well against the run. With the current line movement favoring the underdog, there\'s good value on the moneyline. The weather conditions are also favorable for their passing attack.'
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
              <TeamBadge name={game.away.name} abbr={game.away.abbr} score={21} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={mockBettingData.spread.away.value}
                odds={mockBettingData.spread.away.odds}
                isPicked={pickedBet === 'spread-away'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={mockBettingData.total.over.value}
                odds={mockBettingData.total.over.odds}
                isPicked={pickedBet === 'total-over'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={mockBettingData.moneyline.away}
                isPicked={pickedBet === 'moneyline-away'}
                isMoneyline={true}
              />
            </Grid2>

            {/* Row 3: Home Team */}
            <Grid2 size={5}>
              <TeamBadge name={game.home.name} abbr={game.home.abbr} score={7} />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={mockBettingData.spread.home.value}
                odds={mockBettingData.spread.home.odds}
                isPicked={pickedBet === 'spread-home'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value={mockBettingData.total.under.value}
                odds={mockBettingData.total.under.odds}
                isPicked={pickedBet === 'total-under'}
              />
            </Grid2>
            <Grid2 size={2.33}>
              <BettingOption
                value=""
                odds={mockBettingData.moneyline.home}
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
                         {getStatusEmoji(mockPickStatus.status)}
                       </Typography>
                       <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                         {mockPickStatus.pick}
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
                  {mockPickStatus.rationale}
                </Typography>
              </Box>
            </Collapse>
          </Box>

      </CardContent>
    </Card>
  );
}
