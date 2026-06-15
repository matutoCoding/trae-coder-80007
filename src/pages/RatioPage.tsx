import { useMemo } from 'react';
import {
  Scale, Target, Beaker, Gauge, Droplet, Thermometer, RotateCcw, Sparkles,
  Layers, FileText, Download, AlertTriangle, CheckCircle, Wand2,
} from 'lucide-react';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import { calcRatio, reverseRatioFromTarget } from '@/utils/calculator';

export default function RatioPage() {
  const config = usePaperStore((s) => s.ratioConfig);
  const setConfig = usePaperStore((s) => s.setRatioConfig);
  const resetConfig = usePaperStore((s) => s.resetRatioConfig);
  const fibers = usePaperStore((s) => s.fibers);
  const sizingAgents = usePaperStore((s) => s.sizingAgents);
  const addRecipe = usePaperStore((s) => s.addRecipe);

  const result = useMemo(
    () => calcRatio({ config, fibers, sizingAgents }),
    [config, fibers, sizingAgents],
  );

  const handleReverse = () => {
    const patch = reverseRatioFromTarget(config.targetGrammage, config.paperUse, fibers);
    setConfig(patch);
  };

  const saveAsRecipe = () => {
    const name = prompt('请输入配方名称：', `${config.paperType} - ${config.targetGrammage}g`);
    if (!name) return;
    const category = prompt('请输入配方分类：', '自定义配方') || '自定义配方';
    addRecipe({ name, category, config: { ...config }, tags: ['手动保存'], note: '' });
    alert('已保存到配方库');
  };

  const updateMix = (i: number, patch: { fiberId?: string; ratio_pct?: number }) => {
    const nm = [...config.fiberMixture];
    nm[i] = { ...nm[i], ...patch };
    setConfig({ fiberMixture: nm });
  };
  const addMixItem = () => {
    const first = fibers[0];
    if (!first) return;
    setConfig({ fiberMixture: [...config.fiberMixture, { fiberId: first.id, ratio_pct: 0 }] });
  };
  const removeMixItem = (i: number) => {
    const nm = config.fiberMixture.filter((_, k) => k !== i);
    setConfig({ fiberMixture: nm });
  };

  const totalMixRatio = config.fiberMixture.reduce((s, m) => s + (m.ratio_pct || 0), 0);
  const mixOk = Math.abs(totalMixRatio - 100) < 0.5;

  const goThickness = () => window.location.hash = '#/thickness';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-300">纸浆配比计算</h1>
          <p className="mt-1 text-sm text-ink-100">根据目标纸张参数，计算纸浆浓度、荡料次数，评估强度匀度与抄造可行性</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={resetConfig}>重置参数</Button>
          <Button variant="secondary" icon={<Wand2 className="h-4 w-4" />} onClick={handleReverse}>智能反推配比</Button>
          <Button variant="success" icon={<Download className="h-4 w-4" />} onClick={saveAsRecipe}>存为配方</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <PaperCard title="目标纸张设定" subtitle="输入成品参数，系统据此反算" icon={<Target className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="纸张类型" className="col-span-2">
                <TextInput value={config.paperType} onChange={(e) => setConfig({ paperType: e.target.value })} placeholder="如：净皮宣纸" />
              </Field>
              <Field label="目标克重 (g/m²)" required>
                <TextInput type="number" value={config.targetGrammage || ''} onChange={(e) => setConfig({ targetGrammage: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="纸张用途">
                <Select value={config.paperUse} onChange={(e) => setConfig({ paperUse: e.target.value })}>
                  <option>书画</option>
                  <option>古籍印刷</option>
                  <option>包装用纸</option>
                  <option>工艺灯笼/剪纸</option>
                  <option>临摹/拓印</option>
                  <option>其他</option>
                </Select>
              </Field>
              <Field label="幅宽 (mm)">
                <TextInput type="number" value={config.targetWidth_mm || ''} onChange={(e) => setConfig({ targetWidth_mm: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="幅高 (mm)">
                <TextInput type="number" value={config.targetHeight_mm || ''} onChange={(e) => setConfig({ targetHeight_mm: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="目标厚度 (μm)">
                <TextInput type="number" value={config.targetThickness_um || ''} onChange={(e) => setConfig({ targetThickness_um: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="预计损耗率 (%)" hint="抄造过程中的纤维损失">
                <TextInput type="number" step="0.5" value={config.lossRate_pct ?? ''} onChange={(e) => setConfig({ lossRate_pct: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>
          </PaperCard>

          <PaperCard title="纤维配比" subtitle={`纤维种类 ${config.fiberMixture.length} 种，合计比例 ${totalMixRatio.toFixed(1)}%`} icon={<Beaker className="h-5 w-5" />} actions={
            <Button size="sm" variant="secondary" onClick={addMixItem}>+ 添加纤维</Button>
          }>
            <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 ${mixOk ? 'bg-bamboo-100 text-bamboo-500' : 'bg-rattan-100 text-rattan-400'}`}>
              {mixOk ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span className="text-xs font-medium">
                {mixOk ? '比例合计 100% ✓' : `比例合计为 ${totalMixRatio.toFixed(1)}%，应为 100%`}
              </span>
            </div>
            <div className="space-y-2.5">
              {config.fiberMixture.map((m, i) => {
                const f = fibers.find((x) => x.id === m.fiberId);
                return (
                  <div key={i} className="grid grid-cols-[1fr_110px_40px] items-center gap-2 rounded-lg border border-bronze-100 bg-white/50 px-3 py-2">
                    <Select value={m.fiberId} onChange={(e) => updateMix(i, { fiberId: e.target.value })}>
                      {fibers.map((fb) => (
                        <option key={fb.id} value={fb.id}>
                          {fb.name} ({fb.avgLength_mm.toFixed(1)}mm)
                        </option>
                      ))}
                    </Select>
                    <div className="flex items-center">
                      <TextInput type="number" step="1" value={m.ratio_pct ?? ''} onChange={(e) => updateMix(i, { ratio_pct: parseFloat(e.target.value) || 0 })} className="rounded-r-none" />
                      <span className="rounded-r-md border border-l-0 border-bronze-200 bg-bronze-50 px-2 py-2 text-xs text-ink-100">%</span>
                    </div>
                    <button onClick={() => removeMixItem(i)} className="h-9 w-9 rounded-md text-cinnabar-400 hover:bg-cinnabar-100/50" title="移除">
                      ×
                    </button>
                  </div>
                );
              })}
              {fibers.length > 0 && <p className="text-xs text-ink-100">平均纤维长度：{result ? (result.fiberBreakdown.reduce((s, b) => s + b.fiber.avgLength_mm * b.ratio_pct / 100, 0)).toFixed(2) : '—'} mm</p>}
            </div>
          </PaperCard>

          <PaperCard title="抄造工艺参数" icon={<Gauge className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="打浆度 (°SR)" hint={`建议参考纤维特性区间`}>
                <TextInput type="number" step="1" value={config.beatingDegree_SR ?? ''} onChange={(e) => setConfig({ beatingDegree_SR: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="用水量 (L)">
                <TextInput type="number" step="1" value={config.waterVolume_L ?? ''} onChange={(e) => setConfig({ waterVolume_L: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="每次入帘浆量 (mL)">
                <TextInput type="number" value={config.perSwingVolume_mL ?? ''} onChange={(e) => setConfig({ perSwingVolume_mL: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="纸药种类">
                <Select value={config.sizingAgentId} onChange={(e) => setConfig({ sizingAgentId: e.target.value })}>
                  {sizingAgents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (建议 {s.minDose_pct}–{s.maxDose_pct}%)
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="纸药用量 (% 绝干浆)">
                <TextInput type="number" step="0.1" value={config.sizingDose_pct ?? ''} onChange={(e) => setConfig({ sizingDose_pct: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="压榨压力 (kg)">
                <TextInput type="number" value={config.pressPressure_kg ?? ''} onChange={(e) => setConfig({ pressPressure_kg: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="压榨时长 (min)">
                <TextInput type="number" value={config.pressDuration_min ?? ''} onChange={(e) => setConfig({ pressDuration_min: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="晒纸温度 (°C)">
                <TextInput type="number" value={config.dryingTemp_C ?? ''} onChange={(e) => setConfig({ dryingTemp_C: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>
          </PaperCard>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <PaperCard title="核心配比结果" subtitle="基于目标克重与工艺参数的计算输出" icon={<Scale className="h-5 w-5" />}>
            {!result ? (
              <div className="flex h-40 items-center justify-center rounded-lg bg-bronze-50/50 text-sm text-ink-100">
                请先完善目标克重、幅面尺寸与纤维配比
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MetricDisplay label="成纸面积" value={result.area_m2} unit="m²" icon={<Layers className="h-3.5 w-3.5" />} />
                  <MetricDisplay label="绝干浆用量" value={result.dryPulpWeight_g} unit="g" tone="highlight" icon={<Beaker className="h-3.5 w-3.5" />} />
                  <MetricDisplay label="纸浆浓度" value={result.pulpConcentration_pct} unit="%" icon={<Droplet className="h-3.5 w-3.5" />} hint={`总料浆约 ${result.totalPulpVolume_mL} mL`} />
                  <MetricDisplay label="荡料次数" value={result.swingCount} unit="次" tone="success" icon={<RotateCcw className="h-3.5 w-3.5" />} hint={`每次入帘 ${config.perSwingVolume_mL} mL`} />
                </div>

                <div className="mt-5 overflow-hidden rounded-lg border border-bronze-100">
                  <div className="border-b border-bronze-100 bg-bronze-50/60 px-4 py-2 text-xs font-semibold text-bronze-500">纤维重量分解</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-ink-100">
                        <th className="px-4 py-2 text-left">纤维</th>
                        <th className="px-4 py-2 text-right">比例</th>
                        <th className="px-4 py-2 text-right">绝干重量</th>
                        <th className="px-4 py-2 text-right">纤维长度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.fiberBreakdown.map((b) => (
                        <tr key={b.fiber.id} className="border-t border-bronze-100 bg-white/40">
                          <td className="px-4 py-2 font-medium text-ink-300">{b.fiber.name}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{b.ratio_pct}%</td>
                          <td className="px-4 py-2 text-right tabular-nums text-bronze-500 font-semibold">{b.weight_g} g</td>
                          <td className="px-4 py-2 text-right tabular-nums text-ink-100">{b.fiber.avgLength_mm.toFixed(1)} mm</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-bronze-200 bg-rattan-100/40">
                        <td className="px-4 py-2 font-semibold">合计</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">100%</td>
                        <td className="px-4 py-2 text-right font-bold tabular-nums text-bronze-500">{result.dryPulpWeight_g} g</td>
                        <td />
                      </tr>
                      {result.sizingWeight_g > 0 && (
                        <tr className="border-t border-bronze-100 bg-bamboo-100/30">
                          <td className="px-4 py-2 font-medium text-bamboo-500" colSpan={2}>
                            纸药用量 ({config.sizingDose_pct}%)
                          </td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-bamboo-500">{result.sizingWeight_g} g</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-bronze-100 bg-white/50 px-4 py-3">
                    <div className="text-xs text-ink-100">打浆状态</div>
                    <Badge tone={result.beatingStatus === '合理' ? 'bamboo' : 'rattan'} className="mt-1">
                      {result.beatingStatus}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-bronze-100 bg-white/50 px-4 py-3">
                    <div className="text-xs text-ink-100">纸药用量</div>
                    <Badge tone={result.sizingDoseStatus === '合理' ? 'bamboo' : result.sizingDoseStatus === '不足' ? 'cinnabar' : 'rattan'} className="mt-1">
                      {result.sizingDoseStatus}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-bronze-100 bg-white/50 px-4 py-3">
                    <div className="text-xs text-ink-100">预计总料浆</div>
                    <div className="mt-1 font-display text-lg font-bold text-bronze-500 tabular-nums">{result.totalPulpVolume_mL} mL</div>
                  </div>
                </div>
              </>
            )}
          </PaperCard>

          <PaperCard title="综合指标评估" subtitle="强度·匀度·悬浮·平整 四维评分" icon={<Sparkles className="h-5 w-5" />}>
            {!result ? (
              <div className="h-24" />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-200">综合强度 (撕裂+耐破)</span>
                      <Badge tone={result.strengthScore >= 80 ? 'bamboo' : result.strengthScore >= 60 ? 'rattan' : 'cinnabar'}>
                        {result.strengthScore >= 80 ? '优良' : result.strengthScore >= 60 ? '中等' : '偏弱'}
                      </Badge>
                    </div>
                    <ProgressBar label="撕裂指数" value={result.tearScore} variant="strength" />
                    <div className="h-2" />
                    <ProgressBar label="耐破指数" value={result.burstScore} variant="strength" />
                  </div>
                  <ProgressBar label="匀度预测（成纸均一）" value={result.uniformityPrediction} variant="uniformity" />
                </div>
                <div className="space-y-4">
                  <ProgressBar label="纤维悬浮性" value={result.suspensionScore} variant="suspension" />
                  <ProgressBar label="揭纸顺畅度" value={result.releaseScore} variant="suspension" />
                  <ProgressBar label="成纸平整度" value={result.smoothnessScore} variant="smoothness" />
                </div>
              </div>
            )}
          </PaperCard>

          <PaperCard title="压榨与晒纸模拟" subtitle="预估收缩率与失水率" icon={<Thermometer className="h-5 w-5" />}>
            {!result ? (
              <div className="h-20" />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricDisplay label="压榨失水率" value={result.pressWaterLoss_pct} unit="%" hint="压榨后脱出水分比例" />
                <MetricDisplay label="横向收缩率" value={result.shrinkageWidth_pct} unit="%" hint="宽度方向缩水" tone="highlight" />
                <MetricDisplay label="纵向收缩率" value={result.shrinkageHeight_pct} unit="%" hint="长度方向缩水" tone="highlight" />
                <MetricDisplay label="成品预测尺寸" value={`${(config.targetWidth_mm * (1 - result.shrinkageWidth_pct / 100) / 10).toFixed(0)}×${(config.targetHeight_mm * (1 - result.shrinkageHeight_pct / 100) / 10).toFixed(0)}`} unit="cm" hint="晒纸后实际规格" />
              </div>
            )}
          </PaperCard>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={goThickness}>
              前往抄纸厚薄检测 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
