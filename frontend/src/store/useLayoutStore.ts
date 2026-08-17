import { create } from 'zustand';
import type { Layout, LayoutElement } from '../types';

interface LayoutState {
  layout: Layout | null;
  history: LayoutElement[][];
  historyStep: number;
  activeLayer: string; // 'all' | 'chao' | 'mobiliario' | 'teto'
  setLayout: (layout: Layout) => void;
  updateElement: (id: string, updates: Partial<LayoutElement>) => void;
  addElement: (element: Omit<LayoutElement, 'id'>) => void;
  setElements: (elements: LayoutElement[]) => void;
  setActiveLayer: (layer: string) => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layout: null,
  history: [],
  historyStep: 0,
  activeLayer: 'all',

  setLayout: (layout) => set({
    layout,
    history: [layout.elements],
    historyStep: 0
  }),

  saveHistory: () => {
    const { layout, history, historyStep } = get();
    if (!layout) return;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(JSON.parse(JSON.stringify(layout.elements))); // Deep copy
    if (newHistory.length > 30) newHistory.shift(); // Limit to 30 snapshots

    set({ history: newHistory, historyStep: newHistory.length - 1 });
  },

  updateElement: (id, updates) => set((state) => {
    if (!state.layout) return state;
    const elements = state.layout.elements.map(el => el.id === id ? { ...el, ...updates } : el);
    return { layout: { ...state.layout, elements } };
  }),

  addElement: (element) => set((state) => {
    if (!state.layout) return state;
    const id = Math.random().toString(36).substring(7); // simple id gen for UI
    const elements = [...state.layout.elements, { ...element, id }];
    return { layout: { ...state.layout, elements } };
  }),

  setElements: (elements) => set((state) => {
    if (!state.layout) return state;
    return { layout: { ...state.layout, elements } };
  }),

  setActiveLayer: (layer) => set({ activeLayer: layer }),

  undo: () => set((state) => {
    if (state.historyStep === 0 || !state.layout) return state;
    const newStep = state.historyStep - 1;
    return {
      layout: { ...state.layout, elements: JSON.parse(JSON.stringify(state.history[newStep])) },
      historyStep: newStep
    };
  }),

  redo: () => set((state) => {
    if (state.historyStep === state.history.length - 1 || !state.layout) return state;
    const newStep = state.historyStep + 1;
    return {
      layout: { ...state.layout, elements: JSON.parse(JSON.stringify(state.history[newStep])) },
      historyStep: newStep
    };
  })
}));
