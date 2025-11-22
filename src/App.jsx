import React, { useEffect, useState } from 'react';
import EntropyPool from './components/EntropyPool';
import OracleDisplay from './components/OracleDisplay';

function App() {
    const [corpusLoaded, setCorpusLoaded] = useState(false);

    useEffect(() => {
        // TODO: Load corpus data here
        setCorpusLoaded(true);
    }, []);

    return (
        <div className="app-container">
            <header>
                <h1>HyperstitionEngine</h1>
            </header>
            <main>
                <EntropyPool />
                <OracleDisplay />
            </main>
        </div>
    );
}

export default App;
