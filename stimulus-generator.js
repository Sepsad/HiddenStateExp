/**
 * Stimulus Generator for NeuroState Estimation Experiment
 * Implements HI (History-Independent) and HD (History-Dependent) conditions
 * Based on Prat-Carrabin et al. (2021)
 */

class StimulusGenerator {
    constructor(trialCount = 1000) {
        // Experiment parameters
        this.STATE_RANGE = 300; // Normalized state range [0, 300]
        this.LIKELIHOOD_HALF_WIDTH = 20; // Half-width of triangular likelihood
        this.CHANGE_SIZE_HALF_WIDTH = 40; // Increased half-width of bimodal transition for better exploration
        this.CHANGE_SEPARATION = 15; // Increased distance between bimodal peaks
        
        // Tutorial parameters
        this.TUTORIAL_TRIALS = [10, 10, 15, 15, 20]; // Reduced trials per tutorial phase
        this.MAIN_TRIALS = trialCount; // Main experiment trials per condition
        
        // Seeds for reproducibility
        this.rngSeed = 12345;
        this.rng = new SeededRandom(this.rngSeed);
    }
    
    /**
     * Generate triangular distribution sample
     * @param {number} center - Center of distribution
     * @param {number} halfWidth - Half-width of distribution
     * @param {SeededRandom} rng - Random number generator
     * @returns {number} Sample from triangular distribution
     */
    sampleTriangular(center, halfWidth, rng = this.rng) {
        // Triangular distribution: symmetric around center
        const u = rng.random();
        let sample;
        
        if (u < 0.5) {
            // Left side of triangle
            sample = center - halfWidth + halfWidth * Math.sqrt(2 * u);
        } else {
            // Right side of triangle
            sample = center + halfWidth - halfWidth * Math.sqrt(2 * (1 - u));
        }
        
        // Clamp to valid state range
        return Math.max(0, Math.min(this.STATE_RANGE, sample));
    }
    
    /**
     * Generate bimodal triangular distribution sample for state transitions
     * @param {number} currentState - Current state value
     * @param {SeededRandom} rng - Random number generator
     * @returns {number} New state sample
     */
    sampleBimodalTransition(currentState, rng = this.rng) {
        // Occasionally make larger jumps to explore the full state space
        const largeJumpProbability = 0.2; // 20% chance of a large jump
        
        if (rng.random() < largeJumpProbability) {
            // Large jump: sample from the entire state space with bias toward middle
            const targetCenter = this.STATE_RANGE / 2;
            const largeJumpWidth = this.STATE_RANGE / 3; // Allow jumps across 2/3 of the space
            return this.sampleTriangular(targetCenter, largeJumpWidth, rng);
        } else {
            // Regular bimodal jump
            const leftCenter = currentState - this.CHANGE_SEPARATION;
            const rightCenter = currentState + this.CHANGE_SEPARATION;
            
            // Equal probability for each lobe
            const useLeftLobe = rng.random() < 0.5;
            const center = useLeftLobe ? leftCenter : rightCenter;
            
            return this.sampleTriangular(center, this.CHANGE_SIZE_HALF_WIDTH, rng);
        }
    }
    
    /**
     * Calculate hazard rate for HD condition
     * @param {number} tau - Trials since last change
     * @returns {number} Hazard rate q(tau)
     */
    calculateHDHazard(tau) {
        // q(τ) = (1 + e^(-(τ-10)))^(-1)
        return 1 / (1 + Math.exp(-(tau - 10)));
    }
    
    /**
     * Generate stimulus sequence for one condition
     * @param {string} condition - 'HI' or 'HD'
     * @param {number} nTrials - Number of trials
     * @param {boolean} isTutorial - Whether this is tutorial data
     * @param {number} tutorialPhase - Tutorial phase (1-5)
     * @returns {Array} Array of trial objects
     */
    generateSequence(condition, nTrials, isTutorial = false, tutorialPhase = null) {
        const trials = [];
        
        // Start with a random position across the full state space for better coverage
        let currentState = this.rng.random() * this.STATE_RANGE;
        let tau = 0; // Trials since last change
        
        for (let t = 0; t < nTrials; t++) {
            let changeFlag = false;
            let hazard;
            
            // Calculate hazard rate based on condition
            if (condition === 'HI') {
                hazard = 0.1; // Constant hazard
            } else { // HD
                hazard = this.calculateHDHazard(tau);
            }
            
            // Determine if change occurs
            if (this.rng.random() < hazard) {
                changeFlag = true;
                
                // For better state space coverage, occasionally force exploration of boundaries
                if (isTutorial || (t > 0 && t % 50 === 0)) { // Every 50 trials or in tutorial
                    const explorationProb = 0.3;
                    if (this.rng.random() < explorationProb) {
                        // Force exploration of less common regions
                        if (currentState < this.STATE_RANGE * 0.3) {
                            // If in lower third, bias toward upper regions
                            currentState = this.sampleTriangular(this.STATE_RANGE * 0.7, this.STATE_RANGE * 0.2, this.rng);
                        } else if (currentState > this.STATE_RANGE * 0.7) {
                            // If in upper third, bias toward lower regions
                            currentState = this.sampleTriangular(this.STATE_RANGE * 0.3, this.STATE_RANGE * 0.2, this.rng);
                        } else {
                            // If in middle, explore boundaries
                            const exploreBoundary = this.rng.random() < 0.5;
                            currentState = exploreBoundary ? 
                                this.sampleTriangular(this.STATE_RANGE * 0.15, this.STATE_RANGE * 0.1, this.rng) :
                                this.sampleTriangular(this.STATE_RANGE * 0.85, this.STATE_RANGE * 0.1, this.rng);
                        }
                    } else {
                        currentState = this.sampleBimodalTransition(currentState);
                    }
                } else {
                    currentState = this.sampleBimodalTransition(currentState);
                }
                
                tau = 0;
            } else {
                tau++;
            }
            
            // Generate observation from triangular likelihood
            let likelihoodWidth = this.LIKELIHOOD_HALF_WIDTH;
            
            // Modify likelihood width for tutorial phases 3-4
            if (isTutorial && (tutorialPhase === 3 || tutorialPhase === 4)) {
                likelihoodWidth = this.LIKELIHOOD_HALF_WIDTH * 0.5; // Narrower likelihood
            }
            
            const observation = this.sampleTriangular(currentState, likelihoodWidth);
            
            // Store trial data
            trials.push({
                trial_idx: t,
                condition: condition,
                tau_true: tau,
                change_flag: changeFlag,
                s_t: currentState,
                x_t: observation,
                hazard_rate: hazard,
                tutorial_phase: tutorialPhase,
                is_tutorial: isTutorial,
                likelihood_width: likelihoodWidth
            });
        }
        
        return trials;
    }
    
    /**
     * Generate all tutorial sequences for one condition
     * @param {string} condition - 'HI' or 'HD'
     * @returns {Array} Array of tutorial trial arrays
     */
    generateTutorialSequences(condition) {
        const tutorials = [];
        
        for (let phase = 1; phase <= 5; phase++) {
            const nTrials = this.TUTORIAL_TRIALS[phase - 1];
            const trials = this.generateSequence(condition, nTrials, true, phase);
            tutorials.push(trials);
        }
        
        return tutorials;
    }
    
    /**
     * Generate main experiment sequence
     * @param {string} condition - 'HI' or 'HD'
     * @returns {Array} Array of trial objects
     */
    generateMainSequence(condition) {
        return this.generateSequence(condition, this.MAIN_TRIALS, false, null);
    }
    
    /**
     * Generate all sequences for the experiment
     * @returns {Object} Object containing all sequences
     */
    generateAllSequences() {
        const sequences = {
            HI: {
                tutorials: this.generateTutorialSequences('HI'),
                main: this.generateMainSequence('HI')
            },
            HD: {
                tutorials: this.generateTutorialSequences('HD'),
                main: this.generateMainSequence('HD')
            }
        };
        
        return sequences;
    }
    
    /**
     * Save sequences to JSON for reuse across participants
     * @param {Object} sequences - Generated sequences
     * @returns {string} JSON string of sequences
     */
    exportSequences(sequences) {
        return JSON.stringify(sequences, null, 2);
    }
    
    /**
     * Load sequences from JSON
     * @param {string} jsonString - JSON string of sequences
     * @returns {Object} Parsed sequences object
     */
    importSequences(jsonString) {
        return JSON.parse(jsonString);
    }
    
    /**
     * Analyze state space coverage of generated sequences
     * @param {Object} sequences - Generated sequences
     * @returns {Object} Coverage analysis
     */
    analyzeStateCoverage(sequences) {
        const analysis = {};
        
        for (const condition of ['HI', 'HD']) {
            const mainTrials = sequences[condition].main;
            const states = mainTrials.map(trial => trial.s_t);
            const observations = mainTrials.map(trial => trial.x_t);
            
            // Calculate coverage statistics
            analysis[condition] = {
                stateRange: {
                    min: Math.min(...states),
                    max: Math.max(...states),
                    mean: states.reduce((a, b) => a + b, 0) / states.length,
                    coverage: (Math.max(...states) - Math.min(...states)) / this.STATE_RANGE
                },
                observationRange: {
                    min: Math.min(...observations),
                    max: Math.max(...observations),
                    mean: observations.reduce((a, b) => a + b, 0) / observations.length,
                    coverage: (Math.max(...observations) - Math.min(...observations)) / this.STATE_RANGE
                },
                // Count how many trials fall in each quartile
                quartileDistribution: this.calculateQuartileDistribution(states)
            };
        }
        
        return analysis;
    }
    
    /**
     * Calculate distribution across quartiles
     * @param {Array} states - Array of state values
     * @returns {Object} Quartile distribution
     */
    calculateQuartileDistribution(states) {
        const q1 = this.STATE_RANGE * 0.25;
        const q2 = this.STATE_RANGE * 0.5;
        const q3 = this.STATE_RANGE * 0.75;
        
        const distribution = {
            q1: states.filter(s => s < q1).length,
            q2: states.filter(s => s >= q1 && s < q2).length,
            q3: states.filter(s => s >= q2 && s < q3).length,
            q4: states.filter(s => s >= q3).length
        };
        
        const total = states.length;
        return {
            counts: distribution,
            percentages: {
                q1: (distribution.q1 / total * 100).toFixed(1),
                q2: (distribution.q2 / total * 100).toFixed(1),
                q3: (distribution.q3 / total * 100).toFixed(1),
                q4: (distribution.q4 / total * 100).toFixed(1)
            }
        };
    }
}

/**
 * Seeded Random Number Generator
 * Ensures reproducible stimulus sequences across participants
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.current = seed;
    }
    
    random() {
        // Linear congruential generator
        this.current = (this.current * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.current / Math.pow(2, 32);
    }
    
    setSeed(seed) {
        this.seed = seed;
        this.current = seed;
    }
}

/**
 * Additional utility functions specific for the stimulus generator
 * These complement the main ExperimentUtils from experiment-utils.js
 */
class StimulusHelpers {
    /**
     * Calculate distance between two points on the line
     * @param {number} point1 - First point
     * @param {number} point2 - Second point
     * @returns {number} Absolute distance
     */
    static calculateDistance(point1, point2) {
        return Math.abs(point1 - point2);
    }
    
    /**
     * Calculate points awarded based on distance from target
     * @param {number} clickX - Click position
     * @param {number} trueState - True state value
     * @param {number} baseRadius - Base radius for full points (default 10)
     * @returns {number} Points awarded (1, 0.25, or 0)
     */
    static calculatePoints(clickX, trueState, baseRadius = 10) {
        const distance = this.calculateDistance(clickX, trueState);
        
        if (distance <= baseRadius) {
            return 1; // Full points
        } else if (distance <= baseRadius * 2) {
            return 0.25; // Partial points
        } else {
            return 0; // No points
        }
    }
}

// Export for use in main experiment file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StimulusGenerator, SeededRandom, StimulusHelpers };
} else {
    // Make available globally when used directly in browser
    window.StimulusGenerator = StimulusGenerator;
    window.SeededRandom = SeededRandom;
    window.StimulusHelpers = StimulusHelpers;
}
