import { useMemo } from 'react';
import {
  Layers, AlertTriangle, AlertCircle, Save, RefreshCw, Grid2x2, Grid3x3,
  Gauge, TrendingUp, TrendingDown, ShieldAlert, Info, CheckCircle2,
  Scroll, Clock, PenLine, Hand, Paperclip, Sun, BookOpen,
} from 'lucide-react';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select, Textarea } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import { calcRatio } from '@/utils/calculator';
import {
  detectDeviation, computeStats, uniformityLevel, qualityLevel,
  generateWarnings, assessReleaseRisk,
} from '@/utils/thickness';
import type { Batch, PapermakingRecord } from '@/types';

const ZONE_LABELS_3x3 = [
  ['上左', '上中', '上右'],
  ['中左', '中心', '中右'],
  ['下左', '下中', '下右'],
];
const ZONE_LABELS_4x4 = [
  ['1-1', '1-2', '1-3', '1-4'],
  ['2-1', '2-2', '2-3', '2-4'],
  ['3-1', '3-2', '3-3', '3-4'],
  ['4-1', '4-2', '4-3', '4-4'],
];

const FEEL_OPTIONS: Array<{ value: PapermakingRecord['feelLevel']; label: string; desc: string }> = [
  { value: '极佳', label: '极佳', desc: '纤维悬浮均匀，入帘如行云流水' },
  { value: '良好', label: '良好', desc: '浆流平稳，手感顺畅' },
  { value: '一般', label: '一般', desc: '略有滞感，需调整节奏' },
  { value: '较差', label: '较差', desc: '浆体不稳，入帘有阻滞' },
];

const RELEASE_OPTIONS: Array<{ value: PapermakingRecord['releaseSituation']; label: string; desc: string }> = [
  { value: '顺畅', label: '顺畅', desc: '揭纸如脱茧，完整无损' },
  { value: '微阻', label: '微阻', desc: '略有粘连，小心可揭' },
  { value: '粘连', label: '粘连', desc: '需缓慢揭起，局部有破损' },
  { value: '破损', label: '破损', desc: '纸张易碎，揭纸困难' },
];

export default function ThicknessPage() {
  const gridSize = usePaperStore((s) => s.currentGridSize);
  const setGridSize = usePaperStore((s) => s.setGridSize);
  const grid = usePaperStore((s) => s.currentThicknessGrid);
  const setGrid = usePaperStore((s) => s.setThicknessGrid);
  const resetGrid = usePaperStore((s) => s.resetThicknessGrid);
  const tolerance = usePaperStore((s) => s.currentTolerance_pct);
  const setTolerance = usePaperStore((s) => s.setTolerance);
  const config = usePaperStore((s) => s.ratioConfig);
  const fibers = usePaperStore((s) => s.fibers);
  const sizingAgents = usePaperStore((s) => s.sizingAgents);
  const saveBatch = usePaperStore((s) => s.saveBatch);
  const recipes = usePaperStore((s) => s.recipes);
  const payload = usePaperStore((s) => s.ratioToThicknessPayload);
  const papermakingRecord = usePaperStore((s) => s.papermakingRecord);
  const setPapermakingRecord = usePaperStore((s) => s.setPapermakingRecord);

  const target = config.targetGrammage;
  const ratio = useMemo(() => calcRatio({ config, fibers, sizingAgents }), [config, fibers, sizingAgents]);

  const devs = useMemo(() => detectDeviation(grid, target, tolerance), [grid, target, tolerance]);
  const stats = useMemo(() => computeStats(grid), [grid]);
  const uLevel = useMemo(() => uniformityLevel(stats.cv), [stats.cv]);
  const maxDev = useMemo(() => (
    devs.length ? Math.max(...devs.map((d) => Math.abs(d.deviation_pct))) : 0
  ), [devs]);
  const qLevel = useMemo(() => qualityLevel(stats.cv, maxDev, tolerance), [stats.cv, maxDev, tolerance]);

  const { warnings, issues } = useMemo(
    () => generateWarnings(devs, stats.cv, ratio?.suspensionScore, ratio?.releaseScore),
    [devs, stats.cv, ratio],
  );
  const releaseRisk = useMemo(
    () => assessReleaseRisk(devs, ratio?.releaseScore),
    [devs, ratio],
  );

  const updateCell = (i: number, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    const ng = [...grid];
    ng[i] = isNaN(num as number) ? null : num;
    setGrid(ng);
  };

  const fillDemo = () => {
    const base = target || 60;
    const n = gridSize * gridSize;
    const arr = Array.from({ length: n }, () => {
      const jitter = (Math.random() - 0.5) * base * 0.22;
      return Math.round((base + jitter) * 10) / 10;
    });
    arr[0] = Math.round(base * 1.12 * 10) / 10;
    arr[n - 1] = Math.round(base * 0.85 * 10) / 10;
    setGrid(arr);
  };

  const handleSaveBatch = () => {
    if (!stats.count) {
      alert('请先录入帘面检测数据');
      return;
    }
    const recipe = recipes.find((r) => r.name.includes(config.paperType));
    const batchNo = 'XZ-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 90) + 10);
    const batch: Omit<Batch, 'id' | 'createdAt'> = {
      batchNo,
      recipeId: recipe?.id || null,
      recipeSnapshot: recipe || null,
      date: new Date().toISOString().slice(0, 10),
      configSnapshot: config,
      thicknessGrid: grid,
      gridSize,
      tolerance_pct: tolerance,
      targetGrammage: target,
      targetSwingCount: payload?.swingCount || ratio?.swingCount || 0,
      actualAvgGrammage: stats.mean,
      actualThickness_um: Math.round((stats.mean / target) * config.targetThickness_um) || 0,
      uniformityCV_pct: stats.cv,
      maxDeviation_pct: maxDev,
      qualityLevel: qLevel,
      uniformityLevel: uLevel,
      issues,
      warnings,
      operator: '当班工匠',
      note: '',
      papermakingRecord: { ...papermakingRecord },
    };
    saveBatch(batch);
    alert('批次已归档，工艺档案已生成（含抄造过程记录）');
  };

  const labels = gridSize === 3 ? ZONE_LABELS_3x3 : ZONE_LABELS_4x4;
  const displayPayload = payload || (ratio ? {
    paperType: config.paperType,
    targetGrammage: target,
    targetWidth_mm: config.targetWidth_mm,
    targetHeight_mm: config.targetHeight_mm,
    swingCount: ratio.swingCount,
    pulpConcentration_pct: ratio.pulpConcentration_pct,
    sizingAgentName: sizingAgents.find((s) => s.id === config.sizingAgentId)?.name || '未设定',
    sizingDose_pct: config.sizingDose_pct,
    beatingDegree_SR: config.beatingDegree_SR,
    timestamp: new Date().toISOString(),
  } : null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-300">抄纸厚薄检测</h1>
          <p className="mt-1 text-sm text-ink-100">逐区录入克重/厚度，系统识别偏差标红、云絮分布与揭纸风险</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={resetGrid}>清空网格</Button>
          <Button variant="secondary" icon={<Grid3x3 className="h-4 w-4" />} onClick={fillDemo}>填入示例</Button>
          <Button variant="success" icon={<Save className="h-4 w-4" />} onClick={handleSaveBatch}>归档为工艺档案</Button>
        </div>
      </header>

      {displayPayload && (
        <PaperCard
          title="本次抄造任务"
          subtitle={payload ? '来自纸浆配比计算' : '当前配比设置'}
          icon={<BookOpen className="h-5 w-5" />}
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-lg bg-bronze-50/80 p-3">
              <div className="text-xs text-ink-100">纸种</div>
              <div className="mt-0.5 font-display text-lg font-bold text-bronze-600">{displayPayload.paperType}</div>
            </div>
            <div className="rounded-lg bg-bronze-50/80 p-3">
              <div className="text-xs text-ink-100">目标克重</div>
              <div className="mt-0.5 font-display text-lg font-bold text-ink-300 tabular-nums">{displayPayload.targetGrammage} g/m²</div>
            </div>
            <div className="rounded-lg bg-bronze-50/80 p-3">
              <div className="text-xs text-ink-100">幅面</div>
              <div className="mt-0.5 font-display text-lg font-bold text-ink-300 tabular-nums">
                {displayPayload.targetWidth_mm}×{displayPayload.targetHeight_mm} mm
              </div>
            </div>
            <div className="rounded-lg bg-bamboo-50/80 p-3">
              <div className="text-xs text-ink-100">荡料次数</div>
              <div className="mt-0.5 font-display text-lg font-bold text-bamboo-600 tabular-nums">{displayPayload.swingCount} 次</div>
            </div>
            <div className="rounded-lg bg-bamboo-50/80 p-3">
              <div className="text-xs text-ink-100">纸浆浓度</div>
              <div className="mt-0.5 font-display text-lg font-bold text-bamboo-600 tabular-nums">{displayPayload.pulpConcentration_pct.toFixed(2)}%</div>
            </div>
            <div className="rounded-lg bg-rattan-50/80 p-3">
              <div className="text-xs text-ink-100">打浆度</div>
              <div className="mt-0.5 font-display text-lg font-bold text-rattan-600 tabular-nums">{displayPayload.beatingDegree_SR}°SR</div>
            </div>
          </div>
          {payload && (
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-100">
              <Clock className="h-3.5 w-3.5" />
              <span>配比计算时间：{new Date(payload.timestamp).toLocaleString('zh-CN')}</span>
              <Badge tone="bronze" className="ml-2">来自配比页</Badge>
            </div>
          )}
        </PaperCard>
      )}

      {warnings.length > 0 && (
        <div className="animate-pulse-warn overflow-hidden rounded-xl border-2 border-cinnabar-300 bg-gradient-to-r from-cinnabar-100/80 to-cinnabar-100/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-cinnabar-500">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-display text-lg font-bold">质量预警 · 发现 {warnings.length} 项需注意</span>
          </div>
          <ul className="space-y-1.5 text-sm text-cinnabar-500/95">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <PaperCard
            title={`帘面分区检测 (${gridSize}×${gridSize})`}
            subtitle="录入每区实测克重 g/m²，红框为超差区域"
            icon={<Layers className="h-5 w-5" />}
            actions={
              <div className="flex gap-2">
                <div className="flex rounded-md border border-bronze-200 bg-white/60 p-0.5">
                  <button
                    onClick={() => setGridSize(3)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium ${
                      gridSize === 3 ? 'bg-bronze-400 text-rice-50' : 'text-ink-200 hover:bg-bronze-100/60'
                    }`}
                  >
                    <Grid2x2 className="h-3.5 w-3.5" /> 3×3
                  </button>
                  <button
                    onClick={() => setGridSize(4)}
                    className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium ${
                      gridSize === 4 ? 'bg-bronze-400 text-rice-50' : 'text-ink-200 hover:bg-bronze-100/60'
                    }`}
                  >
                    <Grid3x3 className="h-3.5 w-3.5" /> 4×4
                  </button>
                </div>
                <Field label="" hint="±公差%">
                  <TextInput
                    type="number"
                    className="w-24"
                    value={tolerance || ''}
                    onChange={(e) => setTolerance(parseFloat(e.target.value) || 5)}
                  />
                </Field>
              </div>
            }
          >
            <div className="mb-4 rounded-lg border border-bronze-100 bg-bronze-50/60 p-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border-2 border-cinnabar-400 bg-cinnabar-100" />
                  <span className="text-ink-200">超差（超出 ±{tolerance}%）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border-2 border-bamboo-300 bg-bamboo-100" />
                  <span className="text-ink-200">偏厚 (在公差内)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border-2 border-rattan-200 bg-rattan-100" />
                  <span className="text-ink-200">偏薄 (在公差内)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border-2 border-bronze-200 bg-white" />
                  <span className="text-ink-200">正常值 / 未录入</span>
                </div>
                <div className="ml-auto text-ink-100">
                  目标克重：<span className="font-semibold text-bronze-500 tabular-nums">{target} g/m²</span>
                </div>
              </div>
            </div>

            <div
              className="mx-auto aspect-square w-full max-w-[520px] rounded-xl border-2 border-bronze-300 bamboo-curtain p-3"
              style={{ background: 'linear-gradient(135deg, #FBF8F1 0%, #F5F0E6 100%)' }}
            >
              <div
                className="grid h-full w-full gap-2"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              >
                {labels.map((row, ri) =>
                  row.map((lab, ci) => {
                    const idx = ri * gridSize + ci;
                    const d = devs[idx];
                    const v = grid[idx];
                    const hasVal = v !== null && v !== undefined;
                    let tone = 'normal';
                    if (!hasVal) tone = 'empty';
                    else if (d?.isOverTolerance) tone = d.isHigh ? 'over-high' : 'over-low';
                    else if (v > target) tone = 'high';
                    else if (v < target) tone = 'low';
                    return (
                      <div
                        key={idx}
                        className={[
                          'relative flex flex-col items-stretch justify-between rounded-lg border-2 p-2 transition-all',
                          tone === 'empty' && 'border-dashed border-bronze-200 bg-white/50',
                          tone === 'normal' && 'border-bronze-200 bg-white',
                          tone === 'high' && 'border-bamboo-300 bg-bamboo-100/70',
                          tone === 'low' && 'border-rattan-200 bg-rattan-100/70',
                          tone === 'over-high' && 'border-cinnabar-400 bg-cinnabar-100 shadow-md',
                          tone === 'over-low' && 'border-cinnabar-400 bg-cinnabar-100/70 shadow-md',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-medium text-ink-100">{lab}</span>
                          {tone === 'over-high' && <TrendingUp className="h-3 w-3 text-cinnabar-400" />}
                          {tone === 'over-low' && <TrendingDown className="h-3 w-3 text-cinnabar-400" />}
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          value={v ?? ''}
                          onChange={(e) => updateCell(idx, e.target.value)}
                          placeholder="—"
                          className={[
                            'w-full border-0 bg-transparent text-center font-display text-xl font-bold tabular-nums outline-none',
                            tone === 'over-high' || tone === 'over-low'
                              ? 'text-cinnabar-500'
                              : 'text-ink-300 placeholder:text-ink-100/50',
                          ].join(' ')}
                        />
                        <div className="text-center">
                          {hasVal && d && (
                            <span
                              className={[
                                'inline-flex rounded-sm px-1 text-[10px] font-semibold tabular-nums',
                                d.isOverTolerance
                                  ? 'bg-cinnabar-400 text-white'
                                  : Math.abs(d.deviation_pct) > tolerance * 0.6
                                  ? 'bg-rattan-200 text-rattan-400'
                                  : 'bg-bamboo-100 text-bamboo-500',
                              ].join(' ')}
                            >
                              {d.deviation_pct > 0 ? '+' : ''}{d.deviation_pct.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </PaperCard>

          <PaperCard
            title="抄造过程记录"
            subtitle="记录实际操作细节，归档后可完整回看工艺流程"
            icon={<Scroll className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-3 border-b border-bronze-100 pb-3">
                  <div className="rounded-full bg-bronze-100 p-2">
                    <Hand className="h-4 w-4 text-bronze-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-300">入帘荡料</h3>
                    <p className="text-xs text-ink-100">记录荡料与搅浆实际操作</p>
                  </div>
                </div>
              </div>

              <Field label="实际荡料次数" hint="与目标次数对比">
                <TextInput
                  type="number"
                  value={papermakingRecord.actualSwingCount || ''}
                  onChange={(e) => setPapermakingRecord({ actualSwingCount: parseInt(e.target.value) || 0 })}
                  placeholder={String(payload?.swingCount || ratio?.swingCount || 0)}
                />
              </Field>

              <Field label="搅浆次数" hint="每次入帘前的搅拌次数">
                <TextInput
                  type="number"
                  value={papermakingRecord.stirCount || ''}
                  onChange={(e) => setPapermakingRecord({ stirCount: parseInt(e.target.value) || 0 })}
                  placeholder="如 15"
                />
              </Field>

              <Field label="入帘手感" hint="浆料在竹帘上的流动手感">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {FEEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPapermakingRecord({ feelLevel: opt.value })}
                      className={[
                        'rounded-lg border-2 p-3 text-left transition-all hover:border-bronze-300',
                        papermakingRecord.feelLevel === opt.value
                          ? 'border-bronze-500 bg-bronze-50 shadow-sm'
                          : 'border-bronze-200 bg-white/60',
                      ].join(' ')}
                    >
                      <div className={[
                        'font-display text-sm font-semibold',
                        papermakingRecord.feelLevel === opt.value ? 'text-bronze-600' : 'text-ink-200',
                      ].join(' ')}>{opt.label}</div>
                      <div className="mt-1 text-[10px] text-ink-100">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="手感备注">
                <Textarea
                  value={papermakingRecord.feelNote || ''}
                  onChange={(e) => setPapermakingRecord({ feelNote: e.target.value })}
                  placeholder="如：浆料稍稠，荡料时需略加速..."
                  rows={2}
                />
              </Field>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-3 border-b border-bronze-100 pb-3 pt-2">
                  <div className="rounded-full bg-rattan-100 p-2">
                    <Paperclip className="h-4 w-4 text-rattan-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-300">揭纸情况</h3>
                    <p className="text-xs text-ink-100">湿纸从帘面揭下的完整度</p>
                  </div>
                </div>
              </div>

              <Field label="揭纸情况" hint="湿纸完整度评估" className="md:col-span-2">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {RELEASE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPapermakingRecord({ releaseSituation: opt.value })}
                      className={[
                        'rounded-lg border-2 p-3 text-left transition-all hover:border-bronze-300',
                        papermakingRecord.releaseSituation === opt.value
                          ? 'border-rattan-500 bg-rattan-50 shadow-sm'
                          : 'border-bronze-200 bg-white/60',
                      ].join(' ')}
                    >
                      <div className={[
                        'font-display text-sm font-semibold',
                        papermakingRecord.releaseSituation === opt.value ? 'text-rattan-700' : 'text-ink-200',
                      ].join(' ')}>{opt.label}</div>
                      <div className="mt-1 text-[10px] text-ink-100">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="揭纸备注" className="md:col-span-2">
                <Textarea
                  value={papermakingRecord.releaseNote || ''}
                  onChange={(e) => setPapermakingRecord({ releaseNote: e.target.value })}
                  placeholder="如：左下角略有粘连，揭起时小心处理..."
                  rows={2}
                />
              </Field>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-3 border-b border-bronze-100 pb-3 pt-2">
                  <div className="rounded-full bg-bamboo-100 p-2">
                    <Sun className="h-4 w-4 text-bamboo-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-300">后工序备注</h3>
                    <p className="text-xs text-ink-100">压榨与晒纸的特殊记录</p>
                  </div>
                </div>
              </div>

              <Field label="压榨备注">
                <Textarea
                  value={papermakingRecord.pressNote || ''}
                  onChange={(e) => setPapermakingRecord({ pressNote: e.target.value })}
                  placeholder="如：压榨压力适中，控水良好..."
                  rows={2}
                />
              </Field>

              <Field label="晒纸备注">
                <Textarea
                  value={papermakingRecord.dryingNote || ''}
                  onChange={(e) => setPapermakingRecord({ dryingNote: e.target.value })}
                  placeholder="如：阴干，避免直射，收缩率约3%..."
                  rows={2}
                />
              </Field>

              <Field label="抄造开始时间">
                <TextInput
                  type="datetime-local"
                  value={papermakingRecord.startTime || ''}
                  onChange={(e) => setPapermakingRecord({ startTime: e.target.value })}
                />
              </Field>

              <Field label="抄造结束时间">
                <TextInput
                  type="datetime-local"
                  value={papermakingRecord.endTime || ''}
                  onChange={(e) => setPapermakingRecord({ endTime: e.target.value })}
                />
              </Field>
            </div>
          </PaperCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <MetricDisplay
              label="平均克重"
              value={stats.count ? `${stats.mean.toFixed(1)} g/m²` : '—'}
              hint={stats.count ? `目标 ${target}` : '需录入数据'}
              tone={stats.count && Math.abs(stats.mean - target) <= target * tolerance / 100 ? 'success' : 'warn'}
            />
            <MetricDisplay
              label="变异系数 CV"
              value={stats.count ? `${stats.cv.toFixed(2)}%` : '—'}
              hint={uLevel}
              tone={stats.cv < 5 ? 'success' : stats.cv < 10 ? 'warn' : 'danger'}
            />
            <MetricDisplay
              label="最大偏差"
              value={stats.count ? `${maxDev.toFixed(1)}%` : '—'}
              hint={`公差 ±${tolerance}%`}
              tone={maxDev <= tolerance ? 'success' : maxDev <= tolerance * 1.2 ? 'warn' : 'danger'}
            />
            <MetricDisplay
              label="质量等级"
              value={qLevel || '—'}
              hint={stats.count ? `${stats.count} 个测点` : '需录入数据'}
              tone={qLevel === '优' ? 'success' : qLevel === '良' ? 'warn' : 'danger'}
            />
          </div>

          <PaperCard
            title="匀度评估"
            icon={<Gauge className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <ProgressBar
                label="均匀度评分"
                value={stats.count ? Math.max(0, 100 - stats.cv * 5) : 0}
                max={100}
                variant="uniformity"
              />
              <ProgressBar
                label="强度评分"
                value={ratio?.strengthScore || 0}
                max={100}
                variant="strength"
              />
              <ProgressBar
                label="悬浮评分"
                value={ratio?.suspensionScore || 0}
                max={100}
                variant="suspension"
              />
              <ProgressBar
                label="揭纸顺畅度"
                value={ratio?.releaseScore || 0}
                max={100}
                variant="suspension"
              />
            </div>
          </PaperCard>

          {releaseRisk && (
            <PaperCard
              title="揭纸风险评估"
              icon={<ShieldAlert className="h-5 w-5" />}
            >
              <div className="space-y-3">
                <div className={[
                  'flex items-center gap-3 rounded-lg p-3',
                  releaseRisk.level === '高' ? 'bg-cinnabar-100' : releaseRisk.level === '中' ? 'bg-rattan-100' : 'bg-bamboo-100',
                ].join(' ')}>
                  <AlertTriangle className={[
                    'h-5 w-5',
                    releaseRisk.level === '高' ? 'text-cinnabar-500' : releaseRisk.level === '中' ? 'text-rattan-600' : 'text-bamboo-600',
                  ].join(' ')} />
                  <div>
                    <div className="font-display font-bold text-ink-300">风险等级：{releaseRisk.level}</div>
                    <div className="text-xs text-ink-100">{releaseRisk.assessment}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {releaseRisk.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-ink-200">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bronze-400" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PaperCard>
          )}

          {issues.length > 0 && (
            <PaperCard
              title="检测问题归纳"
              icon={<PenLine className="h-5 w-5" />}
            >
              <ul className="space-y-2 text-sm text-ink-200">
                {issues.map((iss, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-bronze-400" />
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            </PaperCard>
          )}
        </div>
      </div>
    </div>
  );
}
