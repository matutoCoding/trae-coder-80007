import { useState, useMemo } from 'react';
import {
  FileArchive, Search, Filter, Calendar, FileText, Trash2, ChevronRight, X,
  Layers, Scale, Gauge, AlertTriangle, CheckCircle, User,
  GitCompare, CheckSquare, Square, ArrowRight, Plus, Hand, Paperclip, Sun,
} from 'lucide-react';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import type { Batch } from '@/types';
import { detectDeviation } from '@/utils/thickness';

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

  const [kw, setKw] = useState('');
  const [qlFilter, setQlFilter] = useState<string>('全部');
  const [compareMode, setCompareMode] = useState(false);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (qlFilter !== '全部' && b.qualityLevel !== qlFilter) return false;
      if (!kw.trim()) return true;
      const k = kw.trim().toLowerCase();
      return (
        b.batchNo.toLowerCase().includes(k) ||
        b.configSnapshot.paperType.toLowerCase().includes(k) ||
        b.operator.toLowerCase().includes(k)
      );
    });
  }, [batches, kw, qlFilter]);

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
      const note = prompt(`请输入版本备注：`, `沉淀自批次 ${b.batchNo}`);
      if (note === null) return;
      addRecipeVersion(existingRecipe.id, note || '', b.id);
      alert(`已沉淀为「${existingRecipe.name}」的新版本`);
    } else {
      const shouldCreate = confirm(
        `未找到「${paperType}」的配方，是否创建新配方？\n\n创建后将自动包含此批次参数作为初始版本。`
      );
      if (shouldCreate) {
        alert('请前往配方库创建新配方，或使用配比页保存配方功能');
      }
    }
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
          <p className="mt-1 text-sm text-ink-100">记录每批抄造的完整参数链，支持检索、对比与复用</p>
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

      {compareMode && compareBatches.length >= 2 && (
        <PaperCard
          title={`批次对比 · ${compareBatches.map((b) => b.batchNo).join(' vs ')}`}
          subtitle={`${compareBatches[0]?.configSnapshot.paperType} · 共 ${compareBatches.length} 批对比`}
          icon={<GitCompare className="h-5 w-5" />}
          actions={
            <Button variant="ghost" size="sm" onClick={clearCompareBatches}>清空选择</Button>
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
                  { label: '实际克重', key: 'actualGrammage', unit: 'g/m²', get: (b: Batch) => b.actualAvgGrammage.toFixed(1), highlight: true },
                  { label: '匀度 CV', key: 'cv', unit: '%', get: (b: Batch) => b.uniformityCV_pct.toFixed(2), highlight: true, lowerIsBetter: true },
                  { label: '最大偏差', key: 'maxDev', unit: '%', get: (b: Batch) => b.maxDeviation_pct.toFixed(1), highlight: true, lowerIsBetter: true },
                  { label: '荡料次数(目标)', key: 'targetSwing', unit: '次', get: (b: Batch) => b.targetSwingCount },
                  { label: '纸药用量', key: 'sizingDose', unit: '%', get: (b: Batch) => b.configSnapshot.sizingDose_pct },
                  { label: '打浆度', key: 'beating', unit: '°SR', get: (b: Batch) => b.configSnapshot.beatingDegree_SR },
                  { label: '压榨压力', key: 'pressPressure', unit: 'kg', get: (b: Batch) => b.configSnapshot.pressPressure_kg },
                  { label: '压榨时长', key: 'pressDuration', unit: 'min', get: (b: Batch) => b.configSnapshot.pressDuration_min },
                  { label: '晒纸温度', key: 'dryingTemp', unit: '°C', get: (b: Batch) => b.configSnapshot.dryingTemp_C },
                  { label: '质量等级', key: 'quality', unit: '', get: (b: Batch) => b.qualityLevel },
                ].map((row, ri) => {
                  const values = compareBatches.map((b) => row.get(b));
                  const numValues = values.map((v) => typeof v === 'number' ? v : parseFloat(v as string));
                  const hasValidNums = numValues.every((v) => !isNaN(v));
                  let bestIdx = -1;
                  if (row.highlight && hasValidNums) {
                    bestIdx = row.lowerIsBetter
                      ? numValues.indexOf(Math.min(...numValues))
                      : numValues.indexOf(Math.max(...numValues));
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
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-100">
            <CheckCircle className="h-3.5 w-3.5 text-bamboo-500" />
            <span>✓ 标记为该维度的最优值。匀度 CV 和最大偏差越低越好，克重越接近目标越好。</span>
          </div>
        </PaperCard>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <PaperCard
            title="批次时间线"
            subtitle={compareMode ? '点击□选择对比（最多3批同类纸）' : '点击卡片查看详情'}
            icon={<FileArchive className="h-5 w-5" />}
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
                              ? 'border-bronze-400 bg-gradient-to-br from-bronze-50 to-rattan-100/60 shadow-paper'
                              : isInCompare
                              ? 'border-bronze-400 bg-bronze-50/60'
                              : 'border-bronze-100 bg-white/50 hover:border-bronze-200 hover:bg-white',
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
                            {!compareMode && <ChevronRight className={`h-4 w-4 transition-all ${selectedId === b.id ? 'text-bronze-500' : 'text-ink-100 group-hover:translate-x-0.5'}`} />}
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
                  <p className="mt-1 text-xs text-ink-100">左侧按时间倒序排列，点击卡片即可查看详情</p>
                </div>
              </div>
            </PaperCard>
          )}
        </div>
      </div>
    </div>
  );
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
            <div className="rounded-lg border border-bronze-100 bg-white/50 p-3 text-xs">
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-ink-100">纸张类型：</span><span className="font-medium text-ink-300">{batch.configSnapshot.paperType}</span></div>
                <div><span className="text-ink-100">规格：</span><span className="font-medium text-ink-300 tabular-nums">{batch.configSnapshot.targetWidth_mm}×{batch.configSnapshot.targetHeight_mm}mm</span></div>
                <div><span className="text-ink-100">打浆度：</span><span className="font-medium text-ink-300 tabular-nums">{batch.configSnapshot.beatingDegree_SR}°SR</span></div>
                <div><span className="text-ink-100">用水量：</span><span className="font-medium text-ink-300 tabular-nums">{batch.configSnapshot.waterVolume_L} L</span></div>
                <div><span className="text-ink-100">纸药用量：</span><span className="font-medium text-ink-300 tabular-nums">{batch.configSnapshot.sizingDose_pct}%</span></div>
                <div><span className="text-ink-100">压榨压力：</span><span className="font-medium text-ink-300 tabular-nums">{batch.configSnapshot.pressPressure_kg}kg / {batch.configSnapshot.pressDuration_min}min</span></div>
              </div>
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
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
              <Gauge className="h-4 w-4" /> 质量指标
            </h4>
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
