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

// Debug/trace structures
export type ScoringComponent = {
  value: number;
  normalized: number;
  weight: number;
  contribution: number;
  description: string;
};

export type SpreadScoreDebug = SpreadScore & {
  components: {
    margin: ScoringComponent;
    discipline: ScoringComponent;
    disruption: ScoringComponent;
    coaching: ScoringComponent;
    movement: ScoringComponent;
    publicSkew: ScoringComponent;
  };
  inputs: Record<string, number | string | undefined>;
  formula: string;
};

export type TotalScoreDebug = TotalScore & {
  components: {
    edge: ScoringComponent;
    movement: ScoringComponent;
    publicSkew: ScoringComponent;
    disruption: ScoringComponent;
    pace: ScoringComponent;
  };
  inputs: Record<string, number | string | undefined>;
  formula: string;
};

export type MoneylineScoreDebug = MoneylineScore & {
  components: {
    stat: ScoringComponent;
    form: ScoringComponent;
    steam: ScoringComponent;
    publicSkew: ScoringComponent;
  };
  inputs: Record<string, number | string | undefined>;
  formula: string;
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

export function computeSpreadScoreDebug(fb: MinimalFactbook): SpreadScoreDebug {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const lm = fb.bettingContext?.lineMovement?.spread;
  const trends = fb.bettingContext?.bettingTrends?.spread;

  const awayAdv = (away.statistics.offense.pointsPerGame || 0) - (home.statistics.defense.pointsAllowed || 0);
  const homeAdv = (home.statistics.offense.pointsPerGame || 0) - (away.statistics.defense.pointsAllowed || 0);
  const statMargin = awayAdv - homeAdv;
  const side: SpreadSide = statMargin >= 0 ? "away" : "home";

  const chosenOffTo = side === "away" ? away.statistics.offense.turnovers : home.statistics.offense.turnovers;
  const oppOffTo = side === "away" ? home.statistics.offense.turnovers : away.statistics.offense.turnovers;
  const disciplineDelta = (oppOffTo || 0) - (chosenOffTo || 0);

  const chosenDefDisruption = side === "away"
    ? getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions)
    : getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions);
  const oppDefDisruption = side === "away"
    ? getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions)
    : getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions);
  const disruptionDelta = (chosenDefDisruption || 0) - (oppDefDisruption || 0);

  const chosenCoachExp = side === "away" ? (away.coaching?.experience || 0) : (home.coaching?.experience || 0);
  const oppCoachExp = side === "away" ? (home.coaching?.experience || 0) : (away.coaching?.experience || 0);
  const coachingDelta = (chosenCoachExp || 0) - (oppCoachExp || 0);

  const spreadMove = lm ? (lm.movement || 0) : 0;
  const publicImbalance = trends ? Math.abs((trends.home || 50) - (trends.away || 50)) : 0;

  const marginNorm = normalize(statMargin, 10);
  const disciplineNorm = normalize(disciplineDelta, 10);
  const disruptionNorm = normalize(disruptionDelta, 4);
  const coachingNorm = normalize(coachingDelta, 10);
  const movementNorm = normalize(spreadMove, 3);
  const publicNorm = normalize(publicImbalance, 50);

  const components = {
    margin: { value: toFixed(statMargin,2), normalized: toFixed(marginNorm,3), weight: 40, contribution: toFixed(marginNorm*40,2), description: "Stat margin (PPG vs opp PA)" },
    discipline: { value: toFixed(disciplineDelta,2), normalized: toFixed(disciplineNorm,3), weight: 10, contribution: toFixed(disciplineNorm*10,2), description: "Turnovers delta (opp − chosen)" },
    disruption: { value: toFixed(disruptionDelta,2), normalized: toFixed(disruptionNorm,3), weight: 10, contribution: toFixed(disruptionNorm*10,2), description: "Defensive disruption delta (sacks+INTs)" },
    coaching: { value: toFixed(coachingDelta,2), normalized: toFixed(coachingNorm,3), weight: 10, contribution: toFixed(coachingNorm*10,2), description: "Coaching experience delta (years)" },
    movement: { value: toFixed(spreadMove,2), normalized: toFixed(movementNorm,3), weight: 15, contribution: toFixed(movementNorm*15,2), description: "Spread movement magnitude" },
    publicSkew: { value: toFixed(publicImbalance,2), normalized: toFixed(publicNorm,3), weight: 15, contribution: toFixed(publicNorm*15,2), description: "Public split magnitude" }
  } as const;

  const score = clamp(toFixed(components.margin.contribution + components.discipline.contribution + components.disruption.contribution + components.coaching.contribution + components.movement.contribution + components.publicSkew.contribution, 2));
  const edge = toFixed(Math.abs(statMargin), 2);

  const reasons: string[] = [
    `Stat margin (PPG vs opp PA): ${statMargin >= 0 ? "AWAY" : "HOME"} ${statMargin >= 0 ? "+" : "-"}${toFixed(Math.abs(statMargin), 2)} pts`,
    `Turnovers delta (opp − chosen): ${disciplineDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(disciplineDelta), 2)}`,
    `Defensive disruption delta (sacks+INTs): ${disruptionDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(disruptionDelta), 2)}`,
    `Coaching experience delta (years): ${coachingDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(coachingDelta), 2)}`,
    `${lm ? `Spread movement: ${toFixed(lm.opening ?? 0, 2)}→${toFixed(lm.current ?? 0, 2)} (${lm.direction})` : 'Spread movement: n/a'}`,
    `Public split (spread): ${trends ? `${trends.home}% home / ${trends.away}% away` : 'n/a'}`
  ];

  const inputs: Record<string, number | string | undefined> = {
    awayOffPPG: away.statistics.offense.pointsPerGame,
    homeDefPA: home.statistics.defense.pointsAllowed,
    homeOffPPG: home.statistics.offense.pointsPerGame,
    awayDefPA: away.statistics.defense.pointsAllowed,
    chosenOffTurnovers: chosenOffTo,
    oppOffTurnovers: oppOffTo,
    chosenDefDisruption,
    oppDefDisruption,
    chosenCoachExp,
    oppCoachExp,
    lm_open: lm?.opening,
    lm_current: lm?.current,
    lm_movement: lm?.movement,
    trends_home: trends?.home,
    trends_away: trends?.away
  };

  const formula = "score = 40*norm(statMargin/10) + 10*norm(disciplineDelta/10) + 10*norm(disruptionDelta/4) + 10*norm(coachingDelta/10) + 15*norm(spreadMove/3) + 15*norm(publicImbalance/50)";

  return { score, side, edge, reasons, components, inputs, formula };
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

export function computeTotalScoreDebug(fb: MinimalFactbook): TotalScoreDebug {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const currentTotal = fb.bettingContext?.currentLine?.total || 0;
  const lmTotal = fb.bettingContext?.lineMovement?.total;
  const trends = fb.bettingContext?.bettingTrends?.total;

  const awayPpg = away.statistics.offense.pointsPerGame || 0;
  const homePpg = home.statistics.offense.pointsPerGame || 0;
  const awayPa = away.statistics.defense.pointsAllowed || 0;
  const homePa = home.statistics.defense.pointsAllowed || 0;

  const offensiveTotal = awayPpg + homePpg;
  const defensiveTotal = awayPa + homePa;
  const expected = (offensiveTotal * 0.65) + (defensiveTotal * 0.35);
  const diff = expected - currentTotal;
  const direction: TotalDirection = diff >= 0 ? "over" : "under";
  const edge = toFixed(Math.abs(diff), 2);

  let moveConfirm = 0;
  if (lmTotal) {
    const sameDirection = (lmTotal.direction === "over" && direction === "over") || (lmTotal.direction === "under" && direction === "under");
    moveConfirm = sameDirection ? (lmTotal.movement || 0) : 0;
  }

  const publicImbalance = trends ? Math.abs((trends.over || 50) - (trends.under || 50)) : 0;
  const awayDisruption = getDefenseDisruption(away.statistics.defense.sacks, away.statistics.defense.interceptions);
  const homeDisruption = getDefenseDisruption(home.statistics.defense.sacks, home.statistics.defense.interceptions);
  const disruptionTotal = (awayDisruption || 0) + (homeDisruption || 0);
  const passingTilt = (away.statistics.offense.passingYards || 0) + (home.statistics.offense.passingYards || 0);

  const edgeNorm = normalize(diff, 10);
  const movementNorm = normalize(moveConfirm, 3);
  const publicNorm = normalize(publicImbalance, 50);
  const disruptionNorm = normalize(disruptionTotal, 8);
  const paceNorm = normalize(passingTilt, 600);

  const components = {
    edge: { value: toFixed(diff,2), normalized: toFixed(edgeNorm,3), weight: 40, contribution: toFixed(edgeNorm*40,2), description: "Expected vs market (points)" },
    movement: { value: toFixed(moveConfirm,2), normalized: toFixed(movementNorm,3), weight: 20, contribution: toFixed(movementNorm*20,2), description: "Movement aligned with direction" },
    publicSkew: { value: toFixed(publicImbalance,2), normalized: toFixed(publicNorm,3), weight: 20, contribution: toFixed(publicNorm*20,2), description: "Public O/U split magnitude" },
    disruption: { value: toFixed(disruptionTotal,2), normalized: toFixed(disruptionNorm,3), weight: 10, contribution: toFixed(disruptionNorm*10*(direction === 'under' ? 1 : 0.3),2), description: "Defensive disruption (sacks+INTs)" },
    pace: { value: toFixed(passingTilt,2), normalized: toFixed(paceNorm,3), weight: 10, contribution: toFixed(paceNorm*10*(direction === 'over' ? 1 : 0.3),2), description: "Passing volume proxy" }
  } as const;

  const score = clamp(toFixed(
    components.edge.contribution +
    components.movement.contribution +
    components.publicSkew.contribution +
    components.disruption.contribution +
    components.pace.contribution,
  2));

  const reasons: string[] = [
    `Expected total ${toFixed(expected, 2)} vs market ${currentTotal}`,
    `${lmTotal ? `Total movement: ${toFixed(lmTotal.opening ?? 0, 2)}→${toFixed(lmTotal.current ?? 0, 2)} (${lmTotal.direction})` : 'Total movement: n/a'}`,
    `Public split (total): ${trends ? `${trends.over}% over / ${trends.under}% under` : 'n/a'}`,
    `Defensive disruption (combined sacks+INTs): ${toFixed(disruptionTotal, 2)}`,
    `Passing volume proxy (combined pass yards): ${toFixed(passingTilt, 2)}`
  ];

  const inputs: Record<string, number | string | undefined> = {
    currentTotal,
    expected,
    awayOffPPG: awayPpg,
    homeOffPPG: homePpg,
    awayDefPA: awayPa,
    homeDefPA: homePa,
    lm_open: lmTotal?.opening,
    lm_current: lmTotal?.current,
    lm_movement: lmTotal?.movement,
    trends_over: trends?.over,
    trends_under: trends?.under,
    disruptionTotal,
    passingTilt
  };

  const formula = "score = 40*norm(diff/10) + 20*norm(moveConfirm/3) + 20*norm(publicImbalance/50) + 10*norm(disruption/8)*(under bias) + 10*norm(passingTilt/600)*(over bias)";

  return { score, direction, edge, reasons, components, inputs, formula };
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

export function computeMoneylineScoreDebug(fb: MinimalFactbook): MoneylineScoreDebug {
  const away = fb.teams.away;
  const home = fb.teams.home;
  const ml = fb.bettingContext?.lineMovement?.moneyline;
  const trends = fb.bettingContext?.bettingTrends?.moneyline;

  const awayAdv = (away.statistics.offense.pointsPerGame || 0) - (home.statistics.defense.pointsAllowed || 0);
  const homeAdv = (home.statistics.offense.pointsPerGame || 0) - (away.statistics.defense.pointsAllowed || 0);
  const statMargin = awayAdv - homeAdv;
  const formDelta = (away.record.winPercentage || 0) - (home.record.winPercentage || 0);
  const side: SpreadSide = (statMargin + formDelta) >= 0 ? "away" : "home";

  let steam = 0;
  let chosenMl: { opening?: number; current?: number } | undefined;
  if (ml) {
    chosenMl = side === "away" ? ml.away : ml.home;
    steam = chosenMl ? Math.abs((chosenMl.current || 0) - (chosenMl.opening || 0)) : 0;
  }
  const publicImbalance = trends ? Math.abs((trends.home || 50) - (trends.away || 50)) : 0;

  const statNorm = normalize(statMargin, 10);
  const formNorm = normalize(formDelta, 0.5);
  const steamNorm = normalize(steam, 60);
  const publicNorm = normalize(publicImbalance, 50);

  const components = {
    stat: { value: toFixed(statMargin,2), normalized: toFixed(statNorm,3), weight: 35, contribution: toFixed(statNorm*35,2), description: "Stat margin (PPG vs opp PA)" },
    form: { value: toFixed(formDelta,3), normalized: toFixed(formNorm,3), weight: 20, contribution: toFixed(formNorm*20,2), description: "Record delta (win%)" },
    steam: { value: toFixed(steam,2), normalized: toFixed(steamNorm,3), weight: 25, contribution: toFixed(steamNorm*25,2), description: "Moneyline movement (cents)" },
    publicSkew: { value: toFixed(publicImbalance,2), normalized: toFixed(publicNorm,3), weight: 20, contribution: toFixed(publicNorm*20,2), description: "Public ML split magnitude" }
  } as const;

  const score = clamp(toFixed(components.stat.contribution + components.form.contribution + components.steam.contribution + components.publicSkew.contribution, 2));
  const edge = toFixed(Math.abs(statMargin + formDelta), 2);

  const reasons: string[] = [
    `Stat margin (PPG vs opp PA): ${statMargin >= 0 ? "AWAY" : "HOME"} ${statMargin >= 0 ? "+" : "-"}${toFixed(Math.abs(statMargin), 2)}`,
    `Form delta (win%): ${formDelta >= 0 ? "+" : "-"}${toFixed(Math.abs(formDelta), 3)}`,
    `${ml && chosenMl ? `Moneyline movement (${side}): ${toFixed((chosenMl.opening ?? 0), 0)}→${toFixed((chosenMl.current ?? 0), 0)} (${toFixed(steam, 2)} cents)` : 'Moneyline movement: n/a'}`,
    `Public split (moneyline): ${trends ? `${trends.home}% home / ${trends.away}% away` : 'n/a'}`
  ];

  const inputs: Record<string, number | string | undefined> = {
    awayOffPPG: away.statistics.offense.pointsPerGame,
    homeDefPA: home.statistics.defense.pointsAllowed,
    homeOffPPG: home.statistics.offense.pointsPerGame,
    awayDefPA: away.statistics.defense.pointsAllowed,
    awayWinPct: away.record.winPercentage,
    homeWinPct: home.record.winPercentage,
    ml_open: chosenMl?.opening,
    ml_current: chosenMl?.current,
    ml_steam: steam,
    trends_home: trends?.home,
    trends_away: trends?.away
  };

  const formula = "score = 35*norm(statMargin/10) + 20*norm(formDelta/0.5) + 25*norm(steam/60) + 20*norm(publicImbalance/50)";

  return { score, side, edge, reasons, components, inputs, formula };
}


