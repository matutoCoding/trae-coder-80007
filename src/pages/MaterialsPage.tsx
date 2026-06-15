import { useState } from 'react';
import { Plus, Edit2, Trash2, Sprout, Droplets, X } from 'lucide-react';
import PaperCard from '@/components/layout/PaperCard';
import Button from '@/components/ui/Button';
import Field, { TextInput, Textarea, Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/ProgressBar';
import { usePaperStore } from '@/store/paperStore';
import type { Fiber, SizingAgent } from '@/types';

type Tab = 'fiber' | 'sizing';
type EditingFiber = Partial<Fiber> | null;
type EditingSizing = Partial<SizingAgent> | null;

export default function MaterialsPage() {
  const [tab, setTab] = useState<Tab>('fiber');
  const fibers = usePaperStore((s) => s.fibers);
  const sizingAgents = usePaperStore((s) => s.sizingAgents);
  const addFiber = usePaperStore((s) => s.addFiber);
  const updateFiber = usePaperStore((s) => s.updateFiber);
  const removeFiber = usePaperStore((s) => s.removeFiber);
  const addSizingAgent = usePaperStore((s) => s.addSizingAgent);
  const updateSizingAgent = usePaperStore((s) => s.updateSizingAgent);
  const removeSizingAgent = usePaperStore((s) => s.removeSizingAgent);

  const [editingFiber, setEditingFiber] = useState<EditingFiber>(null);
  const [editingSizing, setEditingSizing] = useState<EditingSizing>(null);
  const [showFiberForm, setShowFiberForm] = useState(false);
  const [showSizingForm, setShowSizingForm] = useState(false);

  const startEditFiber = (f: Fiber) => {
    setEditingFiber({ ...f });
    setShowFiberForm(true);
  };
  const startNewFiber = () => {
    setEditingFiber({
      name: '', avgLength_mm: 2, minBeating_SR: 30, maxBeating_SR: 55,
      origin: '', unitPrice: 0, note: '',
    });
    setShowFiberForm(true);
  };
  const submitFiber = () => {
    if (!editingFiber) return;
    const f = editingFiber;
    if (!f.name || !f.avgLength_mm) {
      alert('请填写纤维名称与平均长度');
      return;
    }
    if (f.id) {
      updateFiber(f.id, f);
    } else {
      addFiber(f as Omit<Fiber, 'id' | 'createdAt'>);
    }
    setShowFiberForm(false);
    setEditingFiber(null);
  };

  const startEditSizing = (s: SizingAgent) => {
    setEditingSizing({ ...s });
    setShowSizingForm(true);
  };
  const startNewSizing = () => {
    setEditingSizing({
      name: '', source: '植物粘液', minDose_pct: 0.4, maxDose_pct: 1.0, suspensionLevel: 3, note: '',
    });
    setShowSizingForm(true);
  };
  const submitSizing = () => {
    if (!editingSizing) return;
    const s = editingSizing;
    if (!s.name) {
      alert('请填写纸药名称');
      return;
    }
    if (s.id) updateSizingAgent(s.id, s);
    else addSizingAgent(s as Omit<SizingAgent, 'id' | 'createdAt'>);
    setShowSizingForm(false);
    setEditingSizing(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-300">原料录入</h1>
          <p className="mt-1 text-sm text-ink-100">维护纤维原料库与纸药库，是配比计算的基础数据</p>
        </div>
        <div className="flex rounded-lg border border-bronze-200 bg-white/60 p-1">
          {(['fiber', 'sizing'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-bronze-400 text-rice-50 shadow-sm'
                  : 'text-ink-200 hover:bg-bronze-100/60'
              }`}
            >
              {t === 'fiber' ? <Sprout className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
              {t === 'fiber' ? '纤维原料' : '纸药（悬浮剂）'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'fiber' && (
        <PaperCard
          title="纤维原料库"
          subtitle={`共 ${fibers.length} 种原料`}
          icon={<Sprout className="h-5 w-5" />}
          actions={
            <Button icon={<Plus className="h-4 w-4" />} onClick={startNewFiber}>新增纤维</Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-bronze-200 text-left text-xs text-ink-100">
                  <th className="px-3 py-3 font-semibold">纤维名称</th>
                  <th className="px-3 py-3 font-semibold">平均长度(mm)</th>
                  <th className="px-3 py-3 font-semibold">打浆度范围(°SR)</th>
                  <th className="px-3 py-3 font-semibold">产地</th>
                  <th className="px-3 py-3 font-semibold">单价(元/kg)</th>
                  <th className="px-3 py-3 font-semibold">备注</th>
                  <th className="px-3 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {fibers.map((f, i) => (
                  <tr
                    key={f.id}
                    className={`border-b border-bronze-100 transition-colors hover:bg-rattan-100/30 ${
                      i % 2 === 0 ? 'bg-white/30' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-ink-300">
                      <span className="inline-flex items-center gap-2">
                        <Badge tone="bamboo">{f.avgLength_mm >= 3 ? '长纤' : f.avgLength_mm >= 1.5 ? '中纤' : '短纤'}</Badge>
                        {f.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink-200">{f.avgLength_mm.toFixed(1)}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-200">
                      {f.minBeating_SR} – {f.maxBeating_SR}
                    </td>
                    <td className="px-3 py-3 text-ink-200">{f.origin || '—'}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-200">¥{f.unitPrice}</td>
                    <td className="px-3 py-3 max-w-[220px] truncate text-ink-100">{f.note || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => startEditFiber(f)}>编辑</Button>
                        <Button variant="ghost" size="sm" className="text-cinnabar-400 hover:text-cinnabar-500" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => confirm(`确定删除「${f.name}」?`) && removeFiber(f.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!fibers.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-ink-100">暂无纤维原料，点击「新增纤维」添加</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PaperCard>
      )}

      {tab === 'sizing' && (
        <PaperCard
          title="纸药（悬浮剂）库"
          subtitle={`共 ${sizingAgents.length} 种纸药`}
          icon={<Droplets className="h-5 w-5" />}
          actions={
            <Button icon={<Plus className="h-4 w-4" />} onClick={startNewSizing}>新增纸药</Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-bronze-200 text-left text-xs text-ink-100">
                  <th className="px-3 py-3 font-semibold">纸药名称</th>
                  <th className="px-3 py-3 font-semibold">来源</th>
                  <th className="px-3 py-3 font-semibold">建议用量范围</th>
                  <th className="px-3 py-3 font-semibold">悬浮效果等级</th>
                  <th className="px-3 py-3 font-semibold">备注</th>
                  <th className="px-3 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {sizingAgents.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-bronze-100 transition-colors hover:bg-rattan-100/30 ${
                      i % 2 === 0 ? 'bg-white/30' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-ink-300">{s.name}</td>
                    <td className="px-3 py-3 text-ink-200">{s.source || '—'}</td>
                    <td className="px-3 py-3 tabular-nums text-ink-200">
                      <Badge tone="bronze">{s.minDose_pct}% – {s.maxDose_pct}%</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <span
                              key={k}
                              className={`h-3 w-1.5 rounded-sm ${
                                k < s.suspensionLevel ? 'bg-bronze-400' : 'bg-bronze-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-ink-100">
                          {['极弱', '较弱', '中等', '良好', '极佳'][s.suspensionLevel - 1] || '未知'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-[260px] truncate text-ink-100">{s.note || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => startEditSizing(s)}>编辑</Button>
                        <Button variant="ghost" size="sm" className="text-cinnabar-400 hover:text-cinnabar-500" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => confirm(`确定删除「${s.name}」?`) && removeSizingAgent(s.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PaperCard>
      )}

      {showFiberForm && editingFiber && (
        <Modal title={editingFiber.id ? '编辑纤维原料' : '新增纤维原料'} onClose={() => { setShowFiberForm(false); setEditingFiber(null); }}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="纤维名称" required>
              <TextInput value={editingFiber.name || ''} onChange={(e) => setEditingFiber({ ...editingFiber, name: e.target.value })} placeholder="如：青檀皮" />
            </Field>
            <Field label="产地">
              <TextInput value={editingFiber.origin || ''} onChange={(e) => setEditingFiber({ ...editingFiber, origin: e.target.value })} placeholder="如：安徽泾县" />
            </Field>
            <Field label="平均纤维长度 (mm)" required hint="长纤维强度更好">
              <TextInput type="number" step="0.1" value={editingFiber.avgLength_mm ?? ''} onChange={(e) => setEditingFiber({ ...editingFiber, avgLength_mm: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="单价 (元/kg)">
              <TextInput type="number" value={editingFiber.unitPrice ?? ''} onChange={(e) => setEditingFiber({ ...editingFiber, unitPrice: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="最低打浆度 (°SR)">
              <TextInput type="number" value={editingFiber.minBeating_SR ?? ''} onChange={(e) => setEditingFiber({ ...editingFiber, minBeating_SR: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="最高打浆度 (°SR)">
              <TextInput type="number" value={editingFiber.maxBeating_SR ?? ''} onChange={(e) => setEditingFiber({ ...editingFiber, maxBeating_SR: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="备注" className="col-span-2">
              <Textarea rows={3} value={editingFiber.note || ''} onChange={(e) => setEditingFiber({ ...editingFiber, note: e.target.value })} placeholder="纤维特性、适用纸品等" />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowFiberForm(false); setEditingFiber(null); }}>取消</Button>
            <Button onClick={submitFiber}>{editingFiber.id ? '保存修改' : '确认添加'}</Button>
          </div>
        </Modal>
      )}

      {showSizingForm && editingSizing && (
        <Modal title={editingSizing.id ? '编辑纸药' : '新增纸药'} onClose={() => { setShowSizingForm(false); setEditingSizing(null); }}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="纸药名称" required>
              <TextInput value={editingSizing.name || ''} onChange={(e) => setEditingSizing({ ...editingSizing, name: e.target.value })} placeholder="如：黄蜀葵根" />
            </Field>
            <Field label="来源类别">
              <Select value={editingSizing.source || ''} onChange={(e) => setEditingSizing({ ...editingSizing, source: e.target.value })}>
                <option>植物粘液</option>
                <option>动物胶</option>
                <option>合成助剂</option>
              </Select>
            </Field>
            <Field label="建议最小用量 (%)">
              <TextInput type="number" step="0.1" value={editingSizing.minDose_pct ?? ''} onChange={(e) => setEditingSizing({ ...editingSizing, minDose_pct: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="建议最大用量 (%)">
              <TextInput type="number" step="0.1" value={editingSizing.maxDose_pct ?? ''} onChange={(e) => setEditingSizing({ ...editingSizing, maxDose_pct: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="悬浮效果等级" hint="1-5 级，5级最佳" className="col-span-2">
              <Select value={editingSizing.suspensionLevel ?? 3} onChange={(e) => setEditingSizing({ ...editingSizing, suspensionLevel: parseInt(e.target.value) || 3 })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>Level {n} — {['极弱', '较弱', '中等', '良好', '极佳'][n - 1]}</option>
                ))}
              </Select>
            </Field>
            <Field label="备注" className="col-span-2">
              <Textarea rows={3} value={editingSizing.note || ''} onChange={(e) => setEditingSizing({ ...editingSizing, note: e.target.value })} placeholder="使用心得、适配纸品等" />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowSizingForm(false); setEditingSizing(null); }}>取消</Button>
            <Button onClick={submitSizing}>{editingSizing.id ? '保存修改' : '确认添加'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-400/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative paper-grain w-full max-w-2xl overflow-hidden rounded-xl border border-bronze-200 bg-rice-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-bronze-200/60 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink-300">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-100 transition-colors hover:bg-bronze-100 hover:text-ink-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
