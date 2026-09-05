export class GrammarEngine {
  constructor() {
    this.posData = {
      nouns: [],
      verbs: [],
      adjectives: [],
    };

    // Templates categorized by "Vibe"
    this.templates = {
      accelerator: [
        "The <adj> <noun> accelerates into the <adj> future.",
        "Capital is a <adj> <noun> from the outside.",
        "To <verb> is to exit the <noun>.",
        "A <adj> feedback loop <verb>s the <noun>.",
        "The <noun> melts into <adj> data.",
        "Zero is the <adj> <noun>.",
        "The <adj> virus <verb>s the system.",
      ],
      void: [
        "The <adj> abyss stares back at the <noun>.",
        "There is no <noun>, only <adj> silence.",
        "We <verb> in the shadow of the <adj> <noun>.",
        "Entropy <verb>s all <adj> things.",
        "The <noun> is a myth; the void is <adj>.",
        "A <adj> horror <verb>s beneath the <noun>.",
      ],
      prophecy: [
        "And the <noun> shall <verb> the <adj> earth.",
        "Beware the <adj> <noun> that <verb>s.",
        "A <adj> time comes when the <noun> will <verb>.",
        "The <adj> <noun> is the sign of the end.",
        "He who <verb>s the <noun> controls the <adj> fate.",
        "The <noun> of the <adj> dawn shall <verb>.",
      ],
    };
  }

  loadCorpus(spiritsData) {
    this.posData = { nouns: [], verbs: [], adjectives: [] };
    // Aggregate POS data from all spirits
    spiritsData.forEach((spirit) => {
      if (spirit && spirit.pos) {
        if (spirit.pos.nouns) this.posData.nouns.push(...spirit.pos.nouns);
        if (spirit.pos.verbs) this.posData.verbs.push(...spirit.pos.verbs);
        if (spirit.pos.adjectives)
          this.posData.adjectives.push(...spirit.pos.adjectives);
      }
    });

    console.log(
      `Grammar engine loaded: ${this.posData.nouns.length} nouns, ${this.posData.verbs.length} verbs, ${this.posData.adjectives.length} adjs.`,
    );
  }

  getRandom(list, rng = Math.random) {
    if (!list || list.length === 0) return "[(void)]";
    return list[Math.floor(rng() * list.length)];
  }

  generate(entropyLevel, rng = Math.random) {
    // Select template category based on entropy
    // Low Entropy (0-30) = Prophecy (Structured, Archaic)
    // Medium Entropy (30-70) = Accelerator (Dynamic, Cybernetic)
    // High Entropy (70+) = Void (Nihilistic, Chaotic)

    let category = "prophecy";
    const normalizedEntropy = Math.min(Math.max(entropyLevel / 10, 0), 100);

    if (normalizedEntropy > 70) {
      category = "void";
    } else if (normalizedEntropy > 30) {
      category = "accelerator";
    }

    const templateList = this.templates[category];
    const template = templateList[Math.floor(rng() * templateList.length)];

    let result = template
      .replace(/<noun>/g, () => this.getRandom(this.posData.nouns, rng))
      .replace(/<verb>/g, () => this.getRandom(this.posData.verbs, rng))
      .replace(/<adj>/g, () => this.getRandom(this.posData.adjectives, rng));

    // High entropy might glitch the text
    if (normalizedEntropy > 90) {
      result = result.replace(/ /g, () => (rng() > 0.8 ? "_" : " "));
    }

    return result;
  }
}
