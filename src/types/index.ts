export interface Fiber {
  id: string;
  name: string;
  avgLength_mm: number;
  minBeating_SR: number;
  maxBeating_SR: number;
  origin: string;
  unitPrice: number;
  note: string;
  createdAt: string;
}

export interface SizingAgent {
  id: string;
  name: string;
  source: string;
  minDose_pct: number;
  maxDose_pct: number;
  suspensionLevel: number;
  note: string;
  createdAt: string;
}

export interface FiberMixItem {
  fiberId: string;
  ratio_pct: number;
}

export interface RatioConfig {
  paperType: string;
  targetGrammage: number;
  targetWidth_mm: number;
  targetHeight_mm: number;
  targetThickness_um: number;
  paperUse: string;
  fiberMixture: FiberMixItem[];
  sizingAgentId: string;
  sizingDose_pct: number;
  beatingDegree_SR: number;
  lossRate_pct: number;
  waterVolume_L: number;
  perSwingVolume_mL: number;
  pressPressure_kg: number;
  pressDuration_min: number;
  dryingTemp_C: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  config: RatioConfig;
  tags: string[];
  createdAt: string;
  note: string;
}

export interface ThicknessCellValue {
  value: number | null;
}

export interface Batch {
  id: string;
  batchNo: string;
  recipeId: string | null;
  recipeSnapshot?: Recipe | null;
  date: string;
  configSnapshot: RatioConfig;
  thicknessGrid: (number | null)[];
  gridSize: number;
  tolerance_pct: number;
  targetGrammage: number;
  actualAvgGrammage: number;
  actualThickness_um: number;
  uniformityCV_pct: number;
  maxDeviation_pct: number;
  qualityLevel: '优' | '良' | '合格' | '不合格';
  uniformityLevel: '优' | '良' | '合格' | '不合格';
  issues: string[];
  warnings: string[];
  operator: string;
  note: string;
  createdAt: string;
}

export interface RatioResult {
  dryPulpWeight_g: number;
  area_m2: number;
  pulpConcentration_pct: number;
  totalPulpVolume_mL: number;
  swingCount: number;
  fiberBreakdown: { fiber: Fiber; weight_g: number; ratio_pct: number }[];
  sizingWeight_g: number;
  tearScore: number;
  burstScore: number;
  strengthScore: number;
  uniformityPrediction: number;
  suspensionScore: number;
  releaseScore: number;
  pressWaterLoss_pct: number;
  shrinkageWidth_pct: number;
  shrinkageHeight_pct: number;
  smoothnessScore: number;
  sizingDoseStatus: '不足' | '合理' | '过量';
  beatingStatus: '偏轻' | '合理' | '偏重';
}

export interface DeviationInfo {
  index: number;
  value: number;
  deviation_pct: number;
  isOverTolerance: boolean;
  isHigh: boolean;
}
