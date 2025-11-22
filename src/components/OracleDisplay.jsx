import React from 'react';
import useEntropyStore from '../store/entropyStore';

const OracleDisplay = ({ onGenerate }) => {
    const { generatedText, entropyLevel, selectedSpirits, toggleSpirit } = useEntropyStore();

    // This list should ideally come from the manifest, but for now we can hardcode or pass it down
    // Let's assume the parent passes the available spirits or we fetch them.
    // For this step, I'll just use the store's generated text and a generate button.

    return (
        <div className="oracle-display">
            <div className="controls">
                <button
                    onClick={onGenerate}
                    disabled={entropyLevel < 50}
                    className="generate-btn"
                >
                    {entropyLevel < 50 ? "Gather more entropy..." : "Consult the Oracle"}
                </button>
            </div>

            <div className="output-area">
                {generatedText ? (
                    <p className="oracle-text">{generatedText}</p>
                ) : (
                    <p className="placeholder-text">The void awaits your query...</p>
                )}
            </div>

            <div className="stats">
                <span>Spirits Active: {selectedSpirits.length}</span>
            </div>
        </div>
    );
};

export default OracleDisplay;
