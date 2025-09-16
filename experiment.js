/**
 * NeuroState Estimation Task
 * Based on Prat-Carrabin et al. (2021)
 */

class NeuroStateExperiment {
    constructor() {
        // Experiment parameters
        this.participantID = ExperimentUtils.generateParticipantID();
        this.stimulusGenerator = null; // Will be created when experiment starts based on trial count selection
        this.condition = this.getRandomCondition(); // 'HI' or 'HD'
        this.blockIdx = 0;
        this.trialIdx = 0;
        this.totalScore = 0;
        this.currentTrial = null;
        this.sequences = null;
        this.tutorialPhase = 0;
        this.isTutorial = true;
        this.showPastDotsFlag = false;
        this.pastDots = [];
        this.trialCount = 5; // Default trial count
        this.showTrueState = false; // Whether to show the true state position
        
        // Canvas properties
        this.canvas = document.getElementById('experiment-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        } else {
            console.warn("Canvas element not found during initialization");
            this.ctx = null;
        }
        this.canvasWidth = 800;
        this.canvasHeight = 200;
        this.lineY = this.canvasHeight / 2;
        
        // Snowball properties
        this.snowballInitialSize = 20;
        this.snowballFinalSize = 8;
        this.snowballShrinkDuration = 400; // ms
        this.snowballColor = 'white';
        
        // Pointer properties
        this.pointerSize = 10;
        this.pointerColor = 'green';
        this.pointerY = this.lineY;
        this.pointerX = this.canvasWidth / 2;
        
        // Timing properties
        this.interTrialInterval = 100; // ms
        
        // Data logging
        this.experimentData = {
            participantID: this.participantID,
            condition: this.condition,
            trials: []
        };
        
        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.startExperiment = this.startExperiment.bind(this);
        
        // UI elements
        this.experimentDisplay = document.getElementById('experiment-display');
        this.instructionsDisplay = document.getElementById('instructions');
        this.scoreDisplay = document.getElementById('score-display');
        this.tutorialInfo = document.getElementById('tutorial-info');
        this.startButton = document.getElementById('start-button');
        this.progressBar = document.getElementById('progress-bar');
        this.progressContainer = document.querySelector('.progress-container');
        this.completionScreen = document.getElementById('completion-screen');
        // We'll set up download buttons at the end of the experiment
        
        // Initialize
        this.initEventListeners();
        this.setupCanvas();
        this.showInstructions();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Add event listeners to canvas if it exists
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', this.handleMouseMove);
            this.canvas.addEventListener('click', this.handleClick);
        } else {
            console.warn("Canvas not available for event listeners");
        }
        
        // We'll set up the start button in showInstructions instead
        
        // We'll set up download buttons at the end of the experiment
        
        // Add a direct start button with explicit event handler
        const directStartBtn = document.createElement('button');
        directStartBtn.textContent = 'Begin Experiment';
        directStartBtn.className = 'prominent-button';
        directStartBtn.style.marginTop = '20px';
        directStartBtn.addEventListener('click', () => this.startExperiment());
        this.instructionsDisplay.appendChild(directStartBtn);
    }
    
    /**
     * Set up the canvas dimensions
     */
    setupCanvas() {
        if (this.canvas) {
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;
        } else {
            console.warn("Canvas not available for setup");
        }
    }
    
    /**
     * Show instructions for the experiment
     */
    showInstructions() {
        const instructionsText = `
            <h2>NeuroState Estimation Task</h2>
            <p>In this task, you will see a white dot on a horizontal line.</p>
            <p>The dot represents a noisy observation of a hidden state, which you need to estimate.</p>
            <p>Use your mouse to move along the line and click to indicate your estimate.</p>
            <p>The closer your estimate is to the true position, the more points you'll earn.</p>
            <p>You'll first complete a tutorial before starting the main experiment.</p>
            
            <div class="experiment-options">
                <h3>Experiment Options:</h3>
                <div class="option-group">
                    <label>
                        <input type="radio" name="trial-count" value="1000" checked> 
                        Full Experiment (1000 trials)
                    </label>
                </div>
                <div class="option-group">
                    <label>
                        <input type="radio" name="trial-count" value="200"> 
                        Short Version (200 trials)
                    </label>
                </div>
            </div>
            
            <button id="start-button-inline" class="prominent-button">Start Experiment Now</button>
        `;
        
        if (this.instructionsDisplay) {
            this.instructionsDisplay.innerHTML = instructionsText;
            this.startButton = document.getElementById('start-button-inline'); // Update reference to the new button
            if (this.startButton) {
                this.startButton.addEventListener('click', this.startExperiment); // Add event listener directly
            } else {
                console.warn("Start button not found after updating instructions");
            }
        } else {
            console.error("Instructions display element not found");
        }
    }
    
    /**
     * Show tutorial information for the current phase
     */
    showTutorialInfo() {
        const phaseInfo = {
            1: "Tutorial Phase 1: Practice making estimates by clicking on the line. Try to place your estimate close to the white dot.",
            2: "Tutorial Phase 2: The white dot is a noisy observation of a hidden state. The true state is shown as a red dot. Try to estimate the hidden state.",
            3: "Tutorial Phase 3: The hidden state may change over time (red dot). The changes follow specific patterns.",
            4: "Tutorial Phase 4: Sometimes the hidden state (red dot) doesn't change. Use past observations to improve your estimate.",
            5: "Tutorial Phase 5: Final practice with the true state (red dot) visible. In the main experiment, you won't see the true state."
        };
        
        this.tutorialInfo.textContent = phaseInfo[this.tutorialPhase] || "";
        this.tutorialInfo.style.display = "block";
    }
    
    /**
     * Get a random condition (HI or HD)
     * @returns {string} 'HI' or 'HD'
     */
    getRandomCondition() {
        return Math.random() < 0.5 ? 'HI' : 'HD';
    }
    
    /**
     * Start the experiment
     */
    startExperiment() {
        // Get selected trial count
        const trialCountElements = document.getElementsByName('trial-count');
        let selectedTrialCount = 5; // Default
        
        for (const element of trialCountElements) {
            if (element.checked) {
                selectedTrialCount = parseInt(element.value);
                break;
            }
        }
        
        // Create a new stimulus generator with the selected trial count
        this.stimulusGenerator = new StimulusGenerator(selectedTrialCount);
        console.log(`Starting experiment with ${selectedTrialCount} trials per condition`);
        
        // Generate sequences for the experiment
        this.sequences = this.stimulusGenerator.generateAllSequences();
        
        // Log state space coverage analysis
        const coverageAnalysis = this.stimulusGenerator.analyzeStateCoverage(this.sequences);
        console.log('State Space Coverage Analysis:', coverageAnalysis);
        
        // Log summary statistics
        for (const condition of ['HI', 'HD']) {
            const analysis = coverageAnalysis[condition];
            console.log(`${condition} Condition:`);
            console.log(`  State Range: ${analysis.stateRange.min.toFixed(1)} - ${analysis.stateRange.max.toFixed(1)} (${(analysis.stateRange.coverage * 100).toFixed(1)}% coverage)`);
            console.log(`  State Mean: ${analysis.stateRange.mean.toFixed(1)}`);
            console.log(`  Quartile Distribution: Q1=${analysis.quartileDistribution.percentages.q1}%, Q2=${analysis.quartileDistribution.percentages.q2}%, Q3=${analysis.quartileDistribution.percentages.q3}%, Q4=${analysis.quartileDistribution.percentages.q4}%`);
        }
        
        // Hide instructions, show experiment display
        this.instructionsDisplay.style.display = 'none';
        this.experimentDisplay.style.display = 'block';
        this.progressContainer.style.display = 'block';
        
        // Start tutorial
        this.startTutorial();
    }
    
    /**
     * Start the tutorial phases
     */
    startTutorial() {
        this.isTutorial = true;
        this.tutorialPhase = 1;
        
        // Show the true state in tutorial phases 2-5, but not in phase 1
        this.showTrueState = false; // Start with false for phase 1
        
        this.showTutorialInfo();
        this.startBlock();
    }
    
    /**
     * Start the main experiment
     */
    startMainExperiment() {
        this.isTutorial = false;
        this.tutorialPhase = null;
        this.tutorialInfo.style.display = 'none';
        this.blockIdx = 0;
        
        // Hide true state in main experiment
        this.showTrueState = false;
        
        this.startBlock();
    }
    
    /**
     * Start a block of trials
     */
    startBlock() {
        if (this.isTutorial) {
            const tutorialSequences = this.sequences[this.condition].tutorials;
            const currentPhaseSequence = tutorialSequences[this.tutorialPhase - 1];
            this.currentTrials = currentPhaseSequence;
        } else {
            this.currentTrials = this.sequences[this.condition].main;
        }
        
        this.trialIdx = 0;
        this.startTrial();
    }
    
    /**
     * Start a new trial
     */
    startTrial() {
        if (this.trialIdx >= this.currentTrials.length) {
            this.endBlock();
            return;
        }
        
        this.currentTrial = this.currentTrials[this.trialIdx];
        this.animateSnowball();
        
        // Update progress bar
        const progress = (this.trialIdx / this.currentTrials.length) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    /**
     * Animate the snowball (white dot)
     */
    animateSnowball() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw horizontal line
        this.drawHorizontalLine();
        
        // Draw past dots if enabled
        if (this.showPastDotsFlag) {
            this.drawPastDots();
        }
        
        // Draw true state if in tutorial mode and phase >= 2
        if (this.isTutorial && this.showTrueState) {
            this.drawTrueState();
        }
        
        // Calculate screen position for the observation
        const observationX = ExperimentUtils.stateToScreen(
            this.currentTrial.x_t, 
            this.canvasWidth, 
            this.stimulusGenerator.STATE_RANGE
        );
        
        // Animate snowball shrinking
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.snowballShrinkDuration, 1);
            
            // Calculate current size
            const currentSize = this.snowballInitialSize - 
                (this.snowballInitialSize - this.snowballFinalSize) * progress;
            
            // Clear canvas and redraw
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.drawHorizontalLine();
            
            // Draw past dots if enabled
            if (this.showPastDotsFlag) {
                this.drawPastDots();
            }
            
            // Draw snowball
            this.ctx.fillStyle = this.snowballColor;
            this.ctx.beginPath();
            this.ctx.arc(observationX, this.lineY, currentSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw pointer
            this.drawPointer();
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Store current observation for potential future display
                this.pastDots.push({
                    x: observationX,
                    y: this.lineY,
                    size: this.snowballFinalSize,
                    color: 'rgba(255, 255, 255, 0.5)'
                });
                
                // Limit past dots to recent history
                if (this.pastDots.length > 10) {
                    this.pastDots.shift();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Draw the horizontal line
     */
    drawHorizontalLine() {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.lineY);
        this.ctx.lineTo(this.canvasWidth, this.lineY);
        this.ctx.stroke();
    }
    
    /**
     * Draw past observation dots
     */
    drawPastDots() {
        this.pastDots.forEach(dot => {
            this.ctx.fillStyle = dot.color;
            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    /**
     * Draw the true state position (red dot)
     */
    drawTrueState() {
        // Convert true state to screen coordinates
        const trueStateX = ExperimentUtils.stateToScreen(
            this.currentTrial.s_t,
            this.canvasWidth,
            this.stimulusGenerator.STATE_RANGE
        );
        
        // Draw the true state as a red dot
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(trueStateX, this.lineY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw a label if not in the final tutorial phase
        if (this.tutorialPhase < 5) {
            this.ctx.fillStyle = 'red';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('True State', trueStateX, this.lineY - 15);
        }
    }
    
    /**
     * Draw the green pointer
     */
    drawPointer() {
        this.ctx.fillStyle = this.pointerColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.pointerX, this.pointerY - this.pointerSize);
        this.ctx.lineTo(this.pointerX + this.pointerSize, this.pointerY);
        this.ctx.lineTo(this.pointerX, this.pointerY + this.pointerSize);
        this.ctx.lineTo(this.pointerX - this.pointerSize, this.pointerY);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse move event
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        
        // Constrain pointer to canvas bounds
        this.pointerX = Math.max(0, Math.min(mouseX, this.canvasWidth));
        
        // Redraw canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawHorizontalLine();
        
        // Draw true state if in tutorial mode and enabled
        if (this.isTutorial && this.showTrueState) {
            this.drawTrueState();
        }
        
        // Draw snowball
        const observationX = ExperimentUtils.stateToScreen(
            this.currentTrial.x_t, 
            this.canvasWidth, 
            this.stimulusGenerator.STATE_RANGE
        );
        this.ctx.fillStyle = this.snowballColor;
        this.ctx.beginPath();
        this.ctx.arc(observationX, this.lineY, this.snowballFinalSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw past dots if enabled
        if (this.showPastDotsFlag) {
            this.drawPastDots();
        }
        
        // Draw pointer
        this.drawPointer();
    }
    
    /**
     * Handle mouse click
     * @param {MouseEvent} event - Mouse click event
     */
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickTime = performance.now();
        
        // Convert to state space
        const clickState = ExperimentUtils.screenToState(
            clickX, 
            this.canvasWidth, 
            this.stimulusGenerator.STATE_RANGE
        );
        
        // Draw the click point
        this.ctx.fillStyle = this.pointerColor;
        this.ctx.beginPath();
        this.ctx.arc(clickX, this.lineY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Calculate points
        const points = ExperimentUtils.calculatePoints(clickState, this.currentTrial.s_t);
        this.totalScore += points;
        
        // Update score display
        this.scoreDisplay.textContent = `Score: ${this.totalScore}`;
        
        // Check if this is a repeated click (same as previous trial)
        const previousTrial = this.experimentData.trials[this.experimentData.trials.length - 1];
        const repeatedClickFlag = previousTrial ? clickState === previousTrial.click_x : false;
        
        // Log trial data
        this.logTrialData({
            pid: this.participantID,
            condition: this.condition,
            block_idx: this.blockIdx,
            trial_idx: this.trialIdx,
            tau_true: this.currentTrial.tau_true,
            change_flag: this.currentTrial.change_flag,
            s_t: this.currentTrial.s_t,
            x_t: this.currentTrial.x_t,
            click_x: clickState,
            rt_ms: clickTime - performance.now(), // This will be negative, we need to fix this
            repeated_click_flag: repeatedClickFlag,
            points_awarded: points,
            score_total_at_checkpoint: this.totalScore,
            show_past_dots_flag: this.showPastDotsFlag,
            tutorial_phase: this.tutorialPhase
        });
        
        // After a brief delay, start the next trial
        setTimeout(() => {
            this.trialIdx++;
            this.startTrial();
        }, this.interTrialInterval);
    }
    
    /**
     * Log trial data
     * @param {Object} data - Trial data
     */
    logTrialData(data) {
        this.experimentData.trials.push(data);
    }
    
    /**
     * End the current block
     */
    endBlock() {
        if (this.isTutorial) {
            if (this.tutorialPhase < 5) {
                // Move to next tutorial phase
                this.tutorialPhase++;
                
                // Show true state for phases 2 through 5
                if (this.tutorialPhase >= 2) {
                    this.showTrueState = true;
                }
                
                this.showTutorialInfo();
                this.startBlock();
            } else {
                // End of tutorial, start main experiment
                this.startMainExperiment();
            }
        } else {
            // End of main experiment
            this.endExperiment();
        }
    }
    
    /**
     * End the experiment
     */
    endExperiment() {
        // Hide experiment display, show completion screen
        this.experimentDisplay.style.display = 'none';
        this.progressContainer.style.display = 'none';
        this.completionScreen.style.display = 'block';
        
        // Generate experiment summary
        this.displayExperimentSummary();
        
        // Set up download buttons
        const jsonButton = document.getElementById('download-json');
        const csvButton = document.getElementById('download-csv');
        
        jsonButton.addEventListener('click', () => {
            ExperimentUtils.downloadData(
                this.experimentData, 
                `neurostate_${this.participantID}_${this.condition}`
            );
        });
        
        csvButton.addEventListener('click', () => {
            ExperimentUtils.downloadCSV(
                this.experimentData, 
                `neurostate_${this.participantID}_${this.condition}`
            );
        });
        
        // Remove event listeners
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('click', this.handleClick);
    }
    
    /**
     * Display summary of experiment results
     */
    displayExperimentSummary() {
        const summaryElement = document.getElementById('experiment-summary');
        const trials = this.experimentData.trials;
        
        if (!trials.length) {
            summaryElement.innerHTML = '<p>No experiment data available.</p>';
            return;
        }
        
        // Calculate summary statistics
        const totalTrials = trials.length;
        const totalPoints = trials.reduce((sum, trial) => sum + trial.points_awarded, 0);
        const averagePoints = totalPoints / totalTrials;
        
        // Calculate average reaction time
        const validRTs = trials.filter(trial => trial.rt_ms > 0);
        const avgReactionTime = validRTs.length ? 
            validRTs.reduce((sum, trial) => sum + trial.rt_ms, 0) / validRTs.length : 0;
        
        // Calculate accuracy (points awarded relative to maximum possible)
        const maxPointsPerTrial = 100; // Assuming 100 is max points per trial
        const accuracy = (totalPoints / (totalTrials * maxPointsPerTrial)) * 100;
        
        // Count change trials
        const changeTrials = trials.filter(trial => trial.change_flag).length;
        const changePercentage = (changeTrials / totalTrials) * 100;
        
        // Format HTML
        const summary = `
            <h3>Experiment Summary</h3>
            <table class="summary-table">
                <tr>
                    <td><strong>Participant ID:</strong></td>
                    <td>${this.participantID}</td>
                </tr>
                <tr>
                    <td><strong>Condition:</strong></td>
                    <td>${this.condition}</td>
                </tr>
                <tr>
                    <td><strong>Total Trials:</strong></td>
                    <td>${totalTrials}</td>
                </tr>
                <tr>
                    <td><strong>Total Score:</strong></td>
                    <td>${totalPoints.toFixed(0)} points</td>
                </tr>
                <tr>
                    <td><strong>Average Score per Trial:</strong></td>
                    <td>${averagePoints.toFixed(2)} points</td>
                </tr>
                <tr>
                    <td><strong>Average Reaction Time:</strong></td>
                    <td>${(avgReactionTime / 1000).toFixed(2)} seconds</td>
                </tr>
                <tr>
                    <td><strong>Accuracy:</strong></td>
                    <td>${accuracy.toFixed(2)}%</td>
                </tr>
                <tr>
                    <td><strong>State Changes:</strong></td>
                    <td>${changeTrials} (${changePercentage.toFixed(1)}% of trials)</td>
                </tr>
            </table>
            <p>Download your data below for detailed analysis.</p>
        `;
        
        summaryElement.innerHTML = summary;
    }
}

// Initialize the experiment when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Initializing NeuroStateExperiment...");
        const experiment = new NeuroStateExperiment();
        console.log("Experiment initialized successfully");
        
        // Add a global start button as a fallback
        const container = document.getElementById('experiment-container');
        const fallbackButton = document.createElement('button');
        fallbackButton.textContent = 'Start Experiment (Fallback)';
        fallbackButton.className = 'prominent-button';
        fallbackButton.style.marginTop = '30px';
        fallbackButton.addEventListener('click', () => {
            if (experiment && typeof experiment.startExperiment === 'function') {
                experiment.startExperiment();
            } else {
                console.error("Experiment object or startExperiment method not available");
                alert("Error starting experiment. Please refresh the page and try again.");
            }
        });
        container.appendChild(fallbackButton);
    } catch (error) {
        console.error("Error initializing experiment:", error);
        document.body.innerHTML += `
            <div style="color: red; padding: 20px; border: 2px solid red; margin: 20px;">
                <h3>Error initializing experiment</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
});
