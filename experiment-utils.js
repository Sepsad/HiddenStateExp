/**
 * Utility functions for the NeuroState Estimation Task
 */
class ExperimentUtils {
    /**
     * Generate a random participant ID
     * @returns {string} Random participant ID
     */
    static generateParticipantID() {
        return 'P' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }
    
    /**
     * Convert a state value (0-300) to screen coordinates
     * @param {number} stateValue - State value (0-300)
     * @param {number} screenWidth - Available screen width
     * @returns {number} Screen x-coordinate
     */
    static stateToScreen(stateValue, screenWidth) {
        return (stateValue / 300) * screenWidth;
    }
    
    /**
     * Convert a screen coordinate to state value
     * @param {number} screenX - Screen x-coordinate
     * @param {number} screenWidth - Available screen width
     * @returns {number} State value (0-300)
     */
    static screenToState(screenX, screenWidth) {
        return (screenX / screenWidth) * 300;
    }
    
    /**
     * Calculate points based on distance between guess and true state
     * @param {number} clickX - User's guess (state space)
     * @param {number} trueState - True state value
     * @returns {number} Points awarded
     */
    static calculatePoints(clickX, trueState) {
        const distance = Math.abs(clickX - trueState);
        // Simple scoring function - max 100 points for perfect guess
        // 0 points for guesses more than 50 units away
        const points = Math.max(0, 100 - Math.floor(distance * 2));
        return points;
    }
    
    /**
     * Download experiment data as JSON file
     * @param {Object} data - Experiment data
     * @param {string} filename - Filename without extension
     */
    static downloadData(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * Convert JSON data to CSV format
     * @param {Object} jsonData - The experiment data in JSON format
     * @returns {string} - CSV formatted string
     */
    static jsonToCSV(jsonData) {
        if (!jsonData.trials || !jsonData.trials.length) {
            return '';
        }
        
        // Get headers from the first trial
        const headers = Object.keys(jsonData.trials[0]);
        
        // Add participant ID and condition as the first columns
        const csvRows = [];
        csvRows.push(['participantID', 'condition', ...headers].join(','));
        
        // Add each trial as a row
        for (const trial of jsonData.trials) {
            const values = headers.map(header => {
                const value = trial[header];
                
                // Handle strings with commas, wrap in quotes
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                
                // Convert boolean to 0/1
                if (typeof value === 'boolean') {
                    return value ? '1' : '0';
                }
                
                return value;
            });
            
            // Add participantID and condition at the beginning of each row
            csvRows.push([jsonData.participantID, jsonData.condition, ...values].join(','));
        }
        
        return csvRows.join('\n');
    }
    
    /**
     * Download experiment data as CSV file
     * @param {Object} data - Experiment data
     * @param {string} filename - Filename without extension
     */
    static downloadCSV(data, filename) {
        const csvData = this.jsonToCSV(data);
        const dataBlob = new Blob([csvData], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Make available globally
window.ExperimentUtils = ExperimentUtils;
