import { create } from "zustand";
import { clampClockRate } from "../engine/clock.js";
import { createObserver, observeEpoch } from "../engine/observer.js";
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
  clockRate: 1,
  clockPaused: false,
  automaticPhase: "charge",
  automaticGeneration: 0,
  machineAction: null,
  machineActions: [],
  machineEpochs: [],
  machineObserver: createObserver(137),
  automaticOracle: "",
  automaticOracleProgress: "",
  setMachineAction: (action) =>
    set((state) => ({
      machineAction: action,
      cycle: action.plan.cycle,
      automaticPhase: action.kind,
      machineActions: [...state.machineActions, action].slice(-16),
      ...(action.kind === "rebirth"
        ? { cycle: action.plan.cycle, entropyLevel: 0, generatedText: "" }
        : {}),
      ...(action.kind === "charge"
        ? { cogTurns: state.cogTurns + 1, entropyLevel: action.plan.entropy }
        : {}),
      ...(["grammar", "markov"].includes(action.kind)
        ? { generationMode: action.kind }
        : {}),
    })),
  setAutomaticOracle: (automaticOracle, index, count) =>
    set({
      automaticOracle,
      automaticOracleProgress: `${index + 1} / ${count}`,
    }),
  recordMachineEpoch: (entry) =>
    set((state) => ({
      machineObserver: observeEpoch(state.machineObserver, entry),
      machineEpochs: [
        ...state.machineEpochs,
        {
          epoch: entry.settings.epoch,
          population: entry.population,
          surviving: entry.conductor.surviving,
          novelty: entry.champion.novelty,
          echo: entry.champion.echo,
          entropy: entry.settings.entropy,
          source: entry.champion.source,
          heir: entry.champion.id,
          aspects: entry.settings.aspects,
          protocol: entry.conductor.protocol,
          mutation: entry.settings.mutation,
          seed: entry.settings.seed,
          originSeed: entry.conductor.initialSeed,
          text: entry.champion.text,
        },
      ].slice(-96),
    })),
  clearMachineHistory: () =>
    set((state) => ({
      machineObserver: createObserver(state.automaticSeed),
      machineAction: null,
      machineActions: [],
      machineEpochs: [],
      automaticOracle: "",
      automaticOracleProgress: "",
    })),
  setClockRate: (rate) => set({ clockRate: clampClockRate(rate) }),
  toggleClock: () => set((state) => ({ clockPaused: !state.clockPaused })),
  setAutomaticPhase: (automaticPhase, automaticGeneration) =>
    set({ automaticPhase, automaticGeneration }),
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
      clockPaused: false,
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
