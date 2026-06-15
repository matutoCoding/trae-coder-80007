import { useState, useMemo } from 'react';
import {
  FileArchive, Search, Filter, Calendar, FileText, Trash2, ChevronRight, X,
  Layers, Scale, Gauge, AlertTriangle, CheckCircle, User,
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

  const [kw, setKw] = useState('');
  const [qlFilter, setQlFilter] = useState<string>('全部');

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

  const loadToRatio = (b: Batch) => {
    setRatioConfig(b.configSnapshot);
    alert('已载入此批次配比到「纸浆配比」页');
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
          <Badge tone="ink">共 {filtered.length} 批次</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <PaperCard title="批次时间线" subtitle="点击卡片查看详情" icon={<FileArchive className="h-5 w-5" />}>
            {!filtered.length ? (
              <div className="rounded-lg bg-bronze-50/60 py-16 text-center text-sm text-ink-100">
                暂无匹配的批次档案
                <div className="mt-3 text-xs">前往「抄纸厚薄」页检测后归档，即可在此查看</div>
              </div>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-bronze-200 pl-5">
                {filtered.map((b) => (
                  <li key={b.id} className="relative">
                    <span
                      className={[
                        'absolute -left-[30px] top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-rice-50',
                        b.qualityLevel === '优' ? 'bg-bamboo-400' :
                        b.qualityLevel === '良' ? 'bg-bronze-400' :
                        b.qualityLevel === '合格' ? 'bg-rattan-300' : 'bg-cinnabar-400',
                      ].join(' ')}
                    />
                    <button
                      onClick={() => selectBatch(b.id)}
                      className={[
                        'group w-full rounded-xl border p-4 text-left transition-all',
                        selectedId === b.id
                          ? 'border-bronze-400 bg-gradient-to-br from-bronze-50 to-rattan-100/60 shadow-paper'
                          : 'border-bronze-100 bg-white/50 hover:border-bronze-200 hover:bg-white',
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
                        <ChevronRight className={`h-4 w-4 transition-all ${selectedId === b.id ? 'text-bronze-500' : 'text-ink-100 group-hover:translate-x-0.5'}`} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-ink-100">目标/实际</div>
                          <div className="mt-0.5 font-semibold tabular-nums text-ink-300">{b.targetGrammage}/{b.actualAvgGrammage} g</div>
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
                    </button>
                  </li>
                ))}
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
  batch, onClose, onDelete, onLoad,
}: {
  batch: Batch;
  onClose: () => void;
  onDelete: () => void;
  onLoad: () => void;
}) {
  const side = batch.gridSize;
  const labels = side === 3
    ? ['上左', '上中', '上右', '中左', '中心', '中右', '下左', '下中', '下右']
    : ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2', '2-3', '2-4', '3-1', '3-2', '3-3', '3-4', '4-1', '4-2', '4-3', '4-4'];
  const devs = detectDeviation(batch.thicknessGrid, batch.targetGrammage, batch.tolerance_pct);

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
          <Button size="sm" variant="secondary" onClick={onLoad}>载入到配比页</Button>
          <Button size="sm" variant="ghost" className="text-cinnabar-400" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>删除</Button>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-100 hover:bg-bronze-100 hover:text-ink-300"><X className="h-4 w-4" /></button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-3">
        <MetricDisplay label="目标克重" value={batch.targetGrammage} unit="g/m²" />
        <MetricDisplay label="平均克重" value={batch.actualAvgGrammage} unit="g/m²" tone={Math.abs(batch.actualAvgGrammage - batch.targetGrammage) / batch.targetGrammage < 0.05 ? 'success' : 'warn'} />
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

      <div className="mt-5 flex items-center gap-2 rounded-lg border border-bamboo-200 bg-bamboo-100/40 px-4 py-2.5 text-xs text-bamboo-500">
        <CheckCircle className="h-4 w-4" />
        <span>档案完成时间 {batch.createdAt}，可随时从「纸浆配比」页载入此批参数重新抄造，保持品质稳定。</span>
      </div>
    </PaperCard>
  );
}
