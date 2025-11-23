import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import useEntropyStore from '../store/entropyStore';

const EntropyPool = () => {
    const containerRef = useRef(null);
    const { addEntropy, entropyLevel, maxEntropy } = useEntropyStore();
    const entropyRef = useRef(entropyLevel);

    // Throttle ref
    const lastUpdateRef = useRef(Date.now());

    // Keep ref synced with store to avoid re-init
    useEffect(() => {
        entropyRef.current = entropyLevel;
    }, [entropyLevel]);

    useEffect(() => {
        let myP5;

        const sketch = (p) => {
            let w, h;
            let particles = [];
            const numParticles = 7500; // Increased count significantly (3x)

            p.setup = () => {
                w = containerRef.current.clientWidth;
                h = 400;
                p.createCanvas(w, h);

                for (let i = 0; i < numParticles; i++) {
                    particles.push(new Particle(p));
                }
                p.background(5);
            };

            p.draw = () => {
                p.background(5, 50); // Higher alpha for less trail, more "dusty"

                // Draw Warp Grid (Subtle background)
                p.stroke(255, 176, 0, 15);
                p.strokeWeight(1);

                // Grid that deforms with mouse
                const gridSize = 40;
                for (let x = 0; x <= w; x += gridSize) {
                    for (let y = 0; y <= h; y += gridSize) {
                        let pointX = x;
                        let pointY = y;

                        // Calculate distance to mouse
                        let d = p.dist(x, y, p.mouseX, p.mouseY);
                        if (d < 200) {
                            let angle = p.atan2(y - p.mouseY, x - p.mouseX);
                            let force = p.map(d, 0, 200, 20, 0); // Warp strength
                            pointX += p.cos(angle) * force;
                            pointY += p.sin(angle) * force;
                        }

                        p.point(pointX, pointY);
                    }
                }

                // Update and Show Particles
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].edges(w, h);
                    particles[i].show();
                }

                // Draw Entropy Bar
                let barWidth = p.map(entropyRef.current, 0, maxEntropy, 0, w);
                p.noStroke();
                p.fill(255, 176, 0);
                p.rect(0, h - 2, barWidth, 2);
            };

            p.windowResized = () => {
                w = containerRef.current.clientWidth;
                p.resizeCanvas(w, h);
            };

            class Particle {
                constructor(p) {
                    this.p = p;
                    this.pos = p.createVector(p.random(w), p.random(h));
                    // Random float velocity (dust)
                    this.vel = p5.Vector.random2D();
                    this.vel.mult(p.random(0.2, 0.8));
                    this.acc = p.createVector(0, 0);
                    this.maxSpeed = 3;
                }

                update() {
                    // Mouse Interaction: Swirl
                    let mouseV = this.p.createVector(this.p.mouseX, this.p.mouseY);
                    let dir = p5.Vector.sub(mouseV, this.pos);
                    let d = dir.mag();

                    if (d < 150) {
                        dir.normalize();
                        // Swirl force (perpendicular to direction)
                        let swirl = this.p.createVector(-dir.y, dir.x);
                        swirl.mult(0.5); // Swirl strength

                        // Add some attraction to keep them engaged
                        dir.mult(0.1);

                        let force = p5.Vector.add(swirl, dir);

                        // Scale by distance
                        let strength = this.p.map(d, 0, 150, 1, 0);
                        force.mult(strength);

                        this.acc.add(force);
                    }

                    // Random Brownian motion
                    let brownian = p5.Vector.random2D();
                    brownian.mult(0.05);
                    this.acc.add(brownian);

                    this.vel.add(this.acc);
                    this.vel.limit(this.maxSpeed);
                    this.pos.add(this.vel);
                    this.acc.mult(0);

                    // Damping (friction)
                    this.vel.mult(0.99);
                }

                edges(width, height) {
                    if (this.pos.x > width) this.pos.x = 0;
                    if (this.pos.x < 0) this.pos.x = width;
                    if (this.pos.y > height) this.pos.y = 0;
                    if (this.pos.y < 0) this.pos.y = height;
                }

                show() {
                    this.p.stroke(255, 176, 0, 180);
                    this.p.strokeWeight(1);
                    this.p.point(this.pos.x, this.pos.y);
                }
            }
        };

        myP5 = new p5(sketch, containerRef.current);

        return () => {
            myP5.remove();
        };
    }, []);

    const handleMouseMove = () => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 50) { // More frequent updates for smoother feel
            addEntropy(2);
            lastUpdateRef.current = now;
        }
    };

    return (
        <div className="entropy-container">
            <h2 className="section-title">ENTROPY_POOL</h2>
            <div
                className="p5-wrapper"
                ref={containerRef}
                onMouseMove={handleMouseMove}
            >
                <div className="entropy-overlay">
                    <span className="entropy-status">
                        ENTROPY_LEVEL: {Math.floor(entropyLevel)} / {maxEntropy}
                    </span>
                </div>
            </div>
            <p className="instruction-text">PERTURB THE SYSTEM TO GENERATE CHAOS.</p>
        </div>
    );
};

export default EntropyPool;
