# HyperstitionEngine

    subgraph "Ingestion (Python)"
        A[Raw PDFs/TXTs] -->|process_corpus.py| B(Structured JSON Corpus)
    end
    
    subgraph "HyperstitionEngine (React)"
        B -->|Load| C[Corpus Loader]
        C --> D[Markov Engine]
        C --> H[Grammar Engine]
        E[Entropy Pool <br/> p5.js] -->|Noise/Input| F[Entropy Store <br/> Zustand]
        F -->|Trigger| D
        F -->|Trigger| H
        D -->|Generated Text| G[Oracle Display]
        H -->|Generated Text| G
    end
# HyperstitionEngine

    subgraph "Ingestion (Python)"
        A[Raw PDFs/TXTs] -->|process_corpus.py| B(Structured JSON Corpus)
    end
    
    subgraph "HyperstitionEngine (React)"
        B -->|Load| C[Corpus Loader]
        C --> D[Markov Engine]
        C --> H[Grammar Engine]
        E[Entropy Pool <br/> p5.js] -->|Noise/Input| F[Entropy Store <br/> Zustand]
        F -->|Trigger| D
        F -->|Trigger| H
        D -->|Generated Text| G[Oracle Display]
        H -->|Generated Text| G
    end
```

> **Philosophy**: We strictly avoid Large Language Models (LLMs) for the generation phase to preserve "divine randomness" and the chaotic nature of the cut-up technique.

## Features
- **Client-Side Generation**: All logic runs in the browser using React.
- **Entropy Pool**: A p5.js-based visual interface where user interaction (mouse movement) generates "entropy", which fuels the generation engine.
- **Dual-Mode Oracle**:
    - **Markov Chain**: Generates chaotic, dream-like text sequences from the corpus.
    - **Grammar Sigil**: Uses "Hyperstitional" templates (Accelerator, Void, Prophecy) filled with corpus vocabulary, selected based on current entropy levels.
- **The Council of Spirits**: A curated corpus including Nick Land, The Bible, Marcus Aurelius, and more.
- **Cyber-Occult UI**: A "glitch-prophet" aesthetic designed to bypass the conscious filter.

## Architecture
## Quick Start

For detailed setup and usage instructions, please see [INSTRUCTIONS.md](./INSTRUCTIONS.md).

### Prerequisites
- Node.js (v18+)
- Python (3.9+) for corpus ingestion

### Installation
1.  Clone the repository.
2.  Install frontend dependencies:
    ```bash
    npm install
    ```
3.  Install ingestor dependencies:
    ```bash
    pip install -r ingestor/requirements.txt
    ```

### Usage
1.  Process your corpus (see Instructions).
2.  Run the dev server:
    ```bash
    npm run dev
    ```

## License
[MIT](LICENSE)
