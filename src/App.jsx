import React, { useEffect, useState, useRef } from 'react';
import EntropyPool from './components/EntropyPool';
import OracleDisplay from './components/OracleDisplay';
import BatchGenerator from './components/BatchGenerator';
import LoadingScreen from './components/LoadingScreen';
import useEntropyStore from './store/entropyStore';
import { loadManifest, loadSpirit } from './services/corpusLoader';
import { MarkovEngine } from './engine/markov';
import { GrammarEngine } from './engine/grammar';

function App() {
  const [corpusLoaded, setCorpusLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("INITIALIZING...");

  const {
    entropyLevel,
    consumeEntropy,
    setGeneratedText,
    generationMode
  } = useEntropyStore();

  const markovRef = useRef(new MarkovEngine());
  const grammarRef = useRef(new GrammarEngine());

  useEffect(() => {
    const initCorpus = async () => {
      setLoadingStatus("LOADING MANIFEST...");
      const manifest = await loadManifest();

      if (manifest) {
        setLoadingStatus("SUMMONING SPIRITS...");

        const spiritPromises = manifest.spirits.map(id => loadSpirit(id));
        const spiritsData = await Promise.all(spiritPromises);

        setLoadingStatus("TRAINING ENGINES...");
        await markovRef.current.loadCorpus(spiritsData);
        grammarRef.current.loadCorpus(spiritsData);

        setCorpusLoaded(true);
        setLoadingStatus("READY.");

        // Artificial delay to allow p5 and other heavy assets to settle
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);

      } else {
        setLoadingStatus("FAILED TO LOAD CORPUS. CHECK INGESTOR.");
        // Allow app to load even if corpus failed, so user can see the error/interface
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    // Delay initialization slightly to allow LoadingScreen to render first
    setTimeout(() => {
      initCorpus();
    }, 100);
  }, []);

  const handleGenerate = async () => {
    if (!corpusLoaded) return;

    let text = "";
    if (generationMode === 'markov') {
      text = await markovRef.current.generate(entropyLevel);
    } else {
      text = grammarRef.current.generate(entropyLevel);
    }

    setGeneratedText(text);
    consumeEntropy(20);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">HYPERSTITION_ENGINE</h1>
        <div className="version-display">v0.9.0 (BETA)</div>
      </header>

      <main>
        <EntropyPool />
        <OracleDisplay onGenerate={handleGenerate} />
        <BatchGenerator />
      </main>
    </div>
  );
}

export default App;
