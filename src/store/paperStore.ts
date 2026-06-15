import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Fiber, SizingAgent, Recipe, Batch, RatioConfig,
  RatioToThicknessPayload, PapermakingRecord, RecipeVersion,
} from '@/types';
import {
  seedFibers, seedSizingAgents, seedRecipes, seedBatches,
  defaultRatioConfig, defaultPapermakingRecord,
} from '@/utils/mock';
import { uid } from '@/utils/calculator';

type RecipeFilter = 'all' | 'recommended' | 'recent' | 'quality' | 'quality_you' | 'quality_liang' | 'quality_hege' | 'quality_buhege';

interface PaperState {
  fibers: Fiber[];
  sizingAgents: SizingAgent[];
  recipes: Recipe[];
  batches: Batch[];
  ratioConfig: RatioConfig;
  currentThicknessGrid: (number | null)[];
  currentGridSize: 3 | 4;
  currentTolerance_pct: number;
  selectedBatchId: string | null;

  ratioToThicknessPayload: RatioToThicknessPayload | null;
  papermakingRecord: PapermakingRecord;
  compareBatchIds: string[];
  recipeFilter: RecipeFilter;

  setRatioConfig: (p: Partial<RatioConfig>) => void;
  resetRatioConfig: () => void;
  loadRecipeToRatio: (recipeId: string, versionId?: string) => void;

  addFiber: (f: Omit<Fiber, 'id' | 'createdAt'>) => void;
  updateFiber: (id: string, f: Partial<Fiber>) => void;
  removeFiber: (id: string) => void;

  addSizingAgent: (s: Omit<SizingAgent, 'id' | 'createdAt'>) => void;
  updateSizingAgent: (id: string, s: Partial<SizingAgent>) => void;
  removeSizingAgent: (id: string) => void;

  addRecipe: (r: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, r: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;
  addRecipeVersion: (recipeId: string, note: string, fromBatchId?: string) => void;
  setRecommendedVersion: (recipeId: string, versionId: string) => void;
  setRecipeFilter: (f: RecipeFilter) => void;
  markRecipeUsed: (recipeId: string) => void;

  saveBatch: (b: Omit<Batch, 'id' | 'createdAt'>) => void;
  removeBatch: (id: string) => void;
  selectBatch: (id: string | null) => void;
  toggleCompareBatch: (id: string) => void;
  clearCompareBatches: () => void;

  setThicknessGrid: (g: (number | null)[]) => void;
  setGridSize: (s: 3 | 4) => void;
  setTolerance: (t: number) => void;
  resetThicknessGrid: () => void;

  setRatioToThicknessPayload: (p: RatioToThicknessPayload) => void;
  clearRatioToThicknessPayload: () => void;
  setPapermakingRecord: (p: Partial<PapermakingRecord>) => void;
  resetPapermakingRecord: () => void;
}

export const usePaperStore = create<PaperState>()(
  persist(
    (set, get) => ({
      fibers: seedFibers,
      sizingAgents: seedSizingAgents,
      recipes: seedRecipes,
      batches: seedBatches,
      ratioConfig: defaultRatioConfig,
      currentThicknessGrid: Array(9).fill(null),
      currentGridSize: 3,
      currentTolerance_pct: 8,
      selectedBatchId: null,
      ratioToThicknessPayload: null,
      papermakingRecord: defaultPapermakingRecord,
      compareBatchIds: [],
      recipeFilter: 'all',

      setRatioConfig: (p) => set((s) => ({ ratioConfig: { ...s.ratioConfig, ...p } })),
      resetRatioConfig: () => set({ ratioConfig: defaultRatioConfig }),
      loadRecipeToRatio: (recipeId, versionId) => {
        const r = get().recipes.find((x) => x.id === recipeId);
        if (!r) return;
        let config = r.config;
        if (versionId) {
          const v = r.versions.find((x) => x.id === versionId);
          if (v) config = v.config;
        } else if (r.recommendedVersionId) {
          const v = r.versions.find((x) => x.id === r.recommendedVersionId);
          if (v) config = v.config;
        }
        set({ ratioConfig: { ...config } });
        get().markRecipeUsed(recipeId);
      },

      addFiber: (f) =>
        set((s) => ({
          fibers: [...s.fibers, { ...f, id: 'fiber-' + uid(), createdAt: new Date().toISOString().slice(0, 10) }],
        })),
      updateFiber: (id, f) =>
        set((s) => ({ fibers: s.fibers.map((x) => (x.id === id ? { ...x, ...f } : x)) })),
      removeFiber: (id) =>
        set((s) => ({ fibers: s.fibers.filter((x) => x.id !== id) })),

      addSizingAgent: (s) =>
        set((st) => ({
          sizingAgents: [
            ...st.sizingAgents,
            { ...s, id: 'sz-' + uid(), createdAt: new Date().toISOString().slice(0, 10) },
          ],
        })),
      updateSizingAgent: (id, s) =>
        set((st) => ({ sizingAgents: st.sizingAgents.map((x) => (x.id === id ? { ...x, ...s } : x)) })),
      removeSizingAgent: (id) =>
        set((st) => ({ sizingAgents: st.sizingAgents.filter((x) => x.id !== id) })),

      addRecipe: (r) =>
        set((s) => {
          const now = new Date().toISOString().slice(0, 10);
          const initialVersion: RecipeVersion = {
            id: 'v-' + uid(),
            version: 'v1.0',
            config: r.config,
            note: r.note || '初始版本',
            createdAt: now,
          };
          return {
            recipes: [
              {
                ...r,
                id: 'recipe-' + uid(),
                paperType: r.paperType || r.config.paperType,
                createdAt: now,
                versions: r.versions?.length ? r.versions : [initialVersion],
                recommendedVersionId: r.recommendedVersionId || initialVersion.id,
                lastUsedAt: now,
              },
              ...s.recipes,
            ],
          };
        }),
      updateRecipe: (id, r) =>
        set((s) => ({ recipes: s.recipes.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
      removeRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((x) => x.id !== id) })),
      addRecipeVersion: (recipeId, note, fromBatchId) =>
        set((s) => {
          const now = new Date().toISOString().slice(0, 10);
          const recipes = s.recipes.map((r) => {
            if (r.id !== recipeId) return r;
            const batch = fromBatchId ? s.batches.find((b) => b.id === fromBatchId) : null;
            const config = batch?.configSnapshot || s.ratioConfig;
            const versionNum = r.versions.length + 1;
            const newVersion: RecipeVersion = {
              id: 'v-' + uid(),
              version: `v${versionNum}.0`,
              config,
              note,
              createdAt: now,
              qualityRefBatchId: fromBatchId || undefined,
            };
            return { ...r, versions: [...r.versions, newVersion] };
          });
          return { recipes };
        }),
      setRecommendedVersion: (recipeId, versionId) =>
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === recipeId ? { ...r, recommendedVersionId: versionId } : r
          ),
        })),
      setRecipeFilter: (f) => set({ recipeFilter: f }),
      markRecipeUsed: (recipeId) =>
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === recipeId ? { ...r, lastUsedAt: new Date().toISOString().slice(0, 10) } : r
          ),
        })),

      saveBatch: (b) =>
        set((s) => ({
          batches: [
            { ...b, id: 'batch-' + uid(), createdAt: new Date().toISOString().slice(0, 10) },
            ...s.batches,
          ],
        })),
      removeBatch: (id) => set((s) => ({ batches: s.batches.filter((x) => x.id !== id) })),
      selectBatch: (id) => set({ selectedBatchId: id }),
      toggleCompareBatch: (id) =>
        set((s) => {
          const exists = s.compareBatchIds.includes(id);
          let newIds = exists
            ? s.compareBatchIds.filter((x) => x !== id)
            : [...s.compareBatchIds, id];
          if (newIds.length > 3) newIds = newIds.slice(1);
          return { compareBatchIds: newIds };
        }),
      clearCompareBatches: () => set({ compareBatchIds: [] }),

      setThicknessGrid: (g) => set({ currentThicknessGrid: g }),
      setGridSize: (s) =>
        set({
          currentGridSize: s,
          currentThicknessGrid: Array(s * s).fill(null),
        }),
      setTolerance: (t) => set({ currentTolerance_pct: t }),
      resetThicknessGrid: () => {
        const n = get().currentGridSize;
        set({ currentThicknessGrid: Array(n * n).fill(null) });
      },

      setRatioToThicknessPayload: (p) => set({ ratioToThicknessPayload: p }),
      clearRatioToThicknessPayload: () => set({ ratioToThicknessPayload: null }),
      setPapermakingRecord: (p) =>
        set((s) => ({ papermakingRecord: { ...s.papermakingRecord, ...p } })),
      resetPapermakingRecord: () => set({ papermakingRecord: defaultPapermakingRecord }),
    }),
    {
      name: 'handmade-paper-store-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fibers: state.fibers,
        sizingAgents: state.sizingAgents,
        recipes: state.recipes,
        batches: state.batches,
        ratioConfig: state.ratioConfig,
        currentThicknessGrid: state.currentThicknessGrid,
        currentGridSize: state.currentGridSize,
        currentTolerance_pct: state.currentTolerance_pct,
        selectedBatchId: state.selectedBatchId,
        compareBatchIds: state.compareBatchIds,
        recipeFilter: state.recipeFilter,
      }),
    },
  ),
);
