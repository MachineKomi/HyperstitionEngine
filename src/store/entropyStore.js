import { create } from "zustand";
const useEntropyStore = create((set) => ({
  entropyLevel: 0,
  maxEntropy: 1000,
  selectedSpirits: ["N_Land", "Bible", "AI"],
  generatedText: "",
  sessionHistory: [],
  cycle: 1,
  cogTurns: 0,
  sprawlPopulation: 0,
  automaticMode: true,
  automaticSeed: 137,
  automaticRevision: 0,
  automaticStatus: "loading",
  automaticError: "",
  setAutomaticMode: (automaticMode) =>
    set((state) =>
      state.automaticMode === automaticMode
        ? state
        : {
            automaticMode,
            automaticError: "",
            automaticStatus: automaticMode ? "loading" : "manual",
          },
    ),
  setAutomaticStatus: (automaticStatus, automaticError = "") =>
    set({ automaticStatus, automaticError }),
  restartAutomatic: (automaticSeed) =>
    set((state) => ({
      automaticSeed,
      automaticRevision: state.automaticRevision + 1,
      automaticMode: true,
      automaticStatus: "loading",
      automaticError: "",
    })),
  signCog: () =>
    set((state) => ({
      cogTurns: state.cogTurns + 1,
      entropyLevel: Math.min(state.maxEntropy, state.entropyLevel + 137),
    })),
  setSprawlPopulation: (sprawlPopulation) => set({ sprawlPopulation }),
  isGenerating: false,
  generationMode: "markov",
  addEntropy: (amount) =>
    set((state) => ({
      entropyLevel: Math.min(
        state.maxEntropy,
        Math.max(0, state.entropyLevel + amount),
      ),
    })),
  consumeEntropy: (amount) =>
    set((state) => ({
      entropyLevel: Math.max(0, state.entropyLevel - amount),
    })),
  toggleSpirit: (id) =>
    set((state) => ({
      selectedSpirits: state.selectedSpirits.includes(id)
        ? state.selectedSpirits.filter((value) => value !== id)
        : [...state.selectedSpirits, id],
    })),
  setGenerationMode: (generationMode) => set({ generationMode }),
  setSelectedSpirits: (selectedSpirits) =>
    set({ selectedSpirits: [...selectedSpirits] }),
  setGeneratedText: (text, metadata = {}) =>
    set((state) => ({
      generatedText: text,
      sessionHistory: [
        ...state.sessionHistory.slice(-199),
        {
          id: crypto.randomUUID(),
          text,
          time: new Date().toISOString(),
          mode: state.generationMode,
          aspects: [...state.selectedSpirits],
          entropy: state.entropyLevel,
          cycle: state.cycle,
          ...metadata,
        },
      ],
    })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  rebirth: () =>
    set((state) => ({
      entropyLevel: 0,
      generatedText: "",
      cycle: state.cycle + 1,
    })),
}));
export default useEntropyStore;
