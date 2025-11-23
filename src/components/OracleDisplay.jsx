import React, { useState, useEffect } from 'react';
import useEntropyStore from '../store/entropyStore';

const OracleDisplay = ({ onGenerate }) => {
    const {
        generatedText,
        isGenerating,
        selectedSpirits,
        toggleSpirit,
        generationMode,
        setGenerationMode,
        entropyLevel
    } = useEntropyStore();

    const [displayText, setDisplayText] = useState("");
    const [revealIndex, setRevealIndex] = useState(0);

    // Aspects List (Renamed from Spirits)
    const aspects = [
        "N_Land", "Gods", "Marcus_A", "M_Cicero", "F_Nietzsche",
        "Yokai", "Confucius", "GoBadukWeiqi", "N_Bostrom",
        "Y_Harari", "AI"
    ];

    // Text Reveal Effect
    useEffect(() => {
        if (generatedText) {
            setRevealIndex(0);
            const interval = setInterval(() => {
                setRevealIndex(prev => {
                    if (prev >= generatedText.length) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1; // Reveal 1 char per tick
                });
            }, 30); // Slower reveal

            return () => clearInterval(interval);
        }
    }, [generatedText]);

    // Decipher Logic
    useEffect(() => {
        if (!generatedText) {
            setDisplayText("");
            return;
        }

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@&";
        let scrambled = "";

        // Part 1: Revealed text
        scrambled += generatedText.substring(0, revealIndex);

        // Part 2: Scrambled tail (deciphering)
        if (revealIndex < generatedText.length) {
            const remaining = generatedText.length - revealIndex;
            const noiseLength = Math.min(remaining, 20); // Longer noise tail
            for (let i = 0; i < noiseLength; i++) {
                scrambled += chars[Math.floor(Math.random() * chars.length)];
            }
        }

        setDisplayText(scrambled);

    }, [revealIndex, generatedText]);


    const handleGenerateClick = () => {
        if (entropyLevel < 10) {
            alert("Insufficient Entropy. Perturb the system.");
            return;
        }
        if (onGenerate) {
            onGenerate();
        }
    };

    return (
        <div className="oracle-container">
            <div className="controls">
                <button
                    className={`mode-btn ${generationMode === 'markov' ? 'active' : ''}`}
                    onClick={() => setGenerationMode('markov')}
                >
                    MARKOV_CHAIN
                </button>
                <button
                    className={`mode-btn ${generationMode === 'grammar' ? 'active' : ''}`}
                    onClick={() => setGenerationMode('grammar')}
                >
                    GRAMMAR_SIGIL
                </button>
            </div>

            <button className="generate-btn" onClick={handleGenerateClick} disabled={isGenerating}>
                {isGenerating ? "TRANSMITTING..." : "SACRIFICE ENTROPY"}
            </button>

            <div className="output-area">
                {generatedText ? (
                    <p className={`oracle-text ${isGenerating ? 'glitch' : ''}`}>
                        {displayText}
                    </p>
                ) : (
                    <p className="subtitle" style={{ textAlign: 'center' }}>AWAITING_TRANSMISSION...</p>
                )}
            </div>

            <div className="spirits-section">
                <h3 className="section-title">ASPECTS</h3>
                <div className="spirit-grid">
                    {aspects.map(aspect => (
                        <button
                            key={aspect}
                            className={`spirit-btn ${selectedSpirits.includes(aspect === "Gods" ? "Bible" : aspect) ? 'selected' : ''}`}
                            onClick={() => toggleSpirit(aspect === "Gods" ? "Bible" : aspect)}
                        >
                            {aspect}
                        </button>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    ASPECTS_BOUND: {selectedSpirits.length} | PROTOCOL: {generationMode.toUpperCase()}
                </div>
            </div>
        </div>
    );
};

export default OracleDisplay;
