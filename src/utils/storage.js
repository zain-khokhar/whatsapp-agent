const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read JSON data from file
 * @param {string} filename - Name of the file (e.g., 'handout-timing.json')
 * @param {*} defaultValue - Default value if file doesn't exist
 * @returns {*} Parsed JSON data or default value
 */
function readData(filename, defaultValue = {}) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[Storage] Error reading ${filename}:`, error.message);
        return defaultValue;
    }
}

/**
 * Write JSON data to file atomically
 * @param {string} filename - Name of the file
 * @param {*} data - Data to write
 */
function writeData(filename, data) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const tempPath = filePath + '.tmp';
        
        // Write to temp file first
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
        
        // Atomic rename
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        console.error(`[Storage] Error writing ${filename}:`, error.message);
        throw error;
    }
}

/**
 * Update data with a function
 * @param {string} filename - Name of the file
 * @param {Function} updateFn - Function that receives current data and returns new data
 * @param {*} defaultValue - Default value if file doesn't exist
 */
function updateData(filename, updateFn, defaultValue = {}) {
    const currentData = readData(filename, defaultValue);
    const newData = updateFn(currentData);
    writeData(filename, newData);
    return newData;
}

module.exports = {
    readData,
    writeData,
    updateData
};
