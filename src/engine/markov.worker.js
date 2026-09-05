import Markov from "markov-strings";

let markov = null;

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "TRAIN") {
      const { sentences } = payload;
      if (!sentences || sentences.length === 0) {
        self.postMessage({ type: "ERROR", id, error: "No sentences provided" });
        return;
      }

      markov = new Markov({ stateSize: 2 });
      await markov.addData(sentences);

      self.postMessage({
        type: "TRAIN_COMPLETE",
        id,
        payload: { count: sentences.length },
      });
    } else if (type === "GENERATE") {
      if (!markov) {
        self.postMessage({ type: "ERROR", id, error: "Model not trained" });
        return;
      }

      const { options } = payload;
      const minWords = 5 + Math.floor((payload.entropyLevel || 0) / 200);
      const result = markov.generate({
        ...options,
        filter: (result) => {
          const words = result.string.split(/\s+/).length;
          return words >= minWords && words <= 100;
        },
      });

      self.postMessage({
        type: "GENERATE_COMPLETE",
        id,
        payload: { result: result.string },
      });
    }
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      id,
      error: error.message,
    });
  }
};
