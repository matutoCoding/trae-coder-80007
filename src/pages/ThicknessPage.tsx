import { useMemo } from 'react';
import {
  Layers, AlertTriangle, AlertCircle, Save, RefreshCw, Grid2x2, Grid3x3,
  Gauge, TrendingUp, TrendingDown, ShieldAlert, Info, CheckCircle2,
} from 'lucide-react';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import { calcRatio } from '@/utils/calculator';
import {
  detectDeviation, computeStats, uniformityLevel, qualityLevel,
  generateWarnings, assessReleaseRisk,
} from '@/utils/thickness';
import type { Batch } from '@/types';

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
    };
    saveBatch(batch);
    alert('批次已归档，工艺档案已生成');
  };

  const labels = gridSize === 3 ? ZONE_LABELS_3x3 : ZONE_LABELS_4x4;

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
        </div>

        <div className="space-y-6 xl:col-span-2">
          <PaperCard title="统计摘要" subtitle={`已录入 ${stats.count}/${gridSize * gridSize} 个样本`} icon={<Gauge className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-3">
              <MetricDisplay label="平均克重" value={stats.mean || '—'} unit="g/m²" tone={Math.abs(stats.mean - target) <= tolerance * target / 100 ? 'success' : 'warn'} />
              <MetricDisplay label="目标克重" value={target} unit="g/m²" />
              <MetricDisplay label="变异系数 CV" value={stats.cv || '—'} unit="%" tone={uLevel === '优' ? 'success' : uLevel === '良' ? 'highlight' : uLevel === '合格' ? 'warn' : 'danger'} hint={`匀度：${uLevel}`} />
              <MetricDisplay label="最大偏差" value={maxDev ? maxDev.toFixed(1) : '—'} unit="%" tone={maxDev > tolerance ? 'danger' : 'success'} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-bronze-100 bg-white/60 p-3">
                <div className="text-xs text-ink-100">综合质量等级</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={qLevel === '优' ? 'bamboo' : qLevel === '良' ? 'bronze' : qLevel === '合格' ? 'rattan' : 'cinnabar'} size="md">
                    {qLevel}
                  </Badge>
                  {qLevel === '优' && <CheckCircle2 className="h-4 w-4 text-bamboo-500" />}
                </div>
              </div>
              <div className="rounded-lg border border-bronze-100 bg-white/60 p-3">
                <div className="text-xs text-ink-100">揭纸破损风险</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    tone={releaseRisk.level === '低' ? 'bamboo' : releaseRisk.level === '中' ? 'rattan' : 'cinnabar'}
                    size="md"
                  >
                    {releaseRisk.level}风险
                  </Badge>
                  <span className="text-xs text-ink-100 tabular-nums">评分 {releaseRisk.score}</span>
                </div>
              </div>
            </div>
          </PaperCard>

          <PaperCard title="检测指标" icon={<Info className="h-5 w-5" />}>
            <ProgressBar label="匀度评分 (100-CV×4)" value={Math.max(0, 100 - stats.cv * 4)} variant="uniformity" />
            <div className="h-4" />
            <ProgressBar label="录入完成度" value={(stats.count / (gridSize * gridSize)) * 100} variant="custom" customColor="from-bronze-200 to-bronze-400" />
            {issues.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-semibold text-ink-200">质量缺陷标记</div>
                <div className="flex flex-wrap gap-2">
                  {issues.map((i) => (
                    <Badge key={i} tone="cinnabar">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
          </PaperCard>

          <PaperCard title="操作建议" icon={<AlertTriangle className="h-5 w-5" />}>
            <ul className="space-y-2 text-sm text-ink-200">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-bamboo-400" />
                <span><b className="text-bamboo-500">匀度优 (CV&lt;5%)</b>：可直接进入压榨晒纸工序，建议记录为本批次标准样。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rattan-300" />
                <span><b className="text-rattan-400">有薄区</b>：揭纸时用湿毛巾敷于薄区上方 10 秒，再缓慢起纸。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cinnabar-400" />
                <span><b className="text-cinnabar-400">云絮多</b>：下次抄前用竹棒顺向搅浆 30 圈，并检查纸药是否失效。</span>
              </li>
            </ul>
          </PaperCard>

          {ratio && (
            <PaperCard title="关联配比信息" icon={<Grid2x2 className="h-5 w-5" />}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="纸张类型" className="m-0">
                  <TextInput value={config.paperType} readOnly className="bg-rice-200/50" />
                </Field>
                <Field label="打浆度">
                  <TextInput value={`${config.beatingDegree_SR}°SR`} readOnly className="bg-rice-200/50" />
                </Field>
                <Field label="纸药">
                  <Select value={config.sizingAgentId} disabled>
                    {sizingAgents.map((s) => <option key={s.id} value={s.id}>{s.name} {config.sizingDose_pct}%</option>)}
                  </Select>
                </Field>
                <Field label="配方库匹配">
                  <TextInput value={recipes.find((r) => r.name.includes(config.paperType))?.name || '未匹配'} readOnly className="bg-rice-200/50" />
                </Field>
              </div>
            </PaperCard>
          )}
        </div>
      </div>
    </div>
  );
}
