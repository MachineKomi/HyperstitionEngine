import React, { useState, useEffect, useRef } from 'react';

const MYSTICAL_LOGS = [
    "INITIALIZING HYPERSTITION_ENGINE...",
    "LOADING KERNEL...",
    "MOUNTING VIRTUAL FILE SYSTEM...",
    "ALLOCATING ENTROPY POOL...",
    "CONNECTING TO NOOSPHERE...",
    "SUMMONING SPIRITS...",
    "Parsing N_Land.pdf...",
    "Parsing Bible_KJV.txt...",
    "Parsing CCru_Writings.pdf...",
    "CALIBRATING MARKOV CHAINS...",
    "ALIGNING GRAMMAR SIGILS...",
    "VERIFYING REALITY CONSENSUS...",
    "WARNING: HIGH ENTROPY DETECTED",
    "ESTABLISHING NEURAL LINK...",
    "DECRYPTING LEMURIAN TIME-WARS...",
    "SCANNING FOR NUMOGRAM PATTERNS...",
    "INJECTING CHAOS MAGICK SIGILS...",
    "LOADING AKASHIC RECORDS...",
    "BYPASSING CAUSALITY FILTERS...",
    "OPTIMIZING HYPERSTITIONAL VECTORS...",
    "SYNCING WITH OMEGA POINT...",
    "DETECTING TEMPORAL ANOMALIES...",
    "PURGING ORTHOGONAL TIME...",
    "INVOKING CYBERNETIC DEMONS...",
    "COMPILING ESOTERIC DATA...",
    "TRAINING NEURAL NET ON GRIMOIRES...",
    "EXECUTING RITUAL_01.EXE...",
    "BUFFERING ASTRAL PLANE...",
    "RECALIBRATING REALITY TUNNELS...",
    "SEARCHING FOR BLACK SWANS...",
    "DECODING ENOCHIAN KEYS...",
    "PINGING THE ABYSS...",
    "ABYSS RETURNED PONG...",
    "GENERATING SYNCHRONICITIES...",
    "LOADING SUB-ROUTINES: [K-GOTH, CYBER-PUNK, WEIRD-FI]...",
    "SYSTEM READY."
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>/?░▒▓█▄▀■□▪▫▲▼►◄◊○●★☆†‡§¶";

const LoadingScreen = ({ onComplete }) => {
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [scrambledTitle, setScrambledTitle] = useState("HYPERSTITION_ENGINE");
    const logContainerRef = useRef(null);
    const progressRef = useRef(0);

    // Infinite Scrolling Logs
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            const log = MYSTICAL_LOGS[currentIndex % MYSTICAL_LOGS.length];
            setLogs(prev => {
                const newLogs = [...prev, log];
                if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50); // Keep last 50
                return newLogs;
            });
            currentIndex++;
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Fake Progress Bar
    useEffect(() => {
        const interval = setInterval(() => {
            if (progressRef.current < 90) {
                // Slow down as it gets higher
                const increment = Math.max(0.1, (90 - progressRef.current) / 50);
                progressRef.current += increment;
                setProgress(progressRef.current);
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Scramble Animation (Slower)
    useEffect(() => {
        const target = "HYPERSTITION_ENGINE";
        let frame = 0;
        const interval = setInterval(() => {
            const scrambled = target.split('').map((char, index) => {
                if (index < frame / 5) return char; // Reveal slower
                return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }).join('');

            setScrambledTitle(scrambled);
            frame++;

            if (frame > target.length * 5 + 20) frame = 0; // Loop the effect
        }, 100); // Slower update rate (was likely faster before)

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="loading-screen">
            <h1 className="loading-title">{scrambledTitle}</h1>
            <div className="loading-log-container" ref={logContainerRef}>
                {logs.map((log, index) => (
                    <div key={index} className="log-line">
                        <span className="log-prefix">{">"}</span> {log}
                    </div>
                ))}
                <div className="log-cursor">_</div>
            </div>
            <div className="loading-bar-container">
                <div className="loading-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="version-tag">v0.9.0 (BETA)</div>
        </div>
    );
};

export default LoadingScreen;
