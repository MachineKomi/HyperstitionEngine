import Markov from 'markov-strings';

export class MarkovEngine {
    constructor() {
        this.markov = null;
        this.corpusData = [];
    }

    async loadCorpus(spiritsData) {
        // spiritsData is an array of the JSON objects loaded from corpus files
        let allSentences = [];
        spiritsData.forEach(spirit => {
            if (spirit && spirit.sentences) {
                allSentences = [...allSentences, ...spirit.sentences];
            }
        });

        if (allSentences.length === 0) {
            console.warn("No sentences found in corpus data.");
            return;
        }

        // Initialize Markov generator
        // stateSize: 2 means it looks at pairs of words to predict the next
        this.markov = new Markov({ stateSize: 2 });

        try {
            await this.markov.addData(allSentences);
            console.log(`Markov engine trained on ${allSentences.length} sentences.`);
        } catch (e) {
            console.error("Error training Markov engine:", e);
        }
    }

    generate(entropyLevel) {
        if (!this.markov) {
            return "The spirits are silent (Corpus not loaded).";
        }

        // Use entropy to influence generation parameters
        // Higher entropy -> lower score threshold, more randomness
        // Lower entropy -> higher score threshold, more coherent

        // Map entropy (0-1000) to options
        const randomness = Math.min(Math.max(entropyLevel / 1000, 0.1), 1.0); // 0.1 to 1.0

        const options = {
            maxTries: 50, // Try harder if entropy is high? Or less hard?
            // filter: (result) => {
            //     return result.string.split(' ').length >= 5; // Min length
            // }
        };

        try {
            const result = this.markov.generate(options);
            return result.string;
        } catch (e) {
            console.warn("Markov generation failed (likely no valid paths):", e);
            return "The oracle speaks in riddles (Generation failed).";
        }
    }
}

