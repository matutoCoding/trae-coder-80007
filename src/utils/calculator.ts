import type { Fiber, SizingAgent, RatioConfig, RatioResult } from '@/types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function round(num: number, digits = 2) {
  const f = Math.pow(10, digits);
  return Math.round(num * f) / f;
}

export interface CalcInput {
  config: RatioConfig;
  fibers: Fiber[];
  sizingAgents: SizingAgent[];
}

export function calcRatio({ config, fibers, sizingAgents }: CalcInput): RatioResult | null {
  if (!config.targetGrammage || !config.targetWidth_mm || !config.targetHeight_mm) return null;
  if (!config.fiberMixture.length) return null;

  const area_m2 = (config.targetWidth_mm * config.targetHeight_mm) / 1e6;
  const lossFactor = 1 + (config.lossRate_pct || 0) / 100;
  const dryPulpWeight_g = round(config.targetGrammage * area_m2 * lossFactor);

  const totalRatio = config.fiberMixture.reduce((s, m) => s + (m.ratio_pct || 0), 0);
  if (totalRatio <= 0) return null;

  const fiberBreakdown = config.fiberMixture
    .map((m) => {
      const fiber = fibers.find((f) => f.id === m.fiberId);
      if (!fiber) return null;
      const normalizedRatio = (m.ratio_pct / totalRatio) * 100;
      const weight_g = round((dryPulpWeight_g * normalizedRatio) / 100);
      return { fiber, weight_g, ratio_pct: round(normalizedRatio, 1) };
    })
    .filter(Boolean) as RatioResult['fiberBreakdown'];

  const water_g = (config.waterVolume_L || 0) * 1000;
  const pulpConcentration_pct = round(dryPulpWeight_g / (dryPulpWeight_g + water_g) * 100, 3);
  const pulpDensity_gmL = pulpConcentration_pct / 100;
  const totalPulpVolume_mL = round(dryPulpWeight_g / (pulpDensity_gmL || 1));
  const perSwing = config.perSwingVolume_mL || 500;
  const swingCount = Math.max(1, Math.round(totalPulpVolume_mL / perSwing));

  const sizingAgent = sizingAgents.find((s) => s.id === config.sizingAgentId);
  const sizingWeight_g = round((dryPulpWeight_g * (config.sizingDose_pct || 0)) / 100, 3);

  let sizingDoseStatus: RatioResult['sizingDoseStatus'] = '合理';
  if (sizingAgent) {
    if (config.sizingDose_pct < sizingAgent.minDose_pct) sizingDoseStatus = '不足';
    else if (config.sizingDose_pct > sizingAgent.maxDose_pct) sizingDoseStatus = '过量';
  }

  let beatingStatus: RatioResult['beatingStatus'] = '合理';
  const beat = config.beatingDegree_SR || 0;
  const avgMix = fiberBreakdown.reduce((s, b) => s + ((b.fiber.minBeating_SR + b.fiber.maxBeating_SR) / 2) * b.ratio_pct / 100, 0);
  const reasonableMin = Math.max(25, avgMix - 10);
  const reasonableMax = Math.min(80, avgMix + 10);
  if (beat < reasonableMin) beatingStatus = '偏轻';
  else if (beat > reasonableMax) beatingStatus = '偏重';

  const tearScore = computeTear(fiberBreakdown, beat);
  const burstScore = computeBurst(fiberBreakdown, beat);
  const strengthScore = round((tearScore + burstScore) / 2);
  const uniformityPrediction = computeUniformityPred(fiberBreakdown, beat, sizingDoseStatus);
  const suspensionScore = computeSuspension(sizingAgent, config.sizingDose_pct, sizingDoseStatus);
  const releaseScore = computeRelease(sizingDoseStatus, suspensionScore);

  const pressWaterLoss_pct = round(Math.min(45, 30 + (config.pressPressure_kg || 30) * 0.25 + (config.pressDuration_min || 10) * 0.3), 1);
  const shrinkageWidth_pct = round(1.5 + (config.dryingTemp_C || 25) * 0.03, 2);
  const shrinkageHeight_pct = round(2.5 + (config.dryingTemp_C || 25) * 0.04, 2);
  const smoothnessScore = round(60 + (config.pressPressure_kg || 30) * 0.3 - Math.abs(60 - (config.dryingTemp_C || 25)) * 0.6 + (suspensionScore >= 70 ? 10 : 0));

  return {
    dryPulpWeight_g,
    area_m2: round(area_m2, 4),
    pulpConcentration_pct,
    totalPulpVolume_mL,
    swingCount,
    fiberBreakdown,
    sizingWeight_g,
    tearScore,
    burstScore,
    strengthScore,
    uniformityPrediction,
    suspensionScore,
    releaseScore,
    pressWaterLoss_pct,
    shrinkageWidth_pct,
    shrinkageHeight_pct,
    smoothnessScore,
    sizingDoseStatus,
    beatingStatus,
  };
}

function computeTear(breakdown: RatioResult['fiberBreakdown'], beat: number) {
  let base = 0;
  for (const b of breakdown) {
    const len = b.fiber.avgLength_mm;
    const score = Math.min(100, 30 + len * 14);
    base += score * b.ratio_pct / 100;
  }
  const beatFactor = beat < 20 ? 0.6 : beat < 40 ? 0.95 : beat < 60 ? 1.0 : beat < 75 ? 0.85 : 0.6;
  return clamp0100(round(base * beatFactor));
}

function computeBurst(breakdown: RatioResult['fiberBreakdown'], beat: number) {
  let base = 0;
  for (const b of breakdown) {
    const len = b.fiber.avgLength_mm;
    const score = Math.min(100, 25 + len * 10 + Math.min(30, beat * 0.8));
    base += score * b.ratio_pct / 100;
  }
  const beatFactor = beat < 25 ? 0.7 : beat < 45 ? 1.0 : beat < 65 ? 1.05 : beat < 80 ? 0.9 : 0.7;
  return clamp0100(round(base * beatFactor));
}

function computeUniformityPred(breakdown: RatioResult['fiberBreakdown'], beat: number, szStatus: RatioResult['sizingDoseStatus']) {
  let base = 60;
  const avgLen = breakdown.reduce((s, b) => s + b.fiber.avgLength_mm * b.ratio_pct / 100, 0);
  base += Math.min(15, avgLen * 3);
  base += beat < 30 ? -10 : beat < 55 ? 15 : beat < 70 ? 5 : -8;
  if (szStatus === '不足') base -= 22;
  else if (szStatus === '过量') base -= 8;
  else base += 10;
  return clamp0100(round(base));
}

function computeSuspension(agent: SizingAgent | undefined, dose_pct: number, status: RatioResult['sizingDoseStatus']) {
  if (!agent) return 40;
  let base = 30 + agent.suspensionLevel * 10;
  if (status === '不足') base = Math.max(20, base - 35);
  else if (status === '过量') base = Math.min(95, base + 5);
  else {
    const mid = (agent.minDose_pct + agent.maxDose_pct) / 2;
    const bonus = Math.max(0, 15 - Math.abs(dose_pct - mid) * 8);
    base += bonus;
  }
  return clamp0100(round(base));
}

function computeRelease(status: RatioResult['sizingDoseStatus'], suspension: number) {
  let base = 55 + suspension * 0.3;
  if (status === '不足') base -= 30;
  else if (status === '过量') base += 5;
  return clamp0100(round(base));
}

function clamp0100(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function reverseRatioFromTarget(
  targetGrammage: number,
  paperUse: string,
  fibers: Fiber[],
): Partial<RatioConfig> {
  let beatingDegree_SR = 45;
  let fiberMixture = fibers.slice(0, 2).map((f, i) => ({
    fiberId: f.id,
    ratio_pct: i === 0 ? 70 : 30,
  }));
  if (!fiberMixture.length && fibers[0]) {
    fiberMixture = [{ fiberId: fibers[0].id, ratio_pct: 100 }];
  }

  switch (paperUse) {
    case '书画':
      beatingDegree_SR = 38;
      break;
    case '古籍印刷':
      beatingDegree_SR = 42;
      break;
    case '包装用纸':
      beatingDegree_SR = 32;
      break;
    case '工艺灯笼/剪纸':
      beatingDegree_SR = 50;
      break;
    case '临摹/拓印':
      beatingDegree_SR = 55;
      break;
  }

  if (targetGrammage < 30) beatingDegree_SR += 8;
  else if (targetGrammage > 100) beatingDegree_SR -= 6;

  return {
    beatingDegree_SR,
    fiberMixture,
    lossRate_pct: 8,
    sizingDose_pct: 0.7,
    waterVolume_L: targetGrammage < 40 ? 40 : targetGrammage < 80 ? 30 : 25,
    perSwingVolume_mL: 500,
    pressPressure_kg: 30,
    pressDuration_min: 15,
    dryingTemp_C: 28,
  };
}
