import { useState, useMemo } from 'react';
import {
  BookOpen, Search, Tag, Plus, X, Trash2, Edit2, Download,
  Sparkles, Target, Scale, Beaker, Clock, ChevronRight,
  Star, GitBranch, Calendar, TrendingUp, Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Select, Textarea } from '@/components/ui/Field';
import ProgressBar, { Badge } from '@/components/ui/ProgressBar';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { usePaperStore } from '@/store/paperStore';
import { calcRatio } from '@/utils/calculator';
import type { Recipe, RecipeVersion } from '@/types';

interface EditingRecipe {
  id?: string;
  name: string;
  category: string;
  note: string;
  tags: string[];
}

type FilterType = 'all' | 'recommended' | 'recent' | 'quality';

const FILTER_OPTIONS: Array<{ value: FilterType; label: string; icon: typeof Star }> = [
  { value: 'all', label: '全部', icon: BookOpen },
  { value: 'recommended', label: '推荐方案', icon: Star },
  { value: 'recent', label: '最近使用', icon: Clock },
  { value: 'quality', label: '质量优先', icon: Award },
];

export default function RecipesPage() {
  const recipes = usePaperStore((s) => s.recipes);
  const fibers = usePaperStore((s) => s.fibers);
  const sizingAgents = usePaperStore((s) => s.sizingAgents);
  const removeRecipe = usePaperStore((s) => s.removeRecipe);
  const updateRecipe = usePaperStore((s) => s.updateRecipe);
  const addRecipe = usePaperStore((s) => s.addRecipe);
  const loadRecipeToRatio = usePaperStore((s) => s.loadRecipeToRatio);
  const currentConfig = usePaperStore((s) => s.ratioConfig);
  const setRecommendedVersion = usePaperStore((s) => s.setRecommendedVersion);
  const addRecipeVersion = usePaperStore((s) => s.addRecipeVersion);
  const recipeFilter = usePaperStore((s) => s.recipeFilter);
  const setRecipeFilter = usePaperStore((s) => s.setRecipeFilter);
  const batches = usePaperStore((s) => s.batches);
  const navigate = useNavigate();

  const [kw, setKw] = useState('');
  const [catFilter, setCatFilter] = useState<string>('全部');
  const [selectedId, setSelectedId] = useState<string | null>(recipes[0]?.id || null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingRecipe | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category));
    return ['全部', ...Array.from(set)];
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = [...recipes];

    list = list.filter((r) => {
      if (catFilter !== '全部' && r.category !== catFilter) return false;
      if (!kw.trim()) return true;
      const k = kw.trim().toLowerCase();
      return (
        r.name.toLowerCase().includes(k) ||
        r.paperType?.toLowerCase().includes(k) ||
        r.config.paperType.toLowerCase().includes(k) ||
        r.tags.some((t) => t.toLowerCase().includes(k))
      );
    });

    if (recipeFilter === 'recommended') {
      list = list.filter((r) => r.recommendedVersionId);
    } else if (recipeFilter === 'recent') {
      list = list
        .filter((r) => r.lastUsedAt)
        .sort((a, b) => new Date(b.lastUsedAt || '').getTime() - new Date(a.lastUsedAt || '').getTime());
    } else if (recipeFilter === 'quality') {
      list = list.sort((a, b) => {
        const aVersions = a.versions || [];
        const bVersions = b.versions || [];
        return bVersions.length - aVersions.length;
      });
    }

    return list;
  }, [recipes, kw, catFilter, recipeFilter]);

  const selected = recipes.find((r) => r.id === selectedId) || null;
  const versions = selected?.versions || [];
  const activeVersionId = selectedVersionId || selected?.recommendedVersionId || versions[0]?.id;
  const activeVersion = versions.find((v) => v.id === activeVersionId) || null;

  const displayConfig = activeVersion?.config || selected?.config || currentConfig;

  const ratio = useMemo(
    () => (selected ? calcRatio({ config: displayConfig, fibers, sizingAgents }) : null),
    [selected, displayConfig, fibers, sizingAgents],
  );

  const startNew = () => {
    setEditing({
      name: currentConfig.paperType + ' 自定义',
      category: '自定义配方',
      note: '',
      tags: [],
    });
    setShowForm(true);
  };
  const startEdit = (r: Recipe) => {
    setEditing({ id: r.id, name: r.name, category: r.category, note: r.note, tags: [...r.tags] });
    setShowForm(true);
  };
  const submitForm = () => {
    if (!editing) return;
    if (!editing.name) return alert('请输入配方名称');
    if (editing.id) {
      updateRecipe(editing.id, { name: editing.name, category: editing.category, note: editing.note, tags: editing.tags });
    } else {
      addRecipe({
        name: editing.name,
        category: editing.category,
        paperType: currentConfig.paperType,
        config: currentConfig,
        tags: editing.tags,
        note: editing.note,
        versions: [],
      });
    }
    setShowForm(false);
    setEditing(null);
  };
  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    if (!editing.tags.includes(tagInput.trim())) {
      setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleLoad = (r: Recipe, versionId?: string) => {
    loadRecipeToRatio(r.id, versionId);
    navigate('/ratio');
  };

  const handleSetRecommended = (r: Recipe, versionId: string) => {
    setRecommendedVersion(r.id, versionId);
    alert('已设为推荐版本');
  };

  const handleAddVersion = (r: Recipe) => {
    const qualityBatches = batches
      .filter((b) => b.configSnapshot.paperType === r.paperType && b.qualityLevel === '优')
      .slice(0, 5);

    const note = prompt('请输入版本备注：', '沉淀自当前配比参数');
    if (note === null) return;

    if (qualityBatches.length > 0) {
      const useBatch = confirm(`发现 ${qualityBatches.length} 个同纸种的优质批次，是否选择一个作为来源？\n\n点击"确定"选择批次，"取消"使用当前配比页参数。`);
      if (useBatch) {
        const batchList = qualityBatches.map((b, i) => `${i + 1}. ${b.batchNo} - 质量${b.qualityLevel} - ${b.date}`).join('\n');
        const batchIdxStr = prompt(`请选择批次编号（1-${qualityBatches.length}）：\n\n${batchList}`, '1');
        if (batchIdxStr === null) return;
        const batchIdx = parseInt(batchIdxStr) - 1;
        const batch = qualityBatches[batchIdx];
        if (batch) {
          addRecipeVersion(r.id, note || '', batch.id);
          alert(`已从批次 ${batch.batchNo} 沉淀为新版本`);
          return;
        }
      }
    }

    addRecipeVersion(r.id, note || '');
    alert('已添加新版本');
  };

  const getBestQualityBatch = (r: Recipe) => {
    return batches
      .filter((b) => b.configSnapshot.paperType === r.paperType)
      .sort((a, b) => {
        const score = (lvl: string) => lvl === '优' ? 4 : lvl === '良' ? 3 : lvl === '合格' ? 2 : 1;
        return score(b.qualityLevel) - score(a.qualityLevel);
      })[0];
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-300">配方库</h1>
          <p className="mt-1 text-sm text-ink-100">保存成熟的抄造方案为配方，支持多版本管理，一键载入稳定输出品质</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100" />
            <TextInput className="w-60 pl-9" placeholder="配方名/纸种/标签" value={kw} onChange={(e) => setKw(e.target.value)} />
          </div>
          <Select className="w-36" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Button icon={<Plus className="h-4 w-4" />} onClick={startNew}>保存当前参数为配方</Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = recipeFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setRecipeFilter(opt.value)}
              className={[
                'flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                active
                  ? 'border-bronze-500 bg-bronze-50 text-bronze-700 shadow-sm'
                  : 'border-bronze-200 bg-white/60 text-ink-200 hover:border-bronze-300 hover:bg-white',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <PaperCard
            title={`配方列表 (${filtered.length})`}
            subtitle="左侧点选配方查看详情"
            icon={<BookOpen className="h-5 w-5" />}
          >
            {!filtered.length ? (
              <div className="rounded-lg bg-bronze-50/60 py-16 text-center text-sm text-ink-100">
                暂无配方
                <div className="mt-3 text-xs">点击右上角「保存当前参数为配方」创建</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
                {filtered.map((r) => {
                  const active = selectedId === r.id;
                  const isRecommended = !!r.recommendedVersionId;
                  const lastUsed = r.lastUsedAt;
                  const bestBatch = getBestQualityBatch(r);
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedId(r.id);
                        setSelectedVersionId(null);
                      }}
                      className={[
                        'group relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                        active
                          ? 'border-bronze-400 bg-gradient-to-br from-bronze-50 via-white to-rattan-100/50 shadow-paper-hover'
                          : 'border-bronze-100 bg-white/60 hover:border-bronze-200 hover:bg-white hover:shadow-paper',
                      ].join(' ')}
                    >
                      {isRecommended && (
                        <div className="absolute right-2 top-2">
                          <Badge tone="bamboo" size="sm" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" /> 推荐
                          </Badge>
                        </div>
                      )}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold text-ink-300">{r.name}</h3>
                          <p className="mt-0.5 text-xs text-ink-100">
                            {r.paperType || r.config.paperType} · 
                            <Clock className="ml-1 inline h-3 w-3" />{r.createdAt}
                          </p>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-all ${active ? 'text-bronze-500 translate-x-0' : 'text-ink-100 group-hover:translate-x-0.5'}`} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded bg-bronze-50 px-2 py-1.5">
                          <div className="text-ink-100">克重</div>
                          <div className="font-semibold tabular-nums text-ink-300">{r.config.targetGrammage} g</div>
                        </div>
                        <div className="rounded bg-bronze-50 px-2 py-1.5">
                          <div className="text-ink-100">幅面</div>
                          <div className="font-semibold tabular-nums text-ink-300">
                            {r.config.targetWidth_mm >= 1000 ? (r.config.targetWidth_mm / 10).toFixed(0) + '×' + (r.config.targetHeight_mm / 10).toFixed(0) + 'cm' : r.config.targetWidth_mm + '×' + r.config.targetHeight_mm + 'mm'}
                          </div>
                        </div>
                        <div className="rounded bg-bronze-50 px-2 py-1.5">
                          <div className="text-ink-100">打浆</div>
                          <div className="font-semibold tabular-nums text-ink-300">{r.config.beatingDegree_SR}°SR</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone="bronze">{r.category}</Badge>
                        {r.versions.length > 1 && (
                          <Badge tone="ink" className="flex items-center gap-1">
                            <GitBranch className="h-2.5 w-2.5" />
                            {r.versions.length} 个版本
                          </Badge>
                        )}
                        {lastUsed && (
                          <Badge tone="rattan" className="flex items-center gap-1">
                            <TrendingUp className="h-2.5 w-2.5" />
                            最近使用
                          </Badge>
                        )}
                        {bestBatch && bestBatch.qualityLevel === '优' && (
                          <Badge tone="bamboo" className="flex items-center gap-1">
                            <Award className="h-2.5 w-2.5" />
                            优品级
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </PaperCard>
        </div>

        <div className="xl:col-span-3">
          {selected ? (
            <PaperCard
              title={
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{selected.name}</h3>
                    <Badge tone="bronze" size="md">{selected.category}</Badge>
                    {selected.recommendedVersionId && (
                      <Badge tone="bamboo" size="md" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> 推荐方案
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-normal text-ink-100">
                    纤维种类 {displayConfig.fiberMixture.length} · 
                    {selected.lastUsedAt && <> 最近使用 <Calendar className="ml-1 inline h-3 w-3" />{selected.lastUsedAt}</>}
                  </p>
                </div>
              }
              icon={<Sparkles className="h-5 w-5" />}
              actions={
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={<GitBranch className="h-4 w-4" />} onClick={() => handleAddVersion(selected)}>
                    沉淀新版本
                  </Button>
                  <Button size="sm" variant="success" icon={<Download className="h-4 w-4" />} onClick={() => handleLoad(selected, activeVersionId)}>
                    载入此版本到配比
                  </Button>
                  <Button size="sm" variant="secondary" icon={<Edit2 className="h-4 w-4" />} onClick={() => startEdit(selected)}>编辑</Button>
                  <Button size="sm" variant="ghost" className="text-cinnabar-400" icon={<Trash2 className="h-4 w-4" />} onClick={() => {
                    if (confirm(`删除配方「${selected.name}」?`)) {
                      removeRecipe(selected.id);
                      setSelectedId(null);
                    }
                  }}>删除</Button>
                </div>
              }
            >
              {versions.length > 1 && (
                <div className="mb-5 rounded-xl border border-bronze-100 bg-bronze-50/50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
                    <GitBranch className="h-4 w-4" /> 版本管理
                    <span className="ml-1 text-xs font-normal text-ink-100">（共 {versions.length} 个版本）</span>
                  </h4>
                  <div className="space-y-2">
                    {versions.map((v) => {
                      const isActive = v.id === activeVersionId;
                      const isRecommended = v.id === selected.recommendedVersionId;
                      const refBatch = v.qualityRefBatchId ? batches.find((b) => b.id === v.qualityRefBatchId) : null;
                      return (
                        <div
                          key={v.id}
                          className={[
                            'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-all',
                            isActive
                              ? 'border-bronze-400 bg-white shadow-sm'
                              : 'border-bronze-100 bg-white/50 hover:border-bronze-200',
                          ].join(' ')}
                        >
                          <button
                            onClick={() => setSelectedVersionId(v.id)}
                            className="flex flex-1 items-center gap-3 text-left"
                          >
                            <div className={[
                              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                              isRecommended ? 'bg-bamboo-100 text-bamboo-600' : 'bg-bronze-100 text-bronze-600',
                            ].join(' ')}>
                              {isRecommended && <Star className="h-3.5 w-3.5 fill-current" />}
                              {!isRecommended && v.version.replace('v', '')}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-semibold text-ink-300">{v.version}</span>
                                {isRecommended && <Badge tone="bamboo" size="sm">推荐版本</Badge>}
                                {refBatch && <Badge tone="bronze" size="sm">来自 {refBatch.batchNo}</Badge>}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-100">
                                <Calendar className="h-3 w-3" />
                                {v.createdAt}
                                {v.note && <span className="ml-1">· {v.note}</span>}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            {!isRecommended && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Star className="h-3.5 w-3.5" />}
                                onClick={() => handleSetRecommended(selected, v.id)}
                              >
                                设为推荐
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={isActive ? 'success' : 'secondary'}
                              onClick={() => handleLoad(selected, v.id)}
                            >
                              载入
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <MetricDisplay label="目标克重" value={displayConfig.targetGrammage} unit="g/m²" tone="highlight" icon={<Target className="h-3.5 w-3.5" />} />
                <MetricDisplay label="成纸面积" value={ratio?.area_m2 ?? '—'} unit="m²" />
                <MetricDisplay label="预计绝干浆" value={ratio?.dryPulpWeight_g ?? '—'} unit="g" tone="highlight" icon={<Beaker className="h-3.5 w-3.5" />} />
                <MetricDisplay label="荡料次数" value={ratio?.swingCount ?? '—'} unit="次" tone="success" />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
                    <Scale className="h-4 w-4" /> 配方核心参数
                  </h4>
                  <div className="space-y-2 rounded-lg border border-bronze-100 bg-white/50 p-3 text-xs">
                    <Row k="纸张用途" v={displayConfig.paperUse} />
                    <Row k="目标厚度" v={`${displayConfig.targetThickness_um} μm`} />
                    <Row k="幅面尺寸" v={`${displayConfig.targetWidth_mm} × ${displayConfig.targetHeight_mm} mm`} />
                    <Row k="打浆度" v={`${displayConfig.beatingDegree_SR}°SR`} />
                    <Row k="用水量" v={`${displayConfig.waterVolume_L} L`} />
                    <Row k="每次入帘浆量" v={`${displayConfig.perSwingVolume_mL} mL`} />
                    <Row k="纸药种类" v={sizingAgents.find((s) => s.id === displayConfig.sizingAgentId)?.name || '未设定'} />
                    <Row k="纸药用量" v={`${displayConfig.sizingDose_pct}% (绝干浆计)`} />
                    <Row k="压榨" v={`${displayConfig.pressPressure_kg}kg / ${displayConfig.pressDuration_min}min`} />
                    <Row k="晒纸温度" v={`${displayConfig.dryingTemp_C} °C`} />
                  </div>
                  {selected.note && (
                    <div className="mt-3 rounded-lg border border-bronze-100 bg-rattan-100/40 p-3 text-xs text-ink-200">
                      <span className="font-semibold">配方备注：</span>{selected.note}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-ink-200">纤维配比</h4>
                    <div className="space-y-2">
                      {displayConfig.fiberMixture.map((m) => {
                        const f = fibers.find((x) => x.id === m.fiberId);
                        return (
                          <div key={m.fiberId}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="font-medium text-ink-300">{f?.name || '未知纤维'} <span className="text-ink-100">({f?.avgLength_mm.toFixed(1)}mm)</span></span>
                              <span className="tabular-nums text-bronze-500 font-semibold">{m.ratio_pct}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-bronze-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-bronze-200 to-bronze-400 transition-all" style={{ width: `${m.ratio_pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-ink-200">预期质量评估</h4>
                    {ratio ? (
                      <div className="space-y-3 rounded-lg border border-bronze-100 bg-white/50 p-3">
                        <ProgressBar label="综合强度" value={ratio.strengthScore} variant="strength" />
                        <ProgressBar label="匀度预测" value={ratio.uniformityPrediction} variant="uniformity" />
                        <ProgressBar label="纤维悬浮性" value={ratio.suspensionScore} variant="suspension" />
                        <ProgressBar label="揭纸顺畅度" value={ratio.releaseScore} variant="suspension" />
                        <ProgressBar label="成纸平整度" value={ratio.smoothnessScore} variant="smoothness" />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-bronze-50/60 py-6 text-center text-xs text-ink-100">部分纤维缺失，评估不可用</div>
                    )}
                  </div>
                </div>
              </div>

              {selected.tags.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold text-ink-200">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map((t) => (
                      <Badge key={t} tone="rattan" size="md" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </PaperCard>
          ) : (
            <PaperCard title="配方详情" subtitle="从左侧选择一个配方" icon={<BookOpen className="h-5 w-5" />}>
              <div className="flex h-[420px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bronze-100/60 text-bronze-400">
                    <BookOpen className="h-9 w-9" />
                  </div>
                  <p className="text-sm text-ink-200">未选择配方</p>
                  <p className="mt-1 text-xs text-ink-100">选择后可查看详细配比、载入到配比页或编辑</p>
                </div>
              </div>
            </PaperCard>
          )}
        </div>
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-400/40 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="relative paper-grain w-full max-w-xl overflow-hidden rounded-xl border border-bronze-200 bg-rice-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-bronze-200/60 px-6 py-4">
              <h3 className="font-display text-lg font-semibold">{editing.id ? '编辑配方' : '保存为新配方'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-ink-100 hover:bg-bronze-100 hover:text-ink-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <Field label="配方名称" required>
                <TextInput value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="分类">
                  <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    {['书画纸', '印刷纸', '包装用纸', '工艺用纸', '文房日常', '修复用纸', '自定义配方'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="标签">
                  <div className="flex gap-2">
                    <TextInput value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="回车添加" />
                    <Button type="button" size="sm" variant="secondary" onClick={addTag}>添加</Button>
                  </div>
                </Field>
              </div>
              {editing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-bronze-100 bg-white/60 p-2">
                  {editing.tags.map((t) => (
                    <Badge key={t} tone="bronze" className="flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> {t}
                      <button onClick={() => setEditing({ ...editing, tags: editing.tags.filter((x) => x !== t) })} className="ml-1 hover:text-cinnabar-400">×</button>
                    </Badge>
                  ))}
                </div>
              )}
              <Field label="备注">
                <Textarea rows={3} value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="适用纸品范围、注意事项等" />
              </Field>
              {!editing.id && (
                <div className="rounded-lg border border-bamboo-200 bg-bamboo-100/40 p-3 text-xs text-bamboo-500">
                  将使用「纸浆配比」页的当前参数作为配方数据保存。
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-bronze-200/60 bg-rice-100/60 px-6 py-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
              <Button onClick={submitForm}>{editing.id ? '保存修改' : '创建配方'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-bronze-100 pb-1.5 last:border-0 last:pb-0">
      <span className="text-ink-100">{k}</span>
      <span className="font-medium text-ink-300">{v}</span>
    </div>
  );
}
