import { MinimalFactbook } from "../types/minimalFactbook";

export type SpreadSide = "home" | "away";
export type TotalDirection = "over" | "under";

export type SpreadScore = {
  score: number; // 0-100
  side: SpreadSide;
  edge: number; // points advantage estimate (positive)
  reasons: string[];
};

export type TotalScore = {
  score: number; // 0-100
  direction: TotalDirection;
  edge: number; // points vs current total (positive)
  reasons: string[];
};

export type MoneylineScore = {
  score: number; // 0-100
  side: SpreadSide;
  edge: number; // strength proxy (positive)
  reasons: string[];
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function toFixed(num: number, digits = 2): number {
  return Number(num.toFixed(digits));
}

function normalize(value: number, maxAbs: number): number {
  // return 0..1 based on absolute value vs a cap
  if (maxAbs <= 0) return 0;
  return Math.min(Math.abs(value) / maxAbs, 1);
}

function getDefenseDisruption(sacks: number, interceptions: number): number {
  return (sacks || 0) + (interceptions || 0);
}

export function computeSpreadScore(fb: MinimalFactbook): SpreadScore {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const lm = fb.bettingContext?.lineMovement?.spread;
  const trends = fb.bettingContext?.bettingTrends?.spread;

  // Statistical margin: offense PPG vs opposing defense PA
  const awayAdv = (away.statistics.offense.pointsPerGame || 0) - (home.statistics.defense.pointsAllowed || 0);
  const homeAdv = (home.statistics.offense.pointsPerGame || 0) - (away.statistics.defense.pointsAllowed || 0);
  const statMargin = awayAdv - homeAdv; // + => away edge, - => home edge

  // Pick side by statistical edge (persona layers can later bias/fade public etc.)
  const side: SpreadSide = statMargin >= 0 ? "away" : "home";

  // Discipline (fewer turnovers on chosen side's offense)
  const chosenOffTo = side === "away" ? away.statistics.offense.turnovers : home.statistics.offense.turnovers;
  const oppOffTo = side === "away" ? home.statistics.offense.turnovers : away.statistics.offense.turnovers;
  const disciplineDelta = (oppOffTo || 0) - (chosenOffTo || 0); // positive is good

  // Defensive disruption differential for chosen side
  const chosenDefDisruption = side === "away"
    ? getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions)
    : getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions);
  const oppDefDisruption = side === "away"
    ? getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions)
    : getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions);
  const disruptionDelta = (chosenDefDisruption || 0) - (oppDefDisruption || 0); // positive is good

  // Coaching experience delta for chosen side (game management/ATS proxy)
  const chosenCoachExp = side === "away" ? (away.coaching?.experience || 0) : (home.coaching?.experience || 0);
  const oppCoachExp = side === "away" ? (home.coaching?.experience || 0) : (away.coaching?.experience || 0);
  const coachingDelta = (chosenCoachExp || 0) - (oppCoachExp || 0);

  // Line movement magnitude (confirmation of value), independent of direction
  const spreadMove = lm ? (lm.movement || 0) : 0;

  // Public imbalance magnitude (persona may choose fade/follow later)
  const publicImbalance = trends ? Math.abs((trends.home || 50) - (trends.away || 50)) : 0;

  // Compose score with weights (sums to 100)
  const marginScore = normalize(statMargin, 10) * 40; // up to ~10 pts differential
  const disciplineScore = normalize(disciplineDelta, 10) * 10;
  const disruptionScore = normalize(disruptionDelta, 4) * 10;
  const coachingScore = normalize(coachingDelta, 10) * 10;
  const movementScore = normalize(spreadMove, 3) * 15;
  const publicSkewScore = normalize(publicImbalance, 50) * 15;

  const rawScore = marginScore + disciplineScore + disruptionScore + coachingScore + movementScore + publicSkewScore;
  const score = clamp(toFixed(rawScore, 2));
  const edge = toFixed(Math.abs(statMargin), 2);

  const reasons: string[] = [
    `Stat margin (PPG vs opp PA): ${statMargin >= 0 ? "AWAY" : "HOME"} ${statMargin >= 0 ? "+" : "-"}${toFixed(Math.abs(statMargin), 2)} pts`,
    `Turnovers delta (opp − chosen): ${disciplineDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(disciplineDelta), 2)}`,
    `Defensive disruption delta (sacks+INTs): ${disruptionDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(disruptionDelta), 2)}`,
    `Coaching experience delta (years): ${coachingDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(coachingDelta), 2)}`,
    `${lm ? `Spread movement: ${toFixed(lm.opening ?? 0, 2)}→${toFixed(lm.current ?? 0, 2)} (${lm.direction})` : 'Spread movement: n/a'}`,
    `Public split (spread): ${trends ? `${trends.home}% home / ${trends.away}% away` : 'n/a'}`
  ];

  return { score, side, edge, reasons };
}

export function computeTotalScore(fb: MinimalFactbook): TotalScore {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const currentTotal = fb.bettingContext?.currentLine?.total || 0;
  const lmTotal = fb.bettingContext?.lineMovement?.total;
  const trends = fb.bettingContext?.bettingTrends?.total;

  const awayPpg = away.statistics.offense.pointsPerGame || 0;
  const homePpg = home.statistics.offense.pointsPerGame || 0;
  const awayPa = away.statistics.defense.pointsAllowed || 0;
  const homePa = home.statistics.defense.pointsAllowed || 0;

  // Simple blended expectation (offense + defense allowed)
  const offensiveTotal = awayPpg + homePpg;
  const defensiveTotal = awayPa + homePa;
  const expected = (offensiveTotal * 0.65) + (defensiveTotal * 0.35);
  const diff = expected - currentTotal; // + => over lean

  const direction: TotalDirection = diff >= 0 ? "over" : "under";
  const edge = toFixed(Math.abs(diff), 2);

  // Movement confirmation
  let moveConfirm = 0;
  if (lmTotal) {
    const sameDirection = (lmTotal.direction === "over" && direction === "over") || (lmTotal.direction === "under" && direction === "under");
    moveConfirm = sameDirection ? (lmTotal.movement || 0) : 0;
  }

  // Public imbalance magnitude (persona decides fade/follow later)
  const publicImbalance = trends ? Math.abs((trends.over || 50) - (trends.under || 50)) : 0;

  // Defensive disruption pushes Under; passing volume pushes Over (very light proxy)
  const awayDisruption = getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions);
  const homeDisruption = getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions);
  const disruptionTotal = (awayDisruption || 0) + (homeDisruption || 0);

  const passingTilt = (away.statistics.offense.passingYards || 0) + (home.statistics.offense.passingYards || 0);

  const edgeScore = normalize(diff, 10) * 40;
  const movementScore = normalize(moveConfirm, 3) * 20;
  const publicSkewScore = normalize(publicImbalance, 50) * 20;
  const disruptionScore = normalize(disruptionTotal, 8) * 10 * (direction === "under" ? 1 : 0.3);
  const paceScore = normalize(passingTilt, 600) * 10 * (direction === "over" ? 1 : 0.3);

  const rawScore = edgeScore + movementScore + publicSkewScore + disruptionScore + paceScore;
  const score = clamp(toFixed(rawScore, 2));

  const reasons: string[] = [
    `Expected total ${toFixed(expected, 2)} vs market ${currentTotal}`,
    `${lmTotal ? `Total movement: ${toFixed(lmTotal.opening ?? 0, 2)}→${toFixed(lmTotal.current ?? 0, 2)} (${lmTotal.direction})` : 'Total movement: n/a'}`,
    `Public split (total): ${trends ? `${trends.over}% over / ${trends.under}% under` : 'n/a'}`,
    `Defensive disruption (combined sacks+INTs): ${toFixed(disruptionTotal, 2)}`,
    `Passing volume proxy (combined pass yards): ${toFixed(passingTilt, 2)}`
  ];

  return { score, direction, edge, reasons };
}

export function computeMoneylineScore(fb: MinimalFactbook): MoneylineScore {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const ml = fb.bettingContext?.lineMovement?.moneyline;
  const trends = fb.bettingContext?.bettingTrends?.moneyline;

  // Strength proxy from offense vs defense (similar to spread stat margin)
  const awayAdv = (away.statistics.offense.pointsPerGame || 0) - (home.statistics.defense.pointsAllowed || 0);
  const homeAdv = (home.statistics.offense.pointsPerGame || 0) - (away.statistics.defense.pointsAllowed || 0);
  const statMargin = awayAdv - homeAdv; // + => away edge

  // Record (win%) as rough form proxy
  const formDelta = (away.record.winPercentage || 0) - (home.record.winPercentage || 0); // + => away edge

  const side: SpreadSide = (statMargin + formDelta) >= 0 ? "away" : "home";
  const edge = toFixed(Math.abs(statMargin + formDelta), 2);

  // Moneyline movement magnitude (steam)
  let steam = 0;
  let chosenMl: { opening?: number; current?: number } | undefined;
  if (ml) {
    chosenMl = side === "away" ? ml.away : ml.home;
    steam = chosenMl ? Math.abs((chosenMl.current || 0) - (chosenMl.opening || 0)) : 0;
  }

  // Public imbalance magnitude
  const publicImbalance = trends ? Math.abs((trends.home || 50) - (trends.away || 50)) : 0;

  const statScore = normalize(statMargin, 10) * 35;
  const formScore = normalize(formDelta, 0.5) * 20; // win% delta up to ~0.5
  const steamScore = normalize(steam, 60) * 25; // ML cents movement
  const publicSkewScore = normalize(publicImbalance, 50) * 20;

  const rawScore = statScore + formScore + steamScore + publicSkewScore;
  const score = clamp(toFixed(rawScore, 2));

  const reasons: string[] = [
    `Stat margin (PPG vs opp PA): ${statMargin >= 0 ? "AWAY" : "HOME"} ${statMargin >= 0 ? "+" : "-"}${toFixed(Math.abs(statMargin), 2)}`,
    `Form delta (win%): ${formDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(formDelta), 3)}`,
    `${ml && chosenMl ? `Moneyline movement (${side}): ${toFixed((chosenMl.opening ?? 0), 0)}→${toFixed((chosenMl.current ?? 0), 0)} (${toFixed(steam, 2)} cents)` : 'Moneyline movement: n/a'}`,
    `Public split (moneyline): ${trends ? `${trends.home}% home / ${trends.away}% away` : 'n/a'}`
  ];

  return { score, side, edge, reasons };
}


