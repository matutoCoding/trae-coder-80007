import type { DeviationInfo } from '@/types';

export function detectDeviation(
  grid: (number | null)[],
  targetValue: number,
  tolerance_pct: number,
): DeviationInfo[] {
  return grid.map((v, i) => {
    if (v === null || v === undefined) {
      return { index: i, value: 0, deviation_pct: 0, isOverTolerance: false, isHigh: false };
    }
    const dev = targetValue > 0 ? ((v - targetValue) / targetValue) * 100 : 0;
    return {
      index: i,
      value: v,
      deviation_pct: Math.round(dev * 10) / 10,
      isOverTolerance: Math.abs(dev) > tolerance_pct,
      isHigh: dev > 0,
    };
  });
}

export function computeStats(grid: (number | null)[]) {
  const valid = grid.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  if (!valid.length) return { mean: 0, cv: 0, max: 0, min: 0, count: 0 };
  const mean = valid.reduce((s, n) => s + n, 0) / valid.length;
  const variance = valid.reduce((s, n) => s + (n - mean) ** 2, 0) / valid.length;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  return {
    mean: round2(mean),
    cv: round2(cv),
    max: Math.max(...valid),
    min: Math.min(...valid),
    count: valid.length,
  };
}

export function uniformityLevel(cv: number): '优' | '良' | '合格' | '不合格' {
  if (cv < 5) return '优';
  if (cv < 10) return '良';
  if (cv < 15) return '合格';
  return '不合格';
}

export function qualityLevel(
  cv: number,
  maxDev: number,
  tolerance_pct: number,
): '优' | '良' | '合格' | '不合格' {
  if (cv < 5 && Math.abs(maxDev) <= tolerance_pct) return '优';
  if (cv < 10 && Math.abs(maxDev) <= tolerance_pct + 3) return '良';
  if (cv < 15) return '合格';
  return '不合格';
}

export function markFlocculationZones(devs: DeviationInfo[]) {
  return devs
    .filter((d) => d.isOverTolerance && d.isHigh)
    .map((d) => d.index);
}

export function generateWarnings(
  devs: DeviationInfo[],
  cv: number,
  suspensionScore: number | undefined,
  releaseScore: number | undefined,
) {
  const warns: string[] = [];
  const issues: string[] = [];
  const overHigh = devs.filter((d) => d.isOverTolerance && d.isHigh);
  const overLow = devs.filter((d) => d.isOverTolerance && !d.isHigh);

  if (overHigh.length >= 3) {
    warns.push(`检测到 ${overHigh.length} 处偏厚云絮区：${overHigh.map((d) => zoneLabel(d.index, devs.length)).join('、')}，可能是纸浆絮聚或荡料时浆团沉积所致，建议打散浆团后再抄。`);
    issues.push('云絮/絮聚');
  } else if (overHigh.length > 0) {
    warns.push(`厚区 ${overHigh.map((d) => zoneLabel(d.index, devs.length)).join('、')} 偏厚超差，注意入帘时荡料手势均匀。`);
  }

  if (overLow.length >= 3) {
    warns.push(`薄区 ${overLow.map((d) => zoneLabel(d.index, devs.length)).join('、')} 偏薄明显，帘面受力不均或料浆不足，建议补浆并平稳荡帘。`);
    issues.push('帘纹薄区');
  } else if (overLow.length > 0) {
    warns.push(`${overLow.map((d) => zoneLabel(d.index, devs.length)).join('、')} 偏薄，揭纸时易破损。`);
  }

  if (cv >= 10) {
    warns.push(`整体匀度变异系数 CV=${cv.toFixed(1)}%，匀度偏差较大，需调整打浆度或纸药用量。`);
    issues.push('匀度差');
  }

  if (suspensionScore !== undefined && suspensionScore < 50) {
    warns.push(`纤维悬浮评分 ${suspensionScore.toFixed(0)} 偏低，絮聚风险高，建议检查纸药种类或适当增加用量。`);
    issues.push('悬浮性不足');
  }
  if (releaseScore !== undefined && releaseScore < 55) {
    warns.push(`揭纸顺畅度评分 ${releaseScore.toFixed(0)} 偏低，揭纸破损风险高，压榨后应静置片刻再湿揭。`);
    issues.push('揭纸破损风险');
  }

  return { warnings: warns, issues };
}

export function assessReleaseRisk(devs: DeviationInfo[], releaseScore: number | undefined) {
  const lowCells = devs.filter((d) => d.isOverTolerance && !d.isHigh).length;
  let level: '低' | '中' | '高' = '低';
  let score = releaseScore ?? 70;
  if (lowCells >= 3 || score < 45) level = '高';
  else if (lowCells >= 1 || score < 60) level = '中';

  let assessment = '';
  const suggestions: string[] = [];

  if (level === '高') {
    assessment = '揭纸破损风险较高，需谨慎操作';
    suggestions.push('建议湿揭前静置3-5分钟，让纤维充分氢键结合');
    suggestions.push('可适当增加纸药用量，提升纤维悬浮性');
    suggestions.push('揭纸速度放慢，角度保持45度');
  } else if (level === '中') {
    assessment = '有一定揭纸风险，需留意操作细节';
    suggestions.push('湿揭时注意帘面湿度均匀');
    suggestions.push('局部偏薄区域需格外小心');
  } else {
    assessment = '揭纸条件良好，可正常操作';
    suggestions.push('保持当前工艺参数即可');
  }

  return { level, score: round2(score), assessment, suggestions };
}

function zoneLabel(i: number, total: number) {
  const side = total === 16 ? 4 : 3;
  const r = Math.floor(i / side) + 1;
  const c = (i % side) + 1;
  const rowNames = ['上', '中', '下', '底'];
  const colNames = ['左', '中', '右', '末'];
  return (total === 16 ? `R${r}C${c}` : `${rowNames[r - 1]}${colNames[c - 1]}`);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
