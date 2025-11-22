export const loadManifest = async () => {
    try {
        const response = await fetch('/src/assets/corpus/corpus_manifest.json');
        if (!response.ok) {
            throw new Error('Failed to load manifest');
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading manifest:", error);
        return null;
    }
};

export const loadSpirit = async (spiritId) => {
    try {
        const response = await fetch(`/src/assets/corpus/${spiritId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load spirit: ${spiritId}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading spirit ${spiritId}:`, error);
        return null;
    }
};
