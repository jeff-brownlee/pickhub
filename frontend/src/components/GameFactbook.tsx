import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  Grid2,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { ExpandMore, TrendingUp, TrendingDown, Warning, Info } from '@mui/icons-material';
import { GameFactbook } from '../types/factbook';

interface GameFactbookProps {
  factbook: GameFactbook;
}

export default function GameFactbook({ factbook }: GameFactbookProps) {
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Game Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {factbook.teams.away.abbreviation} @ {factbook.teams.home.abbreviation}
            </Typography>
            <Chip 
              label={`Week ${factbook.week}`} 
              color="primary" 
              variant="outlined"
            />
          </Stack>
          
          <Stack direction="row" spacing={4} alignItems="center">
            <Box>
              <Typography variant="body2" color="text.secondary">
                {factbook.venue.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {factbook.venue.city}, {factbook.venue.state}
              </Typography>
            </Box>
            <Box>
              <Chip 
                label={factbook.venue.indoor ? 'Indoor' : 'Outdoor'} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={factbook.venue.surface} 
                size="small" 
                variant="outlined" 
                sx={{ ml: 1 }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Team Records Comparison */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Team Records</Typography>
          <Grid2 container spacing={3}>
            <Grid2 size={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {factbook.teams.away.abbreviation}
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {factbook.teams.away.record.wins}-{factbook.teams.away.record.losses}
                  {factbook.teams.away.record.ties > 0 && `-${factbook.teams.away.record.ties}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(factbook.teams.away.record.winPercentage * 100)}% Win Rate
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {factbook.teams.home.abbreviation}
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {factbook.teams.home.record.wins}-{factbook.teams.home.record.losses}
                  {factbook.teams.home.record.ties > 0 && `-${factbook.teams.home.record.ties}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(factbook.teams.home.record.winPercentage * 100)}% Win Rate
                </Typography>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <Stack spacing={2}>
        {/* Betting Context */}
        <Accordion expanded={expandedSection === 'betting'} onChange={handleChange('betting')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Info color="primary" />
              <Typography variant="h6">Betting Context</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <BettingContextSection context={factbook.bettingContext} />
          </AccordionDetails>
        </Accordion>

        {/* Team Statistics */}
        <Accordion expanded={expandedSection === 'stats'} onChange={handleChange('stats')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUp color="primary" />
              <Typography variant="h6">Team Statistics</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <TeamStatsSection 
              awayTeam={factbook.teams.away} 
              homeTeam={factbook.teams.home} 
            />
          </AccordionDetails>
        </Accordion>

        {/* Key Matchups */}
        <Accordion expanded={expandedSection === 'matchups'} onChange={handleChange('matchups')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Warning color="primary" />
              <Typography variant="h6">Key Matchups</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <KeyMatchupsSection matchups={factbook.keyMatchups} />
          </AccordionDetails>
        </Accordion>

        {/* Injury Report */}
        <Accordion expanded={expandedSection === 'injuries'} onChange={handleChange('injuries')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Warning color="error" />
              <Typography variant="h6">Injury Report</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <InjuryReportSection injuries={factbook.injuries} />
          </AccordionDetails>
        </Accordion>

        {/* Trends */}
        <Accordion expanded={expandedSection === 'trends'} onChange={handleChange('trends')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingDown color="primary" />
              <Typography variant="h6">Game Trends</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <TrendsSection trends={factbook.trends} />
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}

function BettingContextSection({ context }: { context: any }) {
  return (
    <Grid2 container spacing={3}>
      <Grid2 size={6}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Line Movement</Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Spread:</Typography>
            <Typography variant="body2" color="primary.main">
              {context.currentLine?.spread || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Total:</Typography>
            <Typography variant="body2" color="primary.main">
              {context.currentLine?.total || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </Grid2>
      <Grid2 size={6}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Public Betting</Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Spread:</Typography>
            <Typography variant="body2">
              {context.bettingTrends?.spread?.home}% / {context.bettingTrends?.spread?.away}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Total:</Typography>
            <Typography variant="body2">
              O{context.bettingTrends?.total?.over}% / U{context.bettingTrends?.total?.under}%
            </Typography>
          </Box>
        </Stack>
      </Grid2>
    </Grid2>
  );
}

function TeamStatsSection({ awayTeam, homeTeam }: { awayTeam: any; homeTeam: any }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stat</TableCell>
            <TableCell align="center">{awayTeam.abbreviation}</TableCell>
            <TableCell align="center">{homeTeam.abbreviation}</TableCell>
            <TableCell align="center">Advantage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Points/Game</TableCell>
            <TableCell align="center">{awayTeam.statistics.offense.pointsPerGame.toFixed(1)}</TableCell>
            <TableCell align="center">{homeTeam.statistics.offense.pointsPerGame.toFixed(1)}</TableCell>
            <TableCell align="center">
              <Chip 
                size="small" 
                label={awayTeam.statistics.offense.pointsPerGame > homeTeam.statistics.offense.pointsPerGame ? awayTeam.abbreviation : homeTeam.abbreviation}
                color="primary"
                variant="outlined"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Points Allowed</TableCell>
            <TableCell align="center">{awayTeam.statistics.defense.pointsAllowed.toFixed(1)}</TableCell>
            <TableCell align="center">{homeTeam.statistics.defense.pointsAllowed.toFixed(1)}</TableCell>
            <TableCell align="center">
              <Chip 
                size="small" 
                label={awayTeam.statistics.defense.pointsAllowed < homeTeam.statistics.defense.pointsAllowed ? awayTeam.abbreviation : homeTeam.abbreviation}
                color="primary"
                variant="outlined"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Yards/Game</TableCell>
            <TableCell align="center">{awayTeam.statistics.offense.yardsPerGame.toFixed(0)}</TableCell>
            <TableCell align="center">{homeTeam.statistics.offense.yardsPerGame.toFixed(0)}</TableCell>
            <TableCell align="center">
              <Chip 
                size="small" 
                label={awayTeam.statistics.offense.yardsPerGame > homeTeam.statistics.offense.yardsPerGame ? awayTeam.abbreviation : homeTeam.abbreviation}
                color="primary"
                variant="outlined"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function KeyMatchupsSection({ matchups }: { matchups: any[] }) {
  if (matchups.length === 0) {
    return <Typography color="text.secondary">No key matchups identified.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {matchups.map((matchup, index) => (
        <Card key={index} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {matchup.description}
              </Typography>
              <Chip 
                label={matchup.advantage} 
                color={matchup.advantage === 'even' ? 'default' : 'primary'}
                size="small"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {matchup.details}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function InjuryReportSection({ injuries }: { injuries: any[] }) {
  if (injuries.length === 0) {
    return <Typography color="text.secondary">No significant injuries reported.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Injury</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Impact</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {injuries.map((injury, index) => (
            <TableRow key={index}>
              <TableCell>{injury.player}</TableCell>
              <TableCell>{injury.position}</TableCell>
              <TableCell>{injury.injury}</TableCell>
              <TableCell>
                <Chip 
                  label={injury.status} 
                  color={injury.status === 'out' ? 'error' : injury.status === 'doubtful' ? 'warning' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={injury.impact} 
                  color={injury.impact === 'high' ? 'error' : injury.impact === 'medium' ? 'warning' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TrendsSection({ trends }: { trends: any[] }) {
  if (trends.length === 0) {
    return <Typography color="text.secondary">No significant trends identified.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {trends.map((trend, index) => (
        <Card key={index} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {trend.description}
              </Typography>
              <Chip 
                label={trend.record} 
                color="primary"
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {trend.games} games • {trend.significance} significance
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
