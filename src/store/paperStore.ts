import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Fiber, SizingAgent, Recipe, Batch, RatioConfig } from '@/types';
import { seedFibers, seedSizingAgents, seedRecipes, seedBatches, defaultRatioConfig } from '@/utils/mock';
import { uid } from '@/utils/calculator';

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

  setRatioConfig: (p: Partial<RatioConfig>) => void;
  resetRatioConfig: () => void;
  loadRecipeToRatio: (recipeId: string) => void;

  addFiber: (f: Omit<Fiber, 'id' | 'createdAt'>) => void;
  updateFiber: (id: string, f: Partial<Fiber>) => void;
  removeFiber: (id: string) => void;

  addSizingAgent: (s: Omit<SizingAgent, 'id' | 'createdAt'>) => void;
  updateSizingAgent: (id: string, s: Partial<SizingAgent>) => void;
  removeSizingAgent: (id: string) => void;

  addRecipe: (r: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, r: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;

  saveBatch: (b: Omit<Batch, 'id' | 'createdAt'>) => void;
  removeBatch: (id: string) => void;
  selectBatch: (id: string | null) => void;

  setThicknessGrid: (g: (number | null)[]) => void;
  setGridSize: (s: 3 | 4) => void;
  setTolerance: (t: number) => void;
  resetThicknessGrid: () => void;
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

      setRatioConfig: (p) => set((s) => ({ ratioConfig: { ...s.ratioConfig, ...p } })),
      resetRatioConfig: () => set({ ratioConfig: defaultRatioConfig }),
      loadRecipeToRatio: (recipeId) => {
        const r = get().recipes.find((x) => x.id === recipeId);
        if (r) set({ ratioConfig: { ...r.config } });
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
        set((s) => ({
          recipes: [
            ...s.recipes,
            { ...r, id: 'recipe-' + uid(), createdAt: new Date().toISOString().slice(0, 10) },
          ],
        })),
      updateRecipe: (id, r) =>
        set((s) => ({ recipes: s.recipes.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
      removeRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((x) => x.id !== id) })),

      saveBatch: (b) =>
        set((s) => ({
          batches: [
            { ...b, id: 'batch-' + uid(), createdAt: new Date().toISOString().slice(0, 10) },
            ...s.batches,
          ],
        })),
      removeBatch: (id) => set((s) => ({ batches: s.batches.filter((x) => x.id !== id) })),
      selectBatch: (id) => set({ selectedBatchId: id }),

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
    }),
    {
      name: 'handmade-paper-store-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
