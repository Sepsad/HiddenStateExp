# NeuroState Estimation Experiment

This is an implementation of the online experiment described in Prat-Carrabin et al. (2021) using jsPsych. The experiment investigates how humans estimate hidden states from noisy observations under different change-point dynamics.

## Experiment Overview

Participants estimate a hidden 1-D state `s_t` from noisy observations `x_t` by clicking on a horizontal line. The task includes:

- **Two conditions**: 
  - HI (History-Independent): Constant hazard rate of 0.1
  - HD (History-Dependent): Logistic hazard rate based on trials since last change
- **Tutorial system**: 5 progressive phases that introduce task features
- **Main experiment**: 1000 trials per condition (2000 total)
- **Scoring**: Points based on distance from true state (1, 0.25, or 0 points)

## Files Structure

```
/Users/sepehr/Desktop/NeuoroBridge/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── stimulus-generator.js   # Stimulus generation logic
├── experiment.js           # Main experiment implementation
└── README.md              # This file
```

## Mathematical Model

### State Dynamics
- **s_t**: Hidden state (piecewise constant with change-points)
- **Change-points**: 
  - HI: q_t = 0.1 (constant hazard)
  - HD: q(τ) = (1 + e^(-(τ-10)))^(-1) where τ is trials since last change

### Observations
- **x_t ~ g(x_t | s_t)**: Triangular likelihood centered at s_t with half-width 20 (SD ≈ 8.165)

### State Transitions
- When change occurs: Sample from bimodal triangular distribution with peaks at s_t ± 5

## Features Implemented

### Core Experiment
- ✅ Triangular likelihood and bimodal transition distributions
- ✅ HI and HD hazard rate models
- ✅ Counterbalanced condition order
- ✅ Identical stimulus streams for all participants (seeded random generation)

### User Interface
- ✅ Gray background with horizontal white line
- ✅ White stimulus dots (large for 400ms, then small)
- ✅ Green click feedback
- ✅ Horizontal-only mouse constraint
- ✅ 100ms inter-trial interval

### Tutorial System
- ✅ 5 progressive tutorial phases:
  1. True state visible (red dot)
  2. True state still visible
  3. No true state, narrower likelihood, change-point highlights
  4. Narrower likelihood continues
  5. Final practice with change-point highlights

### Scoring & Feedback
- ✅ Radius-based scoring (1 point ≤10 units, 0.25 points ≤20 units, 0 otherwise)
- ✅ Score display every 100 trials only
- ✅ No trial-wise feedback

### Data Logging
All required variables logged per trial:
- ✅ `pid`: Participant ID
- ✅ `condition`: HI/HD
- ✅ `block_idx`: Block index
- ✅ `trial_idx`: Trial index within block
- ✅ `tau_true`: True trials since last change
- ✅ `change_flag`: Whether change occurred
- ✅ `s_t`: True state
- ✅ `x_t`: Observed stimulus
- ✅ `click_x`: Participant's response
- ✅ `rt_ms`: Reaction time
- ✅ `repeated_click_flag`: Whether click same as previous
- ✅ `points_awarded`: Points for this trial
- ✅ `score_total_at_checkpoint`: Total score (every 100 trials)
- ✅ `show_past_dots_flag`: Between-subjects manipulation
- ✅ `tutorial_phase`: Tutorial phase (1-5) or null

### Advanced Features
- ✅ Past dots visualization (between-subjects, faded opacity)
- ✅ Automatic data download as JSON
- ✅ Responsive design
- ✅ Seeded random number generation for reproducibility

## Running the Experiment

1. **Local Testing**: Open `index.html` in a web browser
2. **Online Deployment**: Upload all files to a web server

### Browser Requirements
- Modern web browser with JavaScript enabled
- Canvas API support
- Local file access (for local testing) or web server

## Data Output

The experiment automatically downloads data as JSON with the filename format:
`neurostate_P[timestamp]_[random].json`

Each trial contains all the logged variables mentioned above, plus jsPsych metadata.

## Customization

### Key Parameters (in `stimulus-generator.js`):
- `STATE_RANGE`: State space (default: 300)
- `LIKELIHOOD_HALF_WIDTH`: Observation noise (default: 20)
- `CHANGE_SIZE_HALF_WIDTH`: Transition noise (default: 20)
- `CHANGE_SEPARATION`: Bimodal peak separation (default: 5)

### Display Parameters (in `experiment.js`):
- `CANVAS_WIDTH/HEIGHT`: Display size (default: 800x400)
- `DOT_LARGE_SIZE`: Initial dot size (default: 15)
- `DOT_SMALL_SIZE`: Shrunk dot size (default: 8)
- `DOT_DISPLAY_TIME`: Large dot duration (default: 400ms)

## Technical Notes

### Triangular Distribution Implementation
The triangular distribution is implemented using inverse transform sampling with proper symmetric properties around the center point.

### Hazard Rate Functions
- **HI**: Constant 0.1 probability per trial
- **HD**: Logistic function q(τ) = (1 + exp(-(τ-10)))^(-1)

### Coordinate Mapping
Screen coordinates are mapped to state space [0, 300] with proper scaling to maintain the original experiment's spatial relationships.

## Validation

The implementation has been validated against the original paper specifications:
- Mathematical models match exactly
- Timing and visual parameters are correct
- Data logging captures all required variables
- Tutorial progression follows the specified structure

## References

Prat-Carrabin, A., Woodford, M., & Daw, N. D. (2021). Human inference in changing environments with temporal structure. *Psychological Review*, 128(5), 879-912.

## Support

For questions or issues with this implementation, please check:
1. Browser console for JavaScript errors
2. Network connectivity for CDN resources (jsPsych)
3. File permissions for local testing
# HiddenStateExp
