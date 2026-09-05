// Vite emits these corpus modules in production as well as development.
import catalog from "../assets/source_catalog.json";
const corpora = import.meta.glob("../assets/corpus/*.json");
export async function loadManifest() {
  return (await corpora["../assets/corpus/corpus_manifest.json"]()).default;
}
export async function loadSpirit(id) {
  const loader = corpora[`../assets/corpus/${id}.json`];
  if (!loader) throw new Error(`Missing corpus: ${id}`);
  return {
    ...(await loader()).default,
    sourceVersion: catalog.sources[id]?.version,
  };
}
