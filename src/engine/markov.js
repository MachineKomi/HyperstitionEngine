export class MarkovEngine {
    constructor() {
        this.worker = null;
        this.ready = false;
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

        // Initialize Worker
        if (this.worker) {
            this.worker.terminate();
        }

        this.worker = new Worker(new URL('./markov.worker.js', import.meta.url), { type: 'module' });

        return new Promise((resolve, reject) => {
            this.worker.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === 'TRAIN_COMPLETE') {
                    console.log(`Markov engine trained on ${payload.count} sentences (Worker).`);
                    this.ready = true;
                    resolve();
                } else if (type === 'ERROR') {
                    console.error("Worker error:", error);
                    reject(error);
                }
            };

            this.worker.postMessage({
                type: 'TRAIN',
                payload: { sentences: allSentences },
                id: Date.now()
            });
        });
    }

    async generate(entropyLevel) {
        if (!this.worker || !this.ready) {
            return "The spirits are silent (Corpus not loaded).";
        }

        // Map entropy (0-1000) to options
        const randomness = Math.min(Math.max(entropyLevel / 1000, 0.1), 1.0); // 0.1 to 1.0

        const options = {
            maxTries: 50,
            prng: Math.random, // Worker might need this passed or handle it internally? 
            // markov-strings uses Math.random by default, so we don't strictly need to pass it unless we want seeded.
            // However, we can't pass functions to workers easily. 
            // The worker will use its own Math.random.
            filter: (result) => {
                // We can't pass functions to workers. 
                // If we need filtering, we must implement it in the worker or post-process.
                // For now, we'll skip complex filters or implement simple ones in the worker if needed.
                return result.string.split(' ').length >= 5; // Example: min 5 words
            }
        };

        // Since we can't pass functions (like filter) to the worker, we need to handle that.
        // The worker implementation I wrote just calls generate(options).
        // markov-strings generate options can include a filter function.
        // I should update the worker to handle a simple filter or just accept that I can't pass the function.
        // Let's simplify and remove the filter for now or hardcode it in the worker if strictly needed.
        // But wait, the previous code didn't have a filter in the `options` object in `markov.js` (lines 52-54).
        // It just had `maxTries: 50`.
        // So I will stick to that.

        return new Promise((resolve, reject) => {
            const id = Date.now();

            const handler = (e) => {
                if (e.data.id === id) {
                    this.worker.removeEventListener('message', handler);
                    const { type, payload, error } = e.data;

                    if (type === 'GENERATE_COMPLETE') {
                        resolve(payload.result);
                    } else if (type === 'ERROR') {
                        console.warn("Markov generation failed:", error);
                        resolve("The oracle speaks in riddles (Generation failed).");
                    }
                }
            };

            this.worker.addEventListener('message', handler);

            this.worker.postMessage({
                type: 'GENERATE',
                payload: { options: { maxTries: 50 } },
                id
            });
        });
    }
}


