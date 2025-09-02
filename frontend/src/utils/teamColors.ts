// src/utils/teamColors.ts
export const TEAM_COLORS: Record<string, string> = {
  // AFC East
  'BUF': '#00338D', // Buffalo Bills - Royal Blue
  'MIA': '#008E97', // Miami Dolphins - Aqua
  'NE': '#0C2340',  // New England Patriots - Navy Blue
  'NYJ': '#125740', // New York Jets - Green

  // AFC North
  'BAL': '#241773', // Baltimore Ravens - Purple
  'CIN': '#FB4F14', // Cincinnati Bengals - Orange
  'CLE': '#311D00', // Cleveland Browns - Brown
  'PIT': '#FFB612', // Pittsburgh Steelers - Gold

  // AFC South
  'HOU': '#03202F', // Houston Texans - Deep Steel Blue
  'IND': '#002C5F', // Indianapolis Colts - Royal Blue
  'JAX': '#006778', // Jacksonville Jaguars - Teal
  'TEN': '#0C2340', // Tennessee Titans - Navy Blue

  // AFC West
  'DEN': '#FB4F14', // Denver Broncos - Orange
  'KC': '#E31837',  // Kansas City Chiefs - Red
  'LV': '#000000',  // Las Vegas Raiders - Black
  'LAC': '#0080C6', // Los Angeles Chargers - Powder Blue

  // NFC East
  'DAL': '#041E42', // Dallas Cowboys - Navy Blue
  'NYG': '#0B2265', // New York Giants - Blue
  'PHI': '#004C54', // Philadelphia Eagles - Midnight Green
  'WAS': '#5A1414', // Washington Commanders - Burgundy

  // NFC North
  'CHI': '#0B162A', // Chicago Bears - Navy Blue
  'DET': '#0076B6', // Detroit Lions - Honolulu Blue
  'GB': '#203731',  // Green Bay Packers - Dark Green
  'MIN': '#4F2683', // Minnesota Vikings - Purple

  // NFC South
  'ATL': '#A71930', // Atlanta Falcons - Red
  'CAR': '#0085CA', // Carolina Panthers - Blue
  'NO': '#D3BC8D', // New Orleans Saints - Gold
  'TB': '#D50A0A', // Tampa Bay Buccaneers - Red

  // NFC West
  'ARI': '#97233F', // Arizona Cardinals - Cardinal Red
  'LAR': '#003594', // Los Angeles Rams - Royal Blue
  'SF': '#AA0000',  // San Francisco 49ers - Red
  'SEA': '#002244', // Seattle Seahawks - College Navy
};

export const getTeamColor = (abbr: string): string => {
  return TEAM_COLORS[abbr.toUpperCase()] || '#666666'; // Default gray if team not found
};
