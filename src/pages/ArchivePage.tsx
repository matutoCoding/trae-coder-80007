import { useState, useMemo, useEffect } from 'react';
import {
  FileArchive, Search, Filter, Calendar, FileText, Trash2, ChevronRight, X,
  Layers, Scale, Gauge, AlertTriangle, CheckCircle, User,
  GitCompare, CheckSquare, Square, ArrowRight, Plus, Hand, Paperclip, Sun,
  BarChart3, LineChart, AlertOctagon, Wind, Sparkles, Eye, ChevronDown, ChevronUp,
  ListFilter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import type { Batch, RatioConfig, RecipeVersion } from '@/types';
import { detectDeviation } from '@/utils/thickness';

interface PaperTypeSummary {
  paperType: string;
  batchCount: number;
  avgCV: number;
  avgMaxDev: number;
  overToleranceCount: number;
  releaseIssues: number;
  avgGrammageDeviation_pct: number;
  lastBatchDate: string;
  qualityDist: Record<string, number>;
  recentBatches: Batch[];
  batches: Batch[];
}

const QUALITY_SCORE: Record<string, number> = { '优': 4, '良': 3, '合格': 2, '不合格': 1 };
const PARAM_IMPACT_KEYS: Array<{ key: keyof RatioConfig; label: string; unit: string }> = [
  { key: 'beatingDegree_SR', label: '打浆度', unit: '°SR' },
  { key: 'sizingDose_pct', label: '纸药用量', unit: '%' },
  { key: 'pressPressure_kg', label: '压榨压力', unit: 'kg' },
  { key: 'pressDuration_min', label: '压榨时长', unit: 'min' },
  { key: 'dryingTemp_C', label: '晒纸温度', unit: '°C' },
  { key: 'perSwingVolume_mL', label: '入帘浆量', unit: 'mL' },
  { key: 'waterVolume_L', label: '用水量', unit: 'L' },
];

export default function ArchivePage() {
  const batches = usePaperStore((s) => s.batches);
  const removeBatch = usePaperStore((s) => s.removeBatch);
  const selectBatch = usePaperStore((s) => s.selectBatch);
  const selectedId = usePaperStore((s) => s.selectedBatchId);
  const setRatioConfig = usePaperStore((s) => s.setRatioConfig);
  const compareBatchIds = usePaperStore((s) => s.compareBatchIds);
  const toggleCompareBatch = usePaperStore((s) => s.toggleCompareBatch);
  const clearCompareBatches = usePaperStore((s) => s.clearCompareBatches);
  const addRecipeVersion = usePaperStore((s) => s.addRecipeVersion);
  const recipes = usePaperStore((s) => s.recipes);
  const navigate = useNavigate();

  const [kw, setKw] = useState('');
  const [qlFilter, setQlFilter] = useState<string>('全部');
  const [compareMode, setCompareMode] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [selectedPaperType, setSelectedPaperType] = useState<string | null>(null);
  const [expandedPaperTypes, setExpandedPaperTypes] = useState<Set<string>>(new Set());
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    batchId: string;
    recipeId: string;
    recipeName: string;
  } | null>(null);

  const togglePaperTypeExpand = (paperType: string) => {
    setExpandedPaperTypes((prev) => {
      const next = new Set(prev);
      if (next.has(paperType)) next.delete(paperType);
      else next.add(paperType);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (qlFilter !== '全部' && b.qualityLevel !== qlFilter) return false;
      if (selectedPaperType && b.configSnapshot.paperType !== selectedPaperType) return false;
      if (!kw.trim()) return true;
      const k = kw.trim().toLowerCase();
      return (
        b.batchNo.toLowerCase().includes(k) ||
        b.configSnapshot.paperType.toLowerCase().includes(k) ||
        b.operator.toLowerCase().includes(k)
      );
    });
  }, [batches, kw, qlFilter, selectedPaperType]);

  const stabilitySummary = useMemo((): PaperTypeSummary[] => {
    const map = new Map<string, Batch[]>();
    batches.forEach((b) => {
      const pt = b.configSnapshot.paperType;
      if (!map.has(pt)) map.set(pt, []);
      map.get(pt)!.push(b);
    });
    return Array.from(map.entries()).map(([paperType, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const recent = sorted.slice(0, 10);
      const avgCV = recent.reduce((s, b) => s + b.uniformityCV_pct, 0) / (recent.length || 1);
      const avgMaxDev = recent.reduce((s, b) => s + b.maxDeviation_pct, 0) / (recent.length || 1);
      const overTol = recent.filter((b) => b.maxDeviation_pct > b.tolerance_pct).length;
      const releaseIssue = recent.filter((b) => b.papermakingRecord && (b.papermakingRecord.releaseSituation === '粘连' || b.papermakingRecord.releaseSituation === '破损')).length;
      const avgGramDev = recent.reduce((s, b) => s + Math.abs(b.actualAvgGrammage - b.targetGrammage) / b.targetGrammage * 100, 0) / (recent.length || 1);
      const qualityDist: Record<string, number> = {};
      recent.forEach((b) => { qualityDist[b.qualityLevel] = (qualityDist[b.qualityLevel] || 0) + 1; });
      return {
        paperType,
        batchCount: recent.length,
        avgCV,
        avgMaxDev,
        overToleranceCount: overTol,
        releaseIssues: releaseIssue,
        avgGrammageDeviation_pct: avgGramDev,
        lastBatchDate: sorted[0]?.createdAt || '',
        qualityDist,
        recentBatches: recent,
        batches: sorted,
      };
    }).sort((a, b) => b.batchCount - a.batchCount);
  }, [batches]);

  const impactAnalysis = useMemo(() => {
    if (!selectedPaperType) return null;
    const targetBatches = batches
      .filter((b) => b.configSnapshot.paperType === selectedPaperType)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
    if (targetBatches.length < 3) return null;

    return PARAM_IMPACT_KEYS.map(({ key, label, unit }) => {
      const values = targetBatches.map((b) => ({
        param: b.configSnapshot[key] as number,
        quality: QUALITY_SCORE[b.qualityLevel] || 2,
        cv: b.uniformityCV_pct,
      }));

      const paramVals = values.map((v) => v.param);
      const minP = Math.min(...paramVals);
      const maxP = Math.max(...paramVals);
      const range = maxP - minP || 1;
      const qualityVals = values.map((v) => v.quality);
      const cvVals = values.map((v) => v.cv);

      const qCorr = pearson(paramVals, qualityVals);
      const cvCorr = pearson(paramVals, cvVals);
      const impactScore = (Math.abs(qCorr) * 0.6 + Math.abs(cvCorr) * 0.4) * 100;

      const avgLow = values.filter((v) => v.param <= minP + range * 0.33).reduce((s, v) => s + v.quality, 0) / (values.filter((v) => v.param <= minP + range * 0.33).length || 1);
      const avgHigh = values.filter((v) => v.param >= maxP - range * 0.33).reduce((s, v) => s + v.quality, 0) / (values.filter((v) => v.param >= maxP - range * 0.33).length || 1);
      const trend = avgHigh > avgLow + 0.3 ? '↑ 调高更好' : avgHigh < avgLow - 0.3 ? '↓ 调低更好' : '→ 影响不大';

      return {
        key,
        label,
        unit,
        impactScore,
        qCorr,
        cvCorr,
        trend,
        range: `${minP}~${maxP}`,
        avgLow: avgLow.toFixed(1),
        avgHigh: avgHigh.toFixed(1),
      };
    }).sort((a, b) => b.impactScore - a.impactScore);
  }, [batches, selectedPaperType]);

  const selected = batches.find((b) => b.id === selectedId) || null;
  const compareBatches = compareBatchIds
    .map((id) => batches.find((b) => b.id === id))
    .filter((b): b is Batch => b !== undefined);

  const loadToRatio = (b: Batch) => {
    setRatioConfig(b.configSnapshot);
    alert('已载入此批次配比到「纸浆配比」页');
  };

  const handleAddToVersion = (b: Batch) => {
    const paperType = b.configSnapshot.paperType;
    const existingRecipe = recipes.find((r) => r.paperType === paperType);

    if (existingRecipe) {
      setPreviewModal({
        open: true,
        batchId: b.id,
        recipeId: existingRecipe.id,
        recipeName: existingRecipe.name,
      });
    } else {
      const shouldCreate = confirm(
        `未找到「${paperType}」的配方，是否创建新配方？\n\n请先前往配方库或配比页创建配方。`
      );
    }
  };

  const confirmAddVersion = (note: string) => {
    if (!previewModal) return;
    addRecipeVersion(previewModal.recipeId, note || '', previewModal.batchId);
    setPreviewModal(null);
    setTimeout(() => {
      navigate('/recipes');
    }, 200);
  };

  const canAddToCompare = (b: Batch) => {
    if (compareBatchIds.includes(b.id)) return true;
    if (compareBatchIds.length >= 3) return false;
    if (compareBatchIds.length === 0) return true;
    const firstPaperType = batches.find((x) => x.id === compareBatchIds[0])?.configSnapshot.paperType;
    return b.configSnapshot.paperType === firstPaperType;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-300">工艺档案</h1>
          <p className="mt-1 text-sm text-ink-100">记录每批抄造的完整参数链，支持稳定性分析、批次对比与配方沉淀</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100" />
            <TextInput
              className="w-64 pl-9"
              placeholder="批次号 / 纸种 / 工匠"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
          </div>
          <Select className="w-36" value={qlFilter} onChange={(e) => setQlFilter(e.target.value)}>
            {['全部', '优', '良', '合格', '不合格'].map((o) => <option key={o}>{o}</option>)}
          </Select>
          <Button
            variant={compareMode ? 'primary' : 'secondary'}
            size="md"
            icon={<GitCompare className="h-4 w-4" />}
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) clearCompareBatches();
            }}
          >
            {compareMode ? `对比模式 (${compareBatchIds.length}/3)` : '批次对比'}
          </Button>
          <Badge tone="ink">共 {filtered.length} 批次</Badge>
        </div>
      </header>

      <StabilityDashboard
        summary={stabilitySummary}
        selectedPaperType={selectedPaperType}
        onSelectPaperType={setSelectedPaperType}
        impactAnalysis={impactAnalysis}
        batches={batches.filter((b) => b.configSnapshot.paperType === selectedPaperType)}
        expandedPaperTypes={expandedPaperTypes}
        onToggleExpand={togglePaperTypeExpand}
      />

      {compareMode && compareBatches.length >= 2 && (
        <PaperCard
          title={`批次对比 · ${compareBatches.map((b) => b.batchNo).join(' vs ')}`}
          subtitle={`${compareBatches[0]?.configSnapshot.paperType} · 共 ${compareBatches.length} 批对比`}
          icon={<GitCompare className="h-5 w-5" />}
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOnlyDiff(!onlyDiff)}
                className={[
                  'flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all',
                  onlyDiff
                    ? 'border-bronze-500 bg-gradient-to-br from-bronze-50 to-rattan-100 text-bronze-700'
                    : 'border-bronze-200 bg-white/60 text-ink-200 hover:border-bronze-300 hover:bg-white',
                ].join(' ')}
              >
                <ListFilter className="h-3.5 w-3.5" />
                只看差异项
              </button>
              <Button variant="ghost" size="sm" onClick={clearCompareBatches}>清空选择</Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-bronze-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-ink-100">指标</th>
                  {compareBatches.map((b) => (
                    <th key={b.id} className="py-2.5 px-3 text-center text-xs font-semibold text-ink-200">
                      <div className="font-display font-bold text-bronze-600">{b.batchNo}</div>
                      <div className="mt-0.5 text-[10px] font-normal">
                        <Badge tone={
                          b.qualityLevel === '优' ? 'bamboo' :
                          b.qualityLevel === '良' ? 'bronze' :
                          b.qualityLevel === '合格' ? 'rattan' : 'cinnabar'
                        } size="sm">{b.qualityLevel}</Badge>
                        <span className="ml-1 text-ink-100">{b.date}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '目标克重', key: 'targetGrammage', unit: 'g/m²', get: (b: Batch) => b.targetGrammage },
                  {
                    label: '实际克重', key: 'actualGrammage', unit: 'g/m²',
                    get: (b: Batch) => b.actualAvgGrammage.toFixed(1),
                    highlight: true,
                    bestMode: 'closest-to-target' as const,
                    targetGetter: (b: Batch) => b.targetGrammage,
                  },
                  { label: '匀度 CV', key: 'cv', unit: '%', get: (b: Batch) => b.uniformityCV_pct.toFixed(2), highlight: true, lowerIsBetter: true },
                  { label: '最大偏差', key: 'maxDev', unit: '%', get: (b: Batch) => b.maxDeviation_pct.toFixed(1), highlight: true, lowerIsBetter: true },
                  { label: '克重偏差率', key: 'gramDev', unit: '%', get: (b: Batch) => `${(Math.abs(b.actualAvgGrammage - b.targetGrammage) / b.targetGrammage * 100).toFixed(2)}`, highlight: true, lowerIsBetter: true },
                  { label: '荡料次数(目标)', key: 'targetSwing', unit: '次', get: (b: Batch) => b.targetSwingCount },
                  { label: '纸药用量', key: 'sizingDose', unit: '%', get: (b: Batch) => b.configSnapshot.sizingDose_pct },
                  { label: '打浆度', key: 'beating', unit: '°SR', get: (b: Batch) => b.configSnapshot.beatingDegree_SR },
                  { label: '压榨压力', key: 'pressPressure', unit: 'kg', get: (b: Batch) => b.configSnapshot.pressPressure_kg },
                  { label: '压榨时长', key: 'pressDuration', unit: 'min', get: (b: Batch) => b.configSnapshot.pressDuration_min },
                  { label: '晒纸温度', key: 'dryingTemp', unit: '°C', get: (b: Batch) => b.configSnapshot.dryingTemp_C },
                  { label: '质量等级', key: 'quality', unit: '', get: (b: Batch) => b.qualityLevel, highlight: true, higherIsBetter: true },
                ]
                .filter((row) => {
                  if (!onlyDiff) return true;
                  const values = compareBatches.map((b) => String(row.get(b)));
                  const unique = new Set(values);
                  return unique.size > 1;
                })
                .map((row, ri) => {
                  const values = compareBatches.map((b) => row.get(b));
                  const targets = 'targetGetter' in row ? compareBatches.map((b) => (row as any).targetGetter(b)) : null;
                  const numValues = values.map((v) => typeof v === 'number' ? v : parseFloat(v as string));
                  const hasValidNums = numValues.every((v) => !isNaN(v));
                  let bestIdx = -1;

                  if (row.highlight && hasValidNums) {
                    if ((row as any).bestMode === 'closest-to-target' && targets) {
                      const deviations = numValues.map((v, i) => Math.abs(v - targets[i]));
                      bestIdx = deviations.indexOf(Math.min(...deviations));
                    } else if (row.lowerIsBetter) {
                      bestIdx = numValues.indexOf(Math.min(...numValues));
                    } else if ((row as any).higherIsBetter) {
                      const scores = values.map((v) => QUALITY_SCORE[v as string] || 0);
                      bestIdx = scores.indexOf(Math.max(...scores));
                    } else {
                      bestIdx = numValues.indexOf(Math.max(...numValues));
                    }
                  }
                  return (
                    <tr key={row.key} className={ri % 2 === 0 ? 'bg-bronze-50/30' : ''}>
                      <td className="py-2.5 px-3 font-medium text-ink-200">{row.label}</td>
                      {compareBatches.map((b, bi) => {
                        const val = row.get(b);
                        const isBest = bi === bestIdx;
                        return (
                          <td key={b.id} className={[
                            'py-2.5 px-3 text-center tabular-nums',
                            isBest ? 'font-bold text-bamboo-600' : 'text-ink-300',
                          ].join(' ')}>
                            {val}{row.unit ? ` ${row.unit}` : ''}
                            {isBest && <span className="ml-1 text-xs">✓</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-xs text-ink-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-bamboo-500" />
              <span>✓ 标记为该维度的最优值：克重越接近目标越好，CV/偏差越低越好，等级越高越好。</span>
            </div>
          </div>
        </PaperCard>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <PaperCard
            title="批次时间线"
            subtitle={compareMode ? '点击□选择对比（最多3批同类纸）' : '点击卡片查看详情'}
            icon={<FileArchive className="h-5 w-5" />}
            actions={
              selectedPaperType ? (
                <Button size="sm" variant="ghost" onClick={() => setSelectedPaperType(null)}>
                  取消纸种筛选
                </Button>
              ) : undefined
            }
          >
            {!filtered.length ? (
              <div className="rounded-lg bg-bronze-50/60 py-16 text-center text-sm text-ink-100">
                暂无匹配的批次档案
                <div className="mt-3 text-xs">前往「抄纸厚薄」页检测后归档，即可在此查看</div>
              </div>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-bronze-200 pl-5">
                {filtered.map((b) => {
                  const isInCompare = compareBatchIds.includes(b.id);
                  const canAdd = canAddToCompare(b);
                  return (
                    <li key={b.id} className="relative">
                      <span
                        className={[
                          'absolute -left-[30px] top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-rice-50',
                          b.qualityLevel === '优' ? 'bg-bamboo-400' :
                          b.qualityLevel === '良' ? 'bg-bronze-400' :
                          b.qualityLevel === '合格' ? 'bg-rattan-300' : 'bg-cinnabar-400',
                        ].join(' ')}
                      />
                      <div className="flex gap-2">
                        {compareMode && (
                          <button
                            onClick={() => canAdd && toggleCompareBatch(b.id)}
                            className={[
                              'mt-1 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                              isInCompare ? 'bg-bronze-500 border-bronze-500 text-white' :
                              canAdd ? 'border-bronze-300 hover:border-bronze-500 text-transparent hover:text-bronze-400' :
                              'border-bronze-200 bg-bronze-50/50 cursor-not-allowed text-transparent',
                            ].join(' ')}
                            disabled={!canAdd}
                            title={!canAdd && compareBatchIds.length > 0 ? '需选择同一纸种的批次' : ''}
                          >
                            {isInCompare && <CheckSquare className="h-3 w-3" />}
                            {!isInCompare && !canAdd && <X className="h-3 w-3 opacity-30" />}
                          </button>
                        )}
                        <button
                          onClick={() => !compareMode && selectBatch(b.id)}
                          className={[
                            'group flex-1 rounded-xl border p-4 text-left transition-all',
                            selectedId === b.id && !compareMode
                              ? 'border-bronze-400 bg-gradient-to-br from-bronze-50 via-white to-rattan-100/60 shadow-paper'
                              : isInCompare
                              ? 'border-bronze-400 bg-bronze-50/60'
                              : 'border-bronze-100 bg-white/50 hover:border-bronze-200 hover:bg-white hover:shadow-paper',
                            compareMode && 'cursor-default',
                          ].join(' ')}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-ink-300">{b.batchNo}</span>
                                <Badge tone={
                                  b.qualityLevel === '优' ? 'bamboo' :
                                  b.qualityLevel === '良' ? 'bronze' :
                                  b.qualityLevel === '合格' ? 'rattan' : 'cinnabar'
                                }>{b.qualityLevel}</Badge>
                                {b.uniformityLevel === '优' && <Badge tone="bamboo">匀度优</Badge>}
                              </div>
                              <div className="mt-0.5 text-xs text-ink-100">{b.configSnapshot.paperType}</div>
                            </div>
                            {!compareMode && <ChevronRight className={`h-4 w-4 transition-all ${selectedId === b.id ? 'text-bronze-500 translate-x-0' : 'text-ink-100 group-hover:translate-x-0.5'}`} />}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-ink-100">目标/实际</div>
                              <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{b.targetGrammage}/{b.actualAvgGrammage.toFixed(0)} g</div>
                            </div>
                            <div>
                              <div className="text-ink-100">匀度 CV</div>
                              <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{b.uniformityCV_pct.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-ink-100 flex items-center gap-1"><Calendar className="h-3 w-3" />日期</div>
                              <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{b.date}</div>
                            </div>
                          </div>
                          {b.issues.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {b.issues.map((i) => <Badge key={i} tone="cinnabar">{i}</Badge>)}
                            </div>
                          )}
                          {b.papermakingRecord && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-100">
                              <CheckCircle className="h-3 w-3 text-bamboo-500" />
                              <span>含抄造过程记录</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </PaperCard>
        </div>

        <div className="xl:col-span-3">
          {selected ? (
            <BatchDetail
              batch={selected}
              onClose={() => selectBatch(null)}
              onDelete={() => {
                if (confirm(`确定删除批次 ${selected.batchNo}?`)) {
                  removeBatch(selected.id);
                  selectBatch(null);
                }
              }}
              onLoad={() => loadToRatio(selected)}
              onAddToVersion={() => handleAddToVersion(selected)}
            />
          ) : (
            <PaperCard title="批次详情" subtitle="从左侧选择一个批次查看完整档案" icon={<FileText className="h-5 w-5" />}>
              <div className="flex h-[480px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bronze-100/60 text-bronze-400">
                    <Filter className="h-9 w-9" />
                  </div>
                  <p className="text-sm text-ink-200">未选择批次</p>
                  <p className="mt-1 text-xs text-ink-100">左侧按时间倒序排列，点击卡片即可查看详情；上方看板可快速筛选纸种</p>
                </div>
              </div>
            </PaperCard>
          )}
        </div>
      </div>

      {previewModal && (
        <VersionPreviewModal
          batch={batches.find((b) => b.id === previewModal.batchId)!}
          recipeName={previewModal.recipeName}
          onClose={() => setPreviewModal(null)}
          onConfirm={confirmAddVersion}
          existingVersions={recipes.find((r) => r.id === previewModal.recipeId)?.versions || []}
        />
      )}
    </div>
  );
}

function StabilityDashboard({
  summary, selectedPaperType, onSelectPaperType, impactAnalysis, batches,
  expandedPaperTypes, onToggleExpand,
}: {
  summary: PaperTypeSummary[];
  selectedPaperType: string | null;
  onSelectPaperType: (p: string | null) => void;
  impactAnalysis: any;
  batches: Batch[];
  expandedPaperTypes: Set<string>;
  onToggleExpand: (paperType: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <PaperCard
      title={
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5" />
          <span>工艺稳定性看板</span>
          <Badge tone="ink">{summary.length} 个纸种</Badge>
        </div>
      }
      subtitle="按纸种汇总最近批次的波动指标，点击卡片查看参数影响分析"
      icon={<BarChart3 className="h-5 w-5" />}
      actions={
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      }
    >
      {expanded && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {summary.map((s) => {
              const active = selectedPaperType === s.paperType;
              const isExpanded = expandedPaperTypes.has(s.paperType);
              const stableScore = Math.max(0, 100
                - s.avgCV * 4
                - s.avgMaxDev * 2
                - s.overToleranceCount * 8
                - s.avgGrammageDeviation_pct * 3
                - s.releaseIssues * 10);
              const grade = stableScore >= 80 ? '稳定' : stableScore >= 60 ? '一般' : '波动';
              const maxCV = Math.max(...s.recentBatches.map((b) => b.uniformityCV_pct), 10);
              return (
                <div
                  key={s.paperType}
                  className={[
                    'rounded-xl border transition-all overflow-hidden',
                    active || isExpanded
                      ? 'border-bronze-500 bg-gradient-to-br from-bronze-50 to-rattan-100/50 shadow-paper'
                      : 'border-bronze-100 bg-white/60 hover:border-bronze-300 hover:bg-white hover:shadow-paper',
                  ].join(' ')}
                >
                  <button
                    onClick={() => onSelectPaperType(active ? null : s.paperType)}
                    className="w-full p-4 text-left"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-display font-bold text-lg text-ink-300">{s.paperType}</div>
                        <div className="text-xs text-ink-100 mt-0.5">
                          近 {s.batchCount} 批 · {s.lastBatchDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <Badge tone={grade === '稳定' ? 'bamboo' : grade === '一般' ? 'bronze' : 'cinnabar'} size="sm">
                          {grade}
                        </Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleExpand(s.paperType); }}
                          className={[
                            'rounded-md border-2 p-1 transition-all',
                            isExpanded ? 'bg-bronze-500 border-bronze-500 text-white' : 'bg-white border-bronze-200 text-ink-100 hover:border-bronze-400 hover:text-bronze-500',
                          ].join(' ')}
                          title={isExpanded ? '收起批次详情' : '展开批次详情'}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <ProgressBar label="稳定性评分" value={Math.round(stableScore)} max={100} variant="uniformity" />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded bg-bronze-50/70 p-2">
                        <div className="text-ink-100 flex items-center gap-1"><LineChart className="h-3 w-3" />平均 CV</div>
                        <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{s.avgCV.toFixed(2)}%</div>
                      </div>
                      <div className="rounded bg-bronze-50/70 p-2">
                        <div className="text-ink-100 flex items-center gap-1"><Gauge className="h-3 w-3" />最大偏差</div>
                        <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{s.avgMaxDev.toFixed(1)}%</div>
                      </div>
                      <div className="rounded bg-bronze-50/70 p-2">
                        <div className="text-ink-100 flex items-center gap-1"><AlertOctagon className="h-3 w-3" />超差批次</div>
                        <div className={[
                          'mt-0.5 font-semibold tabular-nums',
                          s.overToleranceCount === 0 ? 'text-bamboo-600' : s.overToleranceCount <= 2 ? 'text-bronze-500' : 'text-cinnabar-500',
                        ].join(' ')}>{s.overToleranceCount}/{s.batchCount}</div>
                      </div>
                      <div className="rounded bg-bronze-50/70 p-2">
                        <div className="text-ink-100 flex items-center gap-1"><Wind className="h-3 w-3" />揭纸问题</div>
                        <div className={[
                          'mt-0.5 font-semibold tabular-nums',
                          s.releaseIssues === 0 ? 'text-bamboo-600' : 'text-cinnabar-500',
                        ].join(' ')}>{s.releaseIssues} 次</div>
                      </div>
                    </div>
                    {Object.keys(s.qualityDist).length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[10px]">
                        {(['优', '良', '合格', '不合格'] as const).map((lv) => (
                          s.qualityDist[lv] && (
                            <Badge key={lv} tone={
                              lv === '优' ? 'bamboo' : lv === '良' ? 'bronze' : lv === '合格' ? 'rattan' : 'cinnabar'
                            } size="sm">
                              {lv} {s.qualityDist[lv]}
                            </Badge>
                          )
                        ))}
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-bronze-200/60 bg-white/70 p-3.5">
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="text-[11px] font-semibold text-ink-200 flex items-center gap-1">
                          <LineChart className="h-3.5 w-3.5 text-bronze-500" />
                          最近 {s.recentBatches.length} 批 CV 走势 & 超差情况
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-ink-100">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cinnabar-400" />超差</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rattan-400" />揭纸问题</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                        {s.recentBatches.map((b, idx) => {
                          const isOver = b.maxDeviation_pct > b.tolerance_pct;
                          const hasReleaseIssue = b.papermakingRecord && (b.papermakingRecord.releaseSituation === '粘连' || b.papermakingRecord.releaseSituation === '破损');
                          const cvPct = Math.min(100, (b.uniformityCV_pct / maxCV) * 100);
                          const gramDev = Math.abs(b.actualAvgGrammage - b.targetGrammage) / b.targetGrammage * 100;
                          return (
                            <div key={b.id} className="group">
                              <div className="mb-0.5 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-display font-semibold tabular-nums text-bronze-600 w-16">{b.batchNo}</span>
                                  <span className="text-ink-100">{b.date}</span>
                                  {isOver && <Badge tone="cinnabar" size="sm" className="h-4">超差</Badge>}
                                  {hasReleaseIssue && <Badge tone="rattan" size="sm" className="h-4">揭纸问题</Badge>}
                                </div>
                                <div className="flex items-center gap-2 tabular-nums">
                                  <span className="text-ink-200">CV <span className={[
                                    'font-semibold',
                                    b.uniformityCV_pct < 5 ? 'text-bamboo-600' : b.uniformityCV_pct < 10 ? 'text-bronze-600' : 'text-cinnabar-500',
                                  ].join(' ')}>{b.uniformityCV_pct.toFixed(2)}%</span></span>
                                  <span className="text-ink-200">|</span>
                                  <span className="text-ink-200">克重 <span className={[
                                    'font-semibold',
                                    gramDev < 3 ? 'text-bamboo-600' : gramDev < 7 ? 'text-bronze-600' : 'text-cinnabar-500',
                                  ].join(' ')}>{b.actualAvgGrammage.toFixed(1)}g</span></span>
                                  <Badge tone={
                                    b.qualityLevel === '优' ? 'bamboo' : b.qualityLevel === '良' ? 'bronze' : b.qualityLevel === '合格' ? 'rattan' : 'cinnabar'
                                  } size="sm" className="h-4">{b.qualityLevel}</Badge>
                                </div>
                              </div>
                              <div className="relative h-4 overflow-hidden rounded bg-bronze-50">
                                <div
                                  className={[
                                    'absolute left-0 top-0 h-full rounded transition-all',
                                    isOver
                                      ? 'bg-gradient-to-r from-cinnabar-300 to-cinnabar-500'
                                      : b.uniformityCV_pct < 5
                                      ? 'bg-gradient-to-r from-bamboo-300 to-bamboo-500'
                                      : b.uniformityCV_pct < 10
                                      ? 'bg-gradient-to-r from-bronze-300 to-bronze-500'
                                      : 'bg-gradient-to-r from-rattan-300 to-rattan-500',
                                  ].join(' ')}
                                  style={{ width: `${cvPct}%` }}
                                />
                                <div className="absolute left-0 top-0 flex h-full w-full items-center justify-between px-2 text-[9px] text-white/90">
                                  <span className="font-medium drop-shadow-sm">{b.targetGrammage}g目</span>
                                  <span className="font-medium drop-shadow-sm">±{b.tolerance_pct}%公差</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {s.overToleranceCount > 0 && (
                        <div className="mt-3 rounded-lg border border-cinnabar-200 bg-cinnabar-50/60 p-2.5 text-[10px] text-cinnabar-500 flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">稳定性预警：</span>
                            共 {s.overToleranceCount} 批超出公差范围，
                            {(() => {
                              const worst = [...s.recentBatches]
                                .filter((b) => b.maxDeviation_pct > b.tolerance_pct)
                                .sort((a, b) => b.maxDeviation_pct - a.maxDeviation_pct)[0];
                              return worst
                                ? `最严重为 ${worst.batchNo}（偏差 ${worst.maxDeviation_pct.toFixed(1)}%），建议重点检查打浆度 ${worst.configSnapshot.beatingDegree_SR}°SR、纸药用量 ${worst.configSnapshot.sizingDose_pct}% 是否合适。`
                                : '';
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPaperType && impactAnalysis && (
            <div className="rounded-xl border border-bronze-100 bg-gradient-to-br from-bronze-50/80 to-rattan-50/60 p-5">
              <h4 className="mb-4 flex items-center gap-2 font-display font-semibold text-ink-300">
                <Sparkles className="h-4 w-4 text-bronze-500" />
                「{selectedPaperType}」工艺参数影响分析
                <span className="ml-2 text-xs font-normal text-ink-100">（基于最近 {batches.length} 批次相关性分析）</span>
              </h4>
              {impactAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {impactAnalysis.map((it: any) => (
                    <div key={it.key} className="rounded-lg bg-white/70 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-300 text-sm">{it.label}</span>
                          <span className="text-[10px] text-ink-100 tabular-nums">范围 {it.range} {it.unit}</span>
                          <Badge tone={it.trend.startsWith('↑') ? 'bamboo' : it.trend.startsWith('↓') ? 'rattan' : 'ink'} size="sm">
                            {it.trend}
                          </Badge>
                        </div>
                        <span className={[
                          'text-xs font-bold tabular-nums',
                          it.impactScore >= 40 ? 'text-cinnabar-500' : it.impactScore >= 20 ? 'text-bronze-500' : 'text-ink-100',
                        ].join(' ')}>
                          影响度 {it.impactScore.toFixed(0)}
                        </span>
                      </div>
                      <ProgressBar
                        label={`${it.label}影响权重`}
                        value={it.impactScore}
                        max={100}
                        variant="strength"
                      />
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                        <div className="text-ink-100 tabular-nums">品质相关 r={it.qCorr.toFixed(2)}</div>
                        <div className="text-ink-100 tabular-nums">匀度相关 r={it.cvCorr.toFixed(2)}</div>
                        <div className="text-ink-100 tabular-nums">低段品质 {it.avgLow} / 高段 {it.avgHigh}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-ink-100">
                  该纸种批次不足 3 批，需要更多数据才能分析参数影响
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PaperCard>
  );
}

function VersionPreviewModal({
  batch, recipeName, onClose, onConfirm, existingVersions,
}: {
  batch: Batch;
  recipeName: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
  existingVersions: RecipeVersion[];
}) {
  const [note, setNote] = useState(`沉淀自批次 ${batch.batchNo}`);
  const lastVersion = existingVersions[existingVersions.length - 1];
  const lastConfig = lastVersion?.config;

  const diffs = useMemo(() => {
    if (!lastConfig) return [];
    return PARAM_IMPACT_KEYS.concat([
      { key: 'targetGrammage' as const, label: '目标克重', unit: 'g/m²' },
      { key: 'targetWidth_mm' as const, label: '幅面宽度', unit: 'mm' },
      { key: 'targetHeight_mm' as const, label: '幅面高度', unit: 'mm' },
      { key: 'sizingAgentId' as const, label: '纸药ID', unit: '' },
    ]).map(({ key, label, unit }) => {
      const oldVal = (lastConfig as any)[key];
      const newVal = (batch.configSnapshot as any)[key];
      const oldStr = String(oldVal ?? '-');
      const newStr = String(newVal ?? '-');
      const changed = oldStr !== newStr;
      const diffPct = typeof oldVal === 'number' && typeof newVal === 'number' && oldVal !== 0
        ? ((newVal - oldVal) / oldVal * 100)
        : 0;
      return { key, label, unit, oldVal, newVal, oldStr, newStr, changed, diffPct };
    }).filter((d) => d.changed);
  }, [batch, lastConfig]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-400/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="paper-grain relative w-full max-w-2xl overflow-hidden rounded-xl border border-bronze-200 bg-rice-50 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bronze-200/60 bg-rice-50/95 backdrop-blur px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-bronze-500" />
              版本沉淀预览
            </h3>
            <p className="mt-0.5 text-xs text-ink-100">
              配方「{recipeName}」 · 将从批次 {batch.batchNo} 创建 v{existingVersions.length + 1}.0
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-100 hover:bg-bronze-100 hover:text-ink-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-bronze-100 bg-white/60 p-3">
              <div className="text-xs text-ink-100">来源批次</div>
              <div className="mt-1 font-display font-bold text-ink-300">{batch.batchNo}</div>
              <div className="mt-0.5 text-[11px] text-ink-100">
                <Badge tone={batch.qualityLevel === '优' ? 'bamboo' : batch.qualityLevel === '良' ? 'bronze' : batch.qualityLevel === '合格' ? 'rattan' : 'cinnabar'} size="sm">
                  质量 {batch.qualityLevel}
                </Badge>
                <span className="ml-1">{batch.createdAt}</span>
              </div>
            </div>
            <div className="rounded-lg border border-bronze-100 bg-white/60 p-3">
              <div className="text-xs text-ink-100">将创建版本</div>
              <div className="mt-1 font-display font-bold text-bamboo-600">v{existingVersions.length + 1}.0</div>
              <div className="mt-0.5 text-[11px] text-ink-100">
                前序版本：{lastVersion ? `${lastVersion.version} (${lastVersion.createdAt})` : '首个版本'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-200">
              <Scale className="h-4 w-4 text-bronze-500" />
              参数差异对比
              <Badge tone={diffs.length > 0 ? 'cinnabar' : 'bamboo'} size="sm">
                {diffs.length > 0 ? `${diffs.length} 处变化` : '参数完全一致'}
              </Badge>
            </h4>
            {diffs.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-bronze-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bronze-50 text-xs">
                      <th className="py-2 px-3 text-left font-medium text-ink-100">参数</th>
                      <th className="py-2 px-3 text-right font-medium text-ink-100">
                        {lastVersion ? `上一版本 ${lastVersion.version}` : '初始版本'}
                      </th>
                      <th className="py-2 px-3 text-right font-medium text-ink-100">
                        新批次配置
                      </th>
                      <th className="py-2 px-3 text-right font-medium text-ink-100">变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((d, i) => (
                      <tr key={d.key} className={i % 2 ? 'bg-white' : 'bg-bronze-50/30'}>
                        <td className="py-2 px-3 text-ink-200">{d.label}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-ink-300">
                          {d.oldStr}{d.unit}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium text-bronze-600">
                          {d.newStr}{d.unit}
                        </td>
                        <td className={[
                          'py-2 px-3 text-right tabular-nums font-semibold text-xs',
                          d.diffPct > 0 ? 'text-bamboo-600' : d.diffPct < 0 ? 'text-rattan-600' : 'text-ink-200',
                        ].join(' ')}>
                          {typeof d.oldVal === 'number' && typeof d.newVal === 'number'
                            ? `${d.diffPct > 0 ? '+' : ''}${d.diffPct.toFixed(1)}%`
                            : '变更'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-bamboo-200 bg-bamboo-50/50 p-4 text-xs text-bamboo-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>与上一版本参数完全一致，将作为同参数的另一版本沉淀，用于记录不同时期的工艺探索。</span>
              </div>
            )}
          </div>

          <Field label="版本备注" required>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="记录此次沉淀的原因、探索方向、观察结果等"
              className="w-full rounded-lg border border-bronze-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-100 resize-none"
            />
          </Field>

          <div className="rounded-lg border border-bronze-100 bg-rattan-50/40 p-3 text-xs space-y-1">
            <div className="font-medium text-ink-200 mb-1">即将写入：</div>
            <div className="text-ink-100">• 版本号 v{existingVersions.length + 1}.0</div>
            <div className="text-ink-100">• 关联批次 {batch.batchNo}（质量{batch.qualityLevel}）</div>
            <div className="text-ink-100">• 配置快照：克重 {batch.configSnapshot.targetGrammage}g / 打浆 {batch.configSnapshot.beatingDegree_SR}°SR / 纸药 {batch.configSnapshot.sizingDose_pct}%</div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-bronze-200/60 bg-rice-100/80 backdrop-blur px-6 py-3">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={() => onConfirm(note)}>
            <Plus className="h-4 w-4" />
            确认沉淀为 v{existingVersions.length + 1}.0
          </Button>
        </div>
      </div>
    </div>
  );
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

function BatchDetail({
  batch, onClose, onDelete, onLoad, onAddToVersion,
}: {
  batch: Batch;
  onClose: () => void;
  onDelete: () => void;
  onLoad: () => void;
  onAddToVersion: () => void;
}) {
  const side = batch.gridSize;
  const labels = side === 3
    ? ['上左', '上中', '上右', '中左', '中心', '中右', '下左', '下中', '下右']
    : ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2', '2-3', '2-4', '3-1', '3-2', '3-3', '3-4', '4-1', '4-2', '4-3', '4-4'];
  const devs = detectDeviation(batch.thicknessGrid, batch.targetGrammage, batch.tolerance_pct);
  const pr = batch.papermakingRecord;

  return (
    <PaperCard
      title={
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold">{batch.batchNo}</h3>
            <Badge tone={
              batch.qualityLevel === '优' ? 'bamboo' :
              batch.qualityLevel === '良' ? 'bronze' :
              batch.qualityLevel === '合格' ? 'rattan' : 'cinnabar'
            } size="md">
              {batch.qualityLevel}
            </Badge>
            <Badge tone="bronze">{batch.configSnapshot.paperType}</Badge>
          </div>
          <p className="mt-0.5 text-xs font-normal text-ink-100">
            <Calendar className="mr-1 inline h-3 w-3" />{batch.date}
            <User className="ml-3 mr-1 inline h-3 w-3" />{batch.operator}
          </p>
        </div>
      }
      icon={<FileText className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={onAddToVersion}>
            沉淀为配方版本
          </Button>
          <Button size="sm" variant="secondary" onClick={onLoad}>载入到配比页</Button>
          <Button size="sm" variant="ghost" className="text-cinnabar-400" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>删除</Button>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-100 hover:bg-bronze-100 hover:text-ink-300"><X className="h-4 w-4" /></button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-3">
        <MetricDisplay label="目标克重" value={batch.targetGrammage} unit="g/m²" />
        <MetricDisplay label="平均克重" value={batch.actualAvgGrammage.toFixed(1)} unit="g/m²" tone={Math.abs(batch.actualAvgGrammage - batch.targetGrammage) / batch.targetGrammage < 0.05 ? 'success' : 'warn'} />
        <MetricDisplay label="匀度 CV" value={batch.uniformityCV_pct.toFixed(1)} unit="%" tone={batch.uniformityLevel === '优' ? 'success' : batch.uniformityLevel === '良' ? 'highlight' : batch.uniformityLevel === '合格' ? 'warn' : 'danger'} />
        <MetricDisplay label="最大偏差" value={batch.maxDeviation_pct.toFixed(1)} unit="%" tone={batch.maxDeviation_pct > batch.tolerance_pct ? 'danger' : 'success'} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
            <Layers className="h-4 w-4" /> 帘面检测回放
            <Badge tone="ink" size="sm">±{batch.tolerance_pct}%</Badge>
          </h4>
          <div className="mx-auto aspect-square w-full max-w-[360px] rounded-xl border-2 border-bronze-300 bamboo-curtain p-3 bg-gradient-to-br from-rice-50 to-rice-100">
            <div className="grid h-full w-full gap-2" style={{ gridTemplateColumns: `repeat(${side}, 1fr)` }}>
              {batch.thicknessGrid.map((v, i) => {
                const d = devs[i];
                const hasVal = v !== null && v !== undefined;
                let cls = 'border-bronze-200 bg-white';
                if (!hasVal) cls = 'border-dashed border-bronze-100 bg-white/40';
                else if (d?.isOverTolerance) cls = 'border-cinnabar-400 bg-cinnabar-100 text-cinnabar-500';
                else if (v > batch.targetGrammage) cls = 'border-bamboo-300 bg-bamboo-100/60';
                else if (v < batch.targetGrammage) cls = 'border-rattan-200 bg-rattan-100/60';
                return (
                  <div key={i} className={`flex flex-col items-center justify-center rounded-md border-2 p-1 text-center ${cls}`}>
                    <div className="text-[9px] text-ink-100">{labels[i]}</div>
                    <div className="font-display text-sm font-bold tabular-nums">{v ?? '—'}</div>
                    {hasVal && d && (
                      <div className={`text-[9px] font-semibold tabular-nums ${d.isOverTolerance ? 'text-cinnabar-500' : 'text-ink-100'}`}>
                        {d.deviation_pct > 0 ? '+' : ''}{d.deviation_pct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
              <Scale className="h-4 w-4" /> 配比概要
            </h4>
            <div className="space-y-2 rounded-lg border border-bronze-100 bg-white/50 p-3 text-xs">
              <DetailRow k="纸张用途" v={batch.configSnapshot.paperUse} />
              <DetailRow k="目标厚度" v={`${batch.configSnapshot.targetThickness_um} μm`} />
              <DetailRow k="幅面尺寸" v={`${batch.configSnapshot.targetWidth_mm} × ${batch.configSnapshot.targetHeight_mm} mm`} />
              <DetailRow k="打浆度" v={`${batch.configSnapshot.beatingDegree_SR}°SR`} />
              <DetailRow k="用水量" v={`${batch.configSnapshot.waterVolume_L} L`} />
              <DetailRow k="每次入帘浆量" v={`${batch.configSnapshot.perSwingVolume_mL} mL`} />
              <DetailRow k="纸药用量" v={`${batch.configSnapshot.sizingDose_pct}% (绝干浆计)`} />
              <DetailRow k="压榨" v={`${batch.configSnapshot.pressPressure_kg}kg / ${batch.configSnapshot.pressDuration_min}min`} />
              <DetailRow k="晒纸温度" v={`${batch.configSnapshot.dryingTemp_C} °C`} />
              <div className="mt-2 border-t border-bronze-100 pt-2">
                <div className="mb-1 text-ink-100">纤维配比：</div>
                <div className="flex flex-wrap gap-1">
                  {batch.configSnapshot.fiberMixture.map((m) => (
                    <Badge key={m.fiberId} tone="bronze">Fib{m.fiberId.slice(-2)} {m.ratio_pct}%</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-ink-200">质量指标</h4>
            <div className="space-y-3">
              <ProgressBar label="匀度评级" value={Math.max(0, 100 - batch.uniformityCV_pct * 4)} variant="uniformity" />
              <ProgressBar label="克重准确性" value={Math.max(0, 100 - Math.abs(batch.actualAvgGrammage - batch.targetGrammage) / batch.targetGrammage * 150)} variant="strength" />
            </div>
          </div>

          {batch.warnings.length > 0 && (
            <div className="rounded-lg border border-cinnabar-200 bg-cinnabar-100/50 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-cinnabar-500">
                <AlertTriangle className="h-3.5 w-3.5" /> 抄造过程预警 {batch.warnings.length} 项
              </div>
              <ul className="space-y-1 text-xs text-cinnabar-500/90">
                {batch.warnings.map((w, i) => <li key={i}>· {w}</li>)}
              </ul>
            </div>
          )}

          {batch.note && (
            <div className="rounded-lg border border-bronze-100 bg-rattan-100/40 p-3 text-xs text-ink-200">
              <span className="font-semibold">备注：</span>{batch.note}
            </div>
          )}
        </div>
      </div>

      {pr && (
        <div className="mt-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
            <Hand className="h-4 w-4" /> 抄造过程记录
          </h4>
          <div className="rounded-lg border border-bronze-100 bg-bronze-50/50 p-4">
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div>
                <div className="text-ink-100">目标荡料次数</div>
                <div className="mt-0.5 font-display font-bold text-ink-300 tabular-nums">{batch.targetSwingCount} 次</div>
              </div>
              <div>
                <div className="text-ink-100">实际荡料次数</div>
                <div className="mt-0.5 font-display font-bold text-ink-300 tabular-nums">{pr.actualSwingCount || '未记录'} 次</div>
              </div>
              <div>
                <div className="text-ink-100">搅浆次数</div>
                <div className="mt-0.5 font-display font-bold text-ink-300 tabular-nums">{pr.stirCount || '未记录'} 次</div>
              </div>
              <div>
                <div className="text-ink-100">入帘手感</div>
                <div className="mt-0.5 font-display font-bold text-bronze-600">{pr.feelLevel || '未记录'}</div>
              </div>
              <div>
                <div className="text-ink-100">揭纸情况</div>
                <div className="mt-0.5 font-display font-bold text-rattan-700">{pr.releaseSituation || '未记录'}</div>
              </div>
              {pr.startTime && (
                <div>
                  <div className="text-ink-100">开始时间</div>
                  <div className="mt-0.5 font-medium text-ink-300 tabular-nums">{new Date(pr.startTime).toLocaleString('zh-CN')}</div>
                </div>
              )}
              {pr.endTime && (
                <div>
                  <div className="text-ink-100">结束时间</div>
                  <div className="mt-0.5 font-medium text-ink-300 tabular-nums">{new Date(pr.endTime).toLocaleString('zh-CN')}</div>
                </div>
              )}
            </div>
            {pr.feelNote && (
              <div className="mt-3 rounded-md bg-white/60 p-2.5 text-xs">
                <span className="font-medium text-bronze-600">手感备注：</span>
                <span className="text-ink-200">{pr.feelNote}</span>
              </div>
            )}
            {pr.releaseNote && (
              <div className="mt-2 rounded-md bg-white/60 p-2.5 text-xs">
                <span className="font-medium text-rattan-700">揭纸备注：</span>
                <span className="text-ink-200">{pr.releaseNote}</span>
              </div>
            )}
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {pr.pressNote && (
                <div className="rounded-md bg-white/60 p-2.5 text-xs">
                  <div className="mb-0.5 flex items-center gap-1 font-medium text-ink-200">
                    <ArrowRight className="h-3 w-3 text-bamboo-500" /> 压榨备注
                  </div>
                  <div className="text-ink-200">{pr.pressNote}</div>
                </div>
              )}
              {pr.dryingNote && (
                <div className="rounded-md bg-white/60 p-2.5 text-xs">
                  <div className="mb-0.5 flex items-center gap-1 font-medium text-ink-200">
                    <Sun className="h-3 w-3 text-rattan-600" /> 晒纸备注
                  </div>
                  <div className="text-ink-200">{pr.dryingNote}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-lg border border-bamboo-200 bg-bamboo-100/40 px-4 py-2.5 text-xs text-bamboo-500">
        <CheckCircle className="h-4 w-4" />
        <span>档案完成时间 {batch.createdAt}，可随时从「纸浆配比」页载入此批参数重新抄造，保持品质稳定。</span>
      </div>
    </PaperCard>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-bronze-100 pb-1.5 last:border-0 last:pb-0">
      <span className="text-ink-100">{k}</span>
      <span className="font-medium text-ink-300 tabular-nums">{v}</span>
    </div>
  );
}
