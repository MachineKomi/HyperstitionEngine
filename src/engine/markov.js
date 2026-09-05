export class MarkovEngine {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.sequence = 0;
    this.ready = false;
  }
  request(type, payload) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Engine timed out. Rebind the aspects and retry."));
      }, 60000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type, payload, id });
    });
  }
  async loadCorpus(spirits) {
    this.dispose();
    const sentences = spirits.flatMap((spirit) => spirit.sentences || []);
    if (!sentences.length)
      throw new Error("Select at least one populated aspect.");
    this.worker = new Worker(new URL("./markov.worker.js", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = ({ data }) => {
      const job = this.pending.get(data.id);
      if (!job) return;
      clearTimeout(job.timer);
      this.pending.delete(data.id);
      if (data.type === "ERROR") job.reject(new Error(data.error));
      else job.resolve(data.payload);
    };
    this.worker.onerror = () =>
      this.dispose("Worker failed. Rebind the aspects to retry.");
    await this.request("TRAIN", { sentences });
    this.ready = true;
  }
  async generate(entropyLevel) {
    if (!this.ready) throw new Error("The engine is still binding.");
    const payload = await this.request("GENERATE", {
      options: { maxTries: 200 },
      entropyLevel,
    });
    return payload.result;
  }
  dispose(message = "Engine binding replaced.") {
    this.ready = false;
    this.worker?.terminate();
    this.worker = null;
    for (const job of this.pending.values()) {
      clearTimeout(job.timer);
      job.reject(new Error(message));
    }
    this.pending.clear();
  }
}
